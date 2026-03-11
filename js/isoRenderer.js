import { GRID_SIZE } from './data.js';
import { drawBuilding, drawGuest, drawTile, drawDiamond } from './assets.js';

export class IsoRenderer {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.tileW = 28;
    this.tileH = 14;
    this.originX = canvas.width / 2;
    this.originY = 70;
  }

  gridToScreen(x, y) {
    return {
      x: this.originX + (x - y) * (this.tileW / 2),
      y: this.originY + (x + y) * (this.tileH / 2),
    };
  }

  screenToGrid(sx, sy) {
    const x = ((sx - this.originX) / (this.tileW / 2) + (sy - this.originY) / (this.tileH / 2)) / 2;
    const y = ((sy - this.originY) / (this.tileH / 2) - (sx - this.originX) / (this.tileW / 2)) / 2;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  draw(game, time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const drawQueue = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.map.grid[y][x];
        const p = this.gridToScreen(x, y);
        drawTile(ctx, p.x, p.y, this.tileW, this.tileH, tile.tile, (x * 13 + y * 17) % 3);

        if (tile.tile === 'entrance') {
          ctx.fillStyle = '#496b95';
          drawDiamond(ctx, p.x, p.y + 1, this.tileW - 6, this.tileH - 4, '#496b95');
        }

        if (tile.buildingId && tile.tile !== 'path') {
          drawQueue.push({ depth: x + y + 0.2, x, y, id: tile.buildingId });
        }
      }
    }

    for (const g of game.guestManager.guests) {
      drawQueue.push({ depth: g.x + g.y + 0.25, guest: g });
    }

    drawQueue.sort((a, b) => a.depth - b.depth);
    for (const item of drawQueue) {
      if (item.guest) {
        const p = this.gridToScreen(item.guest.x, item.guest.y);
        drawGuest(ctx, p.x, p.y + this.tileH / 2, item.guest.palette.body, item.guest.palette.head, Math.sin(time * 8 + item.guest.id) * 0.7);
        if (item.guest.thoughtTimer > 0) {
          ctx.fillStyle = '#e5f0ff';
          ctx.strokeStyle = '#304d6a';
          ctx.fillRect(p.x + 4, p.y - 18, 8, 8);
          ctx.strokeRect(p.x + 4, p.y - 18, 8, 8);
          ctx.fillStyle = '#294863';
          ctx.fillRect(p.x + 7, p.y - 15, 2, 2);
        }
        continue;
      }
      const p = this.gridToScreen(item.x, item.y);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + this.tileH / 2, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      drawBuilding(ctx, item.id, p.x, p.y + this.tileH / 2, time * 0.8);
    }

    if (game.hoverTile) {
      const p = this.gridToScreen(game.hoverTile.x, game.hoverTile.y);
      const valid = game.map.canPlace(game.hoverTile.x, game.hoverTile.y, game.selectedBuild);
      drawDiamond(ctx, p.x, p.y, this.tileW, this.tileH, valid ? 'rgba(100,210,235,0.35)' : 'rgba(210,70,80,0.35)');
      ctx.strokeStyle = valid ? '#70d2ea' : '#d24650';
      ctx.stroke();
    }

    for (const t of game.floatingTexts) {
      const p = this.gridToScreen(t.x, t.y);
      ctx.globalAlpha = Math.max(0.2, t.life);
      ctx.fillStyle = t.color;
      ctx.font = '11px Verdana';
      ctx.fillText(t.text, p.x + 10, p.y - 12 - (1 - t.life) * 26);
      ctx.globalAlpha = 1;
    }
  }
}
