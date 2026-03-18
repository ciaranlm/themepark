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

  update(dt, context) {
    for (const structure of Object.values(context.map.structures)) {
      structure.usageCount = Math.max(0, structure.usageCount - dt * 0.35);
      structure.serviceTimer = Math.max(0, (structure.serviceTimer ?? 0) - dt);
      structure.operating = structure.serviceTimer <= 0;
    }
    return this.simulation.computeParkRating();
  }
}
