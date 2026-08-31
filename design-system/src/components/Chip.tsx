import * as React from 'react';
import { cx } from './cx';

export type ChipVariant = 'spec' | 'plain' | 'file';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * `spec` — gold outline, for a technical badge over media (4K, 60FPS).
   * `plain` — ice on a scrim, for a duration or origin badge.
   * `file` — a removable attachment in the request flow.
   */
  variant?: ChipVariant;
  /** `file` only: shown after the name, quieter. Usually the file size. */
  meta?: React.ReactNode;
  /** `file` only: renders the remove control. */
  onRemove?: () => void;
  /** `file` only: the attachment was rejected (too large, wrong type). */
  invalid?: boolean;
  /** `file` only: accessible label for the remove control. */
  removeLabel?: string;
}

const variantClass: Record<ChipVariant, string> = {
  spec: 'mn-chip--spec',
  plain: 'mn-chip--plain',
  file: 'mn-chip--file',
};

/**
 * One shape, three voices. The pill radius is shared with the CTA on purpose:
 * a chip is the same family at a smaller size, not a different idea.
 */
export function Chip({
  variant = 'spec',
  meta,
  onRemove,
  invalid,
  removeLabel = 'Remove',
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cx(
        'mn-chip',
        variantClass[variant],
        invalid && 'mn-chip--danger',
        className,
      )}
      {...rest}
    >
      <span className="mn-chip__name">{children}</span>
      {meta != null && <b>{meta}</b>}
      {onRemove && (
        <button
          type="button"
          className="mn-chip__remove"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      )}
    </span>
  );
}
