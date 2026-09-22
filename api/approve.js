/* Moona — quote approval.
   The quote page posts the approver's name, role and email plus a consent
   tick. We mail the studio inbox one record per approval (with time, country,
   device) and send the approver a copy, so both sides hold the same receipt.
   A server-side event also goes to PostHog. Nothing is persisted here.

   Same SMTP_USER / SMTP_PASS as the lead form. LEAD_TO optional. */
const nodemailer = require('nodemailer');

const QUOTES = new Set(['MS-2026-031']);
const PH_KEY = 'phc_tR7sebAcZCkQvnc475AGEXGYhpmXxFa4JZTD4fQXrhuW';
const PH_HOST = 'https://us.i.posthog.com';

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = v => String(v == null ? '' : v).trim().slice(0, 200);
const device = ua => /iPhone|iPad/.test(ua) ? 'iPhone'
  : /Android/.test(ua) ? 'Android'
  : /Macintosh/.test(ua) ? 'Mac'
  : /Windows/.test(ua) ? 'Windows' : 'other';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }

  const origin = req.headers.origin;
  if (origin) {
    let host; try { host = new URL(origin).host } catch { host = null }
    if (host !== req.headers.host) return res.status(403).json({ ok: false, error: 'origin' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (!body) return res.status(400).json({ ok: false, error: 'body' });
  if (clean(body['bot-field'])) return res.status(200).json({ ok: true });

  const quote = clean(body.quote);
  const name = clean(body.name);
  const role = clean(body.role);
  const email = clean(body.email);
  const po = clean(body.po);
  const page = clean(body.page);
  const code = clean(body.code).replace(/[^\w-]/g, '');
  if (!QUOTES.has(quote)) return res.status(422).json({ ok: false, error: 'quote' });
  if (!name || !email || body.agree !== true) return res.status(422).json({ ok: false, error: 'missing' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(422).json({ ok: false, error: 'email' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  const country = req.headers['x-vercel-ip-country'] || '?';
  const city = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')) || '?';
  const when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false });
  const stamp = new Date().toISOString();

  try {
    await fetch(PH_HOST + '/capture/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PH_KEY, event: 'quote_approved', distinct_id: 'approver:' + email,
        properties: { quote, name, role, po, page, code, country, city, device: device(ua), $ip: ip, $lib: 'moona-approve' } })
    });
  } catch {}
  console.log('[approve]', quote, name, role, email, po, when);

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (!user || !pass) return res.status(503).json({ ok: false, error: 'unconfigured' });

  const row = (k, v) => `<tr><td style="padding:6px 0 6px 18px;color:#8a8a8a;font:12px ui-monospace,monospace;letter-spacing:.08em;vertical-align:top">${k}</td><td style="padding:6px 0;font:15px -apple-system,Segoe UI,sans-serif;color:#111">${esc(v)}</td></tr>`;
  const link = `https://${req.headers.host}${page || '/marina/quote/'}`;
  const table = `<table dir="rtl" style="border-collapse:collapse">${row('הצעה', quote)}${row('שם', name)}${row('תפקיד', role || '-')}${row('אימייל', email)}${row('הזמנת רכש', po || '-')}${row('מועד', when)}${row('מקום', `${country} / ${city} · ${device(ua)}`)}${row('עמוד', link)}</table>`;

  try {
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await transport.sendMail({
      from: `"Moona site" <${user}>`, to: process.env.LEAD_TO || user, replyTo: email,
      subject: `הצעה ${quote} אושרה · ${name}`,
      html: `<div dir="rtl" style="font-family:-apple-system,Segoe UI,sans-serif"><p style="font-size:16px">ההצעה אושרה בעמוד.</p>${table}</div>`
    });
    await transport.sendMail({
      from: `"MOONA STUDIO" <${user}>`, to: email, replyTo: user,
      subject: `אישור הצעה ${quote} · MOONA STUDIO`,
      html: `<div dir="rtl" style="font-family:-apple-system,Segoe UI,sans-serif;color:#111"><p style="font-size:16px">היי ${esc(name)},</p><p>תודה. ההצעה ${esc(quote)} אושרה ב-${esc(when)}. זה העותק שלך.</p>${table}<p>השלב הבא: התסריט של הפרק הראשון מגיע לאישור, ועם האישור חשבונית מקדמה.</p><p>טל צור · MOONA STUDIO · 054-6513133</p></div>`
    });
  } catch (err) {
    console.error('approve mail:', err && err.message || err);
    return res.status(502).json({ ok: false, error: 'mail' });
  }
  return res.status(200).json({ ok: true, when, stamp });
};

function safeParse(s) { try { return JSON.parse(s) } catch { return null } }
