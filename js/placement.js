import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

export class PlacementSystem {
  static footprintTiles(anchorX, anchorY, def) {
    const tiles = [];
    for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) tiles.push({ x: anchorX + x, y: anchorY + y });
    return tiles;
  }

  static validatePlacement(map, x, y, id, economy, objectives) {
    const def = BUILDING_DEFINITIONS[id];
    if (!def) return { valid: false, reason: 'Unknown build item.', tiles: [] };
    if (objectives && !objectives.isUnlocked(def)) return { valid: false, reason: objectives.lockReason(def), tiles: this.footprintTiles(x, y, def) };

    const tiles = this.footprintTiles(x, y, def);

    if (def.kind === 'path' || def.kind === 'terrain') {
      const tile = map.getTile(x, y);
      if (!tile || tile.structureId || tile.base === 'entrance') return { valid: false, reason: 'Terrain can only be built on empty tiles.', tiles };
      if (def.kind === 'path' && tile.base !== 'grass') return { valid: false, reason: 'Path can only be built on grass.', tiles };
      if (def.kind === 'terrain' && tile.base !== 'grass') return { valid: false, reason: 'Water can only be built on grass.', tiles };
      if (def.kind === 'path' && !map.hasAdjacentPath(x, y)) return { valid: false, reason: 'Path must connect to existing path.', tiles };
      if (!economy.canAfford(def.cost)) return { valid: false, reason: 'Insufficient funds.', tiles };
      return { valid: true, reason: 'Valid terrain placement.', tiles };
    }

    for (const tile of tiles) {
      if (!map.inBounds(tile.x, tile.y)) return { valid: false, reason: 'Footprint extends out of map bounds.', tiles };
      const cell = map.getTile(tile.x, tile.y);
      if (cell.base !== 'grass' || cell.structureId || cell.base === 'entrance' || cell.base === 'water') return { valid: false, reason: 'Footprint has blocked terrain.', tiles };
    }

    if (!map.footprintHasAdjacentPath(tiles)) return { valid: false, reason: 'No path access nearby.', tiles };
    if (!economy.canAfford(def.cost)) return { valid: false, reason: 'Insufficient funds.', tiles };
    return { valid: true, reason: 'Placement valid.', tiles };
  }
}
