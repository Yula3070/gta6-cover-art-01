// Neon Vice Cover Studio — screenshot scenes.
//
// The entry's screenshots are taken from these deterministic scenes:
//   ?shot=cover  draws one finished cover full-frame at w x h (the app's own
//                drawing of an exported cover, at a size inside the gate caps)
//   ?shot=editor opens the real editor with a sample photo loaded and a
//                caption set, ready to photograph.
// Both scenes finish by setting window.__shotReady for the capture tool.

import { POST_SIZES, ensurePanels, renderCover } from './cover.js';

const SAMPLE_PATHS = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

// Slightly different crops per panel so one photo spread over a grid still
// reads as designed panels rather than eight identical tiles.
const PANEL_CROPS = [
  { zoom: 1.0, ox: 0, oy: 0 },
  { zoom: 1.35, ox: -0.12, oy: -0.05 },
  { zoom: 1.2, ox: 0.1, oy: 0.08 },
  { zoom: 1.5, ox: 0.05, oy: -0.1 },
  { zoom: 1.15, ox: -0.08, oy: 0.1 },
  { zoom: 1.4, ox: 0.12, oy: 0 },
  { zoom: 1.25, ox: 0, oy: -0.08 },
  { zoom: 1.45, ox: -0.1, oy: 0.06 },
  { zoom: 1.1, ox: 0.06, oy: 0.04 },
];

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = path;
  });
}

function applyParams(state, params) {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('caption')) state.title = params.get('caption');
  if (params.get('sub')) state.subtitle = params.get('sub');
  if (params.get('strength')) state.gradeStrength = Number(params.get('strength')) / 100;
  if (params.get('grain')) state.grain = Number(params.get('grain')) / 100;
  if (params.get('tscale')) state.titleScale = Number(params.get('tscale')) / 100;
  if (params.get('gradient') === '0') state.titleGradient = false;
  if (params.get('frame') === '0') state.frame = false;
  state.selected = 0;
}

function fillPanels(state, images) {
  ensurePanels(state);
  state.panels.forEach((panel, i) => {
    const crop = PANEL_CROPS[i % PANEL_CROPS.length];
    panel.img = images[i % images.length];
    panel.zoom = crop.zoom;
    panel.ox = crop.ox;
    panel.oy = crop.oy;
  });
}

async function sceneImages(params) {
  const first = SAMPLE_PATHS[params.get('photo')] || SAMPLE_PATHS.boulevard;
  const images = [await loadImage(first)];
  const second = SAMPLE_PATHS[params.get('photo2')];
  if (second) images.push(await loadImage(second));
  return images;
}

async function coverScene(params, hooks) {
  const { state } = hooks;
  applyParams(state, params);
  const images = await sceneImages(params);
  fillPanels(state, images);

  const size = POST_SIZES[state.size] || POST_SIZES.square;
  const w = Number(params.get('w')) || size.w;
  const h = Number(params.get('h')) || size.h;

  // Hide the editor chrome; the cover fills the viewport.
  for (const sel of ['.topbar', '.layout', '.foot']) {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  }
  document.body.style.margin = '0';
  document.body.style.background = '#000';

  const canvas = document.getElementById('shot-canvas');
  canvas.hidden = false;
  canvas.width = w;
  canvas.height = h;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block;';

  renderCover(canvas.getContext('2d'), w, h, { ...state, showSelection: false });
  window.__shotReady = true;
}

async function editorScene(params, hooks) {
  const { state, draw, addPhoto } = hooks;
  hooks.wireControls();
  hooks.buildGradeChips();
  applyParams(state, params);
  ensurePanels(state);

  const images = await sceneImages(params);
  for (const img of images) addPhoto(img, img.src, 'Sample photo');
  fillPanels(state, images);

  // Reflect the scene in the controls so the photograph reads as a real edit.
  document.getElementById('sel-layout').value = state.layout;
  document.getElementById('sel-size').value = state.size;
  document.getElementById('txt-title').value = state.title;
  document.getElementById('txt-subtitle').value = state.subtitle;
  document.getElementById('rng-grade').value = String(Math.round(state.gradeStrength * 100));
  document.getElementById('rng-grain').value = String(Math.round(state.grain * 100));
  hooks.buildGradeChips();

  draw();
  window.__shotReady = true;
}

export async function runShotScene(params, hooks) {
  const scene = params.get('shot');
  if (scene === 'cover') return coverScene(params, hooks);
  if (scene === 'editor') return editorScene(params, hooks);
  window.__shotReady = true;
}
