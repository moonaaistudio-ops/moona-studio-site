import * as React from 'react';
import { Card } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '44px 36px',
  borderRadius: 14,
};

export const Beat = () => (
  <div style={stage}>
    <Card number="01" label="The experience" title="A place that never existed.">
      Built before the first shot, so every frame belongs to the same world.
    </Card>
  </div>
);

export const Row = () => (
  <div
    style={{
      ...stage,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 20,
    }}
  >
    <Card number="01" label="The experience" title="A place that never existed.">
      Built before the first shot, so every frame belongs to the same world.
    </Card>
    <Card number="02" label="The shots" title="The cast stays the cast.">
      Faces, wardrobe and product lock before motion begins.
    </Card>
    <Card number="03" label="The cut" title="Every frame has a reason.">
      Camera, edit and grade follow the story, not the model.
    </Card>
  </div>
);

export const TitleOnly = () => (
  <div style={stage}>
    <Card title="Cinematic campaigns, built differently." />
  </div>
);
