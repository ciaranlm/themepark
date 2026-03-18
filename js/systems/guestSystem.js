/**
 * Guest system.
 *
 * Guests already live in GuestManager. This adapter gives the game loop a clear
 * system boundary so future prompts can add routing, needs, and AI changes here
 * without bloating the application entry point.
 */
export class GuestSystem {
  constructor(guestManager) {
    this.guestManager = guestManager;
  }

  update(dt, context) {
    this.guestManager.update(dt, context);
  }
}
