// Neon Palms Cover Studio — the cover renderer.
//
// drawCover() paints a complete GTA-style key-art cover onto any canvas:
// a sunset sky behind a mosaic of photo panels with white comic borders,
// a colour grade over every panel, small cast tags, a big chrome-gradient
// title, a billing block along the foot and a round studio seal. All of it
// is drawn with the 2D canvas API; nothing is fetched.

export const POST_SIZES = [
  { id: 'square', label: 'Square post 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait post 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide post 1920 x 1080', w: 1920, h: 1080 },
];

// Panel layouts as fractions of the cover: [x, y, w, h] per panel, in the
// order the panels are numbered in the editor. The first panel of the
// hero layouts is the big close-up.
export const LAYOUTS = [
  {
    id: 'mosaic7', label: 'Cast mosaic (7 panels)',
    panels: [
      [0.00, 0.00, 0.52, 0.62], [0.52, 0.00, 0.48, 0.31], [0.52, 0.31, 0.48, 0.31],
      [0.00, 0.62, 0.34, 0.38], [0.34, 0.62, 0.33, 0.38], [0.67, 0.62, 0.33, 0.19],
      [0.67, 0.81, 0.33, 0.19],
    ],
  },
  {
    id: 'grid6', label: 'Poster grid (2 x 3)',
    panels: [
      [0.00, 0.00, 0.50, 0.34], [0.50, 0.00, 0.50, 0.34],
      [0.00, 0.34, 0.50, 0.33], [0.50, 0.34, 0.50, 0.33],
      [0.00, 0.67, 0.50, 0.33], [0.50, 0.67, 0.50, 0.33],
    ],
  },
  {
    id: 'hero4', label: 'Hero + strip (5 panels)',
    panels: [
      [0.00, 0.00, 1.00, 0.58],
      [0.00, 0.58, 0.25, 0.42], [0.25, 0.58, 0.25, 0.42],
      [0.50, 0.58, 0.25, 0.42], [0.75, 0.58, 0.25, 0.42],
    ],
  },
  {
    id: 'triptych', label: 'Triptych (3 panels)',
    panels: [[0.00, 0.00, 0.34, 1.00], [0.34, 0.00, 0.33, 1.00], [0.67, 0.00, 0.33, 1.00]],
  },
  {
    id: 'duo', label: 'Duo split (2 panels)',
    panels: [[0.00, 0.00, 0.50, 1.00], [0.50, 0.00, 0.50, 1.00]],
  },
  {
    id: 'solo', label: 'Solo hero (1 panel)',
    panels: [[0.00, 0.00, 1.00, 1.00]],
  },
];

