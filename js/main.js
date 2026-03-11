import { BUILDINGS } from './data.js';
import { Economy } from './economy.js';
import { GuestManager } from './guests.js';
import { IsoRenderer } from './isoRenderer.js';
import { GameMap } from './map.js';
import { ObjectiveManager } from './objectives.js';
import { loadGame, saveGame } from './save.js';
import { UI } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.map = new GameMap();
    this.economy = new Economy();
    this.objectives = new ObjectiveManager();
    this.guestManager = new GuestManager(this.map, this.economy);
    this.ui = new UI(this);
    this.renderer = new IsoRenderer(this.canvas, this.map);
    this.selectedBuild = 'path';
    this.selectedTile = null;
    this.hoverTile = null;
    this.parkRating = 65;
    this.floatingTexts = [];
    this.last = performance.now();

    this.setupInput();
    this.setupButtons();
    this.ui.renderBuildPanel();
    this.loop();
    setInterval(() => saveGame(this), 12000);
  }

  setupButtons() {
    document.getElementById('saveBtn').onclick = () => saveGame(this);
    document.getElementById('loadBtn').onclick = () => {
      const data = loadGame();
      if (data) this.restore(data);
    };
  }

  setupInput() {
    this.canvas.oncontextmenu = (e) => e.preventDefault();
    this.canvas.addEventListener('mousedown', (e) => {
      const t = this.pointerToTile(e);
      if (!t) return;
      const tile = this.map.getTile(t.x, t.y);
      this.selectedTile = tile;

      if (e.button === 2) {
        const removed = this.map.remove(t.x, t.y);
        if (removed) {
          const refund = Math.floor(BUILDINGS[removed].cost * 0.5);
          this.economy.earn(refund);
          this.ui.setHint(`Removed ${BUILDINGS[removed].name}. Refunded $${refund}.`);
        }
        return;
      }
      if (!this.map.canPlace(t.x, t.y, this.selectedBuild)) return;
      const item = BUILDINGS[this.selectedBuild];
      if (!this.objectives.isUnlocked(item) || !this.economy.canAfford(item.cost)) return;

      this.map.place(t.x, t.y, this.selectedBuild);
      this.economy.spend(item.cost);
      this.addFloatingText(`-$${item.cost}`, t.x, t.y, '#ffd1d1');
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const t = this.pointerToTile(e);
      this.hoverTile = t;
      this.selectedTile = t ? this.map.getTile(t.x, t.y) : null;
      if (!t) return;
      const tile = this.map.getTile(t.x, t.y);
      const canBuild = this.map.canPlace(t.x, t.y, this.selectedBuild);
      this.ui.setHint(`Tile (${t.x},${t.y}) • ${tile.tile} • ${canBuild ? 'Valid build' : 'Invalid build'} • Left place / Right remove`);
    });
  }

  pointerToTile(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    const t = this.renderer.screenToGrid(sx, sy);
    return this.map.inBounds(t.x, t.y) ? t : null;
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, life: 1.2, color });
  }

  computeParkRating() {
    let rideCount = 0, stallCount = 0, decoCount = 0, restroomCount = 0;
    for (const row of this.map.grid) {
      for (const t of row) {
        if (t.tile === 'ride') rideCount++;
        if (t.tile === 'stall') stallCount++;
        if (t.tile === 'decoration') decoCount++;
        if (t.tile === 'restroom') restroomCount++;
      }
    }
    const happiness = this.guestManager.averageHappiness();
    const variety = Math.min(20, rideCount * 4 + stallCount * 3);
    const cleanliness = Math.min(15, decoCount * 1.2 + restroomCount * 2);
    const crowdingPenalty = Math.max(0, this.guestManager.guests.length - (rideCount + stallCount + 1) * 10) * 0.6;
    this.parkRating = Math.max(1, Math.min(100, happiness * 0.55 + variety + cleanliness - crowdingPenalty));
    return { rideCount, totalUpkeep: this.totalRideUpkeep() };
  }

  totalRideUpkeep() {
    let total = 0;
    for (const row of this.map.grid) {
      for (const t of row) {
        if (t.tile === 'ride' && t.buildingId) total += BUILDINGS[t.buildingId].upkeep;
      }
    }
    return total;
  }

  update(dt) {
    const { rideCount, totalUpkeep } = this.computeParkRating();
    this.guestManager.update(dt, this);
    const upkeep = this.economy.tick(dt, rideCount, totalUpkeep / Math.max(rideCount, 1));
    if (upkeep > 0) this.addFloatingText(`-$${Math.round(upkeep)} upkeep`, this.map.entrance.x + 2, this.map.entrance.y - 2, '#ffe0cf');

    if (this.objectives.update(this)) {
      this.ui.renderBuildPanel();
      this.addFloatingText('Objective complete', this.map.entrance.x + 3, this.map.entrance.y - 1, '#d9ecff');
    }

    this.floatingTexts = this.floatingTexts.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0);
    this.ui.updateStats();
    this.ui.updateInfoPanel(this.selectedTile);
  }

  render() {
    this.renderer.draw(this, performance.now() / 1000);
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  serialize() {
    return {
      map: this.map.serialize(),
      economy: this.economy.serialize(),
      guests: this.guestManager.serialize(),
      objectives: this.objectives.serialize(),
      selectedBuild: this.selectedBuild,
    };
  }

  restore(data) {
    this.map.restore(data.map);
    this.economy.restore(data.economy);
    this.guestManager.restore(data.guests);
    this.objectives.restore(data.objectives);
    this.selectedBuild = data.selectedBuild || 'path';
    this.ui.renderBuildPanel();
  }
}

new Game();
