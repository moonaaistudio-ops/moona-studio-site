import * as React from 'react';
import { Button, MailButton } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
};

export const Default = () => (
  <div style={stage}>
    <MailButton email="hello@moona.studio" />
  </div>
);

export const WithLabel = () => (
  <div style={stage}>
    <MailButton email="hello@moona.studio">Email the studio</MailButton>
  </div>
);

// The pairing the site actually ships: the white CTA leads, the mail button
// is the second door beside it.
export const BesideTheCta = () => (
  <div style={stage}>
    <Button size="lg">Start a project</Button>
    <MailButton email="hello@moona.studio">Email instead</MailButton>
  </div>
);
