import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

export class ObjectiveManager {
  constructor() {
    this.unlocked = new Set();
    this.justUnlocked = new Set();
    Object.values(BUILDING_DEFINITIONS).forEach((def) => {
      if (def.isStartingUnlocked) this.unlocked.add(def.id);
    });
  }

  progressFor(def, game) {
    const value = def.unlockConditionValue;
    switch (def.unlockConditionType) {
      case 'manual': return { current: value, required: value, label: 'Available', met: true };
      case 'day': return { current: game.currentDay, required: value, label: 'Day', met: game.currentDay >= value };
      case 'guests': return { current: game.lifetimeGuests, required: value, label: 'Guests', met: game.lifetimeGuests >= value };
      case 'rating': return { current: game.parkRating, required: value, label: 'Rating', met: game.parkRating >= value };
      case 'revenue': return { current: game.lifetimeRevenue, required: value, label: 'Revenue', met: game.lifetimeRevenue >= value };
      default: return { current: 0, required: value, label: 'Locked', met: false };
    }
  }

  checkCondition(def, game) {
    return this.progressFor(def, game).met;
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

  formatProgress(def, game) {
    const progress = this.progressFor(def, game);
    if (progress.met || def.unlockConditionType === 'manual') return def.unlockDescription || 'Available from start';
    if (def.unlockConditionType === 'revenue') return `${def.unlockDescription} (${Math.round(progress.current)}/$${progress.required})`;
    return `${def.unlockDescription} (${Math.round(progress.current)}/${progress.required})`;
  }

  lockReason(def, game) {
    if (!game) return def.unlockDescription || 'Locked';
    return this.formatProgress(def, game);
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
