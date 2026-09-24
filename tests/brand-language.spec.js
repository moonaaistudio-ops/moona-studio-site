const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { phrases, dashes } = require('./brand-language.json');

const hitsIn = (text, list) => list.filter(p => text.toLowerCase().includes(p.toLowerCase()));

test('i18n dictionary carries no banned phrase or dash', () => {
  const source = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  expect(hitsIn(source, phrases)).toEqual([]);
  expect(hitsIn(source, dashes)).toEqual([]);
});

test('index.html static fallback markup carries no banned phrase or dash', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  expect(hitsIn(stripped, phrases)).toEqual([]);
  expect(hitsIn(stripped, dashes)).toEqual([]);
});

for (const locale of ['en', 'he']) {
  test(`rendered home page in ${locale} carries no banned phrase or dash`, async ({ page }) => {
    await page.goto(`/?lang=${locale}`);
    await page.waitForFunction(() => window.MoonaI18n
      && !document.documentElement.classList.contains('i18n-pending'));
    const text = await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('script,style,noscript,template').forEach(node => node.remove());
      const attributes = [...document.querySelectorAll('[aria-label],[alt],[placeholder],[title]')]
        .flatMap(el => ['aria-label', 'alt', 'placeholder', 'title']
          .map(name => el.getAttribute(name)).filter(Boolean));
      const metas = [...document.querySelectorAll('meta[content]')].map(meta => meta.content);
      return [document.title, clone.textContent, ...attributes, ...metas].join('\n');
    });
    expect(hitsIn(text, phrases)).toEqual([]);
    expect(hitsIn(text, dashes)).toEqual([]);
  });
}
