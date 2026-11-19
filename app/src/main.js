// Vice Coast Cover Studio — wires the editor page.
//
// The editor keeps one state object: the layout, grade, halftone toggle, up
// to four photos, which photo each panel shows, each panel's crop (zoom and
// focal point), the title and subtitle, and the export size. Every change
// redraws the live preview canvas; Export draws the same state at full size
// on an offscreen canvas and downloads it as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

export const state = {
  layout: 'hero3',
  grade: 'sunset',
  halftone: true,
  photos: [null, null, null, null],
  panelPhotos: [],
  crops: [],
  title: 'Sunset Heist',
  subtitle: 'vice coast nights',
  size: 'wide',
  selectedPanel: 0,
};

function panelCount() {
  return LAYOUTS[state.layout].panels(canvas.width, canvas.height).length;
}

/** Keeps panelPhotos and crops the right length for the current layout. */
export function syncPanels() {
  const n = panelCount();
  const loaded = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  while (state.panelPhotos.length < n) {
    const i = state.panelPhotos.length;
    state.panelPhotos.push(loaded.length ? loaded[i % loaded.length] : 0);
  }
  state.panelPhotos.length = n;
  while (state.crops.length < n) state.crops.push({ zoom: 1, cx: 0.5, cy: 0.5 });
  state.crops.length = n;
  if (state.selectedPanel >= n) state.selectedPanel = 0;
}

/** Sizes the preview canvas to the export size and redraws the cover. */
export function redraw() {
  syncPanels();
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  renderThumbs();
  renderPanelButtons();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

function setStatus(text) {
  status.textContent = text;
}

/** The strip of loaded-photo thumbnails; click one to put it in the selected panel. */
export function renderThumbs() {
  const strip = $('thumbs');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (photo ? '' : ' empty');
    button.textContent = photo ? `Photo ${i + 1}` : `Empty ${i + 1}`;
    button.title = photo ? `Put photo ${i + 1} in the selected panel` : 'No photo loaded yet';
    button.addEventListener('click', () => {
      if (!photo) return;
      state.panelPhotos[state.selectedPanel] = i;
      setStatus(`Panel ${state.selectedPanel + 1} now shows photo ${i + 1}.`);
      redraw();
    });
    strip.appendChild(button);
  });
}

/** The panel picker: one button per panel of the current layout. */
export function renderPanelButtons() {
  const row = $('panels');
  row.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-btn' + (i === state.selectedPanel ? ' active' : '');
    button.textContent = `Panel ${i + 1}`;
    button.addEventListener('click', () => {
      state.selectedPanel = i;
      syncZoomControl();
      redraw();
    });
    row.appendChild(button);
  }
}

/** Fills every panel with the photo in slot `index`. */
export function fillAllPanels(index) {
  syncPanels();
  state.panelPhotos = state.panelPhotos.map(() => index);
  setStatus(`All panels now show photo ${index + 1}.`);
  redraw();
}

/** Loads a file into the first free photo slot (or replaces slot 1 when full). */
export async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  let slot = state.photos.findIndex((p) => !p);
  if (slot === -1) slot = 0;
  state.photos[slot] = img;
  state.panelPhotos = state.panelPhotos.map((p, i) => (i === 0 ? slot : p));
  setStatus(`Photo ${slot + 1} loaded — ${file.name}.`);
  redraw();
}

/** Loads one of the bundled sample photos into the first free slot. */
export async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  let slot = state.photos.findIndex((p) => !p);
  if (slot === -1) slot = 0;
  state.photos[slot] = img;
  setStatus(`Sample photo ${name} loaded into slot ${slot + 1}.`);
  redraw();
}

/** Picks a random layout and grade, keeping the photos and caption. */
export function randomise() {
  const layoutKeys = Object.keys(LAYOUTS);
  const gradeKeys = Object.keys(GRADES);
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
  $('layout').value = state.layout;
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  setStatus(`Random pick: ${LAYOUTS[state.layout].name} + ${GRADES[state.grade].name}.`);
  redraw();
}

