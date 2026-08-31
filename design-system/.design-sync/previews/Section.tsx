import * as React from 'react';
import { Card, Section, SectionHeading } from '@moona/design-system';

// .mn-section pads 15vh/8vh — in a preview cell that is mostly empty space,
// so the stage caps the rhythm while keeping the max-width and gutter that
// the component actually contributes.
const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  borderRadius: 14,
};

const compact: React.CSSProperties = { padding: '48px 0 40px' };

export const WithContent = () => (
  <div style={stage}>
    <Section style={compact}>
      <SectionHeading
        eyebrow="How we work"
        title="Cinematic campaigns, built differently."
        note="Founder-led creative technology studio. We created a brand, then we shot its ad."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 20,
          marginTop: 36,
        }}
      >
        <Card number="01" label="The experience" title="A place that never existed." />
        <Card number="02" label="The shots" title="The cast stays the cast." />
        <Card number="03" label="The cut" title="Every frame has a reason." />
      </div>
    </Section>
  </div>
);

// Sections are separated by light, not boxes — `divided` draws the hairline.
export const Divided = () => (
  <div style={stage}>
    <Section style={compact}>
      <SectionHeading eyebrow="The flagship" title="DUSTLINE" />
    </Section>
    <Section divided style={compact}>
      <SectionHeading eyebrow="AI Crew" title="Specialists behind the work." />
    </Section>
  </div>
);

// 1560px instead of 1200px — the flagship film only.
export const Wide = () => (
  <div style={stage}>
    <Section wide style={compact}>
      <SectionHeading
        eyebrowVariant="index"
        eyebrow="01 / Work"
        title="Made with AI. Directed to the final frame."
      />
    </Section>
  </div>
);
