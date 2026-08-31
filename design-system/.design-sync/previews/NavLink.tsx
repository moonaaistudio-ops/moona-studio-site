import * as React from 'react';
import { Nav, NavLink } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
};

// A NavLink is a button — navigation here scrolls to a section rather than
// changing the URL — and it only ever appears inside a Nav row.
export const InANavRow = () => (
  <div style={stage}>
    <Nav>
      <NavLink>Work</NavLink>
      <NavLink>Studio</NavLink>
      <NavLink>Crew</NavLink>
      <NavLink>Contact</NavLink>
    </Nav>
  </div>
);

export const Single = () => (
  <div style={stage}>
    <NavLink>Contact</NavLink>
  </div>
);
