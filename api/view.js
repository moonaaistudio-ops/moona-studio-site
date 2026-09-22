/* Moona — page-view ping for pitch pages.
   A pitch page (currently /marina) calls this once per load, and the home
   page calls it when reached through an outreach link (?c=<code>). We mail the
   studio inbox one line per view: page, country, city, device, time.
   No cookies, no identifiers stored, nothing persisted here. A warm instance
   remembers recent viewer hashes for a short while so one person refreshing
   does not mail us ten times.

   Uses the same SMTP_USER / SMTP_PASS as the lead form. LEAD_TO optional. */
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const PAGES = new Set(['/marina/', '/marina', '/marina/ep1/', '/marina/ep1', '/goom/v1/', '/goom/v1', '/sj/v1/', '/sj/v1']);
/* server-side copy of every view to PostHog: survives ad blockers and a broken SMTP */
const PH_KEY = 'phc_tR7sebAcZCkQvnc475AGEXGYhpmXxFa4JZTD4fQXrhuW';
const PH_HOST = 'https://us.i.posthog.com';
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
  const code = String(body.code || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (!PAGES.has(page) && !(page === '/' && code)) return res.status(204).end();

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  const key = crypto.createHash('sha256').update(page + '|' + code + '|' + ip + '|' + ua).digest('hex');
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > QUIET_MS) recent.delete(k);
  if (recent.has(key)) return res.status(204).end();
  recent.set(key, now);

  const country = req.headers['x-vercel-ip-country'] || '?';
  const city = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')) || '?';
  const when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false });
  const ref = String(body.ref || '').slice(0, 120) || 'ישיר';
  const line = `${page}${code ? '  ·  קוד ' + code : ''}  ·  ${country} / ${city}  ·  ${device(ua)}  ·  ${when}  ·  מקור: ${ref}`;

  /* PostHog first: it needs no credentials and is the channel that is known to work */
  try {
    await fetch(PH_HOST + '/capture/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PH_KEY, event: 'brief_view', distinct_id: 'server:' + key.slice(0, 16),
        properties: { page, code, country, city, device: device(ua), ref, $ip: ip, $lib: 'moona-view' } })
    });
  } catch {}
  console.log('[view]', line);

  /* same normalisation as lead.js: App Passwords are shown with spaces */
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (!user || !pass) return res.status(204).json ? res.status(204).end() : res.end();
  try {
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await transport.sendMail({
      from: `"Moona site" <${user}>`,
      to: process.env.LEAD_TO || user,
      subject: `צפייה בבריף: ${page}${code ? ' · ' + code : ''}`,
      text: line
    });
  } catch (err) {
    /* a view is not worth an error page; surface the reason only when asked */
    if (body.debug) return res.status(200).json({ ok: false, error: String(err && err.message || err) });
  }
  if (body.debug) return res.status(200).json({ ok: true, line });
  return res.status(204).end();
};

function safeParse(s) { try { return JSON.parse(s) } catch { return null } }
