/**
 * UI system.
 *
 * Coordinates DOM refreshes and notifications from the central state after other
 * systems mutate the simulation. This keeps browser UI concerns out of the game
 * loop and placement handlers.
 */
export class UISystem {
  constructor(ui, objectives) {
    this.ui = ui;
    this.objectives = objectives;
  }

  attach() {
    this.ui.setupTimeControls();
    this.ui.renderBuildPanel();
  }

  updateAfterSimulation(context) {
    if (this.objectives.update(context)) {
      for (const id of this.objectives.justUnlocked) context.ui.notify(`New ride unlocked: ${context.definitions[id].name}`);
      context.ui.renderBuildPanel();
      this.objectives.consumeNewFlags();
    }

    context.ui.updateStats();
    context.ui.updateInfoPanel(context.state.snapshot.hoverTile);
  }
}
