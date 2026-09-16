/* Moona — page-view ping for pitch pages.
   A pitch page (currently /marina) calls this once per load. We mail the
   studio inbox one line per view: page, country, city, device, time.
   No cookies, no identifiers stored, nothing persisted here. A warm instance
   remembers recent viewer hashes for a short while so one person refreshing
   does not mail us ten times.

   Uses the same SMTP_USER / SMTP_PASS as the lead form. LEAD_TO optional. */
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const PAGES = new Set(['/marina/', '/marina']);
const QUIET_MS = 30 * 60 * 1000;
const recent = new Map();

const device = ua => /iPhone|iPad/.test(ua) ? 'iPhone'
  : /Android/.test(ua) ? 'Android'
  : /Macintosh/.test(ua) ? 'Mac'
  : /Windows/.test(ua) ? 'Windows' : 'other';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const page = String(body.page || '').slice(0, 64);
  if (!PAGES.has(page)) return res.status(204).end();

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  const key = crypto.createHash('sha256').update(page + '|' + ip + '|' + ua).digest('hex');
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > QUIET_MS) recent.delete(k);
  if (recent.has(key)) return res.status(204).end();
  recent.set(key, now);

  const country = req.headers['x-vercel-ip-country'] || '?';
  const city = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')) || '?';
  const when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false });
  const ref = String(body.ref || '').slice(0, 120) || 'ישיר';
  const line = `${page}  ·  ${country} / ${city}  ·  ${device(ua)}  ·  ${when}  ·  מקור: ${ref}`;

  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) return res.status(204).end();
  try {
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await transport.sendMail({
      from: `"Moona site" <${user}>`,
      to: process.env.LEAD_TO || user,
      subject: `צפייה בבריף: ${page}`,
      text: line
    });
  } catch (_) { /* a view is not worth an error page */ }
  return res.status(204).end();
};

function safeParse(s) { try { return JSON.parse(s) } catch { return null } }
