import * as React from 'react';
import { Marquee, MarqueeItem } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '32px 0',
  borderRadius: 14,
  overflow: 'hidden',
};

const tile = (sky: string, ground: string, glow: string, w = 300, h = 300) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient><radialGradient id="h"><stop offset="0" stop-color="${glow}" stop-opacity=".85"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="${w * 0.66}" cy="${h * 0.34}" r="${h * 0.3}" fill="url(#h)"/><path d="M0 ${h * 0.72}L${w * 0.3} ${h * 0.58}L${w * 0.5} ${h * 0.69}L${w * 0.7} ${h * 0.54}L${w} ${h * 0.67}L${w} ${h}L0 ${h}Z" fill="#05070c" opacity=".88"/></svg>`,
  )}`;

const shots: [string, string, string][] = [
  ['#8a5f2c', '#1b1209', '#f3d6a3'],
  ['#2f4a74', '#070b14', '#a8c6e8'],
  ['#7d5324', '#17100a', '#e8c58a'],
  ['#1c4a52', '#06110f', '#8fd0cf'],
  ['#6a4630', '#140d09', '#eec9a0'],
];

// Pass children ONCE — the component renders the seamless second copy.
const Row = ({ tall = false }: { tall?: boolean }) => (
  <>
    {shots.map(([sky, ground, glow], i) => (
      <MarqueeItem key={i} tall={tall} aria-label={`Work ${i + 1} — open`}>
        <img src={tile(sky, ground, glow, tall ? 240 : 300, 300)} alt="" />
      </MarqueeItem>
    ))}
  </>
);

export const Strip = () => (
  <div style={stage}>
    <Marquee>
      <Row />
    </Marquee>
  </div>
);

// Two rows at two speeds. Matched speeds read as one wide image sliding, so
// the second row runs reverse and slower.
export const TwoRows = () => (
  <div style={{ ...stage, display: 'grid', gap: 16 }}>
    <Marquee duration="42s">
      <Row />
    </Marquee>
    <Marquee reverse duration="52s">
      <Row tall />
    </Marquee>
  </div>
);
