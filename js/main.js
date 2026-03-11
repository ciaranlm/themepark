import { BUILDING_DEFINITIONS } from './rideDefinitions.js';
import { Economy } from './economy.js';
import { GuestManager } from './guests.js';
import { IsoRenderer } from './isoRenderer.js';
import { GameMap } from './map.js';
import { ObjectiveManager } from './objectives.js';
import { loadGame, saveGame } from './save.js';
import { UI } from './ui.js';
import { PlacementSystem } from './placement.js';
import { TimeControls } from './timeControls.js';
import { Simulation } from './simulation.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.map = new GameMap();
    this.economy = new Economy();
    this.objectives = new ObjectiveManager();
    this.timeControls = new TimeControls();
    this.guestManager = new GuestManager(this.map, this.economy);
    this.ui = new UI(this);
    this.renderer = new IsoRenderer(this.canvas, this.map);
    this.simulation = new Simulation(this);
    this.definitions = BUILDING_DEFINITIONS;
    this.selectedBuild = 'path';
    this.selectedTile = null;
    this.selectedStructure = null;
    this.hoverTile = null;
    this.parkRating = 65;
    this.floatingTexts = [];
    this.last = performance.now();

    this.setupInput();
    this.setupButtons();
    this.ui.setupTimeControls();
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
      this.selectedTile = t;
      this.selectedStructure = this.map.structureAt(t.x, t.y);

      if (e.button === 2) {
        const removed = this.map.removeAt(t.x, t.y);
        if (removed?.id) {
          const refund = Math.floor(BUILDING_DEFINITIONS[removed.id].cost * 0.45);
          this.economy.earn(refund);
          this.ui.setHint(`Removed ${removed.name}. Refunded $${refund}.`);
        }
        return;
      }

      const check = PlacementSystem.validatePlacement(this.map, t.x, t.y, this.selectedBuild, this.economy, this.objectives);
      if (!check.valid) { this.ui.setHint(check.reason); return; }
      const item = BUILDING_DEFINITIONS[this.selectedBuild];
      if (item.kind === 'path') this.map.placePath(t.x, t.y);
      else this.map.placeStructure(t.x, t.y, item);
      this.economy.spend(item.cost);
      this.addFloatingText(`-$${item.cost}`, t.x, t.y, '#ffd1d1');
      this.ui.setHint(`Placed ${item.name} (${item.width}x${item.height}).`);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const t = this.pointerToTile(e);
      this.hoverTile = t;
      this.selectedTile = t;
      if (!t) return;
      const check = PlacementSystem.validatePlacement(this.map, t.x, t.y, this.selectedBuild, this.economy, this.objectives);
      this.ui.setHint(`Tile (${t.x},${t.y}) • ${check.valid ? 'Valid build' : check.reason} • ${this.timeControls.label()}`);
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

  update(realDt) {
    const dt = this.timeControls.tick(realDt);
    const { totalUpkeep } = this.simulation.computeParkRating();

    if (dt > 0) {
      this.guestManager.update(dt, this);
      const upkeep = this.economy.tick(dt, totalUpkeep);
      if (upkeep > 0) this.addFloatingText(`-$${Math.round(upkeep)} upkeep`, this.map.entrance.x + 2, this.map.entrance.y - 2, '#ffe0cf');
      if (this.objectives.update(this)) this.ui.renderBuildPanel();
      this.floatingTexts = this.floatingTexts.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0);
    }

    this.ui.updateStats();
    this.ui.updateInfoPanel(this.hoverTile);
  }

  render() { this.renderer.draw(this, performance.now() / 1000); }

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
      map: this.map.serialize(), economy: this.economy.serialize(), guests: this.guestManager.serialize(),
      objectives: this.objectives.serialize(), selectedBuild: this.selectedBuild, time: { ...this.timeControls },
    };
  }

  restore(data) {
    this.map.restore(data.map);
    this.economy.restore(data.economy);
    this.guestManager.restore(data.guests);
    this.objectives.restore(data.objectives);
    this.selectedBuild = data.selectedBuild || 'path';
    if (data.time) Object.assign(this.timeControls, data.time);
    this.ui.renderBuildPanel();
  }
}

new Game();
