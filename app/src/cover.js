// Vice Coast Cover Studio — the cover engine.
//
// Draws a multi-panel GTA-poster-style cover on a 2D canvas: the photo(s) fill
// the layout's panels (each with its own crop and position), a colour grade
// washes over everything, and bold sunset-gradient lettering plus a neon
// script subtitle and a small "VICE COAST" badge finish the poster.
// No Rockstar logo, artwork or font anywhere: lettering is the system stack.

/** The six panel layouts. Each returns panels as { x, y, w, h, skew } fractions of the canvas. */
export const LAYOUTS = {
  hero3: {
    name: 'Hero + 3',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.62, h: 1, skew: 0 },
        { x: 0.62, y: 0, w: 0.38, h: 0.34, skew: 0 },
        { x: 0.62, y: 0.34, w: 0.38, h: 0.32, skew: 0 },
        { x: 0.62, y: 0.66, w: 0.38, h: 0.34, skew: 0 },
      ];
    },
  },
  grid: {
    name: 'Grid 2 x 2',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5, skew: 0 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5, skew: 0 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5, skew: 0 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5, skew: 0 },
      ];
    },
  },
  fullbleed: {
    name: 'Full-bleed',
    panels(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1, skew: 0 }];
    },
  },
  diagonal: {
    name: 'Diagonal slash',
    panels(w, h) {
      // Three tall panels whose shared edges slant, like a slashed poster.
      return [
        { x: 0, y: 0, w: 0.38, h: 1, skew: 0.06 },
        { x: 0.33, y: 0, w: 0.38, h: 1, skew: 0.06 },
        { x: 0.66, y: 0, w: 0.34, h: 1, skew: 0.06 },
      ];
    },
  },
  comic: {
    name: 'Comic strip',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 1, h: 0.42, skew: 0 },
        { x: 0, y: 0.42, w: 1, h: 0.3, skew: 0 },
        { x: 0, y: 0.72, w: 1, h: 0.28, skew: 0 },
      ];
    },
  },
  mosaic: {
    name: 'Mosaic',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.27, h: 0.5, skew: 0 },
        { x: 0, y: 0.5, w: 0.27, h: 0.5, skew: 0 },
        { x: 0.27, y: 0, w: 0.46, h: 1, skew: 0 },
        { x: 0.73, y: 0, w: 0.27, h: 0.5, skew: 0 },
        { x: 0.73, y: 0.5, w: 0.27, h: 0.5, skew: 0 },
      ];
    },
  },
};

/** The five colour grades. Each is a wash of gradients plus a vignette. */
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    top: 'rgba(255, 122, 26, 0.20)',
    bottom: 'rgba(255, 46, 136, 0.42)',
    wash: 'rgba(255, 190, 80, 0.10)',
    mode: 'overlay',
    letterFrom: '#ffe259',
    letterTo: '#ff2e88',
    subtitle: '#ff5db1',
  },
  neon: {
    name: 'Neon Night',
    top: 'rgba(255, 46, 136, 0.26)',
    bottom: 'rgba(0, 229, 255, 0.30)',
    wash: 'rgba(120, 40, 220, 0.16)',
    mode: 'overlay',
    letterFrom: '#7df9ff',
    letterTo: '#ff2e88',
    subtitle: '#00e5ff',
  },
  gold: {
    name: 'Palm Gold',
    top: 'rgba(255, 210, 63, 0.22)',
    bottom: 'rgba(120, 72, 0, 0.38)',
    wash: 'rgba(255, 170, 40, 0.12)',
    mode: 'soft-light',
    letterFrom: '#fff3b0',
    letterTo: '#ff9a1f',
    subtitle: '#ffd23f',
  },
  noir: {
    name: 'Mono Noir',
    top: 'rgba(255, 255, 255, 0.08)',
    bottom: 'rgba(0, 0, 0, 0.45)',
    wash: 'rgba(0, 0, 0, 0.22)',
    mode: 'multiply',
    letterFrom: '#ffffff',
    letterTo: '#c9c9c9',
    subtitle: '#ffffff',
  },
  haze: {
    name: 'Heat Haze',
    top: 'rgba(255, 240, 200, 0.18)',
    bottom: 'rgba(255, 120, 60, 0.30)',
    wash: 'rgba(255, 120, 120, 0.10)',
    mode: 'soft-light',
    letterFrom: '#ffe9a8',
    letterTo: '#ff5e62',
    subtitle: '#ff8fa3',
  },
};

