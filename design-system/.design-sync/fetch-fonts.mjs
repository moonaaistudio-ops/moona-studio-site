#!/usr/bin/env node
// One-shot: pull the DS's four brand families from Google Fonts into
// .design-sync/fonts/ as self-hosted woff2 + a single @font-face sheet,
// so cfg.extraFonts can ship them (no runtime CDN dependency).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.design-sync/fonts';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FAMILIES = [
  'Inter+Tight:wght@400;500;600',
  'Instrument+Serif:ital@0;1',
  'Assistant:wght@400;500;600',
  'Frank+Ruhl+Libre:wght@400;600',
];

mkdirSync(OUT, { recursive: true });

const url = `https://fonts.googleapis.com/css2?${FAMILIES.map((f) => `family=${f}`).join('&')}&display=swap`;
const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();

const seen = new Map();
let n = 0;
let out = css;
for (const m of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)) {
  const remote = m[1];
  if (seen.has(remote)) continue;
  const name = remote.split('/').slice(-3).join('-').replace(/[^\w.-]/g, '_');
  seen.set(remote, name);
  if (!existsSync(join(OUT, name))) {
    const buf = Buffer.from(await (await fetch(remote, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(join(OUT, name), buf);
    n++;
  }
}
for (const [remote, name] of seen) out = out.split(remote).join(`./${name}`);

writeFileSync(join(OUT, 'fonts.css'), out);
console.error(`fonts: ${seen.size} faces (${n} downloaded) → ${OUT}/fonts.css`);
