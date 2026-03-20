/**
 * Ride simulation and park scoring.
 *
 * Centralizes ride/facility counting and park-rating math so future balance
 * changes have one clear home without coupling them to rendering or input.
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class Simulation {
  constructor(game) {
    this.game = game;
  }

  computeParkRating() {
    let rideCount = 0;
    let serviceCount = 0;
    let totalQueue = 0;
    let totalRideTicket = 0;
    let totalRideExcitement = 0;
    const varietyIds = new Set();
    const operatingCostBreakdown = [];

    for (const s of Object.values(this.game.map.structures)) {
      const def = this.game.definitions[s.id];
      if (def.kind === 'ride') {
        rideCount += 1;
        totalQueue += (s.queue?.length ?? 0) + (s.riders?.length ?? 0);
        totalRideTicket += s.ticketPrice || 0;
        totalRideExcitement += def.excitement || 0;
        varietyIds.add(def.id);
      }
      if (def.kind === 'food' || def.kind === 'drink' || def.kind === 'facility' || def.kind === 'restroom') {
        serviceCount += 1;
      }

      const operatingMultiplier = s.connected === false ? 0 : (def.kind === 'ride'
        ? (s.operatingState === 'running' || s.operatingState === 'loading' || s.operatingState === 'unloading' ? 1 : 0.35)
        : (s.serviceTimer > 0 ? 0.65 : 0.25));
      const cost = Number((s.upkeep * operatingMultiplier).toFixed(2));
      s.currentOperatingCost = cost;
      operatingCostBreakdown.push({
        uid: s.uid,
        name: s.name,
        cost,
        active: operatingMultiplier > 0.5,
      });
    }

    const happinessScore = clamp(this.game.guestManager.averageHappiness(), 0, 100);
    const averageQueue = rideCount > 0 ? totalQueue / rideCount : 0;
    const queueScore = rideCount === 0 ? 75 : clamp(100 - averageQueue * 9, 35, 100);
    const varietyScore = clamp(rideCount === 0 ? 25 : (varietyIds.size / Math.max(1, Math.min(6, rideCount))) * 100, 25, 100);

    const averageRidePrice = rideCount > 0 ? totalRideTicket / rideCount : 0;
    const averageRideExcitement = rideCount > 0 ? totalRideExcitement / rideCount : 18;
    const targetSpend = Math.max(12, averageRideExcitement * 0.55 + serviceCount * 1.2 + 6);
    const actualSpend = this.game.state.snapshot.entryFee + averageRidePrice;
    const valueGap = Math.max(0, actualSpend - targetSpend);
    const valueForMoneyScore = clamp(rideCount === 0 ? 80 : 100 - valueGap * 6, 40, 100);

    const parkRating = clamp(
      happinessScore * 0.4
      + queueScore * 0.2
      + varietyScore * 0.2
      + valueForMoneyScore * 0.2,
      1,
      100,
    );

    this.game.state.patch({
      parkRating,
      ratingBreakdown: {
        happiness: happinessScore,
        queues: queueScore,
        variety: varietyScore,
        value: valueForMoneyScore,
        averageQueue,
        rideCount,
        uniqueRideTypes: varietyIds.size,
        targetSpend,
        actualSpend,
      },
    });

    return { operatingCostBreakdown };
  }
}
