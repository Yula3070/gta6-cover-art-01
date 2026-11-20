# Leonida Cover Studio — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

One photo in, a seven-panel sunset poster out. Leonida Cover Studio turns any
photo into GTA-style cover art — entirely offline, in the browser, with no
uploads and no network requests.

## What it does

- **7-panel slanted collage** (plus hero-split and triptych layouts): every
  panel re-crops the same photo at a different zoom, sheared into a
  parallelogram grid with white keylines.
- **Pop-out hero cut-out**: the centre panel breaks the grid with a fat white
  sticker stroke, an inner keyline and a drop shadow, tagged "★ THE STAR ★".
- **Face-aware smart crop**: a local skin-tone + warm-saturation scan finds
  the face focal point on-device; every panel crops around it (with a
  designed per-panel jitter). "Re-find face" re-runs the scan.
- **8 duo-tone grades**: Sunset Drive, Neon Vice, Palm Heat, Midnight Keys,
  Golden Hour, Bubblegum, Teal Noir and Mono Ink — each maps luminance
  through a shadow → mid → highlight sunset/neon ramp.
- **Poster Ink**: posterized bands + a soft painted downscale pass, keeping a
  whisper of the original colour so the photo reads as painted, not filtered.
- **Retro-chrome title**: banded chrome gradient, dark outline, 3D extrusion
  and a top-shine pass over a halftone title block, with a glowing neon
  script subtitle.
- **Poster furniture**: cast role tags (THE DRIVER, THE FIXER, …), callouts
  (EST. 2026, LEONIDA BAY, …), a rotating round studio seal and a wrapped
  film-poster billing block. Film grain + vignette on top.
- **Exports**: PNG at 1080×1080, 1080×1350, 1920×1080 and 1080×1920 (story),
  rendered from the same normalized layout so every size matches the preview.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Hand the entry in with `node main.ts` (copies `app/` and `screenshots/` to
`/output` and writes `dossier.json`; outside the grader, set
`MAKEFUN_OUTPUT_DIR`).

## Notes

- Pure static app: `app/index.html` + ES modules + canvas 2D. No libraries,
  no build step, no network.
- Fonts are bundled locally: Noto Sans Display Condensed (Regular / Bold /
  Black), SIL Open Font License 1.1 — see `app/fonts/OFL.txt`.
- The two sample photos in `app/samples/` came with the make.fun starter kit
  and are free to use. Your own photos never leave the page.
- Screenshot scenes: `?shot=editor` (studio, photo loaded) and
  `?shot=cover` (finished cover alone), with `photo`, `title`, `subtitle`,
  `grade`, `layout` and `seed` parameters; `window.__shotReady` fires once
  painted.
