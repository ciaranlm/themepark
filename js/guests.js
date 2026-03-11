import { BUILDINGS } from './data.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export class GuestManager {
  constructor(gameMap, economy) {
    this.map = gameMap;
    this.economy = economy;
    this.guests = [];
    this.spawnTimer = 0;
    this.nextId = 1;
  }

  spawn(count = 1) {
    for (let i = 0; i < count; i++) {
      const { x, y } = this.map.entrance;
      this.guests.push({
        id: this.nextId++,
        x: x + 1,
        y,
        happiness: 70 + Math.random() * 30,
        hunger: 20 + Math.random() * 20,
        energy: 70 + Math.random() * 20,
        boredom: 10,
        timeInPark: 0,
        stayDuration: 55 + Math.random() * 80,
        target: null,
        thought: '😊',
        moveCooldown: 0,
        stuckTime: 0,
      });
    }
  }

  update(dt, game) {
    const arrivalRate = 0.45 + game.parkRating / 120;
    this.spawnTimer += dt;
    if (this.spawnTimer > 1 / arrivalRate) {
      this.spawn(1);
      this.spawnTimer = 0;
    }

    for (const g of this.guests) {
      g.timeInPark += dt;
      g.hunger = clamp(g.hunger + dt * 2.2, 0, 100);
      g.energy = clamp(g.energy - dt * 1.2, 0, 100);
      g.boredom = clamp(g.boredom + dt * 1.4, 0, 100);
      if (g.hunger > 70 || g.energy < 25 || g.boredom > 70) g.happiness = clamp(g.happiness - dt * 2, 0, 100);

      if (!g.target || Math.random() < 0.03) g.target = this.chooseTarget(g);
      this.moveGuest(g, dt);
      this.tryInteract(g, game);
      this.updateThought(g);
    }

    const before = this.guests.length;
    this.guests = this.guests.filter((g) => g.timeInPark < g.stayDuration && g.happiness > 5);
    game.economy.totalGuestsServed += before - this.guests.length;
  }

  chooseTarget(guest) {
    const options = this.map.nearbyAttractions(guest.x, guest.y, 8);
    if (!options.length) return null;
    const top = options.slice(0, Math.min(5, options.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  moveGuest(g, dt) {
    g.moveCooldown -= dt;
    if (g.moveCooldown > 0) return;
    g.moveCooldown = 0.35;

    const neighbors = this.map.pathNeighbors(g.x, g.y);
    if (!neighbors.length) {
      g.stuckTime += dt;
      g.happiness -= 1;
      return;
    }

    const candidate = neighbors
      .map((n) => ({
        tile: n,
        score: g.target
          ? Math.abs(n.x - g.target.x) + Math.abs(n.y - g.target.y) + Math.random() * 1.5
          : Math.random() * 5,
      }))
      .sort((a, b) => a.score - b.score)[0].tile;

    if (candidate.x === g.x && candidate.y === g.y) g.stuckTime += dt;
    else g.stuckTime = 0;
    g.x = candidate.x;
    g.y = candidate.y;
  }

  tryInteract(g, game) {
    if (!g.target) return;
    const d = Math.abs(g.x - g.target.x) + Math.abs(g.y - g.target.y);
    if (d > 1) return;
    const b = BUILDINGS[g.target.buildingId];
    if (!b) return;

    if (b.type === 'ride') {
      game.economy.earn(b.ticket);
      g.boredom = clamp(g.boredom - 45, 0, 100);
      g.energy = clamp(g.energy - 8, 0, 100);
      g.happiness = clamp(g.happiness + 10, 0, 100);
      game.addFloatingText(`+$${b.ticket}`, g.x, g.y, '#26c281');
    } else if (b.type === 'food' || b.type === 'drink') {
      game.economy.earn(b.ticket);
      g.hunger = clamp(g.hunger - 50, 0, 100);
      g.happiness = clamp(g.happiness + 7, 0, 100);
      game.addFloatingText(`+$${b.ticket}`, g.x, g.y, '#ff6ea9');
    } else if (b.type === 'restroom') {
      g.happiness = clamp(g.happiness + 4, 0, 100);
      g.energy = clamp(g.energy + 8, 0, 100);
    }
    g.target = null;
  }

  updateThought(g) {
    if (g.hunger > 75) g.thought = '🍔';
    else if (g.boredom > 75) g.thought = '🎢';
    else if (g.energy < 20) g.thought = '😴';
    else if (g.stuckTime > 2) g.thought = '❓';
    else if (g.happiness > 70) g.thought = '😄';
    else g.thought = '🙂';
  }

  averageHappiness() {
    if (!this.guests.length) return 70;
    return this.guests.reduce((acc, g) => acc + g.happiness, 0) / this.guests.length;
  }

  serialize() {
    return { guests: this.guests, spawnTimer: this.spawnTimer, nextId: this.nextId };
  }

  restore(data) {
    this.guests = data.guests;
    this.spawnTimer = data.spawnTimer;
    this.nextId = data.nextId;
  }
}
