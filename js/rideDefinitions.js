export const GRID_SIZE = 40;

export const CATEGORY_ORDER = ['Terrain / Paths', 'Rides', 'Food / Drink', 'Facilities', 'Scenery'];

const unlock = (unlockConditionType = 'manual', unlockConditionValue = 0, unlockDescription = 'Available from start') => ({
  unlockConditionType,
  unlockConditionValue,
  unlockDescription,
  isStartingUnlocked: unlockConditionType === 'manual',
});

export const BUILDING_DEFINITIONS = {
  path: {
    id: 'path', name: 'Path', category: 'Terrain / Paths', kind: 'path', width: 1, height: 1,
    cost: 10, upkeep: 0, ticket: 0, capacity: 0, excitement: 0,
    visualType: 'path', animation: 'none', ...unlock(),
  },
  water: {
    id: 'water', name: 'Water', category: 'Terrain / Paths', kind: 'terrain', width: 1, height: 1,
    cost: 16, upkeep: 0, ticket: 0, capacity: 0, excitement: 1,
    visualType: 'water', animation: 'shimmer', ...unlock(),
  },
  carousel: {
    id: 'carousel', name: 'Carousel', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 480, upkeep: 6, ticket: 16, capacity: 20, excitement: 18,
    visualType: 'carousel', animation: 'spin', ...unlock(),
  },
  teacups: {
    id: 'teacups', name: 'Teacups', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 620, upkeep: 7, ticket: 18, capacity: 18, excitement: 21,
    visualType: 'teacups', animation: 'spin', ...unlock(),
  },
  ferris: {
    id: 'ferris', name: 'Ferris Wheel', category: 'Rides', kind: 'ride', width: 3, height: 3,
    cost: 1300, upkeep: 12, ticket: 24, capacity: 30, excitement: 34,
    visualType: 'ferris', animation: 'wheel', ...unlock(),
  },
  miniCoaster: {
    id: 'miniCoaster', name: 'Mini Coaster', category: 'Rides', kind: 'ride', width: 4, height: 3,
    cost: 2400, upkeep: 18, ticket: 34, capacity: 44, excitement: 56,
    visualType: 'miniCoaster', animation: 'coaster', ...unlock(),
  },
  swing: {
    id: 'swing', name: 'Swing Ride', category: 'Rides', kind: 'ride', width: 2, height: 2,
    cost: 880, upkeep: 9, ticket: 22, capacity: 24, excitement: 24,
    visualType: 'swing', animation: 'swing', ...unlock('day', 3, 'Unlock at Day 3'),
  },
  pirateShip: {
    id: 'pirateShip', name: 'Pirate Ship', category: 'Rides', kind: 'ride', width: 3, height: 2,
    cost: 1450, upkeep: 14, ticket: 31, capacity: 32, excitement: 38,
    visualType: 'pirateShip', animation: 'ship', ...unlock('guests', 50, 'Unlock at 50 lifetime guests'),
  },
  logFlume: {
    id: 'logFlume', name: 'Log Flume', category: 'Rides', kind: 'ride', width: 4, height: 4,
    cost: 3200, upkeep: 24, ticket: 42, capacity: 56, excitement: 66,
    visualType: 'logFlume', animation: 'water', ...unlock('rating', 80, 'Unlock at park rating 80'),
  },
  dropTower: {
    id: 'dropTower', name: 'Drop Tower', category: 'Rides', kind: 'ride', width: 2, height: 3,
    cost: 4100, upkeep: 31, ticket: 52, capacity: 24, excitement: 44,
    visualType: 'dropTower', animation: 'tower', ...unlock('revenue', 5000, 'Unlock at $5000 lifetime revenue'),
  },
  woodCoaster: {
    id: 'woodCoaster', name: 'Wooden Coaster', category: 'Rides', kind: 'ride', width: 6, height: 4,
    cost: 5800, upkeep: 44, ticket: 78, capacity: 78, excitement: 92,
    visualType: 'woodCoaster', animation: 'coaster', ...unlock('day', 10, 'Unlock at Day 10'),
  },
  megaCoaster: {
    id: 'megaCoaster', name: 'Large Coaster', category: 'Rides', kind: 'ride', width: 7, height: 5,
    cost: 8200, upkeep: 62, ticket: 95, capacity: 92, excitement: 106,
    visualType: 'megaCoaster', animation: 'coaster', ...unlock('revenue', 12000, 'Unlock at $12000 lifetime revenue'),
  },
  burger: {
    id: 'burger', name: 'Burger Stall', category: 'Food / Drink', kind: 'food', width: 1, height: 1,
    cost: 210, upkeep: 3, ticket: 11, capacity: 10, excitement: 4,
    effects: { hunger: -48 }, visualType: 'stallBurger', animation: 'none', ...unlock(),
  },
  drink: {
    id: 'drink', name: 'Drink Stall', category: 'Food / Drink', kind: 'drink', width: 1, height: 1,
    cost: 180, upkeep: 2, ticket: 9, capacity: 10, excitement: 3,
    effects: { thirst: -52 }, visualType: 'stallDrink', animation: 'none', ...unlock(),
  },
  pizza: {
    id: 'pizza', name: 'Pizza Stall', category: 'Food / Drink', kind: 'food', width: 1, height: 1,
    cost: 280, upkeep: 4, ticket: 14, capacity: 12, excitement: 5,
    effects: { hunger: -58 }, visualType: 'stallPizza', animation: 'none', ...unlock('day', 4, 'Unlock at Day 4'),
  },
  restroom: {
    id: 'restroom', name: 'Restroom', category: 'Facilities', kind: 'restroom', width: 2, height: 1,
    cost: 260, upkeep: 4, ticket: 0, capacity: 16, excitement: 2,
    effects: { restroom: 100 }, visualType: 'restroom', animation: 'none', ...unlock(),
  },
  infoKiosk: {
    id: 'infoKiosk', name: 'Info Kiosk', category: 'Facilities', kind: 'facility', width: 1, height: 1,
    cost: 240, upkeep: 2, ticket: 0, capacity: 12, excitement: 2,
    visualType: 'kiosk', animation: 'none', ...unlock('guests', 90, 'Unlock at 90 lifetime guests'),
  },
  bench: {
    id: 'bench', name: 'Bench', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 22, upkeep: 0, ticket: 0, capacity: 0, excitement: 1,
    effects: { energy: 3 }, visualType: 'bench', animation: 'none', ...unlock(),
  },
  tree: {
    id: 'tree', name: 'Tree', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 30, upkeep: 0, ticket: 0, capacity: 0, excitement: 2,
    visualType: 'tree', animation: 'sway', ...unlock(),
  },
  lamp: {
    id: 'lamp', name: 'Lamp', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 38, upkeep: 0, ticket: 0, capacity: 0, excitement: 1,
    visualType: 'lamp', animation: 'glow', ...unlock('day', 5, 'Unlock at Day 5'),
  },
  flowers: {
    id: 'flowers', name: 'Flower Bed', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 26, upkeep: 0, ticket: 0, capacity: 0, excitement: 3,
    visualType: 'flowers', animation: 'none', ...unlock('rating', 72, 'Unlock at park rating 72'),
  },
  statue: {
    id: 'statue', name: 'Park Statue', category: 'Scenery', kind: 'scenery', width: 1, height: 1,
    cost: 120, upkeep: 1, ticket: 0, capacity: 0, excitement: 5,
    visualType: 'statue', animation: 'none', ...unlock('revenue', 9000, 'Unlock at $9000 lifetime revenue'),
  },
};
