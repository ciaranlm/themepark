import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const palette = ['#eb6f5d', '#5c7fdb', '#d4a14a', '#78b36a', '#9f79d1', '#55a2a1'];

export class GuestManager {
  constructor(gameMap, economy) {
    this.map = gameMap;
    this.economy = economy;
    this.guests = [];
    this.spawnTimer = 0;
    this.nextId = 1;
  }

  spawn(game) {
    const { x, y } = this.map.entrance;
    const body = palette[Math.floor(Math.random() * palette.length)];
    this.guests.push({
      id: this.nextId++, x: x + 1, y, drawX: x + 1, drawY: y,
      happiness: 66 + Math.random() * 28, hunger: 20 + Math.random() * 25, thirst: 20,
      energy: 70 + Math.random() * 20, boredom: 10, timeInPark: 0, stayDuration: 120 + Math.random() * 150,
      target: null, thought: 'ok', thoughtTimer: 0, moveCooldown: 0, interactCooldown: 0, stuckTime: 0,
      palette: { body, head: '#f2d1b2' },
    });
    this.economy.earn(game.entryFee);
  }

  update(dt, game) {
    const feePenalty = Math.max(0, game.entryFee - 20) * 0.018;
    const feeBonus = game.entryFee <= 5 ? 0.12 : 0;
    const arrivalRate = clamp((0.08 + game.parkRating / 650) - feePenalty + feeBonus, 0.03, 0.45);
    this.spawnTimer += dt;
    if (this.spawnTimer > 1 / arrivalRate) {
      this.spawn(game);
      this.spawnTimer = 0;
    }

    for (const g of this.guests) {
      g.interactCooldown = Math.max(0, g.interactCooldown - dt);
      g.timeInPark += dt;
      g.hunger = clamp(g.hunger + dt * 1.1, 0, 100);
      g.thirst = clamp(g.thirst + dt * 1.2, 0, 100);
      g.energy = clamp(g.energy - dt * 0.65, 0, 100);
      g.boredom = clamp(g.boredom + dt * 0.85, 0, 100);
      if (g.hunger > 70 || g.boredom > 70 || g.thirst > 75 || game.entryFee > 30) g.happiness = clamp(g.happiness - dt * 1.5, 0, 100);

      if (!g.target || Math.random() < 0.008) g.target = this.chooseTarget(g);
      this.moveGuest(g, dt);
      g.drawX += (g.x - g.drawX) * 0.28;
      g.drawY += (g.y - g.drawY) * 0.28;
      this.tryInteract(g, game);
      this.updateThought(g, dt);
    }

    const before = this.guests.length;
    this.guests = this.guests.filter((g) => g.timeInPark < g.stayDuration && g.happiness > 5);
    game.economy.totalGuestsServed += before - this.guests.length;
  }

  chooseTarget(guest) {
    const options = this.map.nearbyAttractions(guest.x, guest.y, 10);
    if (!options.length) return null;
    return options[Math.floor(Math.random() * Math.min(6, options.length))];
  }

  moveGuest(g, dt) {
    g.moveCooldown -= dt;
    if (g.moveCooldown > 0) return;
    g.moveCooldown = 0.32;
    const neighbors = this.map.pathNeighbors(g.x, g.y);
    if (!neighbors.length) return;

    const next = neighbors.map((n) => ({ tile: n, score: g.target ? Math.abs(n.x - g.target.x) + Math.abs(n.y - g.target.y) + Math.random() * 2.1 : Math.random() * 4 }))
      .sort((a, b) => a.score - b.score)[0].tile;
    g.x = next.x;
    g.y = next.y;
  }

  tryInteract(g, game) {
    if (!g.target || g.interactCooldown > 0) return;
    const d = Math.abs(g.x - g.target.x) + Math.abs(g.y - g.target.y);
    if (d > 2) return;

    const b = BUILDING_DEFINITIONS[g.target.id];
    if (!b) return;

    if (b.kind === 'ride') {
      game.economy.earn(g.target.ticketPrice);
      g.boredom = clamp(g.boredom - (16 + b.excitement * 0.35), 0, 100);
      g.energy = clamp(g.energy - 6, 0, 100);
      g.happiness = clamp(g.happiness + 8, 0, 100);
      g.target.usageCount += 1;
      g.target.guestsServed += 1;
      g.interactCooldown = 4.8;
      game.addFloatingText(`+$${g.target.ticketPrice}`, g.x, g.y, '#d7f3d3');
    } else if (b.kind === 'food' || b.kind === 'drink') {
      game.economy.earn(g.target.ticketPrice);
      if (b.effects?.hunger) g.hunger = clamp(g.hunger + b.effects.hunger, 0, 100);
      if (b.effects?.thirst) g.thirst = clamp(g.thirst + b.effects.thirst, 0, 100);
      g.happiness = clamp(g.happiness + 5, 0, 100);
      g.target.guestsServed += 1;
      g.interactCooldown = 6;
      game.addFloatingText(`+$${g.target.ticketPrice}`, g.x, g.y, '#ffe7c4');
    } else if (b.kind === 'restroom') {
      g.happiness = clamp(g.happiness + 3, 0, 100);
      g.energy = clamp(g.energy + 6, 0, 100);
      g.interactCooldown = 5;
    }
    g.target = null;
  }

  updateThought(g, dt) {
    g.thoughtTimer = Math.max(0, g.thoughtTimer - dt);
    if (Math.random() < 0.01) {
      g.thought = g.hunger > 75 ? 'food' : g.thirst > 70 ? 'drink' : g.boredom > 70 ? 'ride' : 'fun';
      g.thoughtTimer = 1;
    }
  }

  averageHappiness() { return this.guests.length ? this.guests.reduce((a, g) => a + g.happiness, 0) / this.guests.length : 70; }
  serialize() { return { guests: this.guests, spawnTimer: this.spawnTimer, nextId: this.nextId }; }
  restore(data) { this.guests = data.guests.map((g) => ({ ...g, drawX: g.drawX ?? g.x, drawY: g.drawY ?? g.y, interactCooldown: g.interactCooldown ?? 0 })); this.spawnTimer = data.spawnTimer; this.nextId = data.nextId; }
}
