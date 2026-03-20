export const GRID_SIZE = 40;

export const CATEGORY_ORDER = ['Terrain / Paths', 'Thrill Rides', 'Family Rides', 'Coasters', 'Food / Drink', 'Facilities', 'Scenery'];

const unlock = (unlockConditionType = 'manual', unlockConditionValue = 0, unlockDescription = 'Available from start') => ({
  unlockConditionType,
  unlockConditionValue,
  unlockDescription,
  isStartingUnlocked: unlockConditionType === 'manual',
});

const ride = ({
  id,
  name,
  category,
  kind,
  size,
  cost,
  upkeep = 0,
  ticketPrice = 0,
  excitement = 0,
  intensity = 0,
  nausea = 0,
  capacity = 0,
  cycleTime = 0,
  visualType,
  animation = 'none',
  effects,
  tags = [],
  placement = {},
  ...unlockConfig
}) => ({
  id,
  name,
  category,
  kind,
  size,
  width: size.width,
  height: size.height,
  cost,
  upkeep,
  ticket: ticketPrice,
  ticketPrice,
  excitement,
  intensity,
  nausea,
  capacity,
  cycleTime,
  visualType,
  animation,
  effects,
  tags,
  placement,
  ...unlock(...(unlockConfig.unlockArgs || [])),
});

