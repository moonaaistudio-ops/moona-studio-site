/**
 * Moona Studio design tokens, typed.
 * Mirrors src/tokens/tokens.css one-for-one. The CSS file is the runtime
 * source of truth; this file exists so tooling and TS callers can read the
 * same values without parsing CSS.
 */

export const color = {
  /** Deep space. The page ground — everything sits on this. */
  void: '#05070c',
  /** Raised surface: panels, media frames, menu sheets. */
  void2: '#080b13',
  /** Scrim over video, so a badge stays legible on any frame. */
  scrim: 'rgba(5,7,12,.72)',
  /** Lightbox backdrop. */
  overlay: 'rgba(3,5,9,.9)',

  /** Pale ice blue — the interface accent. */
  ice: '#a8c6e8',
  /** Brightest text. Headlines and anything that must read first. */
  iceHot: '#dcecff',
  /** Secondary text and mono labels. */
  iceDim: 'rgba(168,198,232,.66)',
  /** Inactive borders and input underlines. */
  iceFaint: 'rgba(168,198,232,.22)',
  /** Hairline dividers between sections. */
  line: 'rgba(168,198,232,.14)',
  /** Long-form body copy — warmer and quieter than iceHot. */
  bodyDim: 'rgba(190,212,238,.72)',

  /** The one accent that acts: CTA, focus rings, progress rails. */
  gold: '#d9c69c',
  /** Emphasis inside a serif headline (the `em` colour). */
  goldHot: '#f3e9d2',
  /** Text on a gold fill. */
  goldInk: '#0d0b07',
  goldLine: 'rgba(217,198,156,.5)',
  goldWash: 'rgba(217,198,156,.1)',
  goldWashHot: 'rgba(217,198,156,.16)',

  /** Form errors and destructive hover. */
  danger: '#e8a09a',
} as const;

/** Warm-gold retint of Magic UI's Rainbow Button ramp. Order matters. */
export const rainbow = [
  'oklch(66% 0.135 48)', // deep amber
  'oklch(60% 0.120 38)', // dark copper
  'oklch(81% 0.125 82)', // gold
  'oklch(94% 0.055 98)', // champagne
  'oklch(87% 0.145 74)', // honey
] as const;

export const font = {
  /** HUD, labels, timestamps, brand lockup. Stays Latin in Hebrew. */
  mono: '"SF Mono",ui-monospace,Menlo,Consolas,monospace',
  /** Interface and body. Swaps to Assistant under html[lang="he"]. */
  sans: '"Inter Tight",Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  /** Headlines. Swaps to Frank Ruhl Libre under html[lang="he"]. */
  serif: '"Instrument Serif",Georgia,serif',
} as const;

export const fontHe = {
  sans: 'Assistant,Arial,sans-serif',
  serif: '"Frank Ruhl Libre","Times New Roman",serif',
} as const;

export const fontSize = {
  display: 'clamp(34px,6vw,82px)',
  title: 'clamp(30px,4.4vw,58px)',
  question: 'clamp(30px,5.4vw,62px)',
  quote: 'clamp(28px,4.6vw,52px)',
  card: 'clamp(21px,1.9vw,27px)',
  lead: 'clamp(15px,1.7vw,19px)',
  body: '15px',
  bodySm: '14.5px',
  label: '10px',
  labelLg: '11px',
  labelSm: '9px',
} as const;

export const tracking = {
  label: '.28em',
  labelWide: '.32em',
  labelTight: '.14em',
  cta: '.22em',
  lockup: '.34em',
  serif: '.005em',
} as const;

export const radius = {
  /** Buttons and chips. The extreme of one rounded family, not an outlier. */
  pill: '999px',
  /** Media surfaces: frames, cards, lightbox stage. */
  lg: '20px',
  /** Panels and dropzones. */
  md: '14px',
  /** Menu rows. */
  sm: '11px',
} as const;

export const motion = {
  ease: 'cubic-bezier(.16,1,.3,1)',
  fast: '.3s',
  base: '.45s',
  slow: '1s',
  reveal: '1.05s',
} as const;

export const shadow = {
  panel: '0 30px 80px -30px rgba(0,0,0,.8)',
  frame: '0 40px 120px -40px rgba(0,0,0,.8)',
  stage: '0 60px 160px -50px rgba(0,0,0,.9)',
  menu: '0 22px 70px -28px rgba(0,0,0,.95)',
  glowGold: '0 0 34px -8px rgba(217,198,156,.45)',
} as const;

export const layout = {
  max: '1200px',
  maxWide: '1560px',
  gutter: 'clamp(22px,5vw,72px)',
  gutterWide: 'clamp(22px,6vw,80px)',
  /** Every interactive target clears this. The custom cursor lags; small targets miss. */
  tap: '44px',
} as const;

export const tokens = {
  color,
  rainbow,
  font,
  fontHe,
  fontSize,
  tracking,
  radius,
  motion,
  shadow,
  layout,
} as const;

export type MoonaTokens = typeof tokens;
export default tokens;
