// Leonida Cover Studio — the poster engine.
//
// One user photo becomes a GTA-style cover: a slanted multi-panel collage in
// which every panel re-crops the same photo around a locally detected face
// focal point, each panel wearing a duo-tone sunset/neon grade and an optional
// Poster Ink (painted) finish. A hero panel pops out of the grid with a white
// cut-out stroke and a drop shadow. The title is retro chrome with a dark
// outline and a 3D extrusion, over a halftone block, with a glowing neon
// script subtitle; cast tags, callouts, a round studio seal and a film-poster
// billing block finish the sheet. Everything is drawn on 2D canvas, offline.

export const GRADES = [
  { id: 'sunset', name: 'Sunset Drive', shadow: [38, 12, 54], mid: [214, 72, 110], high: [255, 214, 150] },
  { id: 'neon', name: 'Neon Vice', shadow: [10, 16, 54], mid: [255, 64, 170], high: [140, 240, 255] },
  { id: 'palm', name: 'Palm Heat', shadow: [24, 38, 20], mid: [240, 150, 60], high: [255, 240, 190] },
  { id: 'keys', name: 'Midnight Keys', shadow: [8, 10, 30], mid: [70, 110, 200], high: [230, 240, 255] },
  { id: 'golden', name: 'Golden Hour', shadow: [52, 26, 10], mid: [232, 140, 52], high: [255, 236, 180] },
  { id: 'bubble', name: 'Bubblegum', shadow: [64, 16, 74], mid: [255, 120, 200], high: [255, 245, 250] },
  { id: 'teal', name: 'Teal Noir', shadow: [6, 26, 30], mid: [30, 150, 160], high: [220, 250, 240] },
  { id: 'mono', name: 'Mono Ink', shadow: [12, 12, 16], mid: [120, 120, 130], high: [250, 250, 252] },
];

const CAST_TAGS = ['THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE WHEELMAN', 'THE GHOST', 'THE DEALER', 'THE QUEEN'];
const CALLOUTS = ['EST. 2026', 'LEONIDA BAY', 'NO REFUNDS', 'ONE LAST JOB', 'PALM RADIO 98.6', 'CASH ONLY', 'SUNSET CREW'];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Deterministic jitter per panel so shuffling feels designed, not random soup.
function seeded(seed) {
  let s = seed * 2654435761 % 4294967296;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

/**
 * Face-aware focal point: scores a downscaled copy of the photo for skin-tone
 * likelihood plus warm saturation, and returns the weighted centroid in
 * normalized [0..1] coordinates. Falls back to the brightest warm region,
 * then to the centre. Runs entirely on-device.
 */
export function findFocalPoint(photo) {
  if (!photo || !photo.naturalWidth) return { x: 0.5, y: 0.42, found: false };
  const N = 72;
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(photo, 0, 0, N, N);
  let data;
  try { data = ctx.getImageData(0, 0, N, N).data; } catch { return { x: 0.5, y: 0.42, found: false }; }
  const lumAt = (x, y) => {
    const i = (clamp(y, 0, N - 1) * N + clamp(x, 0, N - 1)) * 4;
    return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  };
  let sx = 0, sy = 0, sw = 0, best = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Skin-tone window (broad, works across tones in warm sunset light).
      const skin = (r > 60 && r > g && g > b && r - b > 18 && r - b < 170 && Math.abs(r - g) < 90) ? 1 : 0;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const sat = mx ? (mx - mn) / mx : 0;
      const warm = clamp((r - b) / 120, 0, 1);
      const lum = lumAt(x, y);
      // Local contrast: eyes/hair/sunglasses make a face busier than a bare
      // shoulder, so contrast pulls the focal point off big flat skin areas.
      const contrast = Math.abs(lum - lumAt(x - 2, y)) + Math.abs(lum - lumAt(x + 2, y))
        + Math.abs(lum - lumAt(x, y - 2)) + Math.abs(lum - lumAt(x, y + 2));
      // Faces sit in the upper-middle band more often than not: gentle prior.
      const prior = Math.max(0.2, 1 - Math.abs(y / N - 0.32) * 1.1);
      const wgt = (skin * (0.8 + contrast * 4.2) + sat * warm * 0.6 + contrast * 0.9) * (0.35 + lum) * prior;
      if (wgt > 0.05) { sx += x * wgt; sy += y * wgt; sw += wgt; if (wgt > best) best = wgt; }
    }
  }
  if (sw < 0.5) return { x: 0.5, y: 0.42, found: false };
  return { x: clamp(sx / sw / N, 0.08, 0.92), y: clamp(sy / sw / N, 0.08, 0.9), found: best > 0.9 };
}

