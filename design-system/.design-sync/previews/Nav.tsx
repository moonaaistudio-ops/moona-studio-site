import * as React from 'react';
import { Nav, NavLink } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
};

export const SiteNav = () => (
  <div style={stage}>
    <Nav>
      <NavLink>Work</NavLink>
      <NavLink>Studio</NavLink>
      <NavLink>Crew</NavLink>
      <NavLink>Contact</NavLink>
    </Nav>
  </div>
);