// Colour grades: a canvas filter for the photo plus two overlay washes
// (a top colour and a bottom colour, blended soft-light) and the sky
// gradient painted behind the panels.
export const GRADES = [
  {
    id: 'vice', label: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.03)',
    washTop: 'rgba(255, 170, 60, 0.55)', washBottom: 'rgba(190, 30, 130, 0.60)',
    sky: ['#ffd76e', '#ff7a59', '#c2187a', '#2b0f45'],
  },
  {
    id: 'neon', label: 'Neon Noir',
    filter: 'saturate(1.7) contrast(1.25) brightness(0.92) hue-rotate(-12deg)',
    washTop: 'rgba(40, 220, 255, 0.45)', washBottom: 'rgba(255, 0, 160, 0.55)',
    sky: ['#0b2a5b', '#123a8f', '#7a1fa2', '#12041f'],
  },
  {
    id: 'gold', label: 'Golden Mile',
    filter: 'sepia(0.35) saturate(1.5) contrast(1.08) brightness(1.06)',
    washTop: 'rgba(255, 200, 90, 0.50)', washBottom: 'rgba(160, 60, 10, 0.55)',
    sky: ['#ffe9a8', '#ffb84d', '#e06428', '#571f10'],
  },
  {
    id: 'teal', label: 'Miami Teal',
    filter: 'saturate(1.35) contrast(1.1) hue-rotate(18deg)',
    washTop: 'rgba(120, 255, 220, 0.40)', washBottom: 'rgba(0, 90, 140, 0.55)',
    sky: ['#a8fff0', '#4fd8c8', '#1b7f9e', '#0a2e4d'],
  },
  {
    id: 'heat', label: 'Magenta Heat',
    filter: 'saturate(1.8) contrast(1.18) hue-rotate(-28deg)',
    washTop: 'rgba(255, 90, 200, 0.50)', washBottom: 'rgba(90, 0, 160, 0.60)',
    sky: ['#ff9de2', '#ff4fa3', '#b01e8f', '#2a0a3d'],
  },
  {
    id: 'ink', label: 'Poster Ink',
    filter: 'grayscale(0.55) contrast(1.35) brightness(1.02)',
    washTop: 'rgba(255, 240, 210, 0.35)', washBottom: 'rgba(20, 16, 40, 0.65)',
    sky: ['#f5e6c8', '#d9a05b', '#7a4a6e', '#191226'],
  },
  {
    id: 'violet', label: 'Ultra Violet',
    filter: 'saturate(1.6) contrast(1.15) hue-rotate(-42deg) brightness(1.0)',
    washTop: 'rgba(190, 140, 255, 0.45)', washBottom: 'rgba(40, 0, 110, 0.60)',
    sky: ['#d9b8ff', '#9a5cff', '#5b2a9e', '#150430'],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeById(id) {
  return POST_SIZES.find((s) => s.id === id) ?? POST_SIZES[0];
}

// A fresh panel: which photo fills it, how it is cropped (dx/dy in
// -1..1 across the overflow, zoom >= 1), and its cast tag.
export function newPanel(photoIndex) {
  return { photo: photoIndex, dx: 0, dy: 0, zoom: 1, tag: '' };
}

function paintSky(ctx, w, h, sky) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.38, sky[1]);
  g.addColorStop(0.72, sky[2]);
  g.addColorStop(1, sky[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // A low sun disc with retro slats, behind the panels' top edge. The sun
  // is painted on its own sprite so the slats stay see-through to the sky.
  const sunR = Math.min(w, h) * 0.30;
  const sunX = w * 0.5;
  const sunY = h * 0.30;
  const sprite = document.createElement('canvas');
  sprite.width = Math.ceil(sunR * 2);
  sprite.height = Math.ceil(sunR * 2);
  const sctx = sprite.getContext('2d');
  const sun = sctx.createLinearGradient(0, 0, 0, sunR * 2);
  sun.addColorStop(0, 'rgba(255, 246, 190, 0.95)');
  sun.addColorStop(1, 'rgba(255, 120, 90, 0.90)');
  sctx.beginPath();
  sctx.arc(sunR, sunR, sunR, 0, Math.PI * 2);
  sctx.clip();
  sctx.fillStyle = sun;
  sctx.fillRect(0, 0, sunR * 2, sunR * 2);
  sctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 5; i++) {
    const y = sunR + sunR * (0.08 + i * 0.18);
    sctx.fillRect(0, y, sunR * 2, sunR * (0.03 + i * 0.012));
  }
  ctx.drawImage(sprite, sunX - sunR, sunY - sunR);
}

