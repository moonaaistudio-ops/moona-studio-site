import * as React from 'react';
import { Chip, FileDrop } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
};

export const Default = () => (
  <div style={stage}>
    <FileDrop
      title="Add a reference"
      hint="PDF, JPG or MP4 · up to 3 files · 25 MB each"
      accept=".pdf,.jpg,.png,.mp4"
      multiple
    />
  </div>
);

// What the control looks like once something has been attached: the drop
// zone stays, the attachments sit under it as removable file chips.
export const WithAttachments = () => (
  <div style={stage}>
    <FileDrop
      title="Add a reference"
      hint="PDF, JPG or MP4 · up to 3 files · 25 MB each"
      multiple
    />
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
      <Chip variant="file" meta="2.4 MB" onRemove={() => {}}>
        dustline-moodboard.pdf
      </Chip>
      <Chip variant="file" meta="640 KB" onRemove={() => {}}>
        brief.docx
      </Chip>
    </div>
  </div>
);

export const CustomCta = () => (
  <div style={stage}>
    <FileDrop title="Attach the brief" hint="One PDF" ctaLabel="Choose file" />
  </div>
);
