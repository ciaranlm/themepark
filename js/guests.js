import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const palette = ['#eb6f5d', '#5c7fdb', '#d4a14a', '#78b36a', '#9f79d1', '#55a2a1'];

const needPressure = (value, start = 55) => clamp((value - start) / (100 - start), 0, 1);
const comfortPressure = (value, end = 45) => clamp((end - value) / end, 0, 1);
const patiencePenalty = (queueLength, patience) => Math.max(0, queueLength - Math.max(1, patience / 18));
const queueIsTooLong = (queueLength, patience) => queueLength >= Math.max(6, Math.round(patience / 5) + 4);

export class GuestManager {
  constructor(gameMap, economy) {
    this.map = gameMap;
    this.economy = economy;
    this.guests = [];
    this.spawnTimer = 0;
    this.nextId = 1;
  }

  spawn(game) {
    const { x, y } = this.map.entranceSpawn;
    const body = palette[Math.floor(Math.random() * palette.length)];
    this.guests.push({
      id: this.nextId++,
      x,
      y,
      drawX: x,
      drawY: y,
      money: 18 + Math.random() * 52,
      happiness: 62 + Math.random() * 28,
      hunger: 12 + Math.random() * 18,
      thirst: 10 + Math.random() * 20,
      nausea: Math.random() * 12,
      patience: 45 + Math.random() * 50,
      timeInPark: 0,
      stayDuration: 120 + Math.random() * 150,
      target: null,
      thought: 'Thinking...',
      thoughtKey: 'arriving',
      thoughtTimer: 0,
      thoughtCooldown: 0,
      moveCooldown: 0,
      interactCooldown: 0,
      mode: 'walking',
      queuedRideId: null,
      leaveIntent: 0,
      visitHistory: {},
      palette: { body, head: '#f2d1b2' },
    });
    this.economy.recordRevenue(game.state.snapshot.entryFee, 'entry-fee');
  }

  update(dt, game) {
    const { entryFee, parkRating } = game.state.snapshot;
    const feePenalty = Math.max(0, entryFee - 20) * 0.018;
    const feeBonus = entryFee <= 5 ? 0.12 : 0;
    const arrivalRate = clamp((0.08 + parkRating / 650) - feePenalty + feeBonus, 0.03, 0.45);
    this.spawnTimer += dt;
    if (this.spawnTimer > 1 / arrivalRate) {
      this.spawn(game);
      this.spawnTimer = 0;
    }

    this.map.updateStructureConnectivity();

    for (const g of this.guests) {
      g.interactCooldown = Math.max(0, g.interactCooldown - dt);
      g.timeInPark += dt;
      g.hunger = clamp(g.hunger + dt * 1.15, 0, 100);
      g.thirst = clamp(g.thirst + dt * 1.3, 0, 100);
      g.nausea = clamp(g.nausea - dt * 0.55, 0, 100);
      g.patience = clamp(g.patience - dt * (g.mode === 'queuing' ? 1.2 : 0.08), 0, 100);

      const discomfort = needPressure(g.hunger, 60) + needPressure(g.thirst, 58) + needPressure(g.nausea, 40) + comfortPressure(g.patience, 30);
      if (discomfort > 0) g.happiness = clamp(g.happiness - dt * discomfort * 1.3, 0, 100);
      if (entryFee > 30) g.happiness = clamp(g.happiness - dt * 0.25, 0, 100);

      if (g.mode === 'riding') {
        if (!this.map.structures[g.queuedRideId]) {
          g.mode = 'walking';
          g.queuedRideId = null;
        }
        g.target = null;
      } else if (g.mode === 'queuing') {
        const queuedRide = this.map.structures[g.queuedRideId];
        if (!queuedRide || !queuedRide.queue.includes(g.id)) {
          g.mode = 'walking';
          g.queuedRideId = null;
        } else if (patiencePenalty(queuedRide.queue.length, g.patience) > 3.5) {
          queuedRide.queue = queuedRide.queue.filter((id) => id !== g.id);
          g.mode = 'walking';
          g.queuedRideId = null;
          g.target = null;
          g.happiness = clamp(g.happiness - 4, 0, 100);
          g.queueComplaintRideId = queuedRide.uid;
        }
      } else if (!g.target || this.shouldRetarget(g)) {
        g.target = this.chooseTarget(g);
      }

      this.moveGuest(g, dt);
      g.drawX += (g.x - g.drawX) * 0.28;
      g.drawY += (g.y - g.drawY) * 0.28;
      this.tryInteract(g, game);
      this.updateThought(g, dt, game);
      this.updateLeaveIntent(g);
    }

    const before = this.guests.length;
    this.guests = this.guests.filter((g) => !(g.leaveIntent >= 1 && g.x === this.map.entrance.x && g.y === this.map.entrance.y) && g.happiness > 0);
    game.economy.totalGuestsServed += before - this.guests.length;
  }