/** The three post sizes the app exports. */
export const SIZES = {
  square: { name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** A small deterministic PRNG so the grain looks the same on every render. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws one photo into one panel rect, cover-fit, with the panel's crop:
 * zoom >= 1 magnifies, cx/cy (0..1) pick the focal point inside the photo.
 */
export function drawPanelPhoto(ctx, photo, rect, crop) {
  if (!photo) return;
  const pw = photo.naturalWidth || photo.width;
  const ph = photo.naturalHeight || photo.height;
  const zoom = crop?.zoom ?? 1;
  const cx = crop?.cx ?? 0.5;
  const cy = crop?.cy ?? 0.5;
  const base = Math.max(rect.w / pw, rect.h / ph);
  const scale = base * zoom;
  const dw = pw * scale;
  const dh = ph * scale;
  // The focal point stays put while zooming: offset from the panel centre.
  const ox = rect.x + (rect.w - dw) / 2 + (0.5 - cx) * (dw - rect.w);
  const oy = rect.y + (rect.h - dh) / 2 + (0.5 - cy) * (dh - rect.h);
  ctx.drawImage(photo, ox, oy, dw, dh);
}

/** Clips to a panel rect, slanting its left and right edges when skew > 0. */
export function clipPanel(ctx, rect) {
  const s = (rect.skew || 0) * rect.h;
  ctx.beginPath();
  ctx.moveTo(rect.x + s, rect.y);
  ctx.lineTo(rect.x + rect.w + s, rect.y);
  ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
  ctx.lineTo(rect.x - s, rect.y + rect.h);
  ctx.closePath();
  ctx.clip();
}

/** Washes the grade's gradients over the whole cover. */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = grade.mode;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
}

/** Darkens the corners so the middle of the poster pops. */
export function applyVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 2, 12, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Scatters a fine film grain over the cover (seeded, so it never flickers). */
export function applyGrain(ctx, w, h, amount) {
  const rand = mulberry32(20261119);
  const n = Math.floor((w * h) / 900);
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

/** Stamps halftone dots along the foot of the cover, comic-print style. */
export function applyHalftone(ctx, w, h) {
  const band = h * 0.16;
  const y0 = h - band;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 4, 16, 0.55)';
  const step = Math.max(10, w / 90);
  for (let y = y0; y < h; y += step) {
    const row = Math.floor((y - y0) / step);
    for (let x = (row % 2) * step * 0.5; x < w; x += step) {
      const depth = (y - y0) / band;
      const r = step * 0.16 + depth * step * 0.22;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Shrinks a font until `text` fits `maxWidth`, returning the fitted size. */
export function fitFont(ctx, text, weight, style, family, start, maxWidth) {
  let size = start;
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${style} ${weight} ${size}px ${family}`;
  }
  return size;
}

const TITLE_FAMILY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const SCRIPT_FAMILY = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';

/** The big title: bold italic capitals, dark outline, sunset gradient fill. */
export function drawTitle(ctx, w, h, title, grade) {
  const text = (title || '').trim().toUpperCase();
  if (!text) return;
  const maxWidth = w * 0.92;
  const size = fitFont(ctx, text, 900, 'italic', TITLE_FAMILY, h * 0.115, maxWidth);
  const x = w * 0.05;
  const y = h - h * 0.045;
  const grad = ctx.createLinearGradient(0, y - size, 0, y);
  grad.addColorStop(0, grade.letterFrom);
  grad.addColorStop(1, grade.letterTo);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.font = `italic 900 ${size}px ${TITLE_FAMILY}`;
  ctx.strokeStyle = 'rgba(16, 4, 14, 0.95)';
  ctx.lineWidth = Math.max(4, size * 0.09);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);
  // A thin white hairline inside the outline keeps the letters crisp.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.strokeText(text, x, y);
  ctx.restore();
}

/** The neon script subtitle, glowing pink above the title. */
export function drawSubtitle(ctx, w, h, subtitle, grade) {
  const text = (subtitle || '').trim();
  if (!text) return;
  const maxWidth = w * 0.86;
  const size = fitFont(ctx, text, 600, 'italic', SCRIPT_FAMILY, h * 0.052, maxWidth);
  const x = w * 0.055;
  const y = h - h * 0.045 - h * 0.115 - h * 0.012;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `italic 600 ${size}px ${SCRIPT_FAMILY}`;
  ctx.shadowColor = grade.subtitle;
  ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** The small "VICE COAST" ribbon badge in the top corner. */
export function drawBadge(ctx, w, h) {
  const label = '★ VICE COAST ★';
  const size = Math.max(14, h * 0.022);
  ctx.save();
  ctx.font = `900 ${size}px ${TITLE_FAMILY}`;
  const tw = ctx.measureText(label).width;
  const padX = size * 0.9;
  const padY = size * 0.55;
  const bw = tw + padX * 2;
  const bh = size + padY * 2;
  const bx = w - bw - w * 0.03;
  const by = h * 0.03;
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(-0.03);
  ctx.translate(-bw / 2, -bh / 2);
  ctx.fillStyle = 'rgba(255, 46, 136, 0.92)';
  ctx.fillRect(0, 0, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, bw - 6, bh - 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bw / 2, bh / 2 + 1);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` from a state:
 * { layout, grade, halftone, photos, panelPhotos, crops, title, subtitle }.
 * `photos` are images (or null); `panelPhotos[i]` is the photo index for
 * panel i; `crops[i]` is { zoom, cx, cy } for panel i.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero3;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gutter = Math.max(3, Math.round(Math.min(w, h) * 0.008));

  ctx.save();
  ctx.fillStyle = '#14060f';
  ctx.fillRect(0, 0, w, h);

  const panels = layout.panels(w, h);
  panels.forEach((p, i) => {
    const rect = {
      x: p.x * w + (p.x > 0 ? gutter / 2 : 0),
      y: p.y * h + (p.y > 0 ? gutter / 2 : 0),
      w: p.w * w - (p.x > 0 ? gutter / 2 : 0) - (p.x + p.w < 1 ? gutter / 2 : 0),
      h: p.h * h - (p.y > 0 ? gutter / 2 : 0) - (p.y + p.h < 1 ? gutter / 2 : 0),
      skew: p.skew || 0,
    };
    const photoIndex = state.panelPhotos?.[i] ?? 0;
    const photo = state.photos?.[photoIndex] ?? null;
    const crop = state.crops?.[i];
    ctx.save();
    clipPanel(ctx, rect);
    if (photo) {
      drawPanelPhoto(ctx, photo, rect, crop);
    } else {
      // An empty panel is a deep plum placeholder with a dashed frame.
      ctx.fillStyle = '#2b1030';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
      ctx.setLineDash([]);
    }
    ctx.restore();
    // A thin white seam between panels, poster style.
    ctx.save();
    clipPanel(ctx, rect);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, gutter * 0.5);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // The grade, vignette and grain wash over every panel at once.
  applyGrade(ctx, w, h, grade);
  applyVignette(ctx, w, h);
  if (state.halftone) applyHalftone(ctx, w, h);
  applyGrain(ctx, w, h);

  // The lettering sits on a soft dark foot so it reads on any photo.
  const foot = ctx.createLinearGradient(0, h * 0.78, 0, h);
  foot.addColorStop(0, 'rgba(16, 4, 14, 0)');
  foot.addColorStop(1, 'rgba(16, 4, 14, 0.72)');
  ctx.fillStyle = foot;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  drawSubtitle(ctx, w, h, state.subtitle, grade);
  drawTitle(ctx, w, h, state.title, grade);
  drawBadge(ctx, w, h);
  ctx.restore();
}
