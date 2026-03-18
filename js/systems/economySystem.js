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

  update(dt, operatingCostBreakdown, map) {
    const { upkeepPaid, breakdown } = this.economy.tick(dt, operatingCostBreakdown);
    if (upkeepPaid > 0) {
      for (const item of breakdown) {
        if (!item.uid) continue;
        const structure = map.structures[item.uid];
        if (!structure?.finances) continue;
        structure.finances.operatingCost += item.cost;
        structure.finances.lastOperatingCost = item.cost;
        structure.finances.profit = structure.finances.income - structure.finances.operatingCost - structure.finances.buildCost;
      }
      this.ui.addFloatingText(`-$${Math.round(upkeepPaid)} running costs`, map.entrance.x + 2, map.entrance.y - 2, '#ffe0cf');
    }
  }
}
