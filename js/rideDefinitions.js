export const GRID_SIZE = 40;

export const CATEGORY_ORDER = ['Paths', 'Rides', 'Food/Drink', 'Facilities', 'Scenery'];

export const BUILDING_DEFINITIONS = {
  path: {
    id: 'path', name: 'Path', category: 'Paths', kind: 'path', width: 1, height: 1,
    cost: 8, upkeep: 0, ticket: 0, capacity: 120, excitement: 0,
    effects: {}, renderType: 'path', animation: 'none', unlockAt: 0,
  },
  carousel: {
    id: 'carousel', name: 'Carousel', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 280, upkeep: 3, ticket: 18, capacity: 22, excitement: 18,
    effects: {}, renderType: 'carousel', animation: 'spin', unlockAt: 0,
  },
  teacups: {
    id: 'teacups', name: 'Teacups', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 340, upkeep: 4, ticket: 22, capacity: 18, excitement: 20,
    effects: {}, renderType: 'teacups', animation: 'spin', unlockAt: 0,
  },
  swing: {
    id: 'swing', name: 'Swing Ride', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 560, upkeep: 5, ticket: 27, capacity: 26, excitement: 24,
    effects: {}, renderType: 'swing', animation: 'swing', unlockAt: 1,
  },
  ferris: {
    id: 'ferris', name: 'Ferris Wheel', category: 'Rides', kind: 'ride', width: 3, height: 3,
    cost: 840, upkeep: 7, ticket: 35, capacity: 34, excitement: 35,
    effects: {}, renderType: 'ferris', animation: 'wheel', unlockAt: 1,
  },
  pirateShip: {
    id: 'pirateShip', name: 'Pirate Ship', category: 'Rides', kind: 'ride', width: 3, height: 2,
    cost: 920, upkeep: 8, ticket: 38, capacity: 30, excitement: 34,
    effects: {}, renderType: 'pirateShip', animation: 'ship', unlockAt: 1,
  },
  dropTower: {
    id: 'dropTower', name: 'Drop Tower', category: 'Rides', kind: 'ride', width: 2, height: 3,
    cost: 1080, upkeep: 10, ticket: 44, capacity: 20, excitement: 42,
    effects: {}, renderType: 'dropTower', animation: 'tower', unlockAt: 2,
  },
  miniCoaster: {
    id: 'miniCoaster', name: 'Mini Coaster', category: 'Rides', kind: 'ride', width: 4, height: 3,
    cost: 1700, upkeep: 15, ticket: 66, capacity: 48, excitement: 58,
    effects: {}, renderType: 'miniCoaster', animation: 'coaster', unlockAt: 2,
  },
  logFlume: {
    id: 'logFlume', name: 'Log Flume', category: 'Rides', kind: 'ride', width: 4, height: 4,
    cost: 2200, upkeep: 19, ticket: 74, capacity: 52, excitement: 68,
    effects: { thirst: -8 }, renderType: 'logFlume', animation: 'water', unlockAt: 2,
  },
  woodCoaster: {
    id: 'woodCoaster', name: 'Wooden Coaster', category: 'Rides', kind: 'ride', width: 6, height: 4,
    cost: 3200, upkeep: 26, ticket: 102, capacity: 76, excitement: 92,
    effects: {}, renderType: 'woodCoaster', animation: 'coaster', unlockAt: 2,
  },
  burger: {
    id: 'burger', name: 'Burger Stall', category: 'Food/Drink', kind: 'food', width: 1, height: 1,
    cost: 130, upkeep: 1, ticket: 16, capacity: 10, excitement: 4,
    effects: { hunger: -50 }, renderType: 'stallBurger', animation: 'none', unlockAt: 0,
  },
  drink: {
    id: 'drink', name: 'Drink Stall', category: 'Food/Drink', kind: 'drink', width: 1, height: 1,
    cost: 110, upkeep: 1, ticket: 12, capacity: 10, excitement: 3,
    effects: { thirst: -55 }, renderType: 'stallDrink', animation: 'none', unlockAt: 0,
  },
  pizza: {
    id: 'pizza', name: 'Pizza Stall', category: 'Food/Drink', kind: 'food', width: 1, height: 1,
    cost: 170, upkeep: 2, ticket: 20, capacity: 12, excitement: 5,
    effects: { hunger: -60 }, renderType: 'stallPizza', animation: 'none', unlockAt: 1,
  },
  restroom: {
    id: 'restroom', name: 'Restroom', category: 'Facilities', kind: 'restroom', width: 2, height: 1,
    cost: 180, upkeep: 2, ticket: 0, capacity: 16, excitement: 2,
    effects: { restroom: 100 }, renderType: 'restroom', animation: 'none', unlockAt: 0,
  },
  infoKiosk: {
    id: 'infoKiosk', name: 'Info Kiosk', category: 'Facilities', kind: 'facility', width: 1, height: 1,
    cost: 140, upkeep: 1, ticket: 0, capacity: 10, excitement: 2,
    effects: {}, renderType: 'kiosk', animation: 'none', unlockAt: 0,
  },
  tree: {
    id: 'tree', name: 'Tree', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 22, upkeep: 0, ticket: 0, capacity: 0, excitement: 2,
    effects: {}, renderType: 'tree', animation: 'sway', unlockAt: 0,
  },
  bench: {
    id: 'bench', name: 'Bench', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 18, upkeep: 0, ticket: 0, capacity: 0, excitement: 1,
    effects: { energy: 3 }, renderType: 'bench', animation: 'none', unlockAt: 0,
  },
  lamp: {
    id: 'lamp', name: 'Lamp', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 28, upkeep: 0, ticket: 0, capacity: 0, excitement: 1,
    effects: {}, renderType: 'lamp', animation: 'glow', unlockAt: 0,
  },
  flowers: {
    id: 'flowers', name: 'Flower Bed', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 20, upkeep: 0, ticket: 0, capacity: 0, excitement: 2,
    effects: {}, renderType: 'flowers', animation: 'none', unlockAt: 0,
  },
};

export const OBJECTIVES = [
  { text: 'Reach 40 guests total', check: (g) => g.economy.totalGuestsServed >= 40 },
  { text: 'Park rating above 80', check: (g) => g.parkRating >= 80 },
  { text: 'Earn $5000 lifetime profit', check: (g) => g.economy.lifetimeProfit >= 5000 },
];
