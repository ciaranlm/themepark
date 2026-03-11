const shadow = (ctx, x, y, w, h, a = 0.22) => {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
};

const booth = (ctx, body, roof) => {
  ctx.fillStyle = body; ctx.fillRect(-9, -15, 18, 11);
  ctx.fillStyle = roof; ctx.fillRect(-10, -18, 20, 4);
  ctx.fillStyle = '#f0f2f7'; ctx.fillRect(-4, -11, 8, 7);
};

export const drawGuest = (ctx, x, y, c1, c2, bob = 0) => {
  shadow(ctx, x, y + 1, 1.8, 1, 0.25);
  ctx.fillStyle = c1; ctx.fillRect(x - 0.9, y - 4 + bob, 1.8, 3);
  ctx.fillStyle = c2; ctx.fillRect(x - 0.6, y - 5.5 + bob, 1.2, 1.2);
};

export const drawStructure = (ctx, type, x, y, anim) => {
  ctx.save();
  ctx.translate(x, y);
  if (type === 'carousel') {
    shadow(ctx, 0, 1, 12, 5);
    ctx.fillStyle = '#754ea9'; ctx.beginPath(); ctx.ellipse(0, -5, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = i * (Math.PI / 4) + anim * 0.7; ctx.fillStyle = '#f5df6e'; ctx.fillRect(Math.cos(a) * 8 - 1, Math.sin(a) * 3 - 10, 2, 7); }
    ctx.fillStyle = '#cf5268'; ctx.beginPath(); ctx.ellipse(0, -16, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'ferris') {
    shadow(ctx, 0, 2, 16, 6);
    ctx.strokeStyle = '#d7e7f7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -18, 16, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + anim * 0.8; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(Math.cos(a) * 16, -18 + Math.sin(a) * 16); ctx.stroke(); ctx.fillStyle = '#f0c85a'; ctx.fillRect(Math.cos(a) * 16 - 1.5, -18 + Math.sin(a) * 16 - 1.5, 3, 3); }
    ctx.fillStyle = '#5377a6'; ctx.fillRect(-3, -8, 6, 12);
    ctx.strokeStyle = '#6d8eb5'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, -18); ctx.lineTo(10, 0); ctx.stroke();
  } else if (type === 'swing') {
    shadow(ctx, 0, 1, 12, 4);
    ctx.fillStyle = '#6b90b8'; ctx.fillRect(-2, -26, 4, 22);
    ctx.fillStyle = '#e2b95f'; ctx.beginPath(); ctx.ellipse(0, -26, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + anim; ctx.strokeStyle = '#f0f6ff'; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(Math.cos(a) * 10, -18 + Math.sin(a) * 2); ctx.stroke(); }
  } else if (type === 'pirateShip') {
    shadow(ctx, 0, 2, 18, 5);
    ctx.strokeStyle = '#a0b5c7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-6, -22); ctx.moveTo(12, -4); ctx.lineTo(6, -22); ctx.stroke();
    ctx.fillStyle = '#7a4a39'; ctx.beginPath(); ctx.ellipse(0, -13 + Math.sin(anim) * 3, 10, 4, Math.sin(anim) * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8c289'; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(6, -22); ctx.stroke();
  } else if (type === 'dropTower') {
    shadow(ctx, 0, 2, 10, 4);
    ctx.fillStyle = '#5e84ab'; ctx.fillRect(-3, -34, 6, 30);
    ctx.fillStyle = '#d25353'; ctx.fillRect(-6, -10 - (Math.sin(anim * 1.8) * 8), 12, 5);
    ctx.fillStyle = '#f2f6ff'; ctx.fillRect(-2, -37, 4, 4);
  } else if (type === 'miniCoaster') {
    shadow(ctx, 0, 2, 22, 6);
    ctx.strokeStyle = '#8c3a2f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(-10, -16); ctx.lineTo(0, -6); ctx.lineTo(10, -20); ctx.lineTo(20, -10); ctx.stroke();
    ctx.fillStyle = '#678db3'; ctx.fillRect(-10, -8, 20, 8);
    for (let i = -16; i <= 18; i += 6) { ctx.strokeStyle = '#cfa672'; ctx.beginPath(); ctx.moveTo(i, -2); ctx.lineTo(i, 4); ctx.stroke(); }
  } else if (type === 'woodCoaster') {
    shadow(ctx, 0, 2, 30, 9);
    ctx.strokeStyle = '#7c412f'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-18, -18); ctx.lineTo(-8, -5); ctx.lineTo(4, -26); ctx.lineTo(16, -12); ctx.lineTo(28, -22); ctx.stroke();
    for (let i = -26; i <= 26; i += 6) { ctx.strokeStyle = '#c69a64'; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, -10 - Math.abs((i % 12) - 6)); ctx.stroke(); }
    ctx.fillStyle = '#487099'; ctx.fillRect(-12, -6, 12, 7);
    ctx.fillStyle = '#d74e4e'; ctx.fillRect(-2 + Math.sin(anim * 2) * 14, -14 - Math.cos(anim * 2) * 4, 4, 3);
  } else if (type === 'megaCoaster') {
    shadow(ctx, 0, 3, 34, 10, 0.3);
    ctx.strokeStyle = '#3e4e7a'; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(-30, -2); ctx.lineTo(-20, -24); ctx.lineTo(-8, -8); ctx.lineTo(6, -30); ctx.lineTo(20, -14); ctx.lineTo(30, -26); ctx.stroke();
    for (let i = -30; i <= 30; i += 6) { ctx.strokeStyle = '#8fa1c5'; ctx.beginPath(); ctx.moveTo(i, 1); ctx.lineTo(i, -12 - Math.abs((i % 14) - 7)); ctx.stroke(); }
    ctx.fillStyle = '#d44b4b'; ctx.fillRect(-10 + Math.sin(anim * 1.6) * 20, -16 - Math.cos(anim * 1.6) * 5, 5, 3);
  } else if (type === 'logFlume') {
    shadow(ctx, 0, 2, 24, 8);
    ctx.strokeStyle = '#5d7ca0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-2, -16); ctx.lineTo(10, -8); ctx.lineTo(18, -16); ctx.stroke();
    ctx.strokeStyle = '#7ec3e3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-2, -16); ctx.lineTo(10, -8); ctx.lineTo(18, -16); ctx.stroke();
    ctx.fillStyle = '#6a5136'; ctx.fillRect(-8, -5, 10, 6);
  } else if (type === 'teacups') {
    shadow(ctx, 0, 1, 11, 4);
    ctx.fillStyle = '#6c97c0'; ctx.beginPath(); ctx.ellipse(0, -6, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + anim * 1.4; ctx.fillStyle = '#f2d47a'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 6, -6 + Math.sin(a) * 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (type === 'restroom') {
    shadow(ctx, 0, 1, 10, 4);
    ctx.fillStyle = '#9ab4c7'; ctx.fillRect(-9, -16, 18, 12);
    ctx.fillStyle = '#5f7991'; ctx.fillRect(-10, -18, 20, 4);
  } else if (type === 'tree') {
    shadow(ctx, 0, 1, 8, 3);
    ctx.fillStyle = '#503823'; ctx.fillRect(-1.5, -10, 3, 8);
    ctx.fillStyle = '#3d8740'; ctx.beginPath(); ctx.arc(0, -12, 7, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'bench') {
    shadow(ctx, 0, 1, 7, 2);
    ctx.fillStyle = '#6e4f29'; ctx.fillRect(-5, -5, 10, 2.5); ctx.fillRect(-4, -7, 8, 1.7);
  } else if (type === 'lamp') {
    shadow(ctx, 0, 1, 5, 2);
    ctx.fillStyle = '#4e5f74'; ctx.fillRect(-1, -12, 2, 9);
    ctx.fillStyle = '#f6e3a1'; ctx.fillRect(-2, -14, 4, 3);
    ctx.fillStyle = 'rgba(246,227,161,0.2)'; ctx.beginPath(); ctx.arc(0, -12, 6, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'flowers') {
    shadow(ctx, 0, 1, 8, 2);
    ctx.fillStyle = '#5f9646'; ctx.fillRect(-5, -4, 10, 3);
    ['#e96a8d', '#f0d45f', '#8fd5ff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-4 + i * 4, -7 + (i % 2), 2, 2); });
  } else if (type === 'statue') {
    shadow(ctx, 0, 1, 7, 3);
    ctx.fillStyle = '#8e9aad'; ctx.fillRect(-2, -14, 4, 10);
    ctx.fillStyle = '#c3ccd9'; ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a7487'; ctx.fillRect(-5, -5, 10, 3);
  } else if (type === 'kiosk') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#d1b89d', '#d46e52');
  } else if (type === 'stallBurger') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#d58d64', '#b24a3f');
  } else if (type === 'stallDrink') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#7eb7d9', '#376e9b');
  } else if (type === 'stallPizza') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#e0a26a', '#c25d3a');
  }
  ctx.restore();
};
