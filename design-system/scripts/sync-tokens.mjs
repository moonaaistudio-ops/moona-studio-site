#!/usr/bin/env node
/**
 * One source of truth for the design tokens.
 *
 * The site keeps its CSS inline — that is the reason it paints in one round
 * trip, and a <link> to a token sheet would cost a second one. So instead of
 * the site importing the package, this script writes the package's tokens
 * INTO index.html, between two markers.
 *
 *   node design-system/scripts/sync-tokens.mjs           write
 *   node design-system/scripts/sync-tokens.mjs --check   fail if out of date
 *
 * The E2E suite runs --check, so the two can never drift silently.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, '../src/tokens/tokens.css');
const TARGET = resolve(here, '../../index.html');

const START = '/* @moona-tokens:start */';
const END = '/* @moona-tokens:end */';

const banner =
  '/* Generated from design-system/src/tokens/tokens.css — do not edit here.\n' +
  '   Change the token there, then: node design-system/scripts/sync-tokens.mjs */';

function build() {
  const tokens = readFileSync(SOURCE, 'utf8').trimEnd();
  return `${START}\n${banner}\n${tokens}\n${END}`;
}

function splice(html, block) {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a === -1 || b === -1) {
    throw new Error(
      `Token markers not found in ${TARGET}. Expected ${START} … ${END}.`,
    );
  }
  return html.slice(0, a) + block + html.slice(b + END.length);
}

const html = readFileSync(TARGET, 'utf8');
const next = splice(html, build());
const check = process.argv.includes('--check');

if (next === html) {
  if (!check) console.log('tokens: already in sync');
  process.exit(0);
}

if (check) {
  console.error(
    'tokens: index.html is out of date with design-system/src/tokens/tokens.css.\n' +
      'Run: node design-system/scripts/sync-tokens.mjs',
  );
  process.exit(1);
}

writeFileSync(TARGET, next);
console.log('tokens: index.html updated');
