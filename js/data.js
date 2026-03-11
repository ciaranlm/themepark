export const GRID_SIZE = 40;
export const TILE_SIZE = 16;

export const TILE_COLORS = {
  grass: '#88d66b',
  path: '#d4c5aa',
  entrance: '#5f6dd9',
  decoration: '#2f9f59',
  restroom: '#90b5ff',
  ride: '#ff9f43',
  stall: '#ff6ea9',
};

export const BUILDINGS = {
  path: { id: 'path', name: 'Path', type: 'path', cost: 8, ticket: 0, upkeep: 0, appeal: 0, icon: '🟫', unlockAt: 0 },
  carousel: { id: 'carousel', name: 'Carousel', type: 'ride', cost: 250, ticket: 18, upkeep: 2, appeal: 7, icon: '🎠', unlockAt: 0 },
  ferris: { id: 'ferris', name: 'Ferris Wheel', type: 'ride', cost: 430, ticket: 30, upkeep: 4, appeal: 12, icon: '🎡', unlockAt: 0 },
  miniCoaster: { id: 'miniCoaster', name: 'Mini Coaster', type: 'ride', cost: 780, ticket: 58, upkeep: 7, appeal: 18, icon: '🎢', unlockAt: 0 },
  burger: { id: 'burger', name: 'Burger Stall', type: 'food', cost: 120, ticket: 16, upkeep: 1, appeal: 4, icon: '🍔', unlockAt: 0 },
  drink: { id: 'drink', name: 'Drink Stall', type: 'drink', cost: 100, ticket: 12, upkeep: 1, appeal: 3, icon: '🥤', unlockAt: 0 },
  tree: { id: 'tree', name: 'Tree', type: 'decoration', cost: 22, ticket: 0, upkeep: 0, appeal: 2, icon: '🌳', unlockAt: 0 },
  bench: { id: 'bench', name: 'Bench', type: 'decoration', cost: 18, ticket: 0, upkeep: 0, appeal: 1, icon: '🪑', unlockAt: 0 },
  restroom: { id: 'restroom', name: 'Restroom', type: 'restroom', cost: 140, ticket: 0, upkeep: 1, appeal: 2, icon: '🚻', unlockAt: 0 },
  swing: { id: 'swing', name: 'Swing Ride', type: 'ride', cost: 560, ticket: 44, upkeep: 5, appeal: 14, icon: '🎪', unlockAt: 1 },
  pizza: { id: 'pizza', name: 'Pizza Stall', type: 'food', cost: 180, ticket: 22, upkeep: 2, appeal: 6, icon: '🍕', unlockAt: 2 },
};

export const OBJECTIVES = [
  { text: 'Reach 40 guests total', check: (g) => g.economy.totalGuestsServed >= 40 },
  { text: 'Park rating above 80', check: (g) => g.parkRating >= 80 },
  { text: 'Earn $3000 lifetime profit', check: (g) => g.economy.lifetimeProfit >= 3000 },
];