  shouldRetarget(guest) {
    if (!guest.target?.accessPoint) return true;
    if (guest.leaveIntent >= 1 && guest.target.kind !== 'exit') return true;
    return Math.random() < 0.01;
  }

  chooseTarget(guest) {
    if (guest.leaveIntent >= 1) {
      const route = this.map.findRouteInfo(guest.x, guest.y, this.map.entrance.x, this.map.entrance.y);
      return route ? {
        kind: 'exit',
        label: 'Leave park',
        accessPoint: { x: this.map.entrance.x, y: this.map.entrance.y },
        nextStep: route.nextStep,
        routeDistance: route.distance,
      } : null;
    }

    const options = [];
    for (const structure of Object.values(this.map.structures)) {
      const choice = this.scoreTarget(guest, structure);
      if (choice) options.push(choice);
    }
    if (!options.length) {
      const exitRoute = this.map.findRouteInfo(guest.x, guest.y, this.map.entrance.x, this.map.entrance.y);
      return exitRoute ? { kind: 'exit', label: 'Nothing to do', accessPoint: { x: this.map.entrance.x, y: this.map.entrance.y }, nextStep: exitRoute.nextStep, routeDistance: exitRoute.distance } : null;
    }

    options.sort((a, b) => b.score - a.score);
    return options[0];
  }

  scoreTarget(guest, structure) {
    const definition = BUILDING_DEFINITIONS[structure.id];
    if (!definition || !structure.connected || !structure.accessPoint) return null;

    const route = this.map.findRouteInfo(guest.x, guest.y, structure.accessPoint.x, structure.accessPoint.y);
    if (!route) return null;

    const queueLength = structure.queue.length + structure.riders.length;
    if (definition.kind === 'ride' && queueIsTooLong(queueLength, guest.patience)) return null;
    const queuePenalty = queueLength * (definition.kind === 'ride' ? 1.25 : 0.6) + patiencePenalty(queueLength, guest.patience) * 4;
    const distancePenalty = route.distance * 1.4;
    const priceRatio = structure.ticketPrice / Math.max(guest.money, 1);
    const affordabilityPenalty = structure.ticketPrice > guest.money ? 1000 : Math.max(0, priceRatio - 0.18) * 48;
    const repeatVisits = guest.visitHistory[structure.uid] || 0;

    let score = 0;
    if (definition.kind === 'ride') {
      const thrillNeed = clamp((55 - guest.happiness) / 12, 0, 4) + clamp((guest.money - structure.ticketPrice) / 35, 0, 2);
      const valuePenalty = Math.max(0, structure.ticketPrice - (definition.excitement * 0.42 + 8)) * 1.35;
      const nauseaPenalty = Math.max(0, guest.nausea + definition.nausea - 75) * 1.6;
      const intensityPenalty = Math.max(0, definition.intensity - (guest.happiness + 15)) * 0.25;
      score = definition.excitement * 1.25 + thrillNeed * 8 - distancePenalty - queuePenalty - affordabilityPenalty - nauseaPenalty - intensityPenalty - valuePenalty - repeatVisits * 7;
    } else if (definition.kind === 'food') {
      const foodValuePenalty = Math.max(0, structure.ticketPrice - 9) * 5.5;
      score = needPressure(guest.hunger, 40) * 85 + (guest.money >= structure.ticketPrice ? 8 : -1000) - distancePenalty - queuePenalty - foodValuePenalty - repeatVisits * 4;
    } else if (definition.kind === 'drink') {
      const drinkValuePenalty = Math.max(0, structure.ticketPrice - 7) * 6;
      score = needPressure(guest.thirst, 38) * 85 + (guest.money >= structure.ticketPrice ? 8 : -1000) - distancePenalty - queuePenalty - drinkValuePenalty - repeatVisits * 4;
    } else if (definition.kind === 'restroom' || definition.kind === 'facility') {
      score = needPressure(guest.nausea, 28) * 70 + comfortPressure(guest.patience, 55) * 22 - distancePenalty - queuePenalty * 0.5;
    } else {
      return null;
    }

    if (score <= 0) return null;
    return {
      structure,
      kind: definition.kind,
      score,
      dist: route.distance,
      routeDistance: route.distance,
      accessPoint: structure.accessPoint,
      nextStep: route.nextStep,
    };
  }

