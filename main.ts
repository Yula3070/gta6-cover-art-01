// Neon Vice Cover Studio — entry program for gta6-cover-art-01 (Node 22, stdlib only).
//
// The actual product is the static web app in app/: an offline cover-art maker that
// turns local photos into multi-panel GTA-style posters. This program only hands the
// app in: it mirrors app/ and screenshots/ into the output directory and writes
// dossier.json with the vendored make.fun library, exactly as the scorer expects.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Local app:  node serve.ts   ->  http://localhost:8080

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gate caps from the kit's reference/gate.json. text_max_bytes shapes the dossier
// bytes; the rest make buildDossier refuse anything the scorer would refuse.
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

function countFiles(dir: string): number {
  let total = 0;
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else total++;
    }
  };
  if (existsSync(dir)) walk(dir);
  return total;
}

if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}

copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, GATE_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(
  `Neon Vice Cover Studio handed in: ${countFiles(join(outputDir, 'app'))} app files, ` +
    `${countFiles(join(outputDir, 'screenshots'))} screenshots, dossier ${Buffer.byteLength(dossier)} bytes -> ${outputDir}`,
);
