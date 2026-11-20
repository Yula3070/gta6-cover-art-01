// Leonida Cover Studio — page wiring: photo in, live poster preview, PNG
// exports at four sizes. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js). No network: samples and fonts are local.
import { GRADES, drawCover, findFocalPoint } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const els = {
  photo: document.getElementById('photo'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  billing: document.getElementById('billing'),
  grade: document.getElementById('grade'),
  layout: document.getElementById('layout'),
  ink: document.getElementById('ink'),
  tags: document.getElementById('tags'),
  grain: document.getElementById('grain'),
  status: document.getElementById('status'),
  focusnote: document.getElementById('focusnote'),
};

for (const g of GRADES) {
  const opt = document.createElement('option');
  opt.value = g.id; opt.textContent = g.name;
  els.grade.appendChild(opt);
}

let photo = null;
let focus = { x: 0.5, y: 0.42, found: false };
let seed = 1;

function currentState() {
  return {
    photo,
    title: els.title.value,
    subtitle: els.subtitle.value,
    billing: els.billing.value,
    grade: GRADES.find((g) => g.id === els.grade.value) || GRADES[0],
    layout: els.layout.value,
    ink: els.ink.checked,
    tags: els.tags.checked,
    grain: els.grain.checked,
    seed,
    focus,
  };
}

function redraw() {
  drawCover(canvas, currentState());
}

function noteFocus() {
  els.focusnote.textContent = focus.found
    ? 'Face found — every panel crops around it.'
    : 'No clear face — panels crop around the warmest bright spot.';
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function usePhoto(img) {
  photo = img;
  focus = findFocalPoint(photo);
  noteFocus();
  redraw();
}

els.photo.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await usePhoto(await loadImage(URL.createObjectURL(file)));
  els.status.textContent = `Photo loaded: ${file.name}`;
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    await usePhoto(await loadImage(`samples/${btn.dataset.sample}.jpg`));
    els.status.textContent = `Sample loaded: ${btn.dataset.sample}.jpg`;
  });
});

for (const el of [els.title, els.subtitle, els.billing]) el.addEventListener('input', redraw);
for (const el of [els.grade, els.layout, els.ink, els.tags, els.grain]) el.addEventListener('change', redraw);

document.getElementById('shuffle').addEventListener('click', () => { seed += 1; redraw(); });
document.getElementById('focus').addEventListener('click', () => {
  focus = findFocalPoint(photo);
  noteFocus();
  redraw();
});

document.querySelectorAll('[data-export]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const [w, h] = btn.dataset.export.split('x').map(Number);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    drawCover(out, currentState());
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `leonida-cover-${w}x${h}.png`;
      a.click();
      els.status.textContent = `Saved leonida-cover-${w}x${h}.png`;
    }, 'image/png');
  });
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (sample, opts) => {
    if (opts.title) els.title.value = opts.title;
    if (opts.subtitle) els.subtitle.value = opts.subtitle;
    if (opts.grade) els.grade.value = opts.grade;
    if (opts.layout) els.layout.value = opts.layout;
    if (opts.seed) seed = opts.seed;
    await usePhoto(await loadImage(sample));
  });
} else {
  // First paint: show the pier sample so the studio never opens empty.
  loadImage('samples/pier.jpg').then(usePhoto).catch(redraw);
}
