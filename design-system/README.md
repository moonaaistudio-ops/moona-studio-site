# Moona Design System

The tokens and components behind this site. Extracted from the live
`index.html`, not invented for the package — and now the other way round:
`tokens.css` is the source, and `index.html` carries a generated copy.

```
design-system/
  src/tokens/tokens.css      SOURCE OF TRUTH — CSS custom properties
  src/tokens/tokens.ts       the same values, typed, for tooling and TS callers
  src/styles/components.css  component styles, every value reading a token
  src/components/*.tsx       13 React components
  scripts/sync-tokens.mjs    writes the tokens into index.html
```

## Changing a token

The site keeps its CSS inline — that is why it paints in one round trip, and a
`<link>` to a token sheet would cost a second one. So the tokens are *written
into* `index.html`, between the `@moona-tokens` markers.

```bash
# 1. edit design-system/src/tokens/tokens.css
# 2. push it into the page
node design-system/scripts/sync-tokens.mjs
```

Never edit the block inside `index.html`. `tests/tokens.spec.js` runs the
script in `--check` mode and fails the build if the two have drifted, then
proves in a real browser that every token still resolves and still paints.

## Using the components

```bash
cd design-system && npm install
```

```ts
import '@moona/design-system';           // tokens.css + components.css + all exports
import { Button, Frame, Card } from '@moona/design-system';
```

Or take the layers separately:

```ts
import '@moona/design-system/tokens.css';
import { tokens } from '@moona/design-system/tokens';
```

## The system in one paragraph

Everything sits on **void** (`#05070c`). **Ice** (`#a8c6e8` → `#dcecff`) is the
voice of the interface: text, rules, HUD. **Gold** (`#d9c69c`) is the only
colour that acts — CTA, focus rings, progress, emphasis. There is no third
accent, and no semantic palette beyond one danger tone for form errors.

Three faces: **Instrument Serif** for headlines, **Inter Tight** for body,
**SF Mono** for every label, badge, timestamp and the brand lockup. The mono
idiom — 10px, uppercase, `.28em` tracking — is what makes a label a label.

One rounded family: `--r-pill` (999px) for buttons and chips, `--r-lg` (20px)
for media, `--r-md` (14px) for panels. The CTA pill is the extreme of that
family, not an outlier.

Every interactive target clears **44px**. The site draws its own cursor, which
trails its true position; a small target is not worth aiming at with a cursor
that lies.

## Hebrew

The system is bilingual. Under `html[lang="he"]`:

- `--moona-sans` becomes Assistant, `--moona-serif` becomes Frank Ruhl Libre.
- Mono stays Latin on purpose — the HUD, timestamps and brand marks are Latin
  in both languages.
- Instrument Serif's Hebrew fallback has no italic, so `<em>` inside a headline
  switches from italic-gold to weight-plus-colour (`--he-emphasis-weight`,
  `--he-emphasis-color`). You still only write `<em>`.
- Labels drop their letter-spacing. Hebrew nav labels are wider than the Latin
  ones, and `letter-spacing:0` is what keeps the header row fitting a 375px
  phone.
- Numerals, durations and the HUD keep `direction:ltr; unicode-bidi:isolate`
  (`.mn-ltr`), so a timestamp never reorders inside an RTL sentence.

## Components

| Component | What it is |
|---|---|
| `Button` | The primary CTA — white pill inside an animated warm-gold border. One per view. `sm` / `md` / `lg`. |
| `MailButton` | The second door. Dark with a gold hairline, so it never competes with the primary. |
| `IconButton` | 44px round control over video: gold hairline on a void scrim. |
| `Chip` | One pill, three voices — `spec` (gold outline), `plain` (ice on scrim), `file` (removable, with a danger state). |
| `SectionHeading` | Eyebrow, serif headline, note. The opener every section shares. |
| `Frame` | The media surface and the signature aperture reveal. Declares its ratio so nothing reflows when the video arrives. |
| `Card` | A story beat: void glass, ember glow from the floor, lit bottom edge, optional tilt. |
| `Steps` | Joined dots — "three, and you are here", sitting with the question. |
| `FileDrop` | The attachment control: icon, plain-language action, visible Browse. |
| `Header` + `Lockup` / `Nav` / `NavLink` / `RoundButton` | The fixed top bar. Gradient, click-through, children take the pointer. |
| `Marquee` + `MarqueeItem` | Endless work strip. Masked at both edges; two rows must run at two speeds. |
| `Reveal` | Rise-and-fade on first sight. Once seen, stays seen. |
| `Section` | Vertical rhythm, max width, the shared fluid gutter. |

## Motion

`--ease: cubic-bezier(.16,1,.3,1)` on everything. Two rules the site earned
the hard way:

- **A video layer costs the compositor whether or not it is playing.** Four at
  full width halve the frame rate across the page. Mount the video only for the
  piece you are near; the poster holds the frame.
- **Do not animate a blur.** The hero halo was a 60px `text-shadow` on a node
  whose opacity changed every frame, and the browser re-blurred the whole
  headline 60 times a second. It is a gradient behind the text now.

Every animation has a `prefers-reduced-motion` branch, and `Reveal` shows its
content outright under it — an observer that never fires can never leave the
page blank.

## Checks

```bash
node design-system/scripts/sync-tokens.mjs --check   # tokens match the page
cd design-system && npx tsc --noEmit                 # components typecheck
npx --prefix tests playwright test --config=playwright.config.js tests/tokens.spec.js
```

## Claude Design

`/design-sync` reads this package — the tokens and the React components — and
publishes it to the org's design systems. It has to be typed by a human at the
Claude Code prompt, from inside `design-system/`; asking Claude to run it does
not work.
