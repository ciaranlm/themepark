/**
 * Game state store.
 *
 * This module owns the single source of truth for mutable gameplay data that is
 * shared across systems. Rendering, input, simulation, economy, and UI all read
 * or write through this object so future features have one safe extension point.
 */
export class GameStateStore {
  constructor() {
    this.state = {
      selectedBuild: 'path',
      selectedTile: null,
      selectedStructure: null,
      hoverTile: null,
      placementPreview: null,
      parkRating: 65,
      parkName: 'Sunset Gardens',
      entryFee: 10,
      ratingBreakdown: {
        happiness: 70,
        queues: 75,
        variety: 25,
        value: 80,
        averageQueue: 0,
        rideCount: 0,
        uniqueRideTypes: 0,
        targetSpend: 12,
        actualSpend: 10,
      },
      lifetimeGuests: 0,
      lifetimeRevenue: 0,
      currentDay: 1,
      floatingTexts: [],
      recentThoughts: [],
      lastFrameAt: performance.now(),
    };
  }

  get snapshot() {
    return this.state;
  }

  patch(updates) {
    Object.assign(this.state, updates);
    return this.state;
  }

  addFloatingText(text, x, y, color) {
    this.state.floatingTexts.push({ text, x, y, life: 1.2, color });
  }

  tickFloatingTexts(dt) {
    this.state.floatingTexts = this.state.floatingTexts
      .map((item) => ({ ...item, life: item.life - dt }))
      .filter((item) => item.life > 0);
  }

  addThought(entry) {
    this.state.recentThoughts = [entry, ...(this.state.recentThoughts || [])].slice(0, 10);
  }

  serialize() {
    const { lastFrameAt, ...persisted } = this.state;
    return persisted;
  }

  restore(data = {}) {
    this.state = {
      ...this.state,
      ...data,
      selectedTile: data.selectedTile ?? null,
      selectedStructure: data.selectedStructure ?? null,
      hoverTile: data.hoverTile ?? null,
      placementPreview: data.placementPreview ?? null,
      floatingTexts: Array.isArray(data.floatingTexts) ? data.floatingTexts : [],
      recentThoughts: Array.isArray(data.recentThoughts) ? data.recentThoughts : [],
      lastFrameAt: performance.now(),
    };
  }
}