export const RIDE_CATALOGUE = [
  ride({
    id: 'path', name: 'Path', category: 'Terrain / Paths', kind: 'path',
    size: { width: 1, height: 1 }, cost: 10, visualType: 'path',
  }),
  ride({
    id: 'water', name: 'Water', category: 'Terrain / Paths', kind: 'terrain',
    size: { width: 1, height: 1 }, cost: 16, excitement: 1, visualType: 'water', animation: 'shimmer',
  }),
  ride({
    id: 'carousel', name: 'Carousel', category: 'Family Rides', kind: 'ride',
    size: { width: 2, height: 2 }, cost: 480, upkeep: 6, ticketPrice: 16,
    excitement: 18, intensity: 8, nausea: 5, capacity: 20, cycleTime: 12,
    visualType: 'carousel', animation: 'spin',
  }),
  ride({
    id: 'ferris', name: 'Ferris Wheel', category: 'Family Rides', kind: 'ride',
    size: { width: 3, height: 3 }, cost: 1300, upkeep: 12, ticketPrice: 24,
    excitement: 34, intensity: 12, nausea: 7, capacity: 30, cycleTime: 18,
    visualType: 'ferris', animation: 'wheel',
  }),
  ride({
    id: 'bumperCars', name: 'Bumper Cars', category: 'Family Rides', kind: 'ride',
    size: { width: 3, height: 2 }, cost: 980, upkeep: 8, ticketPrice: 19,
    excitement: 26, intensity: 16, nausea: 9, capacity: 22, cycleTime: 10,
    visualType: 'bumperCars', animation: 'spin', unlockArgs: ['guests', 35, 'Unlock at 35 lifetime guests'],
  }),
  ride({
    id: 'swing', name: 'Swing Ride', category: 'Family Rides', kind: 'ride',
    size: { width: 2, height: 2 }, cost: 880, upkeep: 9, ticketPrice: 22,
    excitement: 24, intensity: 18, nausea: 10, capacity: 24, cycleTime: 11,
    visualType: 'swing', animation: 'swing', unlockArgs: ['day', 3, 'Unlock on Day 3'],
  }),
  ride({
    id: 'dropTower', name: 'Drop Tower', category: 'Thrill Rides', kind: 'ride',
    size: { width: 2, height: 3 }, cost: 4100, upkeep: 31, ticketPrice: 52,
    excitement: 44, intensity: 43, nausea: 18, capacity: 24, cycleTime: 14,
    visualType: 'dropTower', animation: 'tower', unlockArgs: ['revenue', 6500, 'Unlock at $6500 lifetime revenue'],
  }),
  ride({
    id: 'logFlume', name: 'Log Flume', category: 'Thrill Rides', kind: 'ride',
    size: { width: 4, height: 4 }, cost: 3200, upkeep: 24, ticketPrice: 42,
    excitement: 66, intensity: 32, nausea: 14, capacity: 56, cycleTime: 16,
    visualType: 'logFlume', animation: 'water', unlockArgs: ['revenue', 3200, 'Unlock at $3200 lifetime revenue'],
  }),
  ride({
    id: 'miniCoaster', name: 'Mini Coaster', category: 'Coasters', kind: 'ride',
    size: { width: 4, height: 4 }, cost: 2400, upkeep: 18, ticketPrice: 34,
    excitement: 56, intensity: 34, nausea: 18, capacity: 44, cycleTime: 13,
    visualType: 'miniCoaster', animation: 'coaster', tags: ['coaster'], placement: { minSize: { width: 4, height: 4 } },
    unlockArgs: ['guests', 70, 'Unlock at 70 lifetime guests'],
  }),
  ride({
    id: 'foodStall', name: 'Food Stall', category: 'Food / Drink', kind: 'food',
    size: { width: 1, height: 1 }, cost: 210, upkeep: 3, ticketPrice: 11,
    excitement: 4, intensity: 0, nausea: 0, capacity: 10, cycleTime: 6,
    effects: { hunger: -48 }, visualType: 'stallBurger',
  }),
  ride({
    id: 'drinkStall', name: 'Drink Stall', category: 'Food / Drink', kind: 'drink',
    size: { width: 1, height: 1 }, cost: 180, upkeep: 2, ticketPrice: 9,
    excitement: 3, intensity: 0, nausea: 0, capacity: 10, cycleTime: 5,
    effects: { thirst: -52 }, visualType: 'stallDrink',
  }),
  ride({
    id: 'restroom', name: 'Restroom', category: 'Facilities', kind: 'restroom',
    size: { width: 2, height: 1 }, cost: 260, upkeep: 4, ticketPrice: 0,
    excitement: 2, intensity: 0, nausea: 0, capacity: 16, cycleTime: 4,
    effects: { restroom: 100 }, visualType: 'restroom',
  }),
  ride({
    id: 'infoKiosk', name: 'Info Kiosk', category: 'Facilities', kind: 'facility',
    size: { width: 1, height: 1 }, cost: 240, upkeep: 2, ticketPrice: 0,
    excitement: 2, intensity: 0, nausea: 0, capacity: 12, cycleTime: 4,
    visualType: 'kiosk', unlockArgs: ['guests', 55, 'Unlock at 55 lifetime guests'],
  }),
  ride({
    id: 'bench', name: 'Bench', category: 'Scenery', kind: 'scenery',
    size: { width: 1, height: 1 }, cost: 22, excitement: 1, effects: { energy: 3 }, visualType: 'bench',
  }),
  ride({
    id: 'tree', name: 'Tree', category: 'Scenery', kind: 'scenery',
    size: { width: 1, height: 1 }, cost: 30, excitement: 2, visualType: 'tree', animation: 'sway',
  }),
  ride({
    id: 'lamp', name: 'Lamp', category: 'Scenery', kind: 'scenery',
    size: { width: 1, height: 1 }, cost: 38, excitement: 1, visualType: 'lamp', animation: 'glow', unlockArgs: ['day', 4, 'Unlock on Day 4'],
  }),
  ride({
    id: 'flowers', name: 'Flower Bed', category: 'Scenery', kind: 'scenery',
    size: { width: 1, height: 1 }, cost: 26, excitement: 3, visualType: 'flowers', unlockArgs: ['revenue', 1600, 'Unlock at $1600 lifetime revenue'],
  }),
  ride({
    id: 'statue', name: 'Park Statue', category: 'Scenery', kind: 'scenery',
    size: { width: 1, height: 1 }, cost: 120, upkeep: 1, excitement: 5, visualType: 'statue', unlockArgs: ['revenue', 9000, 'Unlock at $9000 lifetime revenue'],
  }),
];

export const BUILDING_DEFINITIONS = Object.fromEntries(RIDE_CATALOGUE.map((item) => [item.id, item]));