  moveGuest(g, dt) {
    if (g.mode === 'queuing' || g.mode === 'riding') return;
    g.moveCooldown -= dt;
    if (g.moveCooldown > 0) return;
    g.moveCooldown = 0.32;

    let route = null;
    if (g.target?.accessPoint) route = this.map.findRouteInfo(g.x, g.y, g.target.accessPoint.x, g.target.accessPoint.y);
    if (!route && g.target?.kind !== 'exit') {
      g.target = this.chooseTarget(g);
      if (g.target?.accessPoint) route = this.map.findRouteInfo(g.x, g.y, g.target.accessPoint.x, g.target.accessPoint.y);
    }

    const next = route?.nextStep;
    if (!next || (next.x === g.x && next.y === g.y)) return;
    g.x = next.x;
    g.y = next.y;
  }

  tryInteract(g, game) {
    if (!g.target || g.interactCooldown > 0) return;
    if (g.target.kind === 'exit') {
      if (g.x === this.map.entrance.x && g.y === this.map.entrance.y) g.leaveIntent = 1;
      return;
    }

    const structure = g.target?.structure;
    const accessPoint = g.target?.accessPoint;
    if (!structure || !accessPoint) {
      g.target = null;
      return;
    }

    const d = Math.abs(g.x - accessPoint.x) + Math.abs(g.y - accessPoint.y);
    if (d > 1) return;

    const b = BUILDING_DEFINITIONS[structure.id];
    if (!b) return;

    if ((structure.serviceTimer ?? 0) > 0) return;

    if (b.kind === 'ride') {
      const queueLength = (structure.queue?.length ?? 0) + (structure.riders?.length ?? 0);
      if (!structure.connected) {
        g.target = null;
        return;
      }
      if (structure.ticketPrice > g.money) {
        g.target = null;
        g.priceComplaintRideId = structure.uid;
        g.happiness = clamp(g.happiness - 2, 0, 100);
        return;
      }
      if (queueIsTooLong(queueLength, g.patience)) {
        g.target = null;
        g.queueComplaintRideId = structure.uid;
        g.happiness = clamp(g.happiness - 1.5, 0, 100);
        return;
      }
      if (!structure.queue.includes(g.id) && !structure.riders.includes(g.id)) structure.queue.push(g.id);
      g.mode = 'queuing';
      g.queuedRideId = structure.uid;
      g.interactCooldown = 2;
    } else if (b.kind === 'food' || b.kind === 'drink') {
      if (structure.ticketPrice > g.money) {
        g.target = null;
        g.happiness = clamp(g.happiness - 2, 0, 100);
        return;
      }
      g.money = Math.max(0, g.money - structure.ticketPrice);
      game.economy.recordRevenue(structure.ticketPrice, `${b.kind}-sale`);
      structure.finances.income += structure.ticketPrice;
      structure.finances.profit = structure.finances.income - structure.finances.operatingCost - structure.finances.buildCost;
      if (b.effects?.hunger) g.hunger = clamp(g.hunger + b.effects.hunger, 0, 100);
      if (b.effects?.thirst) g.thirst = clamp(g.thirst + b.effects.thirst, 0, 100);
      g.happiness = clamp(g.happiness + 6, 0, 100);
      g.patience = clamp(g.patience + 4, 0, 100);
      structure.guestsServed += 1;
      structure.finances.ridersServed += 1;
      structure.serviceTimer = 1.2;
      structure.operating = false;
      g.interactCooldown = 6;
      g.visitHistory[structure.uid] = (g.visitHistory[structure.uid] || 0) + 1;
      game.ui.addFloatingText(`+$${structure.ticketPrice}`, g.x, g.y, '#ffe7c4');
      g.target = null;
    } else if (b.kind === 'restroom' || b.kind === 'facility') {
      g.nausea = clamp(g.nausea - 28, 0, 100);
      g.patience = clamp(g.patience + 10, 0, 100);
      g.happiness = clamp(g.happiness + 4, 0, 100);
      structure.serviceTimer = 0.8;
      structure.operating = false;
      g.interactCooldown = 5;
      g.visitHistory[structure.uid] = (g.visitHistory[structure.uid] || 0) + 1;
      g.target = null;
    }
  }

