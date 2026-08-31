# design-sync notes — @moona/design-system

## Build

- **The package ships source, not a build.** `main`/`exports` point at
  `src/index.ts` and there is no `build` script. `cfg.buildCmd` therefore
  synthesises a real `dist/` in two steps: `tsc --emitDeclarationOnly` for the
  `.d.ts` tree (the repo's own `tsconfig.json` has `noEmit: true`, hence the
  `--noEmit false` override), then esbuild for `dist/index.js` + `dist/index.css`.
  Run it before the converter on every re-sync. Adding a real `build` script to
  `package.json` would let this collapse to `npm run build`.
- `dist/index.css` is the converter's `cssEntry`: esbuild concatenates
  `tokens.css` + `components.css` into it, so tokens reach designs through the
  `_ds_bundle.css` import closure. `ds-bundle/tokens/` stays empty by design —
  `tokensGlob` only applies to a separate tokens *package*, which this repo
  doesn't have. Nothing is missing; validate reports 84 tokens defined.
- 18 components from 13 files: `Header.tsx` also exports `Lockup`, `Nav`,
  `NavLink`, `RoundButton`, and `Marquee.tsx` also exports `MarqueeItem`.

## Fonts

- The DS ships **no** `@font-face`; the live site loads Inter Tight, Instrument
  Serif, Assistant and Frank Ruhl Libre from Google Fonts in its own HTML. That
  fired `[FONT_MISSING]`, so `.design-sync/fetch-fonts.mjs` self-hosts all four
  families into `.design-sync/fonts/` (17 woff2, ~430 KB) and `cfg.extraFonts`
  points at the generated `fonts.css`. **`.design-sync/fonts/` is committed** —
  without it the next sync re-fires `[FONT_MISSING]`. Re-run the script only to
  add a family or weight.

## Previews

- **Every cell must paint its own ground.** Preview cards render on `#fff` and
  this DS is drawn for `--moona-void`; an unwrapped component reads as unstyled.
  Each `previews/<Name>.tsx` opens with a `stage` style object — keep it.
- `Header` is `position: fixed`; its preview passes `style={{position:'static'}}`
  so the bar renders in flow instead of pinning to the viewport.
- **CSS `url()` gotcha:** `Frame`'s `poster` lands in an *unquoted* `url(...)`.
  `encodeURIComponent` does not escape parentheses, so the SVG's own `url(#s)`
  fill references terminate the declaration early and the frame renders black.
  `Frame.tsx` has an `enc()` helper that also escapes `(` and `)`. `Marquee` /
  `MarqueeItem` pass their SVGs through `<img src>`, which needs no such escape.
- Card modes: `Header`, `Card`, `Section`, `Marquee`, `MarqueeItem` are set to
  `cardMode: "column"`. The first two were flagged `[GRID_OVERFLOW]`; the rest
  are multi-column compositions that were merely cramped in a grid cell.
- Component grouping comes from frontmatter-only stubs in `.design-sync/docs/`
  (`category:` only). They exist to set the group — the `.prompt.md` body is
  still synthesised from the `.d.ts` and the source JSDoc, which is good here.
  If a component ever earns real prose, write it into its stub.

## Known render warns

None. The final validate exits clean with zero warnings — any warn on a future
run is new, so look at it rather than assuming it was always there.

## Deliberate omissions

- **No `disabled` cell for `Button`.** The DS defines no `:disabled` styling, so
  a disabled button is pixel-identical to an enabled one. A cell showing that
  would teach the design agent a state that does not exist. If a disabled look
  is ever added to `components.css`, add the cell.
- `Frame`'s `Closed` (aperture shut) cell was dropped: the capture browser runs
  under `prefers-reduced-motion: reduce`, where `components.css` sets
  `clip-path: none`, making closed and open renders identical. The `open` prop
  is documented in the prompt doc instead.
- Hover, drag-over (`FileDrop.is-over`) and tilt (`Card tilt`) are pointer-only
  states with no static render, so no cell covers them.

## Re-sync risks

- **The working tree was wiped mid-run on 2026-08-31** by a `git restore` +
  `git clean -fd` from outside this session — it removed `.ds-sync/`,
  `ds-bundle/`, `dist/` and every untracked file under `.design-sync/`, and
  reverted a `.gitignore` edit. Everything was rebuilt. If another agent or tool
  operates in this repo, **commit `.design-sync/` before a long run**; that is
  the only thing that makes the previews, fonts and config survive a clean.
- Grades live in the gitignored `.design-sync/.cache/` and do not travel between
  machines. Cross-machine carry-forward comes from the uploaded `_ds_sync.json`,
  so a sync that never uploads leaves the next run re-verifying all 18.
- The fonts are a **network-fetched, frozen** snapshot of Google Fonts. If a
  family is ever re-cut upstream, the committed woff2 stay as they are — that is
  intended (deterministic builds), but it means the DS can drift from what the
  live site serves at runtime.
- The font fetcher lives at `.design-sync/fetch-fonts.mjs` (committed, run it
  with `node .design-sync/fetch-fonts.mjs` from the package root) — it was moved
  out of the gitignored `.ds-sync/` so it survives a fresh clone.
- Preview stills are synthetic SVG gradients, not real Moona frames. If actual
  stills are ever licensed for this use, swapping them in is a preview-only edit.