/** Maps luminance through a 3-stop duo-tone ramp; optional posterize for Ink. */
function gradePixels(img, grade, ink) {
  const d = img.data;
  const [sr, sg, sb] = grade.shadow, [mr, mg, mb] = grade.mid, [hr, hg, hb] = grade.high;
  for (let i = 0; i < d.length; i += 4) {
    let lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    if (ink) lum = Math.round(lum * 5) / 5; // posterize: flat painted bands
    let r, g, b;
    if (lum < 0.5) { const t = lum * 2; r = lerp(sr, mr, t); g = lerp(sg, mg, t); b = lerp(sb, mb, t); }
    else { const t = (lum - 0.5) * 2; r = lerp(mr, hr, t); g = lerp(mg, hg, t); b = lerp(mb, hb, t); }
    if (ink) { // keep a whisper of the original colour so it still reads as a photo
      r = r * 0.82 + d[i] * 0.18; g = g * 0.82 + d[i + 1] * 0.18; b = b * 0.82 + d[i + 2] * 0.18;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  return img;
}

const panelCache = new Map();

/**
 * Renders one graded panel tile (photo cropped around the focal point) to an
 * offscreen canvas, cached by photo+grade+ink+zoom so redraws stay cheap.
 */
function panelTile(photo, grade, ink, zoom, focus, variant) {
  const key = `${photo ? photo.src.slice(-24) : 'none'}|${grade.id}|${ink}|${zoom.toFixed(2)}|${variant}`;
  if (panelCache.has(key)) return panelCache.get(key);
  const W = 640, H = 800;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${grade.mid})`); g.addColorStop(1, `rgb(${grade.shadow})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (photo && photo.naturalWidth) {
    const rnd = seeded(variant * 7 + 3);
    const fx = clamp(focus.x + (rnd() - 0.5) * 0.16, 0.05, 0.95);
    const fy = clamp(focus.y + (rnd() - 0.5) * 0.12, 0.05, 0.95);
    const scale = Math.max(W / photo.naturalWidth, H / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * scale, ph = photo.naturalHeight * scale;
    let dx = W / 2 - fx * pw, dy = H / 2 - fy * ph;
    dx = clamp(dx, W - pw, 0); dy = clamp(dy, H - ph, 0);
    if (ink) { // painted softness: draw small, then scale back up smooth
      const small = document.createElement('canvas');
      small.width = 160; small.height = 200;
      const sctx = small.getContext('2d');
      sctx.drawImage(photo, dx / 4, dy / 4, pw / 4, ph / 4);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(small, 0, 0, W, H);
    } else {
      ctx.drawImage(photo, dx, dy, pw, ph);
    }
    const img = ctx.getImageData(0, 0, W, H);
    ctx.putImageData(gradePixels(img, grade, ink), 0, 0);
    // Sky sheen so panels feel lit by the same sunset.
    const sheen = ctx.createLinearGradient(0, 0, 0, H);
    sheen.addColorStop(0, 'rgba(255,240,200,0.20)');
    sheen.addColorStop(0.45, 'rgba(255,240,200,0)');
    sheen.addColorStop(1, 'rgba(10,4,24,0.28)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, W, H);
  }
  if (panelCache.size > 40) panelCache.clear();
  panelCache.set(key, c);
  return c;
}

// ---- Panel geometry (normalized 0..1 space, so any export size matches) ----
// Each panel: centre, size, slant (parallelogram shear), zoom, hero flag.
const LAYOUTS = {
  seven: [
    { cx: 0.17, cy: 0.30, w: 0.30, h: 0.52, slant: 0.10, zoom: 1.0 },
    { cx: 0.50, cy: 0.26, w: 0.32, h: 0.44, slant: -0.08, zoom: 1.1 },
    { cx: 0.83, cy: 0.30, w: 0.30, h: 0.52, slant: 0.10, zoom: 1.0 },
    { cx: 0.50, cy: 0.55, w: 0.40, h: 0.46, slant: 0.06, zoom: 1.22, hero: true },
    { cx: 0.16, cy: 0.72, w: 0.28, h: 0.36, slant: -0.10, zoom: 1.05 },
    { cx: 0.84, cy: 0.72, w: 0.28, h: 0.36, slant: 0.10, zoom: 1.05 },
    { cx: 0.50, cy: 0.82, w: 0.34, h: 0.24, slant: -0.06, zoom: 1.15 },
  ],
  hero: [
    { cx: 0.20, cy: 0.34, w: 0.34, h: 0.60, slant: 0.12, zoom: 1.05 },
    { cx: 0.80, cy: 0.34, w: 0.34, h: 0.60, slant: -0.12, zoom: 1.05 },
    { cx: 0.50, cy: 0.48, w: 0.52, h: 0.62, slant: 0.05, zoom: 1.3, hero: true },
    { cx: 0.22, cy: 0.78, w: 0.36, h: 0.30, slant: -0.08, zoom: 1.1 },
    { cx: 0.78, cy: 0.78, w: 0.36, h: 0.30, slant: 0.08, zoom: 1.1 },
  ],
  triptych: [
    { cx: 0.18, cy: 0.46, w: 0.30, h: 0.72, slant: 0.07, zoom: 1.0 },
    { cx: 0.50, cy: 0.46, w: 0.32, h: 0.72, slant: 0.07, zoom: 1.2, hero: true },
    { cx: 0.82, cy: 0.46, w: 0.30, h: 0.72, slant: 0.07, zoom: 1.0 },
  ],
};

function panelPath(ctx, p, W, H, grow = 0) {
  const w = p.w * W + grow * 2, h = p.h * H + grow * 2;
  const cx = p.cx * W, cy = p.cy * H, s = p.slant * h;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + s / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2 + s / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2 - s / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2 - s / 2, cy + h / 2);
  ctx.closePath();
}

function drawPanel(ctx, tile, p, W, H, hero) {
  const w = p.w * W, h = p.h * H, cx = p.cx * W, cy = p.cy * H;
  ctx.save();
  if (hero) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W * 0.03; ctx.shadowOffsetY = H * 0.012; }
  panelPath(ctx, p, W, H);
  ctx.fillStyle = '#12081f';
  ctx.fill();
  ctx.clip();
  // Cover-fit the tile into the (slanted) panel box.
  const scale = Math.max(w / tile.width, h / tile.height) * 1.06;
  const tw = tile.width * scale, th = tile.height * scale;
  ctx.drawImage(tile, cx - tw / 2, cy - th / 2, tw, th);
  ctx.restore();
  // Cut-out stroke: heroes get a fat white sticker outline, others a hairline.
  panelPath(ctx, p, W, H);
  ctx.strokeStyle = hero ? '#ffffff' : 'rgba(255,255,255,0.75)';
  ctx.lineWidth = hero ? Math.max(5, W * 0.009) : Math.max(2, W * 0.003);
  ctx.stroke();
  if (hero) { // inner keyline so the pop-out reads as a pasted cut-out
    panelPath(ctx, p, W, H, -W * 0.012);
    ctx.strokeStyle = 'rgba(18,8,31,0.85)';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.stroke();
  }
}

function drawTag(ctx, text, x, y, size, angle, fill, ink) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.font = `700 ${size}px "Noto Display Condensed", sans-serif`;
  const w = ctx.measureText(text).width + size * 1.1;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -size * 0.72); ctx.lineTo(w / 2, -size * 0.72);
  ctx.lineTo(w / 2 - size * 0.35, size * 0.72); ctx.lineTo(-w / 2 - size * 0.35, size * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, -size * 0.17, size * 0.05);
  ctx.restore();
}

