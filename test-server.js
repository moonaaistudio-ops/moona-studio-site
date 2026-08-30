'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4317);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function parseCookies(header = '') {
  return header.split(';').reduce((result, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return result;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) return result;
    try { result[key] = decodeURIComponent(value); } catch (_) { result[key] = value; }
    return result;
  }, {});
}

function send(res, status, body, contentType) {
  if (res.destroyed || res.writableEnded) return;
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    'Content-Length': payload.length
  });
  res.end(payload);
}

function streamFile(res, filePath, options) {
  const stream = fs.createReadStream(filePath, options);
  const stop = () => stream.destroy();
  res.once('close', stop);
  res.once('error', stop);
  stream.once('error', error => {
    if (!res.headersSent) send(res, 500, 'Unable to read file', 'text/plain; charset=utf-8');
    else res.destroy(error);
  });
  stream.pipe(res);
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      return;
    }

    const type = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Type': type
      });
      if (req.method === 'HEAD') res.end();
      else streamFile(res, filePath, { start, end });
      return;
    }

    res.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Content-Length': stat.size,
      'Content-Type': type
    });
    if (req.method === 'HEAD') res.end();
    else streamFile(res, filePath);
  });
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`); }
  catch (_) {
    send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (url.pathname === '/__health') {
    send(res, 200, 'ok', 'text/plain; charset=utf-8');
    return;
  }

  if (url.pathname === '/api/analytics-config.js') {
    const enabled = cookies.e2e_analytics === 'enabled';
    const config = enabled ? { gaMeasurementId: 'G-E2ETEST' } : {};
    send(
      res,
      200,
      `window.MOONA_ANALYTICS_CONFIG = ${JSON.stringify(config)};`,
      'application/javascript; charset=utf-8'
    );
    return;
  }

  if (url.pathname === '/api/lead') {
    if (req.method !== 'POST') {
      send(res, 405, JSON.stringify({ ok: false, error: 'method' }), 'application/json; charset=utf-8');
      return;
    }
    req.resume();
    req.on('end', () => {
      if (cookies.e2e_lead === 'fail') {
        send(res, 503, JSON.stringify({ ok: false, error: 'unconfigured' }), 'application/json; charset=utf-8');
      } else {
        send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
      }
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (_) {
    send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  if (relative === 'i18n.js' && cookies.e2e_i18n === 'fail') {
    send(res, 404, 'Mocked i18n failure', 'text/plain; charset=utf-8');
    return;
  }
  if (relative === 'i18n.js' && cookies.e2e_i18n === 'delay') {
    setTimeout(() => serveFile(req, res, filePath), 700);
    return;
  }
  serveFile(req, res, filePath);
});

server.listen(port, host, () => {
  process.stdout.write(`Moona E2E server listening on http://${host}:${port}\n`);
});

server.on('clientError', (_error, socket) => socket.destroy());

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 2_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
