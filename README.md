# Moona — studio site

AI-native studio for film and motion ads. The site is static HTML, CSS and JavaScript, with one Vercel serverless function for project inquiries.

## What's here

- `index.html` — the main site and request flow
- `i18n.js` — shared English/Hebrew locale runtime and semantic copy
- `privacy.html` — consent and privacy notice in both languages
- `accessibility.html` — bilingual accessibility statement, tested features and known limitations
- `analytics.js` — consent-gated analytics client
- `api/lead.js` — serverless email handler
- `v/` and `p/` — films and poster/still assets
- `tests/` — focused Playwright and axe coverage for locale, RTL, accessibility, state and form behavior

English is the default. A language choice is shared as `?lang=en|he` and stored under `moona.locale` when browser storage is available.

## Local testing

```sh
npm ci
npm ci --prefix tests
npm --prefix tests exec -- playwright install chromium
npm run test:e2e
```

The Playwright harness has its own development-only package under `tests/`. The configuration starts the repository's dependency-free static test server automatically. Tests mock lead submission and analytics; they do not send email or analytics data.

## Accessibility

The site includes semantic landmarks, keyboard navigation, visible focus, translated accessible names, form error announcements, reduced-motion support and a persistent motion control. Automated axe checks run in Chromium alongside keyboard and reflow tests.

The public accessibility statement lists the features that were verified and the limitations that remain. It intentionally does not claim a completed external screen-reader certification. Portfolio films that do not yet include complete captions or audio description are identified as a known limitation, and an accessible written alternative can be requested by email.

## Deployment

Vercel is the only production path. The repository is already linked to its Vercel project, and production deploys from `main`.

1. Work on a feature branch and run `npm run test:e2e`.
2. Create a Vercel Preview for browser acceptance.
3. Merge the verified change to `main`; do not run `vercel --prod` manually.

`vercel.json` installs production dependencies with `npm ci --omit=dev`. The Playwright package is isolated under `tests/` and excluded from deployment, while `nodemailer` remains available to `api/lead.js`.

`netlify.toml` is retained for historical compatibility, but Netlify is not the production deployment path.

## Request form

The client first posts to `/api/lead`. The handler requires the SMTP environment variables documented in `api/lead.js`. If the API and hosted fallback both fail, the browser opens a translated, prefilled email so the inquiry is not lost.
