/**
 * Ride and park simulation system.
 *
 * This thin wrapper keeps ride-related calculations isolated from the main app
 * shell. The underlying Simulation class still owns the park rating logic so
 * gameplay remains unchanged while the architecture becomes easier to extend.
 */
export class RideSystem {
  constructor(simulation) {
    this.simulation = simulation;
  }

  update() {
    return this.simulation.computeParkRating();
  }
}