  updateLeaveIntent(g) {
    const severeNeeds = g.hunger > 92 || g.thirst > 92 || g.nausea > 88;
    if (g.happiness < 18 || g.patience < 8 || severeNeeds || g.timeInPark > g.stayDuration) {
      g.leaveIntent = clamp(g.leaveIntent + 0.08, 0, 1);
    } else {
      g.leaveIntent = clamp(g.leaveIntent - 0.03, 0, 1);
    }
  }

  updateThought(g, dt, game) {
    g.thoughtTimer = Math.max(0, g.thoughtTimer - dt);
    g.thoughtCooldown = Math.max(0, (g.thoughtCooldown ?? 0) - dt);
    if (g.thoughtTimer > 0) return;

    const nextThought = this.evaluateThought(g, game);
    const changed = nextThought.key !== g.thoughtKey || nextThought.text !== g.thought;
    g.thoughtKey = nextThought.key;
    g.thought = nextThought.text;

    if (changed && g.thoughtCooldown <= 0) {
      game.state.addThought({
        guestId: g.id,
        text: nextThought.text,
        mood: nextThought.mood,
        atDay: game.timeControls.day,
      });
      g.thoughtCooldown = 4;
    }

    g.thoughtTimer = 1;
  }

  evaluateThought(g, game) {
    const queuedRide = g.queuedRideId ? this.map.structures[g.queuedRideId] : null;
    const complainedRide = g.queueComplaintRideId ? this.map.structures[g.queueComplaintRideId] : null;
    const expensiveRide = g.priceComplaintRideId ? this.map.structures[g.priceComplaintRideId] : null;

    if (g.hunger >= 72) return { key: 'hungry', text: "I'm hungry", mood: 'need' };
    if (expensiveRide && expensiveRide.ticketPrice > g.money) return { key: `expensive-${expensiveRide.uid}`, text: 'This ride is too expensive', mood: 'warning' };
    if (queuedRide && queueIsTooLong((queuedRide.queue?.length ?? 0) + (queuedRide.riders?.length ?? 0), g.patience)) {
      return { key: `queue-${queuedRide.uid}`, text: 'Queue is too long', mood: 'warning' };
    }
    if (complainedRide && queueIsTooLong((complainedRide.queue?.length ?? 0) + (complainedRide.riders?.length ?? 0), g.patience)) {
      return { key: `queue-${complainedRide.uid}`, text: 'Queue is too long', mood: 'warning' };
    }
    if (game.state.snapshot.parkRating >= 82 && g.happiness >= 78 && g.hunger < 55 && g.thirst < 55 && g.nausea < 35) {
      return { key: 'park-great', text: 'This park is great', mood: 'positive' };
    }
    if (g.thirst >= 70) return { key: 'thirsty', text: "I'm thirsty", mood: 'need' };
    if (g.nausea >= 58) return { key: 'rest', text: 'I need a break', mood: 'need' };
    if (g.leaveIntent >= 1) return { key: 'leave', text: 'Time to head home', mood: 'neutral' };
    return { key: 'explore', text: 'Looking for my next ride', mood: 'neutral' };
  }

  averageHappiness() { return this.guests.length ? this.guests.reduce((a, g) => a + g.happiness, 0) / this.guests.length : 70; }
  serialize() { return { guests: this.guests, spawnTimer: this.spawnTimer, nextId: this.nextId }; }
  restore(data) {
    this.guests = data.guests.map((g) => ({
      ...g,
      drawX: g.drawX ?? g.x,
      drawY: g.drawY ?? g.y,
      interactCooldown: g.interactCooldown ?? 0,
      mode: g.mode ?? 'walking',
      queuedRideId: g.queuedRideId ?? null,
      money: g.money ?? 50,
      nausea: g.nausea ?? 0,
      patience: g.patience ?? 70,
      leaveIntent: g.leaveIntent ?? 0,
      visitHistory: g.visitHistory ?? {},
      thought: g.thought ?? 'Thinking...',
      thoughtKey: g.thoughtKey ?? 'restored',
      thoughtCooldown: g.thoughtCooldown ?? 0,
      queueComplaintRideId: g.queueComplaintRideId ?? null,
      priceComplaintRideId: g.priceComplaintRideId ?? null,
    }));
    this.spawnTimer = data.spawnTimer;
    this.nextId = data.nextId;
  }
}
