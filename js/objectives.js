import { BUILDING_DEFINITIONS, OBJECTIVES } from './rideDefinitions.js';

export class ObjectiveManager {
  constructor() { this.index = 0; }
  get current() { return OBJECTIVES[this.index] || null; }
  update(game) { const obj = this.current; if (obj?.check(game)) { this.index++; return true; } return false; }
  isUnlocked(building) { return building.unlockAt <= this.index; }
  unlockedItems() { return Object.values(BUILDING_DEFINITIONS).filter((b) => this.isUnlocked(b)); }
  serialize() { return { index: this.index }; }
  restore(data) { this.index = data.index; }
}
