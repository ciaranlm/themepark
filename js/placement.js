import { BUILDING_DEFINITIONS } from './rideDefinitions.js';

export class PlacementSystem {
  static footprintTiles(anchorX, anchorY, def) {
    const tiles = [];
    for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) tiles.push({ x: anchorX + x, y: anchorY + y });
    return tiles;
  }

  static validatePlacement(map, x, y, id, economy, objectives) {
    const def = BUILDING_DEFINITIONS[id];
    if (!def) return { valid: false, reason: 'Unknown build item.', tiles: [], blockedTiles: [] };
    const minSize = def.placement?.minSize;
    if (minSize && (def.width < minSize.width || def.height < minSize.height)) {
      return { valid: false, reason: `${def.name} must be at least ${minSize.width}x${minSize.height}.`, tiles: this.footprintTiles(x, y, def), blockedTiles: [] };
    }
    if (objectives && !objectives.isUnlocked(def)) {
      return {
        valid: false,
        reason: objectives.lockReason(def),
        tiles: this.footprintTiles(x, y, def),
        blockedTiles: [],
      };
    }

    const tiles = this.footprintTiles(x, y, def);
    const blockedTiles = [];
    const fail = (reason) => ({ valid: false, reason, tiles, blockedTiles });

    for (const tile of tiles) {
      if (!map.inBounds(tile.x, tile.y)) return fail('Footprint extends out of map bounds.');
    }

    if (def.kind === 'path' || def.kind === 'terrain') {
      for (const tile of tiles) {
        const cell = map.getTile(tile.x, tile.y);
        if (!cell) return fail('Footprint extends out of map bounds.');
        if (cell.structureId || cell.base === 'entrance' || cell.base === 'water' || cell.base === 'path') blockedTiles.push(tile);
        else if (cell.base !== 'grass') blockedTiles.push(tile);
      }
      if (blockedTiles.length) return fail(def.kind === 'path' ? 'Path can only be built on empty grass tiles.' : 'Water can only be built on empty grass tiles.');
      if (def.kind === 'path' && !map.hasAdjacentPath(x, y)) return fail('Path must connect to existing path.');
      if (!economy.canAfford(def.cost)) return fail('Insufficient funds.');
      return { valid: true, reason: 'Valid terrain placement.', tiles, blockedTiles };
    }

    for (const tile of tiles) {
      const cell = map.getTile(tile.x, tile.y);
      if (cell.base === 'entrance' || cell.base === 'water' || cell.structureId || cell.base !== 'grass') blockedTiles.push(tile);
    }

    if (blockedTiles.length) return fail('Footprint overlaps blocked or occupied tiles.');
    if (!map.footprintHasAdjacentPath(tiles)) return fail('No path access nearby.');
    if (!economy.canAfford(def.cost)) return fail('Insufficient funds.');
    return { valid: true, reason: 'Placement valid.', tiles, blockedTiles };
  }
}
