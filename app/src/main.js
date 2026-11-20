// Neon Vice Cover Studio — editor wiring.
//
// Owns the app state, the photo tray, panel picking/panning/zooming on the
// preview canvas, every control in the side panel, and the PNG export. All
// drawing is delegated to cover.js so preview, export and screenshots match.

import {
  GRADES,
  POST_SIZES,
  defaultState,
  ensurePanels,
  panelCountFor,
  renderCover,
} from './cover.js';
import { runShotScene } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = defaultState();
const photos = []; // { img, url, name }
let activePhoto = -1;

const preview = $('preview');
const pctx = preview.getContext('2d');
let lastLayout = null; // panel rects from the latest render, for hit-testing

// ---------------------------------------------------------------------------
// Font: ship one heavy condensed face for the poster lettering (OFL, see
// fonts/OFL.txt). Load it before the first paint so canvas text uses it.
// ---------------------------------------------------------------------------

async function loadDisplayFont() {
  try {
    const face = new FontFace('NeonViceDisplay', 'url("fonts/NotoSansDisplay-CondensedBlack.ttf")');
    await face.load();
    document.fonts.add(face);
  } catch {
    // Fallback stacks in cover.js still render; never block the editor on a font.
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function currentSize() {
  return POST_SIZES[state.size] || POST_SIZES.square;
}

function draw() {
  const { w, h } = currentSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  ensurePanels(state);
  lastLayout = renderCover(pctx, w, h, state);
  $('stage-size').textContent = `${w} × ${h}`;
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[state.selected];
  if (panel) $('rng-zoom').value = String(Math.round((panel.zoom || 1) * 100));
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function addPhoto(img, url, name) {
  photos.push({ img, url, name });
  activePhoto = photos.length - 1;
  renderTray();
  // First photo fills every empty panel so the cover looks finished at once.
  ensurePanels(state);
  let filled = false;
  for (const panel of state.panels) {
    if (!panel.img) {
      panel.img = img;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      filled = true;
    }
  }
  if (!filled && state.panels[state.selected]) {
    state.panels[state.selected].img = img;
  }
  draw();
}

function loadPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => addPhoto(img, url, file.name);
  img.src = url;
}

function loadSample(path, name) {
  const img = new Image();
  img.onload = () => addPhoto(img, path, name);
  img.src = path;
}

function renderTray() {
  const tray = $('photo-tray');
  tray.textContent = '';
  photos.forEach((photo, i) => {
    const el = document.createElement('img');
    el.src = photo.url;
    el.alt = photo.name;
    el.title = photo.name;
    el.className = 'photo-thumb' + (i === activePhoto ? ' active' : '');
    el.addEventListener('click', () => {
      activePhoto = i;
      renderTray();
      const panel = state.panels[state.selected];
      if (panel) {
        panel.img = photo.img;
        panel.zoom = 1;
        panel.ox = 0;
        panel.oy = 0;
      }
      draw();
    });
    tray.appendChild(el);
  });
}

// ---------------------------------------------------------------------------
// Panel picking, panning, zooming on the preview canvas
// ---------------------------------------------------------------------------

function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * preview.width,
    y: ((event.clientY - rect.top) / rect.height) * preview.height,
  };
}

function panelAt(point) {
  if (!lastLayout) return -1;
  return lastLayout.photos.findIndex(
    (r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h,
  );
}

let drag = null;

preview.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const index = panelAt(point);
  if (index < 0) return;
  state.selected = index;
  const panel = state.panels[index];
  drag = { x: point.x, y: point.y, ox: panel.ox || 0, oy: panel.oy || 0 };
  preview.setPointerCapture(event.pointerId);
  draw();
});

preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const rect = lastLayout.photos[state.selected];
  const panel = state.panels[state.selected];
  panel.ox = clamp(drag.ox + (point.x - drag.x) / rect.w, -1, 1);
  panel.oy = clamp(drag.oy + (point.y - drag.y) / rect.h, -1, 1);
  draw();
});

preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('pointercancel', () => { drag = null; });

preview.addEventListener('wheel', (event) => {
  event.preventDefault();
  const point = canvasPoint(event);
  const index = panelAt(point);
  if (index < 0) return;
  state.selected = index;
  const panel = state.panels[index];
  panel.zoom = clamp((panel.zoom || 1) * (event.deltaY < 0 ? 1.08 : 0.93), 1, 3);
  draw();
}, { passive: false });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function buildGradeChips() {
  const row = $('grade-row');
  row.textContent = '';
  for (const [key, grade] of Object.entries(GRADES)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'grade-chip' + (key === state.grade ? ' active' : '');
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = grade.swatch;
    chip.appendChild(swatch);
    chip.appendChild(document.createTextNode(grade.label));
    chip.addEventListener('click', () => {
      state.grade = key;
      buildGradeChips();
      draw();
    });
    row.appendChild(chip);
  }
}

