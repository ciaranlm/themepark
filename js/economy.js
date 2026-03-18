export class Economy {
  constructor() {
    this.money = 7000;
    this.dailyProfit = 0;
    this.dailyRevenue = 0;
    this.dailyExpenses = 0;
    this.lifetimeProfit = 0;
    this.lifetimeRevenue = 0;
    this.lifetimeExpenses = 0;
    this.totalGuestsServed = 0;
    this.upkeepTimer = 0;
    this.dayTimer = 0;
    this.lastOperatingCost = 0;
    this.lastOperatingBreakdown = [];
  }

  canAfford(amount) { return this.money >= amount; }

  spend(amount) {
    return this.recordExpense(amount);
  }

  earn(amount) {
    return this.recordRevenue(amount);
  }

  recordRevenue(amount, category = 'general') {
    if (amount <= 0) return 0;
    this.money += amount;
    this.dailyProfit += amount;
    this.dailyRevenue += amount;
    this.lifetimeProfit += amount;
    this.lifetimeRevenue += amount;
    return amount;
  }

  recordExpense(amount, category = 'general') {
    if (amount <= 0) return 0;
    this.money -= amount;
    this.dailyProfit -= amount;
    this.dailyExpenses += amount;
    this.lifetimeProfit -= amount;
    this.lifetimeExpenses += amount;
    return amount;
  }

  tick(dt, operatingCostBreakdown = []) {
    this.upkeepTimer += dt;
    this.dayTimer += dt;
    let upkeepPaid = 0;

    if (this.upkeepTimer >= 9) {
      const totalCost = operatingCostBreakdown.reduce((sum, item) => sum + (item.cost || 0), 0);
      upkeepPaid = this.recordExpense(totalCost, 'operating-cost');
      this.lastOperatingCost = upkeepPaid;
      this.lastOperatingBreakdown = operatingCostBreakdown.map((item) => ({ ...item }));
      this.upkeepTimer = 0;
    }

    if (this.dayTimer >= 90) {
      this.dailyProfit = 0;
      this.dailyRevenue = 0;
      this.dailyExpenses = 0;
      this.dayTimer = 0;
    }

    return {
      upkeepPaid,
      breakdown: this.lastOperatingBreakdown,
    };
  }

  serialize() { return { ...this }; }
  restore(data) {
    Object.assign(this, {
      dailyRevenue: 0,
      dailyExpenses: 0,
      lifetimeExpenses: 0,
      lastOperatingCost: 0,
      lastOperatingBreakdown: [],
      ...data,
    });
  }
}
