#!/usr/bin/env node
/* Every HTML page on this site must load /ph.js (PostHog, cookieless, with session replay).
   Vercel runs this as `vercel-build` on every deploy: any page that lacks the tag gets it
   injected before </head>, so a page added later is covered even if nobody remembered.
   `node scripts/ensure-posthog.js --check` only reports and exits 1 (used by publish.sh). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skip = new Set(['node_modules', '.git', '.vercel', '.claude', 'tests', 'scripts']);
const tag = '<script src="/ph.js"></script>';
const checkOnly = process.argv.includes('--check');

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const missing = [];
for (const file of walk(root, [])) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('/ph.js')) continue;
  const rel = path.relative(root, file);
  missing.push(rel);
  if (checkOnly) continue;
  const at = html.search(/<\/head>/i);
  const fixed = at >= 0 ? html.slice(0, at) + tag + '\n' + html.slice(at) : tag + '\n' + html;
  fs.writeFileSync(file, fixed);
}

if (checkOnly) {
  if (missing.length) {
    console.error('PostHog (/ph.js) missing on: ' + missing.join(', '));
    process.exit(1);
  }
  console.log('PostHog (/ph.js) present on every page.');
} else {
  console.log(missing.length ? 'Injected /ph.js into: ' + missing.join(', ') : 'Every page already loads /ph.js.');
}
