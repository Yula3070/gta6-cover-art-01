// Neon Vice Cover Studio — cover rendering engine.
//
// Pure canvas drawing: given a state (layout, grade, lettering, per-panel photos
// with pan/zoom) it paints a GTA-style multi-panel poster onto any 2D context.
// The editor preview, the PNG export and the screenshot scenes all call
// renderCover, so what you see is exactly what exports.

export const POST_SIZES = {
  square: { label: 'Square', w: 1080, h: 1080 },
  portrait: { label: 'Portrait', w: 1080, h: 1350 },
  landscape: { label: 'Landscape', w: 1920, h: 1080 },
  story: { label: 'Story', w: 1080, h: 1920 },
};

export const TITLE_FONT = '"NeonViceDisplay", "Arial Black", "Arial Narrow Bold", sans-serif';
// Font shorthand templates: style/weight come BEFORE the size, or the canvas
// silently keeps the previous font. {s} is replaced with the pixel size.
export const TITLE_FONT_TPL = '{s}px "NeonViceDisplay", "Arial Black", "Arial Narrow Bold", sans-serif';
export const SUB_FONT_TPL = 'italic 600 {s}px "NeonViceDisplay", "Arial Narrow", sans-serif';

// ---------------------------------------------------------------------------
// Layouts: each returns photo-panel rects (pixels) plus where the title lives.
// ---------------------------------------------------------------------------

function gridRects(W, H, cols, rows, gutter) {
  const rects = [];
  const cw = (W - gutter * (cols + 1)) / cols;
  const ch = (H - gutter * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({ x: gutter + c * (cw + gutter), y: gutter + r * (ch + gutter), w: cw, h: ch });
    }
  }
  return rects;
}

export const LAYOUTS = {
  grid9: {
    label: 'Cover grid',
    panels(W, H, g) {
      const all = gridRects(W, H, 3, 3, g);
      const titleCell = all[4];
      const photos = all.filter((_, i) => i !== 4);
      return { photos, title: { kind: 'block', rect: titleCell } };
    },
  },
  hero3: {
    label: 'Hero + 3',
    panels(W, H, g) {
      if (W >= H) {
        const heroW = (W - g * 3) * 0.62;
        const sideW = W - g * 3 - heroW;
        const sideH = (H - g * 4) / 3;
        const photos = [{ x: g, y: g, w: heroW, h: H - g * 2 }];
        for (let i = 0; i < 3; i++) {
          photos.push({ x: g * 2 + heroW, y: g + i * (sideH + g), w: sideW, h: sideH });
        }
        return { photos, title: { kind: 'overlay', rect: photos[0] } };
      }
      const heroH = (H - g * 3) * 0.58;
      const stripH = H - g * 3 - heroH;
      const cellW = (W - g * 4) / 3;
      const photos = [{ x: g, y: g, w: W - g * 2, h: heroH }];
      for (let i = 0; i < 3; i++) {
        photos.push({ x: g + i * (cellW + g), y: g * 2 + heroH, w: cellW, h: stripH });
      }
      return { photos, title: { kind: 'overlay', rect: photos[0] } };
    },
  },
  quad: {
    label: 'Four panels',
    panels(W, H, g) {
      const photos = gridRects(W, H, 2, 2, g);
      return { photos, title: { kind: 'band', rect: { x: 0, y: H * 0.72, w: W, h: H * 0.28 } } };
    },
  },
  strip: {
    label: 'Film strip',
    panels(W, H, g) {
      const photos = gridRects(W, H, 3, 1, g);
      return { photos, title: { kind: 'band', rect: { x: 0, y: H * 0.74, w: W, h: H * 0.26 } } };
    },
  },
  duo: {
    label: 'Two wide panels',
    panels(W, H, g) {
      const photos = gridRects(W, H, 1, 2, g);
      return { photos, title: { kind: 'band', rect: { x: 0, y: H * 0.70, w: W, h: H * 0.30 } } };
    },
  },
  bleed: {
    label: 'Full bleed',
    panels(W, H, g) {
      const photos = [{ x: g, y: g, w: W - g * 2, h: H - g * 2 }];
      return { photos, title: { kind: 'band', rect: { x: 0, y: H * 0.68, w: W, h: H * 0.32 } } };
    },
  },
};

export function panelCountFor(layout) {
  const probe = LAYOUTS[layout].panels(1080, 1080, 10);
  return probe.photos.length;
}

