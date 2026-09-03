# Building with the Moona design system

## 1. The ground is void, and it is not optional

Every component in this library is drawn for a **dark ground**. Nothing paints a
page background for you — put one on the page root, or every component renders as
pale text on white:

```jsx
<div style={{ background: 'var(--moona-void)', color: 'var(--moona-ice-hot)', fontFamily: 'var(--moona-sans)', minHeight: '100vh' }}>
  {/* the whole app lives in here */}
</div>
```

There is **no provider and no theme object**. Link `styles.css` once and the
tokens, fonts and component styles are all live. Two things the host page owns:

- `html[lang="he"]` swaps `--moona-sans` to Assistant and `--moona-serif` to
  Frank Ruhl Libre, and retunes tracking. Set `lang` on `<html>` for Hebrew.
- `html[dir="rtl"]` flips `.mn-caret` on `Button` and `MailButton`. Set `dir`,
  never mirror a component by hand.

`Header` is `position: fixed`. Give the page top padding rather than trying to
place it in flow.

## 2. The styling idiom: tokens, not utilities

There is **no utility-class framework here**. Component classes (`mn-btn`,
`mn-card`, …) belong to the library — never author, extend or imitate one.
For your own layout glue, write plain CSS or inline styles that read the tokens:

| Family | Real names |
|---|---|
| Ground | `--moona-void` (page), `--moona-void-2` (panels), `--moona-scrim` (over media), `--moona-overlay` (lightbox) |
| Ice — the interface voice | `--moona-ice-hot` (brightest text), `--moona-ice`, `--moona-ice-dim` (labels), `--moona-ice-faint`, `--moona-body-dim` (long copy), `--moona-line` (hairlines) |
| Gold — the one accent | `--moona-gold`, `--moona-gold-hot` (emphasis in serif), `--moona-gold-ink` (text on gold), `--moona-gold-line`, `--moona-gold-wash`, `--moona-gold-wash-hot` |
| Status | `--moona-danger` |
| Type families | `--moona-sans` (Inter Tight), `--moona-serif` (Instrument Serif), `--moona-mono` (SF Mono) |
| Type scale | `--moona-fs-display`, `-title`, `-question`, `-quote`, `-card`, `-lead`, `-body`, `-body-sm`, `-label-lg`, `-label`, `-label-sm` |
| Tracking | `--moona-track-cta`, `-label`, `-label-wide`, `-label-tight`, `-lockup`, `-serif` |
| Line height | `--moona-lh-display`, `-title`, `-body`, `-loose` |
| Layout | `--moona-max` (1200px), `--moona-max-wide` (1560px), `--moona-gutter`, `--moona-gutter-wide`, `--moona-tap` (44px floor) |
| Depth & motion | `--moona-shadow-frame`, `-stage`, `-panel`, `-menu`, `--moona-glow-gold`, `--moona-dur`, `-fast`, `-slow`, `-reveal` |

Three rules the library enforces on itself, so your own markup should too:
serif for headlines, mono uppercase for every label and control, sans for body;
**one** `Button` per view (a second primary makes neither primary); nothing
interactive below `--moona-tap`.

## 3. Where the truth lives

- `_ds/<folder>/styles.css` and the files it `@import`s — the tokens and every
  component rule, verbatim. Read it before styling anything.
- `components/<group>/<Name>/<Name>.prompt.md` — usage per component.
- `components/<group>/<Name>/<Name>.d.ts` — the prop contract.

Groups: **actions** (Button, MailButton, IconButton, RoundButton),
**navigation** (Header, Lockup, Nav, NavLink), **layout** (Section, Frame, Card),
**content** (SectionHeading, Chip, Steps, Marquee, MarqueeItem),
**motion** (Reveal), **inputs** (FileDrop).

## 4. An idiomatic block

Library components carry the design; your own element does layout only, in tokens:

```jsx
<Section divided>
  <SectionHeading
    eyebrow="How we work"
    title={<>Made with AI. <em>Directed</em> to the final frame.</>}
    note="Camera, edit and grade follow the story, not the model."
  />
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 20, marginTop: 36 }}>
    <Reveal><Card number="01" label="The experience" title="A place that never existed." /></Reveal>
    <Reveal delay=".12s"><Card number="02" label="The shots" title="The cast stays the cast." /></Reveal>
    <Reveal delay=".24s"><Card number="03" label="The cut" title="Every frame has a reason." /></Reveal>
  </div>
</Section>
```

`<em>` inside a `SectionHeading` title is the only emphasis you write — it
renders italic gold in Latin and switches to weight and colour in Hebrew.

`Frame` never derives its size from its video: declare `ratio`, give it a
`poster`, and drive `open` from an IntersectionObserver so the aperture opens
when the frame is actually in view.
