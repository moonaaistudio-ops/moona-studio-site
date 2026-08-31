import * as React from 'react';
import { Steps } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
};

// Steps sit *with* the question, not in a far corner — that is the whole
// point of the component, so the preview shows the pairing.
export const InTheRequestFlow = () => (
  <div style={stage}>
    <Steps total={3} current={1} label="Step 2 of 3" />
    <div
      style={{
        fontFamily: 'var(--moona-serif)',
        fontSize: 34,
        lineHeight: 1.15,
        color: 'var(--moona-ice-hot)',
      }}
    >
      What is the film for?
    </div>
    <div
      style={{
        marginTop: 14,
        fontFamily: 'var(--moona-mono)',
        fontSize: 10.5,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: 'var(--moona-ice-dim)',
      }}
    >
      One line is enough
    </div>
  </div>
);

export const Progression = () => (
  <div style={{ ...stage, display: 'grid', gap: 26 }}>
    <Steps total={3} current={0} />
    <Steps total={3} current={1} />
    <Steps total={3} current={2} />
  </div>
);
