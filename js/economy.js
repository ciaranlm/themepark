export class Economy {
  constructor() {
    this.money = 7000;
    this.dailyProfit = 0;
    this.lifetimeProfit = 0;
    this.lifetimeRevenue = 0;
    this.totalGuestsServed = 0;
    this.upkeepTimer = 0;
    this.dayTimer = 0;
  }

  canAfford(amount) { return this.money >= amount; }

  spend(amount) {
    this.money -= amount;
    this.dailyProfit -= amount;
    this.lifetimeProfit -= amount;
  }

  earn(amount) {
    this.money += amount;
    this.dailyProfit += amount;
    this.lifetimeProfit += amount;
    this.lifetimeRevenue += amount;
  }

  tick(dt, totalUpkeep) {
    this.upkeepTimer += dt;
    this.dayTimer += dt;
    let upkeepPaid = 0;
    if (this.upkeepTimer >= 9) {
      const cost = totalUpkeep * 0.75;
      this.spend(cost);
      upkeepPaid = cost;
      this.upkeepTimer = 0;
    }
    if (this.dayTimer >= 90) {
      this.dailyProfit = 0;
      this.dayTimer = 0;
    }
    return upkeepPaid;
  }

  serialize() { return { ...this }; }
  restore(data) { Object.assign(this, data); }
}
