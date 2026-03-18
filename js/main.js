import { BUILDING_DEFINITIONS } from './rideDefinitions.js';
import { Economy } from './economy.js';
import { GuestManager } from './guests.js';
import { IsoRenderer } from './isoRenderer.js';
import { GameMap } from './map.js';
import { ObjectiveManager } from './objectives.js';
import { loadGame, saveGame } from './save.js';
import { UI } from './ui.js';
import { TimeControls } from './timeControls.js';
import { Simulation } from './simulation.js';
import { GameStateStore } from './gameState.js';
import { InputSystem } from './systems/inputSystem.js';
import { RideSystem } from './systems/rideSystem.js';
import { GuestSystem } from './systems/guestSystem.js';
import { EconomySystem } from './systems/economySystem.js';
import { RenderSystem } from './systems/renderSystem.js';
import { UISystem } from './systems/uiSystem.js';
import { GameLoop } from './systems/gameLoop.js';

/**
 * Main application shell.
 *
 * The app now composes small systems around a shared state store so new prompts
 * can extend the game safely without hunting through one large class.
 */
class GameApp {
  get currentDay() { return this.state.snapshot.currentDay; }
  get lifetimeGuests() { return this.state.snapshot.lifetimeGuests; }
  get parkRating() { return this.state.snapshot.parkRating; }
  get lifetimeRevenue() { return this.state.snapshot.lifetimeRevenue; }

  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.map = new GameMap();
    this.economy = new Economy();
    this.objectives = new ObjectiveManager();
    this.timeControls = new TimeControls();
    this.state = new GameStateStore();
    this.definitions = BUILDING_DEFINITIONS;

    this.guestManager = new GuestManager(this.map, this.economy);
    this.ui = new UI(this);
    this.renderer = new IsoRenderer(this.canvas, this.map);
    this.simulation = new Simulation(this);

    this.inputSystem = new InputSystem({
      canvas: this.canvas,
      state: this.state,
      map: this.map,
      renderer: this.renderer,
      economy: this.economy,
      objectives: this.objectives,
      ui: this.ui,
    });
    this.rideSystem = new RideSystem(this.simulation);
    this.guestSystem = new GuestSystem(this.guestManager);
    this.economySystem = new EconomySystem(this.economy, this.ui);
    this.renderSystem = new RenderSystem(this.renderer);
    this.uiSystem = new UISystem(this.ui, this.objectives);
    this.loop = new GameLoop({
      state: this.state,
      timeControls: this.timeControls,
      rideSystem: this.rideSystem,
      guestSystem: this.guestSystem,
      economySystem: this.economySystem,
      uiSystem: this.uiSystem,
      renderSystem: this.renderSystem,
      context: this,
    });

    this.setupButtons();
    this.inputSystem.attach();
    this.uiSystem.attach();
    this.loop.start();
    setInterval(() => saveGame(this), 12000);
  }

  setupButtons() {
    document.getElementById('saveBtn').onclick = () => saveGame(this);
    document.getElementById('loadBtn').onclick = () => {
      const data = loadGame();
      if (data) this.restore(data);
    };
  }

  serialize() {
    return {
      map: this.map.serialize(),
      economy: this.economy.serialize(),
      guests: this.guestManager.serialize(),
      objectives: this.objectives.serialize(),
      time: { ...this.timeControls },
      state: this.state.serialize(),
    };
  }

  restore(data) {
    this.map.restore(data.map);
    this.economy.restore(data.economy);
    this.guestManager.restore(data.guests);
    this.objectives.restore(data.objectives);
    if (data.time) Object.assign(this.timeControls, data.time);
    this.state.restore(data.state || {
      selectedBuild: data.selectedBuild,
      parkName: data.parkName,
      entryFee: data.entryFee,
      lifetimeGuests: data.lifetimeGuests,
      lifetimeRevenue: data.lifetimeRevenue,
      currentDay: data.currentDay ?? data.time?.day,
    });

    const snapshot = this.state.snapshot;
    snapshot.lifetimeGuests = snapshot.lifetimeGuests ?? this.economy.totalGuestsServed;
    snapshot.lifetimeRevenue = snapshot.lifetimeRevenue ?? this.economy.lifetimeRevenue;

    this.ui.renderBuildPanel();
  }
}

new GameApp();
