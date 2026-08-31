import * as React from 'react';
import { IconButton } from '@moona/design-system';

const stage: React.CSSProperties = {
  background: 'var(--moona-void)',
  color: 'var(--moona-ice-hot)',
  fontFamily: 'var(--moona-sans)',
  padding: '40px 36px',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const Play = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
);

const Pause = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="4" y="2.5" width="3" height="11" rx="1" />
    <rect x="9" y="2.5" width="3" height="11" rx="1" />
  </svg>
);

const Muted = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M3 7v4h3l4 3V4L6 7H3M12.5 7l3 4M15.5 7l-3 4" />
  </svg>
);

// Media controls, the only place these appear — always over a frame.
export const MediaControls = () => (
  <div style={stage}>
    <IconButton aria-label="Play">
      <Play />
    </IconButton>
    <IconButton aria-label="Pause">
      <Pause />
    </IconButton>
    <IconButton aria-label="Unmute">
      <Muted />
    </IconButton>
  </div>
);

export const OverMedia = () => (
  <div style={{ ...stage, padding: 0, display: 'block' }}>
    <div
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        borderRadius: 14,
        overflow: 'hidden',
        background:
          'radial-gradient(120% 90% at 30% 20%, #1d2740 0%, #0a0e18 55%, #05070c 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          display: 'flex',
          gap: 10,
        }}
      >
        <IconButton aria-label="Play with sound">
          <Play />
        </IconButton>
      </div>
    </div>
  </div>
);
