import { BUILDINGS, GRID_SIZE, TILE_COLORS, TILE_SIZE } from './data.js';
import { Economy } from './economy.js';
import { GuestManager } from './guests.js';
import { GameMap } from './map.js';
import { ObjectiveManager } from './objectives.js';
import { loadGame, saveGame } from './save.js';
import { UI } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.map = new GameMap();
    this.economy = new Economy();
    this.objectives = new ObjectiveManager();
    this.guestManager = new GuestManager(this.map, this.economy);
    this.ui = new UI(this);
    this.selectedBuild = 'path';
    this.selectedTile = null;
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
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      const tile = this.map.getTile(x, y);
      this.selectedTile = tile;

      if (e.button === 2) {
        const removed = this.map.remove(x, y);
        if (removed) this.economy.earn(Math.floor(BUILDINGS[removed].cost * 0.5));
        return;
      }
      if (!this.map.canPlace(x, y, this.selectedBuild)) return;
      const item = BUILDINGS[this.selectedBuild];
      if (!this.objectives.isUnlocked(item)) return;
      if (!this.economy.canAfford(item.cost)) return;

      this.map.place(x, y, this.selectedBuild);
      this.economy.spend(item.cost);
      this.addFloatingText(`-$${item.cost}`, x, y, '#d64545');
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      this.selectedTile = this.map.getTile(x, y);
    });
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({ text, x: x * TILE_SIZE + 6, y: y * TILE_SIZE + 8, life: 1.2, color });
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
    const variety = Math.min(20, (rideCount * 4 + stallCount * 3));
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
    if (upkeep > 0) this.addFloatingText(`-$${Math.round(upkeep)} upkeep`, this.map.entrance.x + 2, this.map.entrance.y - 2, '#a15c5c');

    if (this.objectives.update(this)) {
      this.ui.renderBuildPanel();
      this.addFloatingText('Objective complete!', this.map.entrance.x + 3, this.map.entrance.y - 1, '#3378ff');
    }

    this.floatingTexts = this.floatingTexts
      .map((t) => ({ ...t, y: t.y - dt * 12, life: t.life - dt }))
      .filter((t) => t.life > 0);

    this.ui.updateStats();
    this.ui.updateInfoPanel(this.selectedTile);
  }

  drawGrid() {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const t = this.map.grid[y][x];
        this.ctx.fillStyle = TILE_COLORS[t.tile] || '#88d66b';
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        if (t.buildingId && t.tile !== 'path') {
          this.ctx.fillStyle = '#1f2d3d';
          this.ctx.font = '12px sans-serif';
          this.ctx.fillText(BUILDINGS[t.buildingId].icon, x * TILE_SIZE + 1, y * TILE_SIZE + 12);
        }
      }
    }

    if (this.selectedTile) {
      this.ctx.strokeStyle = '#3378ff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(this.selectedTile.x * TILE_SIZE, this.selectedTile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      this.ctx.lineWidth = 1;
    }
  }

  drawGuests() {
    for (const g of this.guestManager.guests) {
      this.ctx.fillStyle = '#243447';
      this.ctx.beginPath();
      this.ctx.arc(g.x * TILE_SIZE + TILE_SIZE / 2, g.y * TILE_SIZE + TILE_SIZE / 2, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(g.thought, g.x * TILE_SIZE + 6, g.y * TILE_SIZE + 5);
    }
  }

  drawFloatingText() {
    for (const t of this.floatingTexts) {
      this.ctx.globalAlpha = Math.max(0.25, t.life);
      this.ctx.fillStyle = t.color;
      this.ctx.font = '11px sans-serif';
      this.ctx.fillText(t.text, t.x, t.y);
    }
    this.ctx.globalAlpha = 1;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawGuests();
    this.drawFloatingText();
  }

  loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
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
