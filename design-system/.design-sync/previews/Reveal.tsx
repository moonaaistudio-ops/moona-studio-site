import * as React from 'react';
import { Card, Reveal, SectionHeading } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '48px 40px',
  borderRadius: 14,
};

// Rise-and-fade on first sight, then it stays seen. In a card the content
// is already in view, so it settles immediately — what the preview shows is
// the resting state the observer leaves behind.
export const OnSight = () => (
  <div style={stage}>
    <Reveal>
      <SectionHeading
        eyebrow="How we work"
        title="Every frame has a reason."
        note="Camera, edit and grade follow the story, not the model."
      />
    </Reveal>
  </div>
);

// Stagger siblings by hand — the row enters as a sequence, not a block.
export const Staggered = () => (
  <div
    style={{
      ...stage,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 20,
    }}
  >
    <Reveal>
      <Card number="01" label="The experience" title="A place that never existed." />
    </Reveal>
    <Reveal delay=".12s">
      <Card number="02" label="The shots" title="The cast stays the cast." />
    </Reveal>
    <Reveal delay=".24s">
      <Card number="03" label="The cut" title="Every frame has a reason." />
    </Reveal>
  </div>
);

// `as` renders it as something other than a div when the wrapper has to be
// a real landmark.
export const AsArticle = () => (
  <div style={stage}>
    <Reveal as="article">
      <SectionHeading eyebrow="The studio" title="Founder-led, end to end." />
    </Reveal>
  </div>
);
