import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const palette = ['#eb6f5d', '#5c7fdb', '#d4a14a', '#78b36a', '#9f79d1', '#55a2a1'];

const needPressure = (value, start = 55) => clamp((value - start) / (100 - start), 0, 1);
const comfortPressure = (value, end = 45) => clamp((end - value) / end, 0, 1);
const patiencePenalty = (queueLength, patience) => Math.max(0, queueLength - Math.max(1, patience / 18));

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
      money: 35 + Math.random() * 80,
      happiness: 62 + Math.random() * 28,
      hunger: 12 + Math.random() * 18,
      thirst: 10 + Math.random() * 20,
      nausea: Math.random() * 12,
      patience: 45 + Math.random() * 50,
      timeInPark: 0,
      stayDuration: 120 + Math.random() * 150,
      target: null,
      thought: 'ok',
      thoughtTimer: 0,
      moveCooldown: 0,
      interactCooldown: 0,
      mode: 'walking',
      queuedRideId: null,
      leaveIntent: 0,
      visitHistory: {},
      palette: { body, head: '#f2d1b2' },
    });
    this.economy.earn(game.state.snapshot.entryFee);
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
        }
      } else if (!g.target || this.shouldRetarget(g)) {
        g.target = this.chooseTarget(g);
      }

      this.moveGuest(g, dt);
      g.drawX += (g.x - g.drawX) * 0.28;
      g.drawY += (g.y - g.drawY) * 0.28;
      this.tryInteract(g, game);
      this.updateThought(g, dt);
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
    const queuePenalty = queueLength * (definition.kind === 'ride' ? 1.25 : 0.6) + patiencePenalty(queueLength, guest.patience) * 4;
    const distancePenalty = route.distance * 1.4;
    const affordabilityPenalty = structure.ticketPrice > guest.money ? 1000 : 0;
    const repeatVisits = guest.visitHistory[structure.uid] || 0;

    let score = 0;
    if (definition.kind === 'ride') {
      const thrillNeed = clamp((55 - guest.happiness) / 12, 0, 4) + clamp((guest.money - structure.ticketPrice) / 35, 0, 2);
      const nauseaPenalty = Math.max(0, guest.nausea + definition.nausea - 75) * 1.6;
      const intensityPenalty = Math.max(0, definition.intensity - (guest.happiness + 15)) * 0.25;
      score = definition.excitement * 1.25 + thrillNeed * 8 - distancePenalty - queuePenalty - affordabilityPenalty - nauseaPenalty - intensityPenalty - repeatVisits * 7;
    } else if (definition.kind === 'food') {
      score = needPressure(guest.hunger, 40) * 85 + (guest.money >= structure.ticketPrice ? 8 : -1000) - distancePenalty - queuePenalty - repeatVisits * 4;
    } else if (definition.kind === 'drink') {
      score = needPressure(guest.thirst, 38) * 85 + (guest.money >= structure.ticketPrice ? 8 : -1000) - distancePenalty - queuePenalty - repeatVisits * 4;
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
      if (!structure.connected || structure.ticketPrice > g.money) {
        g.target = null;
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
      game.economy.earn(structure.ticketPrice);
      if (b.effects?.hunger) g.hunger = clamp(g.hunger + b.effects.hunger, 0, 100);
      if (b.effects?.thirst) g.thirst = clamp(g.thirst + b.effects.thirst, 0, 100);
      g.happiness = clamp(g.happiness + 6, 0, 100);
      g.patience = clamp(g.patience + 4, 0, 100);
      structure.guestsServed += 1;
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

  updateThought(g, dt) {
    g.thoughtTimer = Math.max(0, g.thoughtTimer - dt);
    if (g.thoughtTimer > 0) return;

    if (g.leaveIntent >= 1) g.thought = 'leave';
    else if (g.thirst > 70) g.thought = 'drink';
    else if (g.hunger > 70) g.thought = 'food';
    else if (g.nausea > 55) g.thought = 'rest';
    else g.thought = g.happiness < 45 ? 'cheer up' : 'ride';
    g.thoughtTimer = 1;
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
    }));
    this.spawnTimer = data.spawnTimer;
    this.nextId = data.nextId;
  }
}
