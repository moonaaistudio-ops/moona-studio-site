import * as React from 'react';
import { Header, Lockup, Nav, NavLink, RoundButton } from '@moona/design-system';

// .mn-header is position:fixed on the real site; inside a preview cell it
// would pin to the viewport, so the card renders it in flow.
const inFlow: React.CSSProperties = { position: 'static' };

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  borderRadius: 14,
  paddingBottom: 56,
};

const Iris = () => (
  <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
    <circle cx="14" cy="14" r="13" fill="none" stroke="#d9c69c" strokeWidth="1.2" />
    <circle cx="14" cy="14" r="5.5" fill="#d9c69c" opacity="0.85" />
  </svg>
);

export const Bar = () => (
  <div style={stage}>
    <Header style={inFlow}>
      <Lockup mark={<Iris />} name="Moona" />
      <Nav>
        <NavLink>Work</NavLink>
        <NavLink>Studio</NavLink>
        <NavLink>Crew</NavLink>
        <NavLink>Contact</NavLink>
      </Nav>
      <RoundButton aria-label="Switch language to Hebrew">HE</RoundButton>
    </Header>
  </div>
);

export const MarkOnly = () => (
  <div style={stage}>
    <Header style={inFlow}>
      <Lockup mark={<Iris />} />
      <RoundButton aria-label="Open menu">≡</RoundButton>
    </Header>
  </div>
);
