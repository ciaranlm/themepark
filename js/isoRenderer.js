import { GRID_SIZE, BUILDING_DEFINITIONS } from './rideDefinitions.js';
import { drawGuest, drawStructure } from './entityRenderer.js';

const drawDiamond = (ctx, x, y, w, h, color, stroke = '#00000055') => {
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y + h / 2); ctx.lineTo(x, y + h); ctx.lineTo(x - w / 2, y + h / 2); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
};

export class IsoRenderer {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.tileW = 30;
    this.tileH = 15;
    this.originX = canvas.width / 2;
    this.originY = 60;
  }

  gridToScreen(x, y) { return { x: this.originX + (x - y) * (this.tileW / 2), y: this.originY + (x + y) * (this.tileH / 2) }; }
  screenToGrid(sx, sy) {
    const x = ((sx - this.originX) / (this.tileW / 2) + (sy - this.originY) / (this.tileH / 2)) / 2;
    const y = ((sy - this.originY) / (this.tileH / 2) - (sx - this.originX) / (this.tileW / 2)) / 2;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  drawBaseTile(ctx, x, y, tile, time) {
    const grass = ['#6cae47', '#73b14d', '#669f42', '#77b64d', '#6aa848'];
    const path = ['#bea983', '#c7b38f', '#af9a74', '#c2ad8a'];
    const water = ['#3f88bc', '#4d98cc', '#3b7cad'];
    if (tile.base === 'water') {
      const shimmer = Math.sin(time * 2.2 + tile.x * 0.3 + tile.y * 0.2) * 8;
      drawDiamond(ctx, x, y, this.tileW, this.tileH, water[tile.waterVariant], 'rgba(20,62,102,0.35)');
      drawDiamond(ctx, x, y + 2, this.tileW - 5, this.tileH - 6, `rgba(120,200,255,${0.16 + shimmer / 80})`, null);
      return;
    }

    const color = tile.base === 'path' || tile.base === 'entrance' ? path[tile.pathVariant] : grass[tile.grassVariant];
    drawDiamond(ctx, x, y, this.tileW, this.tileH, color, 'rgba(0,0,0,0.13)');
    if (tile.base !== 'path' && tile.base !== 'entrance' && tile.grassVariant % 2 === 0) {
      ctx.fillStyle = 'rgba(80,130,48,0.24)';
      ctx.fillRect(x - 2, y + 5, 2, 1);
      ctx.fillRect(x + 3, y + 6, 2, 1);
    }
  }

  drawPlacementPreview(game, time) {
    const ctx = this.ctx;
    const state = game.state.snapshot;
    const preview = state.placementPreview;
    const build = BUILDING_DEFINITIONS[state.selectedBuild];
    if (!state.hoverTile || !preview || !build) return;

    const pulse = 0.78 + Math.sin(time * 8) * 0.08;
    for (const t of preview.tiles) {
      if (!game.map.inBounds(t.x, t.y)) continue;
      const p = this.gridToScreen(t.x, t.y);
      const blocked = preview.blockedTiles?.some((tile) => tile.x === t.x && tile.y === t.y);
      const fill = blocked || !preview.valid ? 'rgba(226,78,84,0.32)' : 'rgba(88,214,123,0.26)';
      const stroke = blocked || !preview.valid ? `rgba(255,108,108,${pulse})` : `rgba(134,255,174,${pulse})`;
      drawDiamond(ctx, p.x, p.y, this.tileW, this.tileH, fill, stroke);
      ctx.strokeStyle = blocked ? 'rgba(128,26,26,0.75)' : stroke;
      ctx.lineWidth = blocked ? 2 : 1.25;
      ctx.beginPath();
      ctx.moveTo(p.x - 7, p.y + 4);
      ctx.lineTo(p.x + 7, p.y + 11);
      ctx.moveTo(p.x + 7, p.y + 4);
      ctx.lineTo(p.x - 7, p.y + 11);
      if (blocked) ctx.stroke();
    }
    ctx.lineWidth = 1;

    if (build.kind === 'path' || build.kind === 'terrain') return;

    const center = this.gridToScreen(state.hoverTile.x + build.width / 2 - 0.5, state.hoverTile.y + build.height / 2 - 0.5);
    ctx.save();
    ctx.globalAlpha = preview.valid ? 0.5 : 0.28;
    if (!preview.valid) ctx.filter = 'grayscale(0.15) saturate(0.8)';
    drawStructure(ctx, build.visualType, center.x, center.y + this.tileH / 2, time * 0.7);
    ctx.restore();
  }

  draw(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const drawQueue = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.map.grid[y][x];
        const p = this.gridToScreen(x, y);
        this.drawBaseTile(ctx, p.x, p.y, tile, time);
        if (tile.base === 'entrance') drawDiamond(ctx, p.x, p.y + 1, this.tileW - 6, this.tileH - 4, '#496b95');
      }
    }

    this.drawPlacementPreview(game, time);

    for (const s of Object.values(this.map.structures)) drawQueue.push({ depth: s.x + s.y + s.width + s.height + 0.2, structure: s });
    for (const g of game.guestManager.guests) drawQueue.push({ depth: g.drawX + g.drawY + 0.18, guest: g });

    drawQueue.sort((a, b) => a.depth - b.depth);
    for (const item of drawQueue) {
      if (item.guest) {
        const p = this.gridToScreen(item.guest.drawX, item.guest.drawY);
        drawGuest(ctx, p.x, p.y + this.tileH / 2, item.guest.palette.body, item.guest.palette.head, Math.sin(time * 8 + item.guest.id) * 0.3);
      } else {
        const s = item.structure;
        const anchor = this.gridToScreen(s.x + s.width / 2 - 0.5, s.y + s.height / 2 - 0.5);
        const def = BUILDING_DEFINITIONS[s.id];
        drawStructure(ctx, def.visualType, anchor.x, anchor.y + this.tileH / 2, time * 0.8);
      }
    }

    const state = game.state.snapshot;

    for (const t of state.floatingTexts) {
      const p = this.gridToScreen(t.x, t.y);
      ctx.globalAlpha = Math.max(0.25, t.life);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 11px Verdana';
      ctx.fillText(t.text, p.x + 10, p.y - 10 - (1 - t.life) * 25);
      ctx.globalAlpha = 1;
    }
  }
}
