/**
 * Game loop / tick system.
 *
 * Owns the fixed browser animation flow and orchestrates the order of systems:
 * time progression, rides, guests, economy, state cleanup, UI refresh, then
 * rendering. The sequencing matches the current behavior while being much more
 * explicit for future work.
 */
export class GameLoop {
  constructor({ state, timeControls, rideSystem, guestSystem, economySystem, uiSystem, renderSystem, context }) {
    this.state = state;
    this.timeControls = timeControls;
    this.rideSystem = rideSystem;
    this.guestSystem = guestSystem;
    this.economySystem = economySystem;
    this.uiSystem = uiSystem;
    this.renderSystem = renderSystem;
    this.context = context;
  }

  start() {
    this.frame();
  }

  frame() {
    const snapshot = this.state.snapshot;
    const now = performance.now();
    const dt = Math.min((now - snapshot.lastFrameAt) / 1000, 0.05);
    this.state.patch({ lastFrameAt: now });

    const simDt = this.timeControls.tick(dt);
    const { totalUpkeep } = this.rideSystem.update();

    if (simDt > 0) {
      this.guestSystem.update(simDt, this.context);
      this.economySystem.update(simDt, totalUpkeep, this.context.map);
      this.state.tickFloatingTexts(simDt);
    }

    this.uiSystem.updateAfterSimulation(this.context);
    this.renderSystem.render(this.context);
    requestAnimationFrame(() => this.frame());
  }
}
