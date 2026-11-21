# Neon Palms Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

## About

Neon Palms Cover Studio turns your own photos and a caption into GTA-style
cover art: a multi-panel poster mosaic with white comic borders, a Vice
City sunset grade, chrome-gradient title lettering, cast tags, a movie
billing block and a studio seal — exported as a PNG in the three common
post sizes (1080 x 1080, 1080 x 1350, 1920 x 1080).

Everything runs offline in your browser. Photos are read on your machine
and never uploaded; there is no build step and no network request.

## How to use

1. Open `app/index.html` in a desktop browser (or serve `app/` with any
   static file server, e.g. `node serve.ts`).
2. Add your photos, or start from the four painted demo scenes and two
   sample photos that load by default.
3. Pick a panel layout (cast mosaic, poster grid, hero + strip, triptych,
   duo, solo) and a colour grade (Vice Sunset, Neon Noir, Golden Mile,
   Miami Teal, Magenta Heat, Poster Ink).
4. Click a panel on the cover to select it, drag to reposition its photo,
   scroll to zoom. Give panels cast tags — they print on the panel and in
   the billing block.
5. Edit the title and subtitle, choose a post size, and export the PNG —
   or export all three sizes at once.

## Entry layout

- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output and writes `dossier.json` with the kit's `buildDossier`.
- `app/` — the studio itself (plain HTML/CSS/ES modules, no libraries).
  - `app/src/cover.js` — the cover renderer (layouts, grades, lettering).
  - `app/src/scenes.js` — procedural demo photos painted on canvas.
  - `app/src/main.js` — editor wiring (drag-crop, zoom, export).
  - `app/src/shots.js` — fixed scenes for the maker's screenshots.
- `screenshots/` — the cover and editor screenshots the judge reads.
- `serve.ts` — a tiny local static server for trying the app.

## License

MIT — see `LICENSE`. The two sample photos under `app/samples/` were made
for make.fun with an image model and are free to use. All artwork, lettering
and code in this entry are original; no game logos, artwork or fonts are used.
