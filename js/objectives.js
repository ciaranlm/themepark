import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

export class ObjectiveManager {
  constructor() {
    this.unlocked = new Set();
    this.justUnlocked = new Set();
    Object.values(BUILDING_DEFINITIONS).forEach((def) => {
      if (def.isStartingUnlocked) this.unlocked.add(def.id);
    });
  }

  checkCondition(def, game) {
    const value = def.unlockConditionValue;
    switch (def.unlockConditionType) {
      case 'manual': return true;
      case 'day': return game.currentDay >= value;
      case 'guests': return game.lifetimeGuests >= value;
      case 'rating': return game.parkRating >= value;
      case 'revenue': return game.lifetimeRevenue >= value;
      default: return false;
    }
  }

  update(game) {
    this.justUnlocked.clear();
    for (const def of Object.values(BUILDING_DEFINITIONS)) {
      if (this.unlocked.has(def.id)) continue;
      if (this.checkCondition(def, game)) {
        this.unlocked.add(def.id);
        this.justUnlocked.add(def.id);
      }
    }
    return this.justUnlocked.size > 0;
  }

  isUnlocked(building) { return this.unlocked.has(building.id); }
  stateFor(def) {
    if (this.justUnlocked.has(def.id)) return 'new';
    return this.isUnlocked(def) ? 'available' : 'locked';
  }

  lockReason(def) {
    return def.unlockDescription || 'Locked';
  }

  consumeNewFlags() { this.justUnlocked.clear(); }

  serialize() {
    return { unlocked: Array.from(this.unlocked) };
  }

  restore(data) {
    this.unlocked = new Set(data?.unlocked || []);
    this.justUnlocked = new Set();
  }
}
