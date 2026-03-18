import { BUILDING_DEFINITIONS } from '../rideDefinitions.js';
import { PlacementSystem } from '../placement.js';

/**
 * Input and placement system.
 *
 * This system translates browser pointer events into map coordinates, updates the
 * central selection state, and applies placement/removal rules without changing
 * any rendering or UI code directly outside its own responsibilities.
 */
export class InputSystem {
  constructor({ canvas, state, map, renderer, economy, objectives, ui }) {
    this.canvas = canvas;
    this.state = state;
    this.map = map;
    this.renderer = renderer;
    this.economy = economy;
    this.objectives = objectives;
    this.ui = ui;
  }

  attach() {
    this.canvas.oncontextmenu = (event) => event.preventDefault();
    this.canvas.addEventListener('mousedown', (event) => this.handlePointerDown(event));
    this.canvas.addEventListener('mousemove', (event) => this.handlePointerMove(event));
  }

  pointerToTile(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const sy = (event.clientY - rect.top) * (this.canvas.height / rect.height);
    const tile = this.renderer.screenToGrid(sx, sy);
    return this.map.inBounds(tile.x, tile.y) ? tile : null;
  }

  handlePointerDown(event) {
    const tile = this.pointerToTile(event);
    if (!tile) return;

    this.state.patch({
      selectedTile: tile,
      selectedStructure: this.map.structureAt(tile.x, tile.y),
    });

    if (event.button === 2) {
      this.removeAt(tile.x, tile.y);
      return;
    }

    this.placeAt(tile.x, tile.y);
  }

  handlePointerMove(event) {
    const tile = this.pointerToTile(event);
    this.state.patch({ hoverTile: tile, selectedTile: tile });
    if (!tile) return;

    const currentState = this.state.snapshot;
    const check = PlacementSystem.validatePlacement(
      this.map,
      tile.x,
      tile.y,
      currentState.selectedBuild,
      this.economy,
      this.objectives,
    );
    const tileData = this.map.getTile(tile.x, tile.y);
    this.ui.setHint(`Tile (${tile.x},${tile.y}) • ${tileData.base} • ${check.valid ? 'Valid placement' : check.reason} • ${this.ui.timeLabel()}`);
  }

  removeAt(x, y) {
    const removed = this.map.removeAt(x, y);
    if (!removed?.id) return;

    const refund = Math.floor(BUILDING_DEFINITIONS[removed.id].cost * 0.45);
    this.economy.earn(refund);
    this.ui.setHint(`Removed ${removed.name}. Refunded $${refund}.`);
  }

  placeAt(x, y) {
    const currentState = this.state.snapshot;
    const check = PlacementSystem.validatePlacement(
      this.map,
      x,
      y,
      currentState.selectedBuild,
      this.economy,
      this.objectives,
    );
    if (!check.valid) {
      this.ui.setHint(check.reason);
      return;
    }

    const item = BUILDING_DEFINITIONS[currentState.selectedBuild];
    if (item.kind === 'path') this.map.placePath(x, y);
    else if (item.kind === 'terrain') this.map.placeWater(x, y);
    else this.map.placeStructure(x, y, item);

    this.economy.spend(item.cost);
    this.ui.addFloatingText(`-$${item.cost}`, x, y, '#ffd1d1');
    this.ui.setHint(`Placed ${item.name} (${item.width}x${item.height}).`);
  }
}
