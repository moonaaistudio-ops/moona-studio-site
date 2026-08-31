import * as React from 'react';
import { Button } from '@moona/design-system';

// Every Moona surface is void-ground; the preview card's page is white, so
// each cell paints its own ground or the components read as unstyled.
const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 22,
  flexWrap: 'wrap',
};

export const Sizes = () => (
  <div style={stage}>
    <Button size="sm">Talk to us</Button>
    <Button size="md">Start a project</Button>
    <Button size="lg">See the flagship</Button>
  </div>
);

export const WithoutCaret = () => (
  <div style={stage}>
    <Button caret={false}>Accept analytics</Button>
  </div>
);

export const AsLink = () => (
  <div style={stage}>
    <Button href="#work" size="lg">
      Skip to the work
    </Button>
  </div>
);
