# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Yula3070/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Vice Cover Studio** — an offline web app that turns your own photos and a caption into GTA 6-style cover art: multi-panel poster layouts (cover grid, hero + 3, film strip, full bleed), bold condensed lettering with a sunset gradient, five colour grades (Vice Sunset, Neon Night, Golden Hour, Poster Ink, Candy Pop), film grain and a white poster frame — exported as a PNG in 1080 × 1080, 1080 × 1350, 1920 × 1080 or 1080 × 1920. Everything runs in the browser from static files; your photos are read on your own machine and never uploaded.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — add a photo (or load a sample), pick a layout and a post size, click any panel to crop it (drag to reposition, scroll to zoom), choose a grade, edit the title and subtitle, and hit **Export PNG**.

## Hand it in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json` with the vendored make.fun library.

All art, lettering and code are original — no Rockstar Games logo, artwork or fonts. The display font is Noto Sans Display Condensed Black under the SIL Open Font License (see `app/fonts/OFL.txt`). The two sample photos in `app/samples/` were made with an image model for make.fun and are free to use.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tfznw81m&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
