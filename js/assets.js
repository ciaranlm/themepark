const shade = (c, amount) => {
  const n = parseInt(c.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
};

export const drawDiamond = (ctx, x, y, w, h, color) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};

export const drawTile = (ctx, x, y, tileW, tileH, tile, variant = 0) => {
  const grass = ['#6cae47', '#73b14d', '#68a344'];
  const path = ['#b9a47f', '#c2ae8a', '#ad9973'];
  const base = tile === 'path' || tile === 'entrance' ? path[variant % path.length] : grass[variant % grass.length];
  drawDiamond(ctx, x, y, tileW, tileH, base);
  ctx.strokeStyle = shade(base, -28);
  ctx.stroke();
};

export const drawBuilding = (ctx, id, x, y, anim = 0) => {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'tree') {
    ctx.fillStyle = '#503823';
    ctx.fillRect(-2, -12, 4, 10);
    ctx.fillStyle = '#3a7e3a';
    ctx.beginPath(); ctx.arc(0, -14, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d9a47';
    ctx.beginPath(); ctx.arc(-3, -16, 5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bench') {
    ctx.fillStyle = '#6e4f29';
    ctx.fillRect(-5, -5, 10, 3);
    ctx.fillRect(-5, -8, 10, 2);
  } else if (id === 'carousel') {
    ctx.fillStyle = '#8458b8'; ctx.beginPath(); ctx.ellipse(0, -6, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5df6e'; ctx.fillRect(-2, -17, 4, 11);
    ctx.fillStyle = '#c74f5c'; ctx.beginPath(); ctx.ellipse(0, -19, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ferris') {
    ctx.strokeStyle = '#d7e7f7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -14, 10, anim, Math.PI * 2 + anim); ctx.stroke();
    ctx.fillStyle = '#476b9a'; ctx.fillRect(-2, -6, 4, 8);
  } else if (id === 'miniCoaster') {
    ctx.strokeStyle = '#7f3f33'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-3, -15); ctx.lineTo(3, -8); ctx.lineTo(10, -12); ctx.stroke();
    ctx.fillStyle = '#4b79a1'; ctx.fillRect(-6, -7, 12, 6);
  } else if (id === 'restroom') {
    ctx.fillStyle = '#9ab4c7'; ctx.fillRect(-8, -16, 16, 12);
    ctx.fillStyle = '#5f7991'; ctx.fillRect(-9, -17, 18, 3);
  } else if (id === 'burger' || id === 'drink' || id === 'pizza') {
    ctx.fillStyle = '#d55f4f'; ctx.fillRect(-8, -12, 16, 8);
    ctx.fillStyle = '#f2e1a4'; ctx.fillRect(-7, -15, 14, 3);
  } else if (id === 'swing') {
    ctx.fillStyle = '#6b90b8'; ctx.fillRect(-1, -18, 2, 14);
    ctx.strokeStyle = '#f2d99f'; ctx.beginPath(); ctx.arc(0, -19, 8, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
};

export const drawGuest = (ctx, x, y, c1, c2, bob = 0) => {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y - 1, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c1;
  ctx.fillRect(x - 2, y - 9 + bob, 4, 5);
  ctx.fillStyle = c2;
  ctx.fillRect(x - 1, y - 12 + bob, 2, 2);
};
