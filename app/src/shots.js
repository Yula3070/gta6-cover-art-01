// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded; ?shot=cover shows the finished cover alone, full-bleed.
// `photo` picks the sample (samples/<photo>.jpg); `title`, `subtitle`,
// `grade`, `layout` and `seed` set the poster. window.__shotReady is set
// once the scene is painted (fonts included, so the chrome title is real).
export async function runShot(shot, query, load) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Render the cover at the exact viewport size so landscape and portrait
    // scenes are composed for their frame, never stretched.
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  const num = Number(query.get('seed'));
  await load(`samples/${query.get('photo') ?? 'pier'}.jpg`, {
    title: query.get('title'),
    subtitle: query.get('subtitle'),
    grade: query.get('grade'),
    layout: query.get('layout'),
    seed: Number.isFinite(num) && num > 0 ? num : null,
  });
  try { await document.fonts.ready; } catch { /* fallback fonts still paint */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
