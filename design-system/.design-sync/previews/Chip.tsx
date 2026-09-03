import * as React from 'react';
import { Chip } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

// The gold outline, over media: a technical badge.
export const Spec = () => (
  <div style={stage}>
    <Chip variant="spec">4K</Chip>
    <Chip variant="spec">60FPS</Chip>
    <Chip variant="spec">Dolby</Chip>
  </div>
);

// Ice on a scrim: a duration or an origin.
export const Plain = () => (
  <div style={stage}>
    <Chip variant="plain">Moona original</Chip>
    <Chip variant="plain">00:47</Chip>
  </div>
);

// The removable attachment in the request flow, with its size as meta.
export const FileAttachment = () => (
  <div style={stage}>
    <Chip variant="file" meta="2.4 MB" onRemove={() => {}}>
      dustline-moodboard.pdf
    </Chip>
    <Chip variant="file" meta="640 KB" onRemove={() => {}}>
      brief.docx
    </Chip>
  </div>
);

// Rejected — too large, or the wrong type.
export const Invalid = () => (
  <div style={stage}>
    <Chip variant="file" meta="84 MB — too large" invalid onRemove={() => {}}>
      first-cut-v3.mov
    </Chip>
  </div>
);
