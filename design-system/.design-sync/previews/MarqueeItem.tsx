import * as React from 'react';
import { MarqueeItem } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: 32,
  borderRadius: 14,
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
};

export const tile = (sky: string, ground: string, glow: string, w = 300, h = 300) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient><radialGradient id="h"><stop offset="0" stop-color="${glow}" stop-opacity=".85"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="${w * 0.66}" cy="${h * 0.34}" r="${h * 0.3}" fill="url(#h)"/><path d="M0 ${h * 0.72}L${w * 0.3} ${h * 0.58}L${w * 0.5} ${h * 0.69}L${w * 0.7} ${h * 0.54}L${w} ${h * 0.67}L${w} ${h}L0 ${h}Z" fill="#05070c" opacity=".88"/></svg>`,
  )}`;

// One tile of work. It is a button because clicking it opens the lightbox.
export const Square = () => (
  <div style={stage}>
    <MarqueeItem aria-label="DUSTLINE — open">
      <img src={tile('#8a5f2c', '#1b1209', '#f3d6a3')} alt="" />
    </MarqueeItem>
    <MarqueeItem aria-label="AI Crew — open">
      <img src={tile('#2f4a74', '#070b14', '#a8c6e8')} alt="" />
    </MarqueeItem>
  </div>
);

// A film keeps its own 3:4 shape beside the stills.
export const Tall = () => (
  <div style={stage}>
    <MarqueeItem tall aria-label="DUSTLINE film — open">
      <img src={tile('#7d5324', '#17100a', '#e8c58a', 240, 320)} alt="" />
    </MarqueeItem>
    <MarqueeItem aria-label="Still — open">
      <img src={tile('#2f4a74', '#070b14', '#a8c6e8')} alt="" />
    </MarqueeItem>
  </div>
);
