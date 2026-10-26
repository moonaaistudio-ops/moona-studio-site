const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const view = require('../api/view');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', 'tests', '.git', '.vercel', '.claude']);

/* every page that reports its own pathname to /api/view, as the path the browser sends */
function pingingPages(dir = ROOT) {
  const pages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pages.push(...pingingPages(full));
    else if (entry.name === 'index.html') {
      const html = fs.readFileSync(full, 'utf8');
      if (/fetch\('\/api\/view'[\s\S]{0,200}page:location\.pathname/.test(html)) {
        pages.push('/' + path.relative(ROOT, dir).split(path.sep).join('/') + '/');
      }
    }
  }
  return pages;
}

function response() {
  return {
    statusCode: 200,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json() { return this; },
    end() { return this; }
  };
}

const originalFetch = global.fetch;
const originalEnv = { SMTP_USER: process.env.SMTP_USER, SMTP_PASS: process.env.SMTP_PASS };

test.beforeEach(() => {
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
});

test.after(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('every brief page that pings /api/view is tracked, so its views reach the inbox and PostHog', async () => {
  const pages = pingingPages();
  assert.ok(pages.includes('/lulies/v1/'), 'the scan finds the brief pages');
  const untracked = [];
  for (const page of pages) {
    const sent = [];
    global.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return { ok: true }; };
    await view({ method: 'POST', headers: { 'user-agent': `test ${page}` }, body: { page, code: 'e2e' } }, response());
    if (!sent.some(event => event.event === 'brief_view' && event.properties.page === page)) untracked.push(page);
  }
  assert.deepEqual(untracked, []);
});

test('an unknown page is ignored and sends nothing', async () => {
  const sent = [];
  global.fetch = async (url, options) => { sent.push(options); return { ok: true }; };
  const res = response();
  await view({ method: 'POST', headers: {}, body: { page: '/not-a-brief/' } }, res);
  assert.equal(res.statusCode, 204);
  assert.equal(sent.length, 0);
});

test('the home page reports a view only when the outreach link carries a ?c= code', async () => {
  const sent = [];
  global.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return { ok: true }; };
  await view({ method: 'POST', headers: { 'user-agent': 'home-without-code' }, body: { page: '/' } }, response());
  assert.equal(sent.length, 0);
  await view({ method: 'POST', headers: { 'user-agent': 'home-with-code' }, body: { page: '/', code: 'assaf' } }, response());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].properties.code, 'assaf');
});