// ---------------------------------------------------------------------------
// Colour grades: a canvas filter for the photo plus a tinted overlay.
// ---------------------------------------------------------------------------

export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#ffb35c,#ff5e8a,#7b4dff)',
    filter: 'saturate(1.38) contrast(1.12) brightness(1.03)',
    stops: [[0, 'rgba(255,150,80,0.55)'], [0.55, 'rgba(255,80,140,0.38)'], [1, 'rgba(90,60,220,0.45)']],
    mode: 'overlay',
    vignette: 0.35,
  },
  neon: {
    label: 'Neon Night',
    swatch: 'linear-gradient(135deg,#37e0c8,#3d7bff,#ff3df0)',
    filter: 'saturate(1.55) contrast(1.18) brightness(0.98)',
    stops: [[0, 'rgba(40,230,210,0.42)'], [0.5, 'rgba(60,90,255,0.30)'], [1, 'rgba(255,50,220,0.42)']],
    mode: 'overlay',
    vignette: 0.5,
  },
  golden: {
    label: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#ffe9a8,#ffb35c,#e06a3b)',
    filter: 'sepia(0.28) saturate(1.25) contrast(1.06) brightness(1.05)',
    stops: [[0, 'rgba(255,205,120,0.40)'], [1, 'rgba(210,110,60,0.34)']],
    mode: 'soft-light',
    vignette: 0.3,
  },
  ink: {
    label: 'Poster Ink',
    swatch: 'linear-gradient(135deg,#f2f2f2,#8a8a8a,#1c1c1c)',
    filter: 'grayscale(0.82) contrast(1.38) brightness(1.02)',
    stops: [[0, 'rgba(255,255,255,0.10)'], [1, 'rgba(10,10,20,0.30)']],
    mode: 'overlay',
    vignette: 0.55,
  },
  candy: {
    label: 'Candy Pop',
    swatch: 'linear-gradient(135deg,#ffd1f2,#a8f0ff,#fff3a8)',
    filter: 'saturate(1.65) contrast(1.05) brightness(1.08)',
    stops: [[0, 'rgba(255,170,230,0.32)'], [0.5, 'rgba(150,220,255,0.26)'], [1, 'rgba(255,240,160,0.30)']],
    mode: 'soft-light',
    vignette: 0.22,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  const rnd = seededRandom(20261120);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

function drawPhotoCover(ctx, img, rect, panel) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (panel.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPlaceholder(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3a2a63');
  grad.addColorStop(0.55, '#8a3d7a');
  grad.addColorStop(1, '#e06a3b');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.07)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function applyGrade(ctx, rect, grade, strength) {
  if (strength <= 0) return;
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.4, rect.y + rect.h);
  for (const [at, color] of grade.stops) grad.addColorStop(at, color);
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.globalAlpha = strength;
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function applyVignette(ctx, W, H, amount) {
  if (amount <= 0) return;
  const r = Math.max(W, H) * 0.75;
  const grad = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(5,2,12,${amount})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function applyGrain(ctx, W, H, amount) {
  if (amount <= 0) return;
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = amount * 0.22;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Fit a single line of text into maxWidth by shrinking the font size.
function fitFontSize(ctx, text, fontTemplate, startSize, maxWidth) {
  let size = startSize;
  ctx.font = fontTemplate.replace('{s}', String(Math.round(size)));
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size *= 0.94;
    ctx.font = fontTemplate.replace('{s}', String(Math.round(size)));
  }
  return size;
}

function drawLettering(ctx, W, H, state, titleSpot) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;

  const scale = state.titleScale || 1;
  let cx;
  let cy;
  let maxWidth;
  let baseSize;

  if (titleSpot.kind === 'block') {
    const r = titleSpot.rect;
    // Title block: sunset panel behind the words, like the classic cover grid.
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, '#ffd76e');
    grad.addColorStop(0.45, '#ff7a5c');
    grad.addColorStop(0.75, '#ff4d8d');
    grad.addColorStop(1, '#7b4dff');
    ctx.fillStyle = grad;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    cx = r.x + r.w / 2;
    cy = r.y + r.h / 2;
    maxWidth = r.w * 0.9;
    baseSize = r.h * 0.34 * scale;
  } else if (titleSpot.kind === 'band') {
    const r = titleSpot.rect;
    const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    grad.addColorStop(0, 'rgba(8,4,18,0)');
    grad.addColorStop(0.45, 'rgba(8,4,18,0.55)');
    grad.addColorStop(1, 'rgba(8,4,18,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, r.y, W, r.h);
    cx = W / 2;
    cy = r.y + r.h * 0.58;
    maxWidth = W * 0.92;
    baseSize = Math.min(W, H) * 0.16 * scale;
  } else {
    // Overlay on the hero photo, lower-left with a soft scrim.
    const r = titleSpot.rect;
    const scrim = ctx.createLinearGradient(0, r.y + r.h * 0.55, 0, r.y + r.h);
    scrim.addColorStop(0, 'rgba(8,4,18,0)');
    scrim.addColorStop(1, 'rgba(8,4,18,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(r.x, r.y + r.h * 0.55, r.w, r.h * 0.45);
    cx = r.x + r.w / 2;
    cy = r.y + r.h * 0.84;
    maxWidth = r.w * 0.92;
    baseSize = Math.min(r.w, r.h) * 0.30 * scale;
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '1px'; } catch { /* older canvas: no spacing */ }

  if (title) {
    const size = fitFontSize(ctx, title, TITLE_FONT_TPL, baseSize, maxWidth);
    ctx.font = TITLE_FONT_TPL.replace('{s}', String(Math.round(size)));
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(10,2,20,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = 'rgba(16,6,28,0.92)';
    ctx.lineWidth = Math.max(2, size * 0.10);
    const titleY = cy - (subtitle ? size * 0.20 : 0);
    ctx.strokeText(title, cx, titleY);
    if (state.titleGradient) {
      const tg = ctx.createLinearGradient(cx, cy - size * 0.6, cx, cy + size * 0.6);
      tg.addColorStop(0, '#fff3b0');
      tg.addColorStop(0.35, '#ffd76e');
      tg.addColorStop(0.65, '#ff7a5c');
      tg.addColorStop(1, '#ff4d8d');
      ctx.fillStyle = tg;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillText(title, cx, titleY);

    if (subtitle) {
      const subSize = fitFontSize(ctx, subtitle, SUB_FONT_TPL, Math.max(12, size * 0.32), maxWidth);
      ctx.font = SUB_FONT_TPL.replace('{s}', String(Math.round(subSize)));
      try { ctx.letterSpacing = '3px'; } catch { /* ignore */ }
      ctx.shadowBlur = subSize * 0.3;
      ctx.lineWidth = Math.max(1.5, subSize * 0.12);
      const sy = cy + size * 0.50;
      ctx.strokeText(subtitle, cx, sy);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtitle, cx, sy);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function renderCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const gutter = Math.round(Math.min(W, H) * 0.012) + 4;
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid9;
  const { photos, title } = layout.panels(W, H, gutter);

  // Poster background behind the gutters.
  ctx.fillStyle = '#120b22';
  ctx.fillRect(0, 0, W, H);

  photos.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.img && panel.img.complete && panel.img.naturalWidth > 0) {
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, panel.img, rect, panel);
      ctx.filter = 'none';
      applyGrade(ctx, rect, grade, state.gradeStrength);
    } else {
      drawPlaceholder(ctx, rect, i);
    }
    ctx.restore();

    // Panel keyline.
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rect.x + 0.75, rect.y + 0.75, rect.w - 1.5, rect.h - 1.5);
  });

  applyVignette(ctx, W, H, grade.vignette * (0.4 + 0.6 * state.gradeStrength));
  drawLettering(ctx, W, H, state, title);
  applyGrain(ctx, W, H, state.grain);

  if (state.frame) {
    const bw = Math.max(6, Math.min(W, H) * 0.012);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
    ctx.strokeStyle = 'rgba(10,5,20,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bw + 2, bw + 2, W - bw * 2 - 4, H - bw * 2 - 4);
  }

  if (state.showSelection && photos[state.selected]) {
    const r = photos[state.selected];
    ctx.save();
    ctx.strokeStyle = '#37e0c8';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }

  return { photos, title };
}

export function defaultState() {
  return {
    layout: 'grid9',
    grade: 'vice',
    gradeStrength: 0.8,
    grain: 0.35,
    size: 'square',
    title: 'NEON VICE',
    subtitle: 'a cover story',
    titleScale: 1,
    titleGradient: true,
    frame: true,
    panels: [],
    selected: 0,
    showSelection: true,
  };
}

export function ensurePanels(state) {
  const count = panelCountFor(state.layout);
  while (state.panels.length < count) {
    state.panels.push({ img: null, zoom: 1, ox: 0, oy: 0 });
  }
  return count;
}
