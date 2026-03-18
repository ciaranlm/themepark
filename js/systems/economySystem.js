/**
 * Economy system.
 *
 * Handles park cashflow ticks separately from guest and rendering code. Keeping
 * this wrapper explicit makes it safer to add loans, research, staffing, or new
 * expense categories later without reworking the app shell.
 */
export class EconomySystem {
  constructor(economy, ui) {
    this.economy = economy;
    this.ui = ui;
  }

  update(dt, totalUpkeep, map) {
    const upkeep = this.economy.tick(dt, totalUpkeep);
    if (upkeep > 0) this.ui.addFloatingText(`-$${Math.round(upkeep)} upkeep`, map.entrance.x + 2, map.entrance.y - 2, '#ffe0cf');
  }
}
