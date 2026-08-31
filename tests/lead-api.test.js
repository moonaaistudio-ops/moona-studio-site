const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const lead = require('../api/lead');

const originalCreateTransport = nodemailer.createTransport;
const originalEnv = {
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  LEAD_TO: process.env.LEAD_TO
};

function request(body, headers = {}) {
  return {
    method: 'POST',
    headers: { host: 'moona.test', ...headers },
    body
  };
}

function response() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

function validBody(overrides = {}) {
  return {
    name: 'Tal Visitor',
    email: 'tal@example.com',
    website: 'example.com',
    brief: 'A cinematic launch film for our new global campaign.',
    files: [],
    'bot-field': '',
    ...overrides
  };
}

test.beforeEach(() => {
  process.env.SMTP_USER = 'studio@example.com';
  process.env.SMTP_PASS = 'abcdefghijklmnop';
  delete process.env.LEAD_TO;
});

test.afterEach(() => {
  nodemailer.createTransport = originalCreateTransport;
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('requires a trimmed brief between 20 and 1200 characters', async () => {
  let transportCalls = 0;
  nodemailer.createTransport = () => {
    transportCalls += 1;
    return { sendMail: async () => {} };
  };

  for (const brief of [undefined, ' '.repeat(8), 'x'.repeat(19), `  ${'x'.repeat(1201)}  `]) {
    const res = response();
    await lead(request(validBody({ brief })), res);
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.payload, { ok: false, error: 'brief' });
  }

  assert.equal(transportCalls, 0);

  for (const brief of ['x'.repeat(20), `  ${'x'.repeat(1200)}  `]) {
    const res = response();
    await lead(request(validBody({ brief })), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { ok: true });
  }

  assert.equal(transportCalls, 2);
});

test('includes the trimmed brief in SMTP text and escaped HTML', async () => {
  let message;
  nodemailer.createTransport = options => {
    assert.equal(options.host, 'smtp.gmail.com');
    return { sendMail: async value => { message = value; } };
  };

  const brief = '  Create <launch>& "now" with a cinematic product reveal.  ';
  const res = response();
  await lead(request(JSON.stringify(validBody({ brief }))), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { ok: true });
  assert.ok(message);
  assert.match(message.text, /Brief:\nCreate <launch>& "now" with a cinematic product reveal\./);
  assert.match(message.html, /Create &lt;launch&gt;&amp; &quot;now&quot; with a cinematic product reveal\./);
  assert.doesNotMatch(message.html, /Create <launch>/);
  assert.equal(message.subject, 'New ad request: example.com');
});

test('rejects an invalid website with the normal API error shape', async () => {
  nodemailer.createTransport = () => {
    throw new Error('transport should not be created for an invalid website');
  };

  const res = response();
  await lead(request(validBody({ website: 'not a valid host / path' })), res);

  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.payload, { ok: false, error: 'website' });
});

test('keeps the honeypot silent-success behavior without processing a brief', async () => {
  nodemailer.createTransport = () => {
    throw new Error('transport should not be created for honeypot submissions');
  };

  const res = response();
  await lead(request({ 'bot-field': 'filled by bot' }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { ok: true });
});