/** Exports the cover at the chosen post size as a PNG download. */
export function exportPng() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — the browser could not make the PNG.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setStatus(`Saved vice-coast-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

// ---- Controls -------------------------------------------------------------

const layoutSelect = $('layout');
Object.entries(LAYOUTS).forEach(([key, layout]) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = layout.name;
  layoutSelect.appendChild(option);
});
layoutSelect.value = state.layout;
layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  redraw();
});

const gradesRow = $('grades');
Object.entries(GRADES).forEach(([key, grade]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'grade-btn' + (key === state.grade ? ' active' : '');
  button.dataset.grade = key;
  button.textContent = grade.name;
  button.addEventListener('click', () => {
    state.grade = key;
    document.querySelectorAll('#grades button').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === key);
    });
    redraw();
  });
  gradesRow.appendChild(button);
});

$('halftone').addEventListener('change', (e) => {
  state.halftone = e.target.checked;
  redraw();
});

const sizeSelect = $('size');
Object.entries(SIZES).forEach(([key, size]) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = size.name;
  sizeSelect.appendChild(option);
});
sizeSelect.value = state.size;
sizeSelect.addEventListener('change', () => {
  state.size = sizeSelect.value;
  redraw();
});

$('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await addPhotoFile(file);
  } catch {
    setStatus('That file could not be read as a photo.');
  }
  e.target.value = '';
});
$('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
$('sample-pier').addEventListener('click', () => loadSample('pier'));
$('fill-all').addEventListener('click', () => {
  const first = state.photos.findIndex((p) => p);
  if (first === -1) {
    setStatus('Load a photo first, then fill all panels with it.');
    return;
  }
  fillAllPanels(first);
});
$('random').addEventListener('click', randomise);
$('export').addEventListener('click', exportPng);

$('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
$('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

// ---- Crop: zoom slider + drag the preview to slide the selected panel ----

const zoom = $('zoom');
function syncZoomControl() {
  syncPanels();
  zoom.value = String(state.crops[state.selectedPanel].zoom);
  $('zoom-val').textContent = `${Number(zoom.value).toFixed(1)}x`;
}
zoom.addEventListener('input', () => {
  syncPanels();
  state.crops[state.selectedPanel].zoom = Number(zoom.value);
  $('zoom-val').textContent = `${Number(zoom.value).toFixed(1)}x`;
  redraw();
});

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const panels = LAYOUTS[state.layout].panels(canvas.width, canvas.height);
  const hit = panels.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  if (hit >= 0) state.selectedPanel = hit;
  drag = { x: e.clientX, y: e.clientY, cx: state.crops[state.selectedPanel]?.cx ?? 0.5, cy: state.crops[state.selectedPanel]?.cy ?? 0.5 };
  canvas.setPointerCapture(e.pointerId);
  syncZoomControl();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const crop = state.crops[state.selectedPanel];
  const zoomFactor = crop.zoom || 1;
  // Dragging moves the focal point: the photo slides under the panel.
  crop.cx = Math.min(1, Math.max(0, drag.cx - ((e.clientX - drag.x) / rect.width) * zoomFactor));
  crop.cy = Math.min(1, Math.max(0, drag.cy - ((e.clientY - drag.y) / rect.height) * zoomFactor));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// ---- Boot -----------------------------------------------------------------

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (sampleName, text, options) => {
    if (options?.layout) state.layout = options.layout;
    if (options?.grade) state.grade = options.grade;
    if (options?.size) state.size = options.size;
    if (options?.halftone !== undefined) state.halftone = options.halftone;
    if (options?.subtitle !== undefined) state.subtitle = options.subtitle;
    layoutSelect.value = state.layout;
    sizeSelect.value = state.size;
    document.querySelectorAll('#grades button').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === state.grade);
    });
    $('halftone').checked = state.halftone;
    state.title = text;
    $('title').value = text;
    $('subtitle').value = state.subtitle;
    const img = await loadImage(`samples/${sampleName}.jpg`);
    state.photos[0] = img;
    if (options?.photo2) {
      state.photos[1] = await loadImage(`samples/${options.photo2}.jpg`);
      state.panelPhotos = [];
    }
    redraw();
  });
} else {
  redraw();
}
