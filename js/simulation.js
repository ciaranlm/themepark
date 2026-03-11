export class Simulation {
  constructor(game) {
    this.game = game;
  }

  computeParkRating() {
    let rideCount = 0, stallCount = 0, scenery = 0, facilities = 0, totalUpkeep = 0, thrill = 0;
    for (const s of Object.values(this.game.map.structures)) {
      const def = this.game.definitions[s.id];
      if (def.kind === 'ride') { rideCount++; thrill += def.excitement; }
      if (def.kind === 'food' || def.kind === 'drink') stallCount++;
      if (def.kind === 'scenery') scenery++;
      if (def.kind === 'facility' || def.kind === 'restroom') facilities++;
      totalUpkeep += s.upkeep;
    }
    const happiness = this.game.guestManager.averageHappiness();
    const variety = Math.min(24, rideCount * 3.3 + stallCount * 1.9);
    const polish = Math.min(20, scenery * 1.5 + facilities * 2.6);
    const thrillScore = Math.min(15, thrill / 20);
    const crowdingPenalty = Math.max(0, this.game.guestManager.guests.length - (rideCount * 18 + stallCount * 12 + 20)) * 0.28;
    this.game.parkRating = Math.max(1, Math.min(100, happiness * 0.5 + variety + polish + thrillScore - crowdingPenalty));
    return { totalUpkeep };
  }
}
