// Procedural demo "photos": little sunset scenes painted on offscreen
// canvases, so the studio opens with a finished cover before the visitor
// adds a photo of their own. Deterministic: a seeded generator makes the
// same scene every load, and nothing is fetched.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawSun(ctx, x, y, r) {
  // Painted on a sprite so the retro slats are see-through to the sky
  // already on the scene, instead of erasing it.
  const sprite = makeCanvas(Math.ceil(r * 2), Math.ceil(r * 2));
  const sctx = sprite.getContext('2d');
  const g = sctx.createLinearGradient(0, 0, 0, r * 2);
  g.addColorStop(0, '#fff3b0');
  g.addColorStop(0.6, '#ffb35c');
  g.addColorStop(1, '#ff5e78');
  sctx.beginPath();
  sctx.arc(r, r, r, 0, Math.PI * 2);
  sctx.clip();
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, r * 2, r * 2);
  sctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    sctx.fillRect(0, r + r * (0.15 + i * 0.2), r * 2, r * (0.035 + i * 0.015));
  }
  ctx.drawImage(sprite, x - r, y - r);
}

function drawPalm(ctx, x, y, height, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * height * 0.35;
  const topY = y - height;
  ctx.lineWidth = Math.max(3, height * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * height * 0.1, y - height * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, height * 0.022);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i * 0.14) + lean * 0.3;
    const len = height * (0.42 + (i % 3) * 0.06);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY - Math.sin(a) * len * 0.45,
      topX + Math.cos(a) * len, topY - Math.sin(a) * len * 0.25 + len * 0.22,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, w, horizon, seed, color, litColor) {
  const rand = rng(seed);
  ctx.fillStyle = color;
  let x = -10;
  while (x < w + 10) {
    const bw = 40 + rand() * 110;
    const bh = horizon * (0.18 + rand() * 0.5);
    ctx.fillRect(x, horizon - bh, bw, bh);
    if (rand() > 0.55) ctx.fillRect(x + bw * 0.3, horizon - bh - 14, bw * 0.16, 14);
    // Lit windows.
    ctx.fillStyle = litColor;
    const cols = Math.max(2, Math.floor(bw / 22));
    const rows = Math.max(2, Math.floor(bh / 26));
    for (let cxi = 0; cxi < cols; cxi++) {
      for (let ryi = 0; ryi < rows; ryi++) {
        if (rand() > 0.62) {
          ctx.fillRect(x + 8 + cxi * 20, horizon - bh + 10 + ryi * 24, 7, 10);
        }
      }
    }
    ctx.fillStyle = color;
    x += bw + 6 + rand() * 26;
  }
}

function drawSea(ctx, w, y, h, seed) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#ff9e7a');
  g.addColorStop(0.25, '#c94f8e');
  g.addColorStop(1, '#1c2a6e');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, h);
  const rand = rng(seed);
  ctx.fillStyle = 'rgba(255, 230, 180, 0.5)';
  for (let i = 0; i < 90; i++) {
    const sx = rand() * w;
    const sy = y + rand() * h * 0.7;
    const sw = 8 + rand() * 42;
    ctx.fillRect(sx, sy, sw, 2);
  }
}

export function sceneSunsetSkyline() {
  const w = 1200; const h = 900;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#2b1055'], [0.35, '#7597de'], [0.62, '#ff7a59'], [0.8, '#ffb35c'], [1, '#ffd76e']]);
  drawSun(ctx, w * 0.52, h * 0.52, 150);
  drawSkyline(ctx, w, h * 0.78, 42, 'rgba(26, 10, 48, 0.92)', 'rgba(255, 214, 110, 0.9)');
  drawSea(ctx, w, h * 0.78, h * 0.22, 7);
  drawPalm(ctx, w * 0.10, h * 0.86, 300, 0.7, '#14082b');
  drawPalm(ctx, w * 0.90, h * 0.88, 340, -0.6, '#14082b');
  return c;
}