function halftoneBlock(ctx, x, y, w, h, dot, color) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = color;
  const step = dot * 2.6;
  for (let ry = y + dot; ry < y + h; ry += step) {
    const off = ((ry / step) % 2) * step * 0.5;
    for (let rx = x + dot + off; rx < x + w; rx += step) {
      ctx.beginPath(); ctx.arc(rx, ry, dot, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function chromeTitle(ctx, text, cx, cy, maxW, baseSize) {
  const clean = (text || 'LEONIDA NIGHTS').trim().toUpperCase() || 'LEONIDA NIGHTS';
  let size = baseSize;
  const setFont = (s) => { ctx.font = `900 ${s}px "Noto Display Condensed", sans-serif`; };
  setFont(size);
  while (ctx.measureText(clean).width > maxW && size > 14) { size -= 3; setFont(size); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // 3D extrusion: stacked dark copies stepping down-right.
  const depth = Math.max(4, size * 0.14);
  ctx.fillStyle = '#1b0b2e';
  for (let i = depth; i >= 1; i--) ctx.fillText(clean, cx + i * 0.55, cy + i * 0.8);
  // Chrome face: hard horizontal bands, sunset into sky.
  const grad = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.28, '#ffe9a8');
  grad.addColorStop(0.46, '#ff9d5c'); grad.addColorStop(0.52, '#fff6e8');
  grad.addColorStop(0.62, '#ff5ca8'); grad.addColorStop(0.85, '#8a5cff');
  grad.addColorStop(1, '#7be7ff');
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = '#140722';
  ctx.strokeText(clean, cx, cy);
  ctx.fillStyle = grad;
  ctx.fillText(clean, cx, cy);
  // Top shine pass.
  ctx.save();
  ctx.beginPath(); ctx.rect(cx - maxW / 2, cy - size * 0.55, maxW, size * 0.34); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(clean, cx, cy);
  ctx.restore();
  return size;
}

function neonSubtitle(ctx, text, cx, cy, size) {
  const clean = (text || '').trim();
  if (!clean) return;
  ctx.save();
  ctx.font = `italic 700 ${size}px "Noto Display Condensed", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff5ca8'; ctx.shadowBlur = size * 0.9;
  ctx.fillStyle = '#ffd7ec';
  ctx.fillText(clean, cx, cy);
  ctx.shadowColor = '#40e0ff'; ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clean, cx, cy);
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(-0.22);
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#5c3d00';
  ctx.font = `900 ${r * 0.34}px "Noto Display Condensed", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, -r * 0.18);
  ctx.font = `900 ${r * 0.2}px "Noto Display Condensed", sans-serif`;
  ctx.fillText('OFFICIAL', 0, r * 0.16);
  ctx.font = `700 ${r * 0.13}px "Noto Display Condensed", sans-serif`;
  ctx.fillText('COVER · 2026', 0, r * 0.4);
  // Ring text.
  const ring = 'LEONIDA COVER STUDIO · SUNSET HEIST · ';
  ctx.font = `700 ${r * 0.15}px "Noto Display Condensed", sans-serif`;
  for (let i = 0; i < ring.length; i++) {
    const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(a); ctx.translate(0, -r * 0.76);
    ctx.fillText(ring[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function billingBlock(ctx, text, W, H) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  const size = Math.max(9, W * 0.0135);
  ctx.save();
  ctx.font = `400 ${size}px "Noto Display Condensed", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // Wrap into up to 3 centred lines, poster-credit style.
  const words = clean.split(/\s+/);
  const lines = []; let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > W * 0.9 && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, W / 2, H - H * 0.055 + i * size * 1.35));
  ctx.restore();
}

function grainVignette(ctx, W, H) {
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,2,18,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const n = document.createElement('canvas');
  n.width = 180; n.height = 180;
  const nctx = n.getContext('2d');
  const img = nctx.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(n, 'repeat');
  ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/**
 * Draws the full cover onto `canvas` at its own size.
 * state: { photo, title, subtitle, billing, grade, layout, ink, tags, grain, seed, focus }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = state.grade || GRADES[0];
  const focus = state.focus || { x: 0.5, y: 0.42 };
  const seed = state.seed || 1;

  // Backdrop: deep sunset wash in the grade's own colours.
  const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bg.addColorStop(0, `rgb(${grade.shadow})`);
  bg.addColorStop(0.55, `rgb(${grade.mid})`);
  bg.addColorStop(1, `rgb(${grade.shadow})`);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  halftoneBlock(ctx, 0, 0, W, H * 0.16, Math.max(2, W * 0.004), 'rgba(255,255,255,0.16)');

  const panels = LAYOUTS[state.layout] || LAYOUTS.seven;
  const ordered = [...panels].sort((a, b) => (a.hero ? 1 : 0) - (b.hero ? 1 : 0));
  ordered.forEach((p) => {
    const idx = panels.indexOf(p);
    const tile = panelTile(state.photo, grade, state.ink, p.zoom, focus, idx + seed * 13);
    drawPanel(ctx, tile, p, W, H, !!p.hero);
  });

  if (state.tags) {
    const tagSize = Math.max(11, W * 0.02);
    panels.forEach((p, i) => {
      if (p.hero) return;
      // Keep tags clear of the billing block (bottom) and the seal (bottom-right).
      const tx = (p.cx > 0.7 && p.cy > 0.6 ? p.cx - 0.07 : p.cx) * W;
      drawTag(ctx, CAST_TAGS[(i + seed) % CAST_TAGS.length], tx, (p.cy + p.h / 2 - 0.045) * H, tagSize, (i % 2 ? -1 : 1) * 0.06, i % 2 ? '#7be7ff' : '#ffd94d', '#1b0b2e');
    });
    const hero = panels.find((p) => p.hero);
    if (hero) drawTag(ctx, '★ THE STAR ★', hero.cx * W, (hero.cy - hero.h / 2 + 0.015) * H, tagSize * 1.15, -0.05, '#ff5ca8', '#ffffff');
    drawTag(ctx, CALLOUTS[seed % CALLOUTS.length], W * 0.14, H * 0.055, tagSize * 0.9, -0.08, '#ffffff', '#1b0b2e');
    drawTag(ctx, CALLOUTS[(seed + 3) % CALLOUTS.length], W * 0.86, H * 0.055, tagSize * 0.9, 0.08, '#1b0b2e', '#ffe9a8');
  }

  // Title block: halftone band + chrome title + neon subtitle.
  const titleY = H * 0.145;
  halftoneBlock(ctx, W * 0.04, titleY - H * 0.075, W * 0.92, H * 0.15, Math.max(2, W * 0.0035), 'rgba(20,7,34,0.35)');
  const used = chromeTitle(ctx, state.title, W / 2, titleY, W * 0.92, Math.min(W, H) * 0.115);
  neonSubtitle(ctx, state.subtitle, W / 2, titleY + used * 0.78, Math.max(16, used * 0.42));

  drawSeal(ctx, W * 0.885, H * 0.845, Math.min(W, H) * 0.085);
  billingBlock(ctx, state.billing, W, H);
  if (state.grain) grainVignette(ctx, W, H);
}
