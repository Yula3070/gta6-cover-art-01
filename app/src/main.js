// Neon Palms Cover Studio — page wiring: photos in, panels cropped by
// dragging on the cover itself, lettering edited live, PNG out in the
// three post sizes. A `?shot=` query sets up a fixed scene instead
// (./shots.js) for the maker's screenshots.
import { POST_SIZES, LAYOUTS, GRADES, drawCover, renderExport, newPanel, layoutById, sizeById } from './cover.js';
import { demoPhotos } from './scenes.js';
import { shotSetup } from './shots.js';

const canvas = document.getElementById('cover');
const els = {
  photos: document.getElementById('photos'),
  layout: document.getElementById('layout'),
  grade: document.getElementById('grade'),
  size: document.getElementById('size'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  seal: document.getElementById('seal'),
  panelList: document.getElementById('panel-list'),
  status: document.getElementById('status'),
};

const state = {
  photos: demoPhotos(),
  photoNames: ['Demo: Sunset Skyline', 'Demo: Neon Boulevard', 'Demo: Pier at Dusk', 'Demo: Beach Day'],
  panels: [],
  layout: 'mosaic7',
  grade: 'vice',
  size: 'wide',
  title: 'NEON PALMS',
  subtitle: 'A COVER IN THREE SIZES',
  seal: true,
};
let selected = 0;
let lastRects = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function syncPanels() {
  const want = layoutById(state.layout).panels.length;
  while (state.panels.length < want) {
    state.panels.push(newPanel(state.panels.length % Math.max(1, state.photos.length)));
  }
  state.panels.length = want;
  if (selected >= want) selected = 0;
}

function redraw() {
  const size = sizeById(state.size);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  lastRects = drawCover(canvas, state);
  highlightSelected();
}

function highlightSelected() {
  const rect = lastRects[selected];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.lineWidth = Math.max(3, canvas.width * 0.0022);
  ctx.strokeStyle = '#ff4fa3';
  ctx.setLineDash([16, 10]);
  ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  ctx.restore();
  for (const card of els.panelList.children) {
    card.classList.toggle('selected', Number(card.dataset.index) === selected);
  }
}

function fillSelect(select, items, value) {
  select.innerHTML = '';
  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.label;
    select.append(opt);
  }
  select.value = value;
}

function rebuildPanelList() {
  els.panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.dataset.index = String(i);
    const head = document.createElement('div');
    head.className = 'head';
    head.innerHTML = `Panel ${i + 1} <span>${i === 0 ? 'hero' : ''}</span>`;
    card.append(head);

    const photoLabel = document.createElement('label');
    photoLabel.textContent = 'Photo';
    const photoSelect = document.createElement('select');
    state.photoNames.forEach((name, pi) => {
      const opt = document.createElement('option');
      opt.value = String(pi);
      opt.textContent = name;
      photoSelect.append(opt);
    });
    photoSelect.value = String(panel.photo);
    photoSelect.addEventListener('change', () => {
      panel.photo = Number(photoSelect.value);
      panel.dx = 0; panel.dy = 0; panel.zoom = 1;
      selected = i;
      redraw();
    });
    photoLabel.append(photoSelect);
    card.append(photoLabel);

    const tagLabel = document.createElement('label');
    tagLabel.textContent = 'Cast tag';
    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.maxLength = 22;
    tagInput.placeholder = 'e.g. THE DRIVER';
    tagInput.value = panel.tag;
    tagInput.addEventListener('input', () => { panel.tag = tagInput.value; redraw(); });
    tagLabel.append(tagInput);
    card.append(tagLabel);

    const zoomLabel = document.createElement('label');
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1'; zoom.max = '3'; zoom.step = '0.02';
    zoom.value = String(panel.zoom);
    zoom.addEventListener('input', () => { panel.zoom = Number(zoom.value); selected = i; redraw(); });
    zoomLabel.append(zoom);
    card.append(zoomLabel);

    card.addEventListener('pointerdown', () => { selected = i; redraw(); });
    els.panelList.append(card);
  });
  highlightSelected();
}