export function sceneNeonBoulevard() {
  const w = 1200; const h = 900;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#0a0a2e'], [0.5, '#3d1a78'], [0.8, '#a4137c'], [1, '#ff5e78']]);
  const horizon = h * 0.62;
  // Street in perspective.
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, horizon);
  ctx.lineTo(w * 0.58, horizon);
  ctx.lineTo(w * 0.98, h);
  ctx.lineTo(w * 0.02, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 110, 0.85)';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 30]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, horizon);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  // Neon signs as glowing blocks on both sides.
  const rand = rng(99);
  const neon = ['#ff4fa3', '#35e0ff', '#ffd76e', '#7CFC9B', '#ff7a59'];
  for (let i = 0; i < 9; i++) {
    const side = i % 2 === 0 ? 0 : 1;
    const t = i / 9;
    const y = horizon + t * (h - horizon) * 0.9;
    const spread = 0.06 + t * 0.34;
    const x = side === 0 ? w * (0.5 - spread) : w * (0.5 + spread);
    const bw = 30 + t * 120;
    const bh = 16 + t * 46;
    ctx.save();
    ctx.shadowColor = neon[i % neon.length];
    ctx.shadowBlur = 22;
    ctx.fillStyle = neon[i % neon.length];
    ctx.fillRect(side === 0 ? x - bw : x, y - bh, bw, bh);
    ctx.restore();
    ctx.fillStyle = 'rgba(10, 4, 24, 0.75)';
    ctx.fillRect(side === 0 ? x - bw : x, y, bw, 6 + t * 16);
  }
  drawSkyline(ctx, w, horizon, 1234, 'rgba(16, 6, 34, 0.95)', 'rgba(140, 230, 255, 0.85)');
  drawPalm(ctx, w * 0.06, h * 0.98, 380, 0.5, '#0a0418');
  drawPalm(ctx, w * 0.95, h * 0.98, 420, -0.5, '#0a0418');
  return c;
}

export function scenePierDusk() {
  const w = 1200; const h = 900;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#3a2a6e'], [0.45, '#b04a8e'], [0.7, '#ff8a5c'], [1, '#ffd76e']]);
  drawSun(ctx, w * 0.5, h * 0.55, 120);
  drawSea(ctx, w, h * 0.62, h * 0.38, 31);
  // Pier planks running to the horizon.
  ctx.fillStyle = '#241031';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.62);
  ctx.lineTo(w * 0.56, h * 0.62);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.22, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 120, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const y = h * 0.62 + t * h * 0.38;
    const half = 0.06 + t * 0.22;
    ctx.beginPath();
    ctx.moveTo(w * (0.5 - half), y);
    ctx.lineTo(w * (0.5 + half), y);
    ctx.stroke();
  }
  // Lamp posts with warm globes.
  for (const [lx, ly, s] of [[0.40, 0.70, 0.7], [0.60, 0.70, 0.7], [0.33, 0.84, 1.1], [0.67, 0.84, 1.1]]) {
    ctx.strokeStyle = '#180a26';
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(w * lx, h * ly);
    ctx.lineTo(w * lx, h * ly - 90 * s);
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = '#ffd76e';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(w * lx, h * ly - 100 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return c;
}

export function sceneBeachDay() {
  const w = 1200; const h = 900;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#7ad0ff'], [0.45, '#a8e6ff'], [0.62, '#ffe9a8'], [1, '#ffd76e']]);
  drawSun(ctx, w * 0.78, h * 0.20, 80);
  // Sea band with foam lines.
  const sea = ctx.createLinearGradient(0, h * 0.52, 0, h * 0.72);
  sea.addColorStop(0, '#2fb7c9');
  sea.addColorStop(1, '#7fe3d8');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.52, w, h * 0.20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  const rand = rng(5);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const y = h * (0.56 + i * 0.045);
    for (let x = 0; x <= w; x += 30) {
      const yy = y + Math.sin(x * 0.02 + i * 1.7) * 5 + rand() * 2;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Sand with umbrellas.
  ctx.fillStyle = '#f7dc9a';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  const spots = [[0.18, 0.82, '#ff4fa3'], [0.45, 0.88, '#35e0ff'], [0.72, 0.80, '#ffb35c'], [0.88, 0.90, '#7CFC9B']];
  for (const [ux, uy, color] of spots) {
    const x = w * ux; const y = h * uy;
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14, y - 84);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 14 - 78, y - 78);
    ctx.quadraticCurveTo(x + 14, y - 128, x + 14 + 78, y - 78);
    ctx.quadraticCurveTo(x + 14, y - 96, x + 14 - 78, y - 78);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(x - 46, y + 6, 92, 14);
  }
  drawPalm(ctx, w * 0.05, h * 0.96, 330, 0.8, '#2e5d3a');
  drawPalm(ctx, w * 0.97, h * 0.95, 300, -0.7, '#2e5d3a');
  return c;
}

// The four built-in demo photos, in panel order.
export function demoPhotos() {
  return [sceneSunsetSkyline(), sceneNeonBoulevard(), scenePierDusk(), sceneBeachDay()];
}
