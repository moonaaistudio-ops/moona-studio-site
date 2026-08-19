# Moona — studio site

AI-native studio for film and motion ads. Single-page static site, no build step.

## What's here

- `index.html` — the whole site: aurora WebGL shader, canvas starfield, cursor/touch stardust trail, and the five-step request flow
- `v/` — the work films (H.264, web-optimised)
- `p/` — poster frames
- `netlify.toml` — publishes the folder as-is; no build minutes consumed

## Deploying

Connect this repo to Netlify. Publish directory `.`, build command empty.

## The request form

Posts to Netlify Forms as `sample-request` (name, website, company, email, attachments).
Two things to set per Netlify account:

1. **Forms → enable form detection**, then redeploy — detection runs at deploy time
2. **Forms → sample-request → Settings → Form notifications** → add email notification
   to `moona.ai.studio@gmail.com`

If the POST fails the flow falls back to a prefilled mailto so a lead is never lost.
