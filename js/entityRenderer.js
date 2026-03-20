const shadow = (ctx, x, y, w, h, a = 0.22) => {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
};

const booth = (ctx, body, roof, accent = '#f0f2f7') => {
  ctx.fillStyle = body; ctx.fillRect(-9, -15, 18, 11);
  ctx.fillStyle = roof; ctx.fillRect(-10, -18, 20, 4);
  ctx.fillStyle = accent; ctx.fillRect(-4, -11, 8, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-7, -14, 4, 8);
};

const strokePath = (ctx, color, width, points) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach(([px, py], index) => {
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
};

const supportLine = (ctx, x, topY, bottomY, color) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, bottomY);
  ctx.lineTo(x, topY);
  ctx.stroke();
};

const drawCanopy = (ctx, x, y, rx, ry, color, highlight) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.22, y - ry * 0.26, rx * 0.46, ry * 0.34, -0.3, 0, Math.PI * 2);
  ctx.fill();
};

export const drawGuest = (ctx, x, y, c1, c2, motion = {}, scale = 1) => {
  const bob = motion.bob || 0;
  const sway = motion.sway || 0;
  const stride = motion.stride || 0;
  const facing = motion.facing || 1;
  const armSwing = motion.armSwing || 0;
  const bounce = bob * 0.45;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  shadow(ctx, 0, 1.6, 2.6 + Math.abs(stride) * 0.8, 1.1, 0.25);

  ctx.save();
  ctx.translate(sway * 0.22, bounce);
  ctx.rotate(sway * 0.05);

  ctx.strokeStyle = '#293345';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-0.6, -1.2);
  ctx.lineTo(-1.1 - stride * 0.5, 1.7);
  ctx.moveTo(0.6, -1.2);
  ctx.lineTo(1.1 + stride * 0.5, 1.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-1.2, -4.2);
  ctx.lineTo(-2 + armSwing * 0.6, -2.2);
  ctx.moveTo(1.2, -4.2);
  ctx.lineTo(2 - armSwing * 0.6, -2.1);
  ctx.stroke();

  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.roundRect(-1.7, -7 + bob, 3.4, 5.6, 1.4);
  ctx.fill();

  ctx.fillStyle = shadeColor(c1, 20);
  ctx.fillRect(-1.2, -6.3 + bob, 0.85, 3.5);

  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.arc(0, -8.15 + bob, 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3d2a21';
  ctx.fillRect(-0.45 * facing, -8.45 + bob, 1.1, 0.35);
  ctx.restore();
  ctx.restore();
};

