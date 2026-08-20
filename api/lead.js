/* Moona — lead intake.
   Runs on Vercel's Node runtime. The lead never leaves our own infrastructure:
   this function talks straight to Gmail over SMTP with the studio's own
   credentials. No form service in the middle.

   Required environment variables (Vercel → Settings → Environment Variables):
     SMTP_USER  moona.ai.studio@gmail.com
     SMTP_PASS  a Google App Password (16 chars, NOT the account password)
     LEAD_TO    optional; defaults to SMTP_USER
*/
const nodemailer = require('nodemailer');

const MAX_FIELD = 400;          /* chars per text field                */
const MAX_FILES = 6;
const MAX_BYTES = 3.5 * 1024 * 1024;   /* total attachments, decoded    */

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = v => String(v == null ? '' : v).trim().slice(0, MAX_FIELD);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }

  /* only our own pages may post here */
  const origin = req.headers.origin;
  if (origin) {
    let host;
    try { host = new URL(origin).host } catch { host = null }
    if (host !== req.headers.host) return res.status(403).json({ ok: false, error: 'origin' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (!body) return res.status(400).json({ ok: false, error: 'body' });

  /* the honeypot the form already carries — humans never fill it */
  if (clean(body['bot-field'])) return res.status(200).json({ ok: true });

  const name    = clean(body.name);
  const company = clean(body.company);
  const website = clean(body.website);
  const email   = clean(body.email);

  if (!name || !company || !website || !email) return res.status(422).json({ ok: false, error: 'missing' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(422).json({ ok: false, error: 'email' });

  /* attachments arrive base64 in JSON, so there is no multipart to parse */
  const attachments = [];
  let total = 0;
  for (const f of (Array.isArray(body.files) ? body.files : []).slice(0, MAX_FILES)) {
    const data = String(f && f.data || '');
    const bytes = Math.floor(data.length * 3 / 4);
    if (!data || total + bytes > MAX_BYTES) break;
    total += bytes;
    attachments.push({
      filename: clean(f.name) || 'attachment',
      content: Buffer.from(data, 'base64'),
      contentType: clean(f.type) || 'application/octet-stream'
    });
  }
  const skipped = (Array.isArray(body.files) ? body.files.length : 0) - attachments.length;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.error('lead: SMTP_USER / SMTP_PASS are not set');
    return res.status(503).json({ ok: false, error: 'unconfigured' });
  }

  const row = (k, v) =>
    `<tr><td style="padding:6px 18px 6px 0;color:#8a8a8a;font:12px ui-monospace,monospace;` +
    `letter-spacing:.08em;text-transform:uppercase;vertical-align:top">${k}</td>` +
    `<td style="padding:6px 0;font:15px -apple-system,Segoe UI,sans-serif;color:#111">${esc(v)}</td></tr>`;

  const site = new URL(website.startsWith('http') ? website : 'https://' + website).href;

  const html =
    `<div style="max-width:560px;font:15px -apple-system,Segoe UI,sans-serif">` +
    `<p style="font:12px ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:#8a8a8a">New ad request</p>` +
    `<table style="border-collapse:collapse;margin-top:8px">` +
      row('Name', name) + row('Company', company) +
      `<tr><td style="padding:6px 18px 6px 0;color:#8a8a8a;font:12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase">Website</td>` +
      `<td style="padding:6px 0"><a href="${esc(site)}">${esc(website)}</a></td></tr>` +
      `<tr><td style="padding:6px 18px 6px 0;color:#8a8a8a;font:12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase">Email</td>` +
      `<td style="padding:6px 0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>` +
      row('Files', attachments.length
        ? attachments.map(a => a.filename).join(', ') + (skipped > 0 ? ` (+${skipped} too large to attach)` : '')
        : 'none') +
    `</table></div>`;

  const text = [
    'New ad request', '',
    'Name:    ' + name,
    'Company: ' + company,
    'Website: ' + website,
    'Email:   ' + email,
    'Files:   ' + (attachments.map(a => a.filename).join(', ') || 'none')
  ].join('\n');

  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass }
    });
    await transport.sendMail({
      from: `"Moona site" <${user}>`,
      to: process.env.LEAD_TO || user,
      replyTo: `"${name}" <${email}>`,     /* hitting reply answers the lead */
      subject: `New ad request — ${company}`,
      text, html, attachments
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead: send failed', err && err.message);
    return res.status(502).json({ ok: false, error: 'send' });
  }
};

function safeParse(s) { try { return JSON.parse(s) } catch { return null } }
