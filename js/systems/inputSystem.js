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
    this.pointerState = null;
    this.dragThreshold = 6;
  }

  attach() {
    this.canvas.oncontextmenu = (event) => event.preventDefault();
    this.canvas.addEventListener('mousedown', (event) => this.handlePointerDown(event));
    this.canvas.addEventListener('mousemove', (event) => this.handlePointerMove(event));
    window.addEventListener('mouseup', (event) => this.handlePointerUp(event));
    this.canvas.addEventListener('mouseleave', () => this.clearHoverState());
    this.canvas.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
  }

  eventToCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      sx: (event.clientX - rect.left) * (this.canvas.width / rect.width),
      sy: (event.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  pointerToTile(event) {
    const { sx, sy } = this.eventToCanvasPoint(event);
    const tile = this.renderer.screenToGrid(sx, sy);
    return this.map.inBounds(tile.x, tile.y) ? tile : null;
  }

  refreshPlacementPreview(tile = this.state.snapshot.hoverTile) {
    const currentState = this.state.snapshot;
    const preview = tile
      ? PlacementSystem.validatePlacement(
        this.map,
        tile.x,
        tile.y,
        currentState.selectedBuild,
        this.economy,
        this.objectives,
      )
      : null;

    this.state.patch({ placementPreview: preview });
    this.updateCursor(preview, tile);
    return preview;
  }

  updateCursor(preview, tile) {
    const hoveringStructure = tile ? this.map.structureAt(tile.x, tile.y) : null;
    const draggingCamera = Boolean(this.pointerState?.dragging);
    this.canvas.classList.toggle('cursor-build-valid', Boolean(tile && preview?.valid && !draggingCamera));
    this.canvas.classList.toggle('cursor-build-invalid', Boolean(tile && preview && !preview.valid && !draggingCamera));
    this.canvas.classList.toggle('cursor-remove', Boolean(tile && !preview && hoveringStructure && !draggingCamera));
    this.canvas.classList.toggle('cursor-pan', draggingCamera);
  }

  clearHoverState() {
    if (this.pointerState?.dragging) return;
    this.state.patch({ hoverTile: null, placementPreview: null });
    this.updateCursor(null, null);
    this.ui.setHint(`Move cursor over map to preview placement. Wheel zoom • drag to pan. • ${this.ui.timeLabel()}`);
  }

  handlePointerDown(event) {
    const { sx, sy } = this.eventToCanvasPoint(event);
    this.pointerState = {
      button: event.button,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      startSx: sx,
      startSy: sy,
      lastSx: sx,
      lastSy: sy,
      dragging: event.button === 1,
      moved: false,
    };

    if (event.button === 1) {
      event.preventDefault();
      this.updateCursor(this.state.snapshot.placementPreview, this.state.snapshot.hoverTile);
      this.ui.setHint(`Panning camera • Zoom ${(this.renderer.camera.zoom * 100).toFixed(0)}%`);
    }
  }

  handlePointerMove(event) {
    const pointer = this.pointerState;
    if (pointer) {
      const { sx, sy } = this.eventToCanvasPoint(event);
      const dx = sx - pointer.startSx;
      const dy = sy - pointer.startSy;
      if (!pointer.dragging && pointer.button !== 2 && Math.hypot(dx, dy) >= this.dragThreshold) {
        pointer.dragging = true;
      }
      if (pointer.dragging) {
        this.renderer.panBy(sx - pointer.lastSx, sy - pointer.lastSy);
        pointer.lastSx = sx;
        pointer.lastSy = sy;
        pointer.lastClientX = event.clientX;
        pointer.lastClientY = event.clientY;
        pointer.moved = true;
        this.updateCursor(this.state.snapshot.placementPreview, this.state.snapshot.hoverTile);
        const tile = this.pointerToTile(event);
        this.state.patch({ hoverTile: tile, selectedTile: tile, selectedStructure: tile ? this.map.structureAt(tile.x, tile.y) : null });
        this.refreshPlacementPreview(tile);
        this.ui.setHint(`Panning camera • Zoom ${(this.renderer.camera.zoom * 100).toFixed(0)}%`);
        return;
      }
      pointer.lastClientX = event.clientX;
      pointer.lastClientY = event.clientY;
      pointer.lastSx = sx;
      pointer.lastSy = sy;
    }

    const tile = this.pointerToTile(event);
    this.state.patch({ hoverTile: tile, selectedTile: tile, selectedStructure: tile ? this.map.structureAt(tile.x, tile.y) : null });
    if (!tile) {
      this.clearHoverState();
      return;
    }

    const check = this.refreshPlacementPreview(tile);
    const tileData = this.map.getTile(tile.x, tile.y);
    const hoverStructure = this.map.structureAt(tile.x, tile.y);
    const hoverSummary = hoverStructure
      ? `${hoverStructure.name} ${hoverStructure.width}x${hoverStructure.height}`
      : `${tileData.base}${tileData.structureId ? ' • occupied' : ''}`;
    const placementState = check.valid ? 'valid' : check.reason;
    this.ui.setHint(`Tile (${tile.x},${tile.y}) • ${hoverSummary} • Placement ${placementState} • Zoom ${(this.renderer.camera.zoom * 100).toFixed(0)}% • ${this.ui.timeLabel()}`);
  }

  handlePointerUp(event) {
    if (!this.pointerState || event.button !== this.pointerState.button) return;

    const tile = this.pointerToTile(event);
    const wasDragging = this.pointerState.dragging && this.pointerState.moved;
    this.pointerState = null;

    if (wasDragging) {
      this.updateCursor(this.state.snapshot.placementPreview, tile);
      return;
    }

    if (!tile) return;

    this.state.patch({
      selectedTile: tile,
      selectedStructure: this.map.structureAt(tile.x, tile.y),
    });

    if (event.button === 2) {
      this.removeAt(tile.x, tile.y);
      return;
    }

    if (event.button === 0) this.placeAt(tile.x, tile.y);
  }

  handleWheel(event) {
    event.preventDefault();
    const { sx, sy } = this.eventToCanvasPoint(event);
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    const zoom = this.renderer.zoomAt(sx, sy, factor);
    const tile = this.pointerToTile(event);
    this.state.patch({ hoverTile: tile, selectedTile: tile, selectedStructure: tile ? this.map.structureAt(tile.x, tile.y) : null });
    this.refreshPlacementPreview(tile);
    this.ui.setHint(`Zoom ${(zoom * 100).toFixed(0)}% • Drag to pan • ${this.ui.timeLabel()}`);
  }

  removeAt(x, y) {
    const removed = this.map.removeAt(x, y);
    if (!removed?.id) return;

    const refund = Math.floor(BUILDING_DEFINITIONS[removed.id].cost * 0.45);
    this.economy.earn(refund);
    this.refreshPlacementPreview();
    this.ui.setHint(`Removed ${removed.name}. Refunded $${refund}.`);
  }

  placeAt(x, y) {
    const currentState = this.state.snapshot;
    const check = currentState.placementPreview && currentState.hoverTile?.x === x && currentState.hoverTile?.y === y
      ? currentState.placementPreview
      : PlacementSystem.validatePlacement(
        this.map,
        x,
        y,
        currentState.selectedBuild,
        this.economy,
        this.objectives,
      );
    if (!check.valid) {
      this.state.patch({ placementPreview: check });
      this.updateCursor(check, { x, y });
      this.ui.setHint(check.reason);
      return;
    }

    const item = BUILDING_DEFINITIONS[currentState.selectedBuild];
    if (item.kind === 'path') this.map.placePath(x, y);
    else if (item.kind === 'terrain') this.map.placeWater(x, y);
    else this.map.placeStructure(x, y, item);

    this.economy.spend(item.cost);
    this.ui.addFloatingText(`-$${item.cost}`, x, y, '#ffd1d1');
    this.refreshPlacementPreview({ x, y });
    this.ui.setHint(`Placed ${item.name} (${item.width}x${item.height}).`);
  }
}
