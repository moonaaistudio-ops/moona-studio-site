import * as React from 'react';
import { SectionHeading } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '48px 40px',
  borderRadius: 14,
};

export const Default = () => (
  <div style={stage}>
    <SectionHeading
      eyebrow="The flagship"
      title="Cinematic campaigns, built differently."
      note="Founder-led creative technology studio. We created a brand, then we shot its ad."
    />
  </div>
);

// `<em>` is the only emphasis you write — italic gold in Latin, weight and
// colour under html[lang="he"].
export const WithEmphasis = () => (
  <div style={stage}>
    <SectionHeading
      eyebrow="How we work"
      title={
        <>
          Made with AI. <em>Directed</em> to the final frame.
        </>
      }
      note="Camera, edit and grade follow the story, not the model."
    />
  </div>
);

// The index eyebrow — ice, wider tracking — for a numbered section.
export const IndexEyebrow = () => (
  <div style={stage}>
    <SectionHeading
      eyebrow="01 / Work"
      eyebrowVariant="index"
      title="A place that never existed."
    />
  </div>
);

export const TitleOnly = () => (
  <div style={stage}>
    <SectionHeading as="h1" title="Specialists behind the work." />
  </div>
);
