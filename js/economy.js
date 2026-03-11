export class Economy {
  constructor() {
    this.money = 1800;
    this.dailyProfit = 0;
    this.lifetimeProfit = 0;
    this.totalGuestsServed = 0;
    this.dayTimer = 0;
    this.upkeepTimer = 0;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  spend(amount) {
    this.money -= amount;
    this.dailyProfit -= amount;
    this.lifetimeProfit -= amount;
  }

  earn(amount) {
    this.money += amount;
    this.dailyProfit += amount;
    this.lifetimeProfit += amount;
  }

  tick(dt, rideCount, upkeepPerRide) {
    this.upkeepTimer += dt;
    this.dayTimer += dt;
    let upkeepPaid = 0;
    if (this.upkeepTimer >= 4) {
      const cost = rideCount * upkeepPerRide;
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

  serialize() {
    return {
      money: this.money,
      dailyProfit: this.dailyProfit,
      lifetimeProfit: this.lifetimeProfit,
      totalGuestsServed: this.totalGuestsServed,
      dayTimer: this.dayTimer,
      upkeepTimer: this.upkeepTimer,
    };
  }

  restore(data) {
    Object.assign(this, data);
  }
}
