import { GRID_SIZE } from './rideDefinitions.js';

const CARDINALS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class GameMap {
  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({
        x,
        y,
        base: 'grass',
        structureId: null,
        pathVariant: (x * 11 + y * 7) % 4,
        grassVariant: (x * 13 + y * 17) % 5,
        waterVariant: (x * 3 + y * 5) % 3,
      }))
    );
    this.entrance = { x: 1, y: Math.floor(GRID_SIZE / 2) };
    this.entranceSpawn = { x: this.entrance.x + 1, y: this.entrance.y };
    this.structures = {};
    this.nextStructureId = 1;
    this.pathDataDirty = true;
    this.cachedReachablePaths = new Set();
    this.routeCache = new Map();

    this.getTile(this.entrance.x, this.entrance.y).base = 'entrance';
    this.getTile(this.entranceSpawn.x, this.entranceSpawn.y).base = 'path';
  }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE; }
  getTile(x, y) { return this.inBounds(x, y) ? this.grid[y][x] : null; }
  tileKey(x, y) { return `${x},${y}`; }
  isPathTile(tile) { return Boolean(tile && (tile.base === 'path' || tile.base === 'entrance')); }
  markPathDataDirty() {
    this.pathDataDirty = true;
    this.routeCache.clear();
  }

  hasAdjacentPath(x, y) {
    return CARDINALS.some(([dx, dy]) => this.isPathTile(this.getTile(x + dx, y + dy)));
  }

  footprintHasAdjacentPath(tiles) { return tiles.some(({ x, y }) => this.hasAdjacentPath(x, y)); }

  placePath(x, y) {
    this.getTile(x, y).base = 'path';
    this.markPathDataDirty();
  }

  placeWater(x, y) {
    this.getTile(x, y).base = 'water';
    this.markPathDataDirty();
  }

  placeStructure(x, y, definition) {
    const structure = {
      uid: this.nextStructureId++, id: definition.id, name: definition.name, x, y,
      width: definition.width, height: definition.height, ticketPrice: definition.ticketPrice,
      upkeep: definition.upkeep, excitement: definition.excitement, intensity: definition.intensity, nausea: definition.nausea, capacity: definition.capacity, cycleTime: definition.cycleTime,
      usageCount: 0, operating: true, guestsServed: 0, serviceTimer: 0,
      operatingState: definition.kind === 'ride' ? 'idle' : 'idle',
      stateTimer: 0,
      connected: false,
      queue: [],
      riders: [],
      loadTimer: 0,
      unloadTimer: 0,
    };
    this.structures[structure.uid] = structure;

    for (let yy = 0; yy < definition.height; yy++) {
      for (let xx = 0; xx < definition.width; xx++) this.getTile(x + xx, y + yy).structureId = structure.uid;
    }
    this.markPathDataDirty();
    return structure;
  }

  structureAt(x, y) {
    const tile = this.getTile(x, y);
    return (!tile || !tile.structureId) ? null : (this.structures[tile.structureId] || null);
  }

  removeAt(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return null;
    if (tile.base === 'path' || tile.base === 'water') {
      if (Math.abs(x - this.entrance.x) + Math.abs(y - this.entrance.y) < 2) return null;
      tile.base = 'grass';
      this.markPathDataDirty();
      return { type: tile.base };
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
    this.markPathDataDirty();
    return structure;
  }

  pathNeighbors(x, y) {
    return CARDINALS.map(([dx, dy]) => this.getTile(x + dx, y + dy)).filter((t) => this.isPathTile(t));
  }

  computeReachablePaths() {
    if (!this.pathDataDirty) return this.cachedReachablePaths;
    const reachable = new Set();
    const start = this.getTile(this.entrance.x, this.entrance.y);
    const queue = start ? [start] : [];
    for (let i = 0; i < queue.length; i++) {
      const tile = queue[i];
      const key = this.tileKey(tile.x, tile.y);
      if (reachable.has(key) || !this.isPathTile(tile)) continue;
      reachable.add(key);
      for (const next of this.pathNeighbors(tile.x, tile.y)) {
        if (!reachable.has(this.tileKey(next.x, next.y))) queue.push(next);
      }
    }
    this.cachedReachablePaths = reachable;
    this.pathDataDirty = false;
    return reachable;
  }

  isTileReachableFromEntrance(x, y) {
    return this.computeReachablePaths().has(this.tileKey(x, y));
  }

  structureAccessPoints(structure) {
    const access = [];
    for (let yy = 0; yy < structure.height; yy++) {
      for (let xx = 0; xx < structure.width; xx++) {
        const tx = structure.x + xx;
        const ty = structure.y + yy;
        for (const [dx, dy] of CARDINALS) {
          const tile = this.getTile(tx + dx, ty + dy);
          if (this.isPathTile(tile)) access.push({ x: tile.x, y: tile.y });
        }
      }
    }
    const seen = new Set();
    return access.filter((tile) => {
      const key = this.tileKey(tile.x, tile.y);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getConnectedAccessPoint(structure) {
    return this.structureAccessPoints(structure).find((tile) => this.isTileReachableFromEntrance(tile.x, tile.y)) || null;
  }

  updateStructureConnectivity() {
    this.computeReachablePaths();
    for (const structure of Object.values(this.structures)) {
      structure.accessPoint = this.getConnectedAccessPoint(structure);
      structure.connected = Boolean(structure.accessPoint);
    }
  }

  buildRouteMap(goalX, goalY) {
    const goalKey = this.tileKey(goalX, goalY);
    if (this.routeCache.has(goalKey)) return this.routeCache.get(goalKey);
    if (!this.isTileReachableFromEntrance(goalX, goalY)) return null;

    const distances = new Map([[goalKey, 0]]);
    const queue = [{ x: goalX, y: goalY }];
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      const currentDistance = distances.get(this.tileKey(current.x, current.y));
      for (const next of this.pathNeighbors(current.x, current.y)) {
        const key = this.tileKey(next.x, next.y);
        if (distances.has(key) || !this.isTileReachableFromEntrance(next.x, next.y)) continue;
        distances.set(key, currentDistance + 1);
        queue.push({ x: next.x, y: next.y });
      }
    }

    const routeMap = { goalKey, distances };
    this.routeCache.set(goalKey, routeMap);
    return routeMap;
  }

  findRouteInfo(startX, startY, goalX, goalY) {
    const routeMap = this.buildRouteMap(goalX, goalY);
    if (!routeMap) return null;
    const startKey = this.tileKey(startX, startY);
    if (!routeMap.distances.has(startKey)) return null;

    const distance = routeMap.distances.get(startKey);
    let bestStep = null;
    let bestDistance = distance;
    for (const next of this.pathNeighbors(startX, startY)) {
      const nextDistance = routeMap.distances.get(this.tileKey(next.x, next.y));
      if (nextDistance === undefined || nextDistance >= bestDistance) continue;
      bestDistance = nextDistance;
      bestStep = { x: next.x, y: next.y };
    }

    return { distance, nextStep: bestStep ?? { x: startX, y: startY } };
  }

  findNextStepTowards(startX, startY, goalX, goalY) {
    return this.findRouteInfo(startX, startY, goalX, goalY)?.nextStep || null;
  }

  nearbyAttractions(x, y, range = 8) {
    const out = [];
    for (const s of Object.values(this.structures)) {
      if (!s.connected) continue;
      const route = s.accessPoint ? this.findRouteInfo(x, y, s.accessPoint.x, s.accessPoint.y) : null;
      if (!route || route.distance > range) continue;
      out.push({ structure: s, dist: route.distance, accessPoint: s.accessPoint, nextStep: route.nextStep });
    }
    return out.sort((a, b) => a.dist - b.dist);
  }

  serialize() { return { grid: this.grid, entrance: this.entrance, entranceSpawn: this.entranceSpawn, structures: this.structures, nextStructureId: this.nextStructureId }; }
  restore(data) {
    this.grid = data.grid;
    this.entrance = data.entrance;
    this.entranceSpawn = data.entranceSpawn || { x: this.entrance.x + 1, y: this.entrance.y };
    this.structures = data.structures || {};
    this.nextStructureId = data.nextStructureId || 1;
    this.markPathDataDirty();
    this.updateStructureConnectivity();
  }
}