function drawPhotoInPanel(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const base = Math.max(w / iw, h / ih);
    const scale = base * Math.max(1, panel.zoom || 1);
    const pw = iw * scale;
    const ph = ih * scale;
    const ox = (w - pw) / 2 + (panel.dx || 0) * Math.max(0, (pw - w) / 2);
    const oy = (h - ph) / 2 + (panel.dy || 0) * Math.max(0, (ph - h) / 2);
    ctx.filter = grade.filter;
    ctx.drawImage(img, x + ox, y + oy, pw, ph);
    ctx.filter = 'none';
    // Grade washes: warm light from the top, neon shade at the foot.
    const wash = ctx.createLinearGradient(0, y, 0, y + h);
    wash.addColorStop(0, grade.washTop);
    wash.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
    wash.addColorStop(1, grade.washBottom);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const shade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
    shade.addColorStop(0, 'rgba(10, 4, 24, 0)');
    shade.addColorStop(1, 'rgba(10, 4, 24, 0.42)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = 'rgba(20, 10, 36, 0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `600 ${Math.max(14, h * 0.05)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function drawCastTag(ctx, rect, tag) {
  const text = (tag || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.max(13, rect.h * 0.055);
  ctx.save();
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 0.55;
  const bw = tw + padX * 2;
  const bh = size * 1.55;
  const bx = rect.x + rect.w - bw - size * 0.4;
  const by = rect.y + rect.h - bh - size * 0.4;
  ctx.fillStyle = 'rgba(12, 6, 26, 0.82)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffd76e';
  ctx.fillRect(bx, by, size * 0.18, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX + size * 0.18, by + bh / 2 + 1);
  ctx.restore();
}

function fitFontSize(ctx, text, weight, style, family, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${style} ${weight} ${size}px ${family}`;
  }
  return size;
}

function drawChromeTitle(ctx, w, h, title, subtitle) {
  const text = (title || '').trim().toUpperCase();
  const baseY = h * 0.90;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (text) {
    const family = `'Arial Black', 'Archivo Black', system-ui, sans-serif`;
    const size = fitFontSize(ctx, text, '900', 'italic', family, w * 0.94, h * 0.115);
    // Slight forward lean, like painted key-art lettering.
    ctx.translate(w / 2, baseY);
    ctx.transform(1, 0, -0.06, 1, 0, 0);
    // Hard offset shadow, then a dark outline, then the chrome gradient.
    ctx.fillStyle = 'rgba(10, 2, 24, 0.85)';
    ctx.fillText(text, size * 0.07, size * 0.09);
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = '#160726';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
    const chrome = ctx.createLinearGradient(0, -size, 0, size * 0.15);
    chrome.addColorStop(0, '#ffffff');
    chrome.addColorStop(0.32, '#ffe9a8');
    chrome.addColorStop(0.52, '#ff9de2');
    chrome.addColorStop(0.74, '#c2187a');
    chrome.addColorStop(1, '#5b2a9e');
    ctx.fillStyle = chrome;
    ctx.fillText(text, 0, 0);
    // A thin neon underline with a glow.
    const tw = ctx.measureText(text).width;
    ctx.shadowColor = '#ff4fa3';
    ctx.shadowBlur = size * 0.18;
    ctx.fillStyle = '#ff5fa8';
    ctx.fillRect(-tw / 2, size * 0.16, tw, Math.max(3, size * 0.055));
    ctx.shadowBlur = 0;
    ctx.translate(-w / 2, -baseY);
  }
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = fitFontSize(ctx, sub, '700', 'normal', 'system-ui, sans-serif', w * 0.9, h * 0.032);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(sub.split('').join('  '), w / 2, baseY + size * 1.7);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawBillingBlock(ctx, w, h, names) {
  const cast = names.filter(Boolean).join('   •   ');
  const lines = [
    'NEON PALMS COVER STUDIO PRESENTS',
    cast ? `STARRING ${cast.toUpperCase()}` : 'STARRING YOU AND YOUR CAMERA ROLL',
    'SHOT ON LOCATION IN YOUR BROWSER • NO PHOTOS WERE UPLOADED • A COVER IN THREE SIZES',
  ];
  ctx.save();
  ctx.textAlign = 'center';
  let y = h * 0.955;
  for (const line of lines) {
    const size = fitFontSize(ctx, line, '600', 'normal', 'system-ui, sans-serif', w * 0.92, h * 0.016);
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillText(line, w / 2, y);
    y += size * 1.5;
  }
  ctx.restore();
}

function drawSeal(ctx, w, h) {
  const r = Math.min(w, h) * 0.055;
  const cx = w - r * 1.7;
  const cy = r * 1.7;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 6, 32, 0.85)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = '#ffd76e';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();
  ctx.fillStyle = '#ffd76e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.62}px system-ui, sans-serif`;
  ctx.fillText('★', 0, -r * 0.22);
  ctx.font = `800 ${r * 0.30}px system-ui, sans-serif`;
  ctx.fillText('NP', 0, r * 0.30);
  ctx.font = `700 ${r * 0.20}px system-ui, sans-serif`;
  ctx.fillText('EST 2026', 0, r * 0.58);
  ctx.restore();
}

function drawFinish(ctx, w, h) {
  // Halftone dots fading in from the corners, then a soft vignette.
  ctx.save();
  const step = Math.max(10, w * 0.016);
  const dot = step * 0.16;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const edge = Math.min(x, y, w - x, h - y) / (Math.min(w, h) * 0.22);
      if (edge >= 1) continue;
      ctx.beginPath();
      ctx.arc(x, y, dot * (1 - edge) + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(8, 2, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 18, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Paints the whole cover. `state` holds photos (images or canvases),
// panels, layout/grade ids, title, subtitle and whether to draw the seal.
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  paintSky(ctx, w, h, grade.sky);
  const gap = Math.max(4, Math.min(w, h) * 0.006);
  const rects = layout.panels.map(([fx, fy, fw, fh]) => ({
    x: fx * w + gap / 2, y: fy * h + gap / 2, w: fw * w - gap, h: fh * h - gap,
  }));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? newPanel(0);
    const img = state.photos[panel.photo] ?? null;
    drawPhotoInPanel(ctx, img, rect, panel, grade);
    // White comic border around every panel.
    ctx.save();
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.004);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    drawCastTag(ctx, rect, panel.tag);
  });
  // A dark band behind the lettering so the title always reads.
  const band = ctx.createLinearGradient(0, h * 0.72, 0, h);
  band.addColorStop(0, 'rgba(10, 3, 24, 0)');
  band.addColorStop(0.45, 'rgba(10, 3, 24, 0.55)');
  band.addColorStop(1, 'rgba(10, 3, 24, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  drawChromeTitle(ctx, w, h, state.title, state.subtitle);
  drawBillingBlock(ctx, w, h, state.panels.map((p) => p.tag));
  if (state.seal !== false) drawSeal(ctx, w, h);
  drawFinish(ctx, w, h);
  return rects;
}

// Renders the cover at an exact export size on a fresh canvas.
export function renderExport(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}
