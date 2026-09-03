import * as React from 'react';
import { Chip, Frame, IconButton } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  fontFamily: 'var(--moona-sans)',
  color: 'var(--moona-ice-hot)',
  padding: 32,
  borderRadius: 14,
};

// A poster stands in for the film: the box declares its ratio, so nothing
// reflows whether or not a video ever arrives.
//
// `poster` lands in an unquoted CSS `url(...)`, so the parentheses inside the
// SVG (its own `url(#s)` fill references) must be percent-escaped too —
// encodeURIComponent leaves them alone and the declaration ends early.
const enc = (s: string) =>
  encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');

const still = (sky: string, ground: string, glow: string, w = 320, h = 180) =>
  `data:image/svg+xml;utf8,${enc(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient><radialGradient id="h"><stop offset="0" stop-color="${glow}" stop-opacity=".85"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="${w * 0.68}" cy="${h * 0.36}" r="${h * 0.34}" fill="url(#h)"/><path d="M0 ${h * 0.74}L${w * 0.29} ${h * 0.6}L${w * 0.47} ${h * 0.71}L${w * 0.67} ${h * 0.55}L${w} ${h * 0.69}L${w} ${h}L0 ${h}Z" fill="#05070c" opacity=".88"/></svg>`,
  )}`;

const dusk = still('#8a5f2c', '#1b1209', '#f3d6a3');
const iceNight = still('#2f4a74', '#070b14', '#a8c6e8');
const teal = still('#1c4a52', '#06110f', '#8fd0cf');

const Play = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
);

// The signature move: the aperture opens from the centre once the frame is
// in view. Drive `open` from an IntersectionObserver, never from load.
export const Open = () => (
  <div style={stage}>
    <Frame open ratio="16/9" poster={dusk} />
  </div>
);

// The flagship size: deeper shadow, wider final aperture, badges and
// controls over the picture, progress along the bottom edge.
export const Stage = () => (
  <div style={stage}>
    <Frame
      open
      variant="stage"
      ratio="16/9"
      poster={iceNight}
      badges={
        <>
          <Chip variant="spec">4K</Chip>
          <Chip variant="plain">DUSTLINE</Chip>
        </>
      }
      controls={
        <IconButton aria-label="Play with sound">
          <Play />
        </IconButton>
      }
      progress={0.42}
    />
  </div>
);

export const Portrait = () => (
  <div style={{ ...stage, maxWidth: 300 }}>
    <Frame open ratio="9/16" poster={still('#2f4a74', '#070b14', '#a8c6e8', 180, 320)} />
  </div>
);

export const Square = () => (
  <div style={{ ...stage, maxWidth: 380 }}>
    <Frame open ratio="1/1" poster={still('#7d5324', '#17100a', '#e8c58a', 300, 300)} />
  </div>
);

// The box holds its ratio with nothing inside it — the poster is what keeps
// the frame from ever being empty.
export const PosterOnly = () => (
  <div style={stage}>
    <Frame open ratio="16/9.18" poster={teal} />
  </div>
);
