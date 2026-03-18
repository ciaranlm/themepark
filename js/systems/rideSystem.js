/**
 * Ride and park simulation system.
 *
 * This thin wrapper keeps ride-related calculations isolated from the main app
 * shell. The underlying Simulation class still owns the park rating logic so
 * gameplay remains unchanged while the architecture becomes easier to extend.
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class RideSystem {
  constructor(simulation) {
    this.simulation = simulation;
  }

  updateRideState(structure, context, dt) {
    structure.queue = (structure.queue || []).filter((id) => context.guestManager.guests.some((guest) => guest.id === id));
    structure.riders = (structure.riders || []).filter((id) => context.guestManager.guests.some((guest) => guest.id === id));

    if (!structure.connected) {
      structure.operatingState = 'closed';
      structure.operating = false;
      return;
    }

    if (structure.operatingState === 'closed') structure.operatingState = 'idle';

    if (structure.operatingState === 'idle' && structure.queue.length > 0) {
      structure.operatingState = 'loading';
      structure.stateTimer = Math.max(1.2, Math.min(3.2, 0.45 + structure.capacity * 0.04));
    }

    if (structure.operatingState === 'loading') {
      while (structure.queue.length > 0 && structure.riders.length < structure.capacity) {
        const guestId = structure.queue.shift();
        const guest = context.guestManager.guests.find((candidate) => candidate.id === guestId);
        if (!guest) continue;
        guest.mode = 'riding';
        guest.queuedRideId = structure.uid;
        guest.target = null;
        guest.queueComplaintRideId = null;
        guest.priceComplaintRideId = null;
        guest.x = structure.accessPoint?.x ?? guest.x;
        guest.y = structure.accessPoint?.y ?? guest.y;
        guest.money = Math.max(0, guest.money - structure.ticketPrice);
        context.economy.earn(structure.ticketPrice);
        context.ui.addFloatingText(`+$${structure.ticketPrice}`, guest.x, guest.y, '#d7f3d3');
        structure.riders.push(guest.id);
      }
      structure.stateTimer -= dt;
      if (structure.stateTimer <= 0) {
        structure.operatingState = structure.riders.length > 0 ? 'running' : 'idle';
        structure.stateTimer = structure.riders.length > 0 ? structure.cycleTime : 0;
      }
      return;
    }

    if (structure.operatingState === 'running') {
      structure.stateTimer -= dt;
      if (structure.stateTimer <= 0) {
        structure.operatingState = 'unloading';
        structure.stateTimer = Math.max(0.9, Math.min(2.4, 0.35 + structure.riders.length * 0.06));
      }
      return;
    }

    if (structure.operatingState === 'unloading') {
      structure.stateTimer -= dt;
      if (structure.stateTimer > 0) return;

      for (const guestId of structure.riders) {
        const guest = context.guestManager.guests.find((candidate) => candidate.id === guestId);
        if (!guest) continue;
        guest.mode = 'walking';
        guest.queuedRideId = null;
        guest.target = null;
        guest.interactCooldown = 4.8;
        guest.hunger = clamp(guest.hunger + structure.intensity * 0.08, 0, 100);
        guest.thirst = clamp(guest.thirst + structure.intensity * 0.12, 0, 100);
        guest.nausea = clamp(guest.nausea + structure.nausea * 0.85, 0, 100);
        guest.patience = clamp(guest.patience + 6, 0, 100);
        guest.happiness = clamp(guest.happiness + 5 + structure.excitement * 0.08 - structure.nausea * 0.03, 0, 100);
        guest.visitHistory[structure.uid] = (guest.visitHistory[structure.uid] || 0) + 1;
        if (structure.accessPoint) {
          guest.x = structure.accessPoint.x;
          guest.y = structure.accessPoint.y;
        }
      }
      structure.guestsServed += structure.riders.length;
      structure.usageCount += structure.riders.length;
      structure.lastQueueLength = structure.queue.length;
      structure.riders = [];
      structure.operatingState = structure.queue.length > 0 ? 'loading' : 'idle';
      structure.stateTimer = structure.operatingState === 'loading'
        ? Math.max(1.2, Math.min(3.2, 0.45 + structure.capacity * 0.04))
        : 0;
    }
  }

  update(dt, context) {
    context.map.updateStructureConnectivity();

    for (const structure of Object.values(context.map.structures)) {
      structure.usageCount = Math.max(0, structure.usageCount - dt * 0.2);
      structure.serviceTimer = Math.max(0, (structure.serviceTimer ?? 0) - dt);

      if (context.definitions[structure.id]?.kind === 'ride') {
        this.updateRideState(structure, context, dt);
        structure.operating = structure.connected && structure.operatingState !== 'closed';
      } else {
        structure.operatingState = structure.connected === false ? 'closed' : (structure.serviceTimer > 0 ? 'busy' : 'idle');
        structure.operating = structure.serviceTimer <= 0 && structure.connected !== false;
      }
    }
    return this.simulation.computeParkRating();
  }
}
