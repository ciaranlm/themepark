import { GRID_SIZE } from './rideDefinitions.js';

export class GameMap {
  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, base: 'grass', structureId: null, pathVariant: (x * 11 + y * 7) % 4, grassVariant: (x * 13 + y * 17) % 5 }))
    );
    this.entrance = { x: 1, y: Math.floor(GRID_SIZE / 2) };
    this.structures = {};
    this.nextStructureId = 1;

    this.getTile(this.entrance.x, this.entrance.y).base = 'entrance';
    this.getTile(this.entrance.x + 1, this.entrance.y).base = 'path';
  }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE; }
  getTile(x, y) { return this.inBounds(x, y) ? this.grid[y][x] : null; }

  hasAdjacentPath(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    return dirs.some(([dx, dy]) => {
      const t = this.getTile(x + dx, y + dy);
      return t && (t.base === 'path' || t.base === 'entrance');
    });
  }

  footprintHasAdjacentPath(tiles) {
    return tiles.some(({ x, y }) => this.hasAdjacentPath(x, y));
  }

  placePath(x, y) {
    this.getTile(x, y).base = 'path';
  }

  placeStructure(x, y, definition) {
    const structure = {
      uid: this.nextStructureId++,
      id: definition.id,
      name: definition.name,
      x,
      y,
      width: definition.width,
      height: definition.height,
      ticketPrice: definition.ticket,
      upkeep: definition.upkeep,
      excitement: definition.excitement,
      capacity: definition.capacity,
      usageCount: 0,
      operating: true,
    };
    this.structures[structure.uid] = structure;

    for (let yy = 0; yy < definition.height; yy++) {
      for (let xx = 0; xx < definition.width; xx++) {
        this.getTile(x + xx, y + yy).structureId = structure.uid;
      }
    }
    return structure;
  }

  structureAt(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || !tile.structureId) return null;
    return this.structures[tile.structureId] || null;
  }

  removeAt(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return null;
    if (tile.base === 'path') {
      if (Math.abs(x - this.entrance.x) + Math.abs(y - this.entrance.y) < 2) return null;
      tile.base = 'grass';
      return { type: 'path' };
    }

    const structure = this.structureAt(x, y);
    if (!structure) return null;
    for (let yy = 0; yy < structure.height; yy++) {
      for (let xx = 0; xx < structure.width; xx++) {
        const t = this.getTile(structure.x + xx, structure.y + yy);
        if (t) t.structureId = null;
      }
    }
    delete this.structures[structure.uid];
    return structure;
  }

  pathNeighbors(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    return dirs.map(([dx, dy]) => this.getTile(x + dx, y + dy)).filter((t) => t && (t.base === 'path' || t.base === 'entrance'));
  }

  nearbyAttractions(x, y, range = 8) {
    const out = [];
    for (const s of Object.values(this.structures)) {
      const cx = s.x + (s.width - 1) / 2;
      const cy = s.y + (s.height - 1) / 2;
      const dist = Math.abs(cx - x) + Math.abs(cy - y);
      if (dist <= range) out.push({ ...s, dist });
    }
    return out.sort((a, b) => a.dist - b.dist);
  }

  serialize() {
    return {
      grid: this.grid,
      entrance: this.entrance,
      structures: this.structures,
      nextStructureId: this.nextStructureId,
    };
  }

  restore(data) {
    this.grid = data.grid;
    this.entrance = data.entrance;
    this.structures = data.structures || {};
    this.nextStructureId = data.nextStructureId || 1;
  }
}
