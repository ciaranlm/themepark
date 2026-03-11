import { GRID_SIZE, BUILDING_DEFINITIONS } from './rideDefinitions.js';
import { drawGuest, drawStructure } from './entityRenderer.js';
import { PlacementSystem } from './placement.js';

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

  drawBaseTile(ctx, x, y, tile) {
    const grass = ['#6cae47', '#73b14d', '#669f42', '#77b64d', '#6aa848'];
    const path = ['#bea983', '#c7b38f', '#af9a74', '#c2ad8a'];
    const color = tile.base === 'path' || tile.base === 'entrance' ? path[tile.pathVariant] : grass[tile.grassVariant];
    drawDiamond(ctx, x, y, this.tileW, this.tileH, color, 'rgba(0,0,0,0.13)');
    if (tile.base !== 'path' && tile.base !== 'entrance' && tile.grassVariant % 2 === 0) {
      ctx.fillStyle = 'rgba(80,130,48,0.24)';
      ctx.fillRect(x - 2, y + 5, 2, 1);
      ctx.fillRect(x + 3, y + 6, 2, 1);
    }
  }

  draw(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const drawQueue = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.map.grid[y][x];
        const p = this.gridToScreen(x, y);
        this.drawBaseTile(ctx, p.x, p.y, tile);
        if (tile.base === 'entrance') drawDiamond(ctx, p.x, p.y + 1, this.tileW - 6, this.tileH - 4, '#496b95');
      }
    }

    for (const s of Object.values(this.map.structures)) {
      drawQueue.push({ depth: s.x + s.y + s.width + s.height + 0.2, structure: s });
    }
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
        drawStructure(ctx, def.renderType, anchor.x, anchor.y + this.tileH / 2, time * 0.8);
      }
    }

    if (game.hoverTile) {
      const check = PlacementSystem.validatePlacement(game.map, game.hoverTile.x, game.hoverTile.y, game.selectedBuild, game.economy, game.objectives);
      for (const t of check.tiles) {
        if (!game.map.inBounds(t.x, t.y)) continue;
        const p = this.gridToScreen(t.x, t.y);
        drawDiamond(ctx, p.x, p.y, this.tileW, this.tileH, check.valid ? 'rgba(90,200,235,0.35)' : 'rgba(220,75,80,0.35)', check.valid ? '#7dd6f1' : '#da5757');
      }
      if (check.valid && game.selectedBuild !== 'path') {
        const def = BUILDING_DEFINITIONS[game.selectedBuild];
        const center = this.gridToScreen(game.hoverTile.x + def.width / 2 - 0.5, game.hoverTile.y + def.height / 2 - 0.5);
        ctx.globalAlpha = 0.45;
        drawStructure(ctx, def.renderType, center.x, center.y + this.tileH / 2, time * 0.7);
        ctx.globalAlpha = 1;
      }
    }

    if (game.selectedStructure) {
      const s = game.selectedStructure;
      for (let yy = 0; yy < s.height; yy++) {
        for (let xx = 0; xx < s.width; xx++) {
          const p = this.gridToScreen(s.x + xx, s.y + yy);
          drawDiamond(ctx, p.x, p.y, this.tileW, this.tileH, 'rgba(255,255,180,0.23)', '#f0e48f');
        }
      }
    }

    for (const t of game.floatingTexts) {
      const p = this.gridToScreen(t.x, t.y);
      ctx.globalAlpha = Math.max(0.25, t.life);
      ctx.fillStyle = t.color;
      ctx.font = '11px Verdana';
      ctx.fillText(t.text, p.x + 10, p.y - 10 - (1 - t.life) * 25);
      ctx.globalAlpha = 1;
    }
  }
}