function refreshAll() {
  syncPanels();
  rebuildPanelList();
  redraw();
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

function panelAt(point) {
  return lastRects.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
}

let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = panelAt(point);
  if (hit < 0) return;
  selected = hit;
  dragging = { x: point.x, y: point.y, dx: state.panels[hit].dx, dy: state.panels[hit].dy };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const rect = lastRects[selected];
  const panel = state.panels[selected];
  panel.dx = Math.max(-1, Math.min(1, dragging.dx + (point.x - dragging.x) / rect.w * 2));
  panel.dy = Math.max(-1, Math.min(1, dragging.dy + (point.y - dragging.y) / rect.h * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom + (event.deltaY < 0 ? 0.08 : -0.08)));
  redraw();
  rebuildPanelList();
}, { passive: false });

els.photos.addEventListener('change', async () => {
  const files = [...els.photos.files];
  for (const file of files) {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    state.photoNames.push(file.name.replace(/\.[^.]+$/, ''));
  }
  if (files.length) {
    // New photos take the panels in turn, so the cover changes at once.
    state.panels.forEach((panel, i) => {
      panel.photo = state.photos.length - files.length + (i % files.length);
      panel.dx = 0; panel.dy = 0; panel.zoom = 1;
    });
    els.status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added — drag panels to crop.`;
  }
  refreshAll();
});

els.layout.addEventListener('change', () => { state.layout = els.layout.value; refreshAll(); });
els.grade.addEventListener('change', () => { state.grade = els.grade.value; redraw(); });
els.size.addEventListener('change', () => { state.size = els.size.value; redraw(); });
els.title.addEventListener('input', () => { state.title = els.title.value; redraw(); });
els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
els.seal.addEventListener('change', () => { state.seal = els.seal.checked; redraw(); });

document.getElementById('fill-all').addEventListener('click', () => {
  const hero = state.panels[selected]?.photo ?? 0;
  state.panels.forEach((panel, i) => {
    panel.photo = hero;
    // Each panel crops a different part of the one photo.
    panel.dx = (i % 3 - 1) * 0.55;
    panel.dy = (Math.floor(i / 3) % 3 - 1) * 0.55;
    panel.zoom = 1 + (i % 3) * 0.35;
  });
  redraw();
});

document.getElementById('shuffle').addEventListener('click', () => {
  state.panels.forEach((panel, i) => {
    panel.photo = (panel.photo + 1 + (i % 2)) % state.photos.length;
  });
  refreshAll();
});

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', () => {
  const size = sizeById(state.size);
  download(renderExport(state, size), `neon-palms-cover-${size.w}x${size.h}.png`);
  els.status.textContent = `Saved neon-palms-cover-${size.w}x${size.h}.png`;
});

document.getElementById('export-all').addEventListener('click', () => {
  for (const size of POST_SIZES) {
    download(renderExport(state, size), `neon-palms-cover-${size.w}x${size.h}.png`);
  }
  els.status.textContent = 'Saved all three post sizes.';
});

fillSelect(els.layout, LAYOUTS, state.layout);
fillSelect(els.grade, GRADES, state.grade);
fillSelect(els.size, POST_SIZES, state.size);

async function addSamples() {
  for (const name of ['pier', 'boulevard']) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      state.photos.push(img);
      state.photoNames.push(`Sample: ${name}`);
    } catch { /* a missing sample just leaves the demos */ }
  }
}

const query = new URLSearchParams(location.search);
if (query.has('shot')) {
  const shot = shotSetup(query);
  if (shot.cover) document.body.classList.add('shot-cover');
  state.layout = shot.layout;
  state.grade = shot.grade;
  state.size = shot.size;
  state.title = shot.title;
  state.subtitle = shot.subtitle;
  els.layout.value = state.layout;
  els.grade.value = state.grade;
  els.size.value = state.size;
  els.title.value = state.title;
  els.subtitle.value = state.subtitle;
  syncPanels();
  shot.tags.forEach((tag, i) => { if (state.panels[i]) state.panels[i].tag = tag; });
  if (shot.photoSet === 'samples') {
    addSamples().then(() => {
      const first = state.photos.length - 2;
      state.panels.forEach((panel, i) => { panel.photo = first + (i % 2); });
      refreshAll();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    });
  } else {
    refreshAll();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  }
} else {
  refreshAll();
  addSamples().then(refreshAll);
}
