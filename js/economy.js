export class Economy {
  constructor() {
    this.money = 6200;
    this.dailyProfit = 0;
    this.lifetimeProfit = 0;
    this.totalGuestsServed = 0;
    this.dayTimer = 0;
    this.upkeepTimer = 0;
  }

  canAfford(amount) { return this.money >= amount; }
  spend(amount) { this.money -= amount; this.dailyProfit -= amount; this.lifetimeProfit -= amount; }
  earn(amount) { this.money += amount; this.dailyProfit += amount; this.lifetimeProfit += amount; }

  tick(dt, totalUpkeep) {
    this.upkeepTimer += dt;
    this.dayTimer += dt;
    let upkeepPaid = 0;
    if (this.upkeepTimer >= 4) {
      const cost = totalUpkeep;
      this.spend(cost);
      upkeepPaid = cost;
      this.upkeepTimer = 0;
    }
    if (this.dayTimer >= 60) {
      this.dailyProfit = 0;
      this.dayTimer = 0;
    }
    return upkeepPaid;
  }

  serialize() { return { ...this }; }
  restore(data) { Object.assign(this, data); }
}
