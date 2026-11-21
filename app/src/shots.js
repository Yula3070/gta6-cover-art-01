// Fixed scenes for the maker's screenshots. `?shot=cover` shows the cover
// alone edge to edge; `?shot=editor` shows the studio at work. The rest of
// the query picks the scene: layout, grade, size (a POST_SIZES id), title,
// subtitle, tags (cast tags separated by |) and photos (demo|samples).
// main.js applies the setup and sets window.__shotReady once painted.
export function shotSetup(query) {
  return {
    cover: query.get('shot') === 'cover',
    layout: query.get('layout') ?? 'mosaic7',
    grade: query.get('grade') ?? 'vice',
    size: query.get('size') ?? 'wide',
    title: query.get('title') ?? 'NEON PALMS',
    subtitle: query.get('subtitle') ?? 'A COVER IN THREE SIZES',
    tags: (query.get('tags') ?? '').split('|').filter((t) => t.length > 0),
    photoSet: query.get('photos') ?? 'demo',
  };
}
