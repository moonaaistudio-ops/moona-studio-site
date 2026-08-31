const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/**
 * The tokens live in design-system/src/tokens/tokens.css. index.html carries a
 * generated copy between the @moona-tokens markers, so the page still paints in
 * one round trip. These tests are what stop the two from drifting apart, and
 * what prove the generated block actually resolves in the browser.
 */

test('index.html tokens are in sync with the design system', () => {
  execFileSync(
    process.execPath,
    [path.join(ROOT, 'design-system/scripts/sync-tokens.mjs'), '--check'],
    { cwd: ROOT, stdio: 'pipe' }
  );
});

const readVars = names => page => page.evaluate(list => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(list.map(n => [n, s.getPropertyValue(n).trim()]));
}, names);

test('the generated block defines every token the stylesheet consumes', async ({ page }) => {
  await page.goto('/');
  const vars = await readVars([
    '--void', '--void-2', '--ice', '--ice-hot', '--ice-dim', '--ice-faint', '--line',
    '--mono', '--sans', '--serif', '--ease', '--r-pill', '--r-lg', '--r-md',
    '--color-1', '--color-5', '--speed',
    '--he-emphasis-weight', '--he-emphasis-color',
    '--moona-gold', '--moona-gold-ink', '--moona-danger'
  ])(page);

  for (const [name, value] of Object.entries(vars)) {
    expect(value, `${name} must resolve`).not.toBe('');
  }

  expect(vars['--void']).toBe('#05070c');
  expect(vars['--ice-hot']).toBe('#dcecff');
  expect(vars['--moona-gold']).toBe('#d9c69c');
  expect(vars['--r-pill']).toBe('999px');
  expect(vars['--speed']).toBe('2s');
  expect(vars['--sans']).toContain('Inter Tight');
  expect(vars['--serif']).toContain('Instrument Serif');
});

test('Hebrew swaps the two text faces and leaves mono alone', async ({ page }) => {
  await page.goto('/?lang=he');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');

  const vars = await readVars(['--sans', '--serif', '--mono'])(page);
  expect(vars['--sans']).toContain('Assistant');
  expect(vars['--serif']).toContain('Frank Ruhl Libre');
  expect(vars['--mono']).toContain('SF Mono');
});

test('the tokens still paint the page they came from', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(5, 7, 12)');

  const cta = page.locator('.contact .cta-btn').first();
  await expect(cta).toHaveCSS('color', 'rgb(13, 11, 7)');
  await expect(cta).toHaveCSS('border-radius', '999px');
});