function wireControls() {
  $('file-input').addEventListener('change', (event) => {
    for (const file of event.target.files) loadPhotoFile(file);
    event.target.value = '';
  });

  $('btn-sample-boulevard').addEventListener('click', () => loadSample('samples/boulevard.jpg', 'Boulevard sample'));
  $('btn-sample-pier').addEventListener('click', () => loadSample('samples/pier.jpg', 'Pier sample'));

  const stage = $('stage');
  stage.addEventListener('dragover', (event) => {
    event.preventDefault();
    stage.classList.add('dragging');
  });
  stage.addEventListener('dragleave', () => stage.classList.remove('dragging'));
  stage.addEventListener('drop', (event) => {
    event.preventDefault();
    stage.classList.remove('dragging');
    for (const file of event.dataTransfer.files) {
      if (file.type.startsWith('image/')) loadPhotoFile(file);
    }
  });

  $('btn-fill-all').addEventListener('click', () => {
    const photo = photos[activePhoto];
    if (!photo) return;
    ensurePanels(state);
    for (const panel of state.panels) {
      panel.img = photo.img;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
    }
    draw();
  });

  $('btn-spread').addEventListener('click', () => {
    if (!photos.length) return;
    ensurePanels(state);
    state.panels.forEach((panel, i) => {
      panel.img = photos[i % photos.length].img;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
    });
    draw();
  });

  $('sel-layout').addEventListener('change', (event) => {
    state.layout = event.target.value;
    state.selected = 0;
    ensurePanels(state);
    draw();
  });

  $('sel-size').addEventListener('change', (event) => {
    state.size = event.target.value;
    draw();
  });

  $('rng-grade').addEventListener('input', (event) => {
    state.gradeStrength = Number(event.target.value) / 100;
    draw();
  });

  $('rng-grain').addEventListener('input', (event) => {
    state.grain = Number(event.target.value) / 100;
    draw();
  });

  $('txt-title').addEventListener('input', (event) => {
    state.title = event.target.value;
    draw();
  });

  $('txt-subtitle').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    draw();
  });

  $('rng-title').addEventListener('input', (event) => {
    state.titleScale = Number(event.target.value) / 100;
    draw();
  });

  $('chk-gradient').addEventListener('change', (event) => {
    state.titleGradient = event.target.checked;
    draw();
  });

  $('chk-frame').addEventListener('change', (event) => {
    state.frame = event.target.checked;
    draw();
  });

  $('rng-zoom').addEventListener('input', (event) => {
    const panel = state.panels[state.selected];
    if (panel) panel.zoom = Number(event.target.value) / 100;
    draw();
  });

  $('btn-center').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (panel) {
      panel.ox = 0;
      panel.oy = 0;
      panel.zoom = 1;
    }
    draw();
  });

  $('btn-next-photo').addEventListener('click', () => {
    if (!photos.length) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const current = photos.findIndex((p) => p.img === panel.img);
    const next = photos[(current + 1) % photos.length];
    panel.img = next.img;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    draw();
  });

  $('btn-random').addEventListener('click', shuffleLook);
  $('btn-export').addEventListener('click', exportPng);
}

const SHUFFLE_TITLES = ['NEON VICE', 'SUNSET HEIST', 'MIDNIGHT BOULEVARD', 'PIER PRESSURE', 'GOLDEN HOUR', 'VICE CITY NIGHTS'];
const SHUFFLE_SUBS = ['a cover story', 'est. tonight', 'no refunds', 'salt & neon', 'one more sunset'];

function shuffleLook() {
  const layouts = Object.keys({ grid9: 1, hero3: 1, quad: 1, strip: 1, duo: 1, bleed: 1 });
  const grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.title = SHUFFLE_TITLES[Math.floor(Math.random() * SHUFFLE_TITLES.length)];
  state.subtitle = SHUFFLE_SUBS[Math.floor(Math.random() * SHUFFLE_SUBS.length)];
  state.gradeStrength = 0.55 + Math.random() * 0.45;
  state.grain = Math.random() * 0.6;
  state.selected = 0;
  ensurePanels(state);
  $('sel-layout').value = state.layout;
  $('txt-title').value = state.title;
  $('txt-subtitle').value = state.subtitle;
  $('rng-grade').value = String(Math.round(state.gradeStrength * 100));
  $('rng-grain').value = String(Math.round(state.grain * 100));
  buildGradeChips();
  draw();
}

// ---------------------------------------------------------------------------
// Export: render at full post size and download the PNG.
// ---------------------------------------------------------------------------

function exportPng() {
  const { w, h } = currentSize();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const exportState = { ...state, showSelection: false };
  renderCover(off.getContext('2d'), w, h, exportState);
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  await loadDisplayFont();
  const params = new URLSearchParams(location.search);
  if (params.has('shot')) {
    await runShotScene(params, { state, photos, addPhoto, draw, loadSample, wireControls, buildGradeChips });
    return;
  }
  wireControls();
  buildGradeChips();
  ensurePanels(state);
  draw();
  // Start with a sample loaded so the first paint is already a finished cover.
  loadSample('samples/boulevard.jpg', 'Boulevard sample');
}

boot();
