import { BUILDINGS, GRID_SIZE } from './data.js';

export class GameMap {
  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, tile: 'grass', buildingId: null }))
    );
    this.entrance = { x: 1, y: Math.floor(GRID_SIZE / 2) };
    this.setTile(this.entrance.x, this.entrance.y, 'entrance', null);
    this.setTile(this.entrance.x + 1, this.entrance.y, 'path', 'path');
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
  }

  getTile(x, y) {
    return this.inBounds(x, y) ? this.grid[y][x] : null;
  }

  setTile(x, y, tile, buildingId) {
    if (!this.inBounds(x, y)) return;
    const t = this.grid[y][x];
    t.tile = tile;
    t.buildingId = buildingId;
  }

  hasAdjacentPath(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    return dirs.some(([dx,dy]) => {
      const n = this.getTile(x + dx, y + dy);
      return n && (n.tile === 'path' || n.tile === 'entrance');
    });
  }

  canPlace(x, y, buildingId) {
    const tile = this.getTile(x, y);
    if (!tile || tile.tile === 'entrance') return false;
    const building = BUILDINGS[buildingId];
    if (!building) return false;

    if (building.type === 'path') return tile.tile === 'grass';
    if (tile.tile !== 'grass') return false;
    return this.hasAdjacentPath(x, y);
  }

  place(x, y, buildingId) {
    const b = BUILDINGS[buildingId];
    if (b.type === 'path') this.setTile(x, y, 'path', buildingId);
    else if (b.type === 'ride') this.setTile(x, y, 'ride', buildingId);
    else if (b.type === 'food' || b.type === 'drink') this.setTile(x, y, 'stall', buildingId);
    else if (b.type === 'decoration') this.setTile(x, y, 'decoration', buildingId);
    else if (b.type === 'restroom') this.setTile(x, y, 'restroom', buildingId);
  }

  remove(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || tile.tile === 'entrance') return null;
    if (tile.tile === 'grass') return null;
    const removed = tile.buildingId;
    this.setTile(x, y, 'grass', null);
    return removed;
  }

  pathNeighbors(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    return dirs
      .map(([dx,dy]) => this.getTile(x + dx, y + dy))
      .filter((t) => t && (t.tile === 'path' || t.tile === 'entrance'));
  }

  nearbyAttractions(x, y, range = 6) {
    const out = [];
    for (let yy = Math.max(0, y - range); yy <= Math.min(GRID_SIZE - 1, y + range); yy++) {
      for (let xx = Math.max(0, x - range); xx <= Math.min(GRID_SIZE - 1, x + range); xx++) {
        const t = this.grid[yy][xx];
        if (['ride', 'stall', 'restroom'].includes(t.tile)) {
          out.push({ x: xx, y: yy, dist: Math.abs(xx - x) + Math.abs(yy - y), buildingId: t.buildingId, tile: t.tile });
        }
      }
    }
    return out.sort((a, b) => a.dist - b.dist);
  }

  serialize() {
    return { grid: this.grid, entrance: this.entrance };
  }

  restore(data) {
    this.grid = data.grid;
    this.entrance = data.entrance;
  }
}
