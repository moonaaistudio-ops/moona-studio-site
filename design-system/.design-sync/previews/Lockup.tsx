import * as React from 'react';
import { Lockup } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 40,
};

const Iris = () => (
  <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
    <circle cx="14" cy="14" r="13" fill="none" stroke="#d9c69c" strokeWidth="1.2" />
    <circle cx="14" cy="14" r="5.5" fill="#d9c69c" opacity="0.85" />
  </svg>
);

export const MarkAndWordmark = () => (
  <div style={stage}>
    <Lockup mark={<Iris />} name="Moona" />
  </div>
);

// Below a 350px header the wordmark drops and the mark carries "home" alone.
export const MarkOnly = () => (
  <div style={stage}>
    <Lockup mark={<Iris />} />
  </div>
);
