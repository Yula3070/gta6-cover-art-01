// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, full frame.
// Query knobs: photo (sample name), photo2 (second sample, fills panel 2),
// caption (the title), subtitle, layout, grade, size, halftone (on/off).
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const options = {
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    size: query.get('size') || undefined,
    photo2: query.get('photo2') || undefined,
    subtitle: query.get('subtitle') ?? undefined,
    halftone: query.get('halftone') === 'off' ? false : undefined,
  };
  await load(
    query.get('photo') ?? 'pier',
    query.get('caption') ?? 'Sunset Heist',
    options,
  );
  // Two frames: one for the image to land, one for the canvas to paint.
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
