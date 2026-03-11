export class Simulation {
  constructor(game) {
    this.game = game;
  }

  computeParkRating() {
    let rideCount = 0, stallCount = 0, scenery = 0, facilities = 0, totalUpkeep = 0;
    for (const s of Object.values(this.game.map.structures)) {
      const def = this.game.definitions[s.id];
      if (def.kind === 'ride') rideCount++;
      if (def.kind === 'food' || def.kind === 'drink') stallCount++;
      if (def.kind === 'scenery') scenery++;
      if (def.kind === 'facility' || def.kind === 'restroom') facilities++;
      totalUpkeep += s.upkeep;
    }
    const happiness = this.game.guestManager.averageHappiness();
    const variety = Math.min(26, rideCount * 4 + stallCount * 2.5);
    const polish = Math.min(18, scenery * 1.3 + facilities * 2.2);
    const crowdingPenalty = Math.max(0, this.game.guestManager.guests.length - (rideCount * 14 + stallCount * 10 + 12)) * 0.35;
    this.game.parkRating = Math.max(1, Math.min(100, happiness * 0.55 + variety + polish - crowdingPenalty));
    return { totalUpkeep };
  }
}