const shadeColor = (color, amount) => {
  const value = color.startsWith('#') ? color.slice(1) : color;
  const int = Number.parseInt(value, 16);
  const r = Math.max(0, Math.min(255, (int >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((int >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (int & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
};

export const drawStructure = (ctx, type, x, y, anim, scale = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (type === 'carousel') {
    shadow(ctx, 0, 2, 14, 6, 0.24);
    ctx.fillStyle = '#6d49a0'; ctx.beginPath(); ctx.ellipse(0, -6, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const a = i * (Math.PI / 5) + anim * 0.75;
      ctx.fillStyle = i % 2 ? '#ffd86a' : '#f7f2cf';
      ctx.fillRect(Math.cos(a) * 9 - 0.85, Math.sin(a) * 3 - 11, 1.7, 8.5);
    }
    ctx.fillStyle = '#d24f66'; ctx.beginPath(); ctx.ellipse(0, -18, 15, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(-4, -19, 5, 2, -0.2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'ferris') {
    shadow(ctx, 0, 2.5, 18, 7, 0.24);
    ctx.strokeStyle = '#d9eeff'; ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.arc(0, -22, 18, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = i * ((Math.PI * 2) / 10) + anim * 0.65;
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(Math.cos(a) * 18, -22 + Math.sin(a) * 18); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#f7d061' : '#ff8b73';
      ctx.beginPath(); ctx.roundRect(Math.cos(a) * 18 - 2, -22 + Math.sin(a) * 18 - 1.3, 4, 2.6, 1); ctx.fill();
    }
    ctx.strokeStyle = '#6d88ac'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-11, 1); ctx.lineTo(0, -22); ctx.lineTo(11, 1); ctx.stroke();
    ctx.fillStyle = '#4e6992'; ctx.fillRect(-4, -8, 8, 10);
  } else if (type === 'swing') {
    shadow(ctx, 0, 1, 13, 4, 0.22);
    ctx.fillStyle = '#6489b0'; ctx.fillRect(-2.2, -30, 4.4, 26);
    ctx.fillStyle = '#efc766'; ctx.beginPath(); ctx.ellipse(0, -30, 12, 4.8, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const a = i * ((Math.PI * 2) / 10) + anim;
      const seatX = Math.cos(a) * 11;
      const seatY = -22 + Math.sin(a) * 2;
      ctx.strokeStyle = '#f6fbff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(seatX, seatY); ctx.stroke();
      ctx.fillStyle = '#d95357'; ctx.fillRect(seatX - 1.1, seatY - 0.7, 2.2, 1.4);
    }
  } else if (type === 'pirateShip') {
    shadow(ctx, 0, 2, 18, 5);
    ctx.strokeStyle = '#9cb1c6'; ctx.lineWidth = 2.1; ctx.beginPath(); ctx.moveTo(-13, -3); ctx.lineTo(-6, -24); ctx.moveTo(13, -3); ctx.lineTo(6, -24); ctx.stroke();
    ctx.strokeStyle = '#d8c289'; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -24); ctx.stroke();
    ctx.fillStyle = '#774736';
    ctx.beginPath();
    ctx.ellipse(0, -14 + Math.sin(anim) * 4, 10.5, 4.6, Math.sin(anim) * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7c589'; ctx.fillRect(-1, -22 + Math.sin(anim) * 2, 2, 8);
  } else if (type === 'bumperCars') {
    shadow(ctx, 0, 2, 19, 7, 0.24);
    ctx.fillStyle = '#5f7896'; ctx.fillRect(-13, -14, 26, 12);
    ctx.strokeStyle = '#e0effd'; ctx.lineWidth = 1.3; ctx.strokeRect(-13, -14, 26, 12);
    ctx.fillStyle = '#7fa9d7'; ctx.fillRect(-11, -12, 22, 2.4);
    ctx.fillStyle = '#d85c52'; ctx.beginPath(); ctx.roundRect(-8 + Math.sin(anim * 1.6) * 4, -10, 7, 4.4, 1.6); ctx.fill();
    ctx.fillStyle = '#f0d56f'; ctx.beginPath(); ctx.roundRect(1 - Math.cos(anim * 1.4) * 4, -6, 7, 4.4, 1.6); ctx.fill();
  } else if (type === 'dropTower') {
    shadow(ctx, 0, 2, 11, 4.5);
    ctx.fillStyle = '#5d84ac'; ctx.fillRect(-3.5, -40, 7, 35);
    ctx.fillStyle = '#87a8cb'; ctx.fillRect(-1, -40, 2, 35);
    ctx.fillStyle = '#d75353'; ctx.beginPath(); ctx.roundRect(-7, -13 - (Math.sin(anim * 1.8) * 10), 14, 6, 2); ctx.fill();
    ctx.fillStyle = '#f3f8ff'; ctx.fillRect(-2.5, -43, 5, 4);
  } else if (type === 'miniCoaster') {
    shadow(ctx, 0, 3, 30, 8, 0.3);
    const track = [[-24, 1], [-16, -10], [-8, -22], [2, -8], [11, -20], [22, -12], [29, -18]];
    strokePath(ctx, '#8e4032', 2.7, track);
    strokePath(ctx, '#d67b56', 1.1, track.map(([px, py]) => [px, py - 1.2]));
    for (let i = -22; i <= 22; i += 5) supportLine(ctx, i, -8 - Math.abs((i % 14) - 7), 4, '#cda26a');
    const train = -12 + Math.sin(anim * 1.55) * 16;
    ctx.fillStyle = '#4c82b8'; ctx.beginPath(); ctx.roundRect(train, -13 - Math.cos(anim * 1.55) * 3, 10, 5, 1.8); ctx.fill();
    ctx.fillStyle = '#d9f0ff'; ctx.fillRect(train + 1.4, -12 - Math.cos(anim * 1.55) * 3, 3.2, 1.4);
  } else if (type === 'woodCoaster') {
    shadow(ctx, 0, 4, 40, 10, 0.32);
    const track = [[-35, 2], [-27, -10], [-19, -28], [-7, -10], [5, -35], [18, -16], [33, -30]];
    strokePath(ctx, '#7d4330', 3.3, track);
    strokePath(ctx, '#bc7d52', 1.2, track.map(([px, py]) => [px, py - 1.4]));
    for (let i = -34; i <= 34; i += 4) supportLine(ctx, i, -11 - Math.abs(((i + 40) % 18) - 9) * 1.7, 5, '#c69a64');
    ctx.strokeStyle = 'rgba(100,64,38,0.45)';
    for (let i = -30; i <= 30; i += 8) { ctx.beginPath(); ctx.moveTo(i - 2, 1); ctx.lineTo(i + 2, -8); ctx.stroke(); }
    const carX = -8 + Math.sin(anim * 1.8) * 20;
    const carY = -17 - Math.cos(anim * 1.8) * 6;
    ctx.fillStyle = '#ce4f4a'; ctx.beginPath(); ctx.roundRect(carX, carY, 8, 4.4, 1.4); ctx.fill();
    ctx.fillStyle = '#ffe3c1'; ctx.fillRect(carX + 1.2, carY + 0.6, 2.2, 1.2);
  } else if (type === 'megaCoaster') {
    shadow(ctx, 0, 5, 46, 12, 0.34);
    const track = [[-40, 4], [-32, -8], [-23, -18], [-10, -42], [4, -16], [18, -38], [31, -24], [42, -36]];
    strokePath(ctx, '#35486d', 3.7, track);
    strokePath(ctx, '#8ea4d1', 1.2, track.map(([px, py]) => [px, py - 1.6]));
    for (let i = -38; i <= 38; i += 4) supportLine(ctx, i, -14 - Math.abs(((i + 30) % 20) - 10) * 2.2, 6, '#93a9c7');
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(-12, -43); ctx.lineTo(-2, -16); ctx.lineTo(11, -39); ctx.stroke();
    const carX = -14 + Math.sin(anim * 1.45) * 24;
    const carY = -23 - Math.cos(anim * 1.45) * 8;
    ctx.fillStyle = '#d94f52'; ctx.beginPath(); ctx.roundRect(carX, carY, 11, 4.5, 1.6); ctx.fill();
    ctx.fillStyle = '#f3f8ff'; ctx.fillRect(carX + 1.5, carY + 0.7, 3.5, 1.2);
  } else if (type === 'logFlume') {
    shadow(ctx, 0, 2, 28, 8, 0.24);
    strokePath(ctx, '#5a6f8c', 6, [[-20, -6], [-8, -16], [5, -10], [17, -20], [23, -12]]);
    strokePath(ctx, '#7ec7ea', 2.1, [[-20, -6], [-8, -16], [5, -10], [17, -20], [23, -12]]);
    ctx.fillStyle = '#6a5136'; ctx.beginPath(); ctx.roundRect(-7 + Math.sin(anim * 1.4) * 8, -10 - Math.cos(anim * 1.4) * 2, 11, 6, 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,245,255,0.42)'; ctx.beginPath(); ctx.arc(19, -21, 4 + Math.sin(anim * 2) * 0.8, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'teacups') {
    shadow(ctx, 0, 1.5, 12, 4);
    ctx.fillStyle = '#6c97c0'; ctx.beginPath(); ctx.ellipse(0, -6, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = i * ((Math.PI * 2) / 5) + anim * 1.5;
      ctx.fillStyle = i % 2 ? '#f2d47a' : '#f58fb3';
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 7, -6 + Math.sin(a) * 2.5, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 'restroom') {
    shadow(ctx, 0, 1.5, 11, 4);
    ctx.fillStyle = '#9ab4c7'; ctx.fillRect(-9, -16, 18, 12);
    ctx.fillStyle = '#5f7991'; ctx.fillRect(-10, -18, 20, 4);
    ctx.fillStyle = '#dce9f5'; ctx.fillRect(-3, -11, 6, 7);
  } else if (type === 'tree') {
    shadow(ctx, 0, 1, 9, 3.5);
    ctx.fillStyle = '#503823'; ctx.fillRect(-1.5, -10, 3, 8);
    drawCanopy(ctx, 0, -14, 7.8, 6.6, '#3d8740', 'rgba(139,216,126,0.32)');
    drawCanopy(ctx, -3.5, -11.5, 4.8, 4.2, '#2d7134', 'rgba(146,220,132,0.18)');
  } else if (type === 'bench') {
    shadow(ctx, 0, 1, 8, 2.3);
    ctx.fillStyle = '#6e4f29'; ctx.fillRect(-5.5, -5.2, 11, 2.7); ctx.fillRect(-4.2, -7.7, 8.4, 1.8);
    ctx.fillStyle = '#3b2a16'; ctx.fillRect(-4.7, -2.5, 1, 2.8); ctx.fillRect(3.7, -2.5, 1, 2.8);
  } else if (type === 'lamp') {
    shadow(ctx, 0, 1, 5, 2);
    ctx.fillStyle = '#4e5f74'; ctx.fillRect(-1, -13, 2, 10);
    ctx.fillStyle = '#f6e3a1'; ctx.beginPath(); ctx.roundRect(-2.2, -16, 4.4, 3.6, 1); ctx.fill();
    ctx.fillStyle = 'rgba(246,227,161,0.22)'; ctx.beginPath(); ctx.arc(0, -13, 6.5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'flowers') {
    shadow(ctx, 0, 1, 8, 2.2);
    ctx.fillStyle = '#5f9646'; ctx.fillRect(-5, -4, 10, 3);
    ['#e96a8d', '#f0d45f', '#8fd5ff', '#cda8ff'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(-4 + i * 2.7, -6 + (i % 2), 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'statue') {
    shadow(ctx, 0, 1, 7, 3.2);
    ctx.fillStyle = '#6a7487'; ctx.fillRect(-5, -5, 10, 3);
    ctx.fillStyle = '#8e9aad'; ctx.fillRect(-2.2, -14, 4.4, 10);
    ctx.fillStyle = '#c3ccd9'; ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7e0eb'; ctx.fillRect(-0.7, -12.5, 1.4, 5);
  } else if (type === 'hedge') {
    shadow(ctx, 0, 1, 10, 3);
    ctx.fillStyle = '#2f7a38'; ctx.beginPath(); ctx.roundRect(-7, -9, 14, 8, 3); ctx.fill();
    ctx.fillStyle = 'rgba(167,236,142,0.22)'; ctx.fillRect(-5, -8, 6, 2);
  } else if (type === 'fountain') {
    shadow(ctx, 0, 1.5, 10, 4, 0.2);
    ctx.fillStyle = '#91a2b6'; ctx.beginPath(); ctx.ellipse(0, -4, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6fc7ee'; ctx.beginPath(); ctx.ellipse(0, -5, 6, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(190,240,255,0.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-1.5, -15 + Math.sin(anim * 2) * 1.5, 0, -18); ctx.quadraticCurveTo(1.5, -15 + Math.sin(anim * 2) * 1.5, 0, -6); ctx.stroke();
  } else if (type === 'arch') {
    shadow(ctx, 0, 1, 11, 3);
    ctx.fillStyle = '#8e6c45'; ctx.fillRect(-6, -14, 2.2, 11); ctx.fillRect(3.8, -14, 2.2, 11);
    ctx.strokeStyle = '#d9c28b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -10, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#4e8e5b'; ctx.fillRect(-5, -14, 10, 2.5);
  } else if (type === 'kiosk') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#d1b89d', '#d46e52');
  } else if (type === 'stallBurger') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#d58d64', '#b24a3f', '#fff3d1');
  } else if (type === 'stallDrink') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#7eb7d9', '#376e9b', '#e7fbff');
  } else if (type === 'stallPizza') {
    shadow(ctx, 0, 1, 8, 3); booth(ctx, '#e0a26a', '#c25d3a', '#fff0cf');
  }
  ctx.restore();
};
