import * as React from 'react';
import { RoundButton } from '@moona/design-system';

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

export const LanguageToggle = () => (
  <div style={stage}>
    <RoundButton aria-label="Switch language to Hebrew">HE</RoundButton>
    <RoundButton aria-label="Switch language to English">EN</RoundButton>
  </div>
);

export const MenuToggle = () => (
  <div style={stage}>
    <RoundButton aria-label="Open menu">
      <svg
        width="16"
        height="16"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 5.5h12M3 12.5h12" />
      </svg>
    </RoundButton>
    <RoundButton aria-label="Close">
      <svg
        width="16"
        height="16"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
      </svg>
    </RoundButton>
  </div>
);
