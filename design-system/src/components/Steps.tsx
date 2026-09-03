import * as React from 'react';
import { cx } from './cx';

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How many steps there are. */
  total: number;
  /** Zero-based index of the step you are on. */
  current: number;
  /** Accessible summary, e.g. "Step 2 of 3". */
  label?: string;
}

/**
 * Joined dots that say "three, and you are here" before anyone decides
 * whether to start.
 *
 * It sits with the question, not in a far corner — a progress indicator
 * you have to hunt for does not reduce the cost of starting.
 */
export function Steps({
  total,
  current,
  label,
  className,
  ...rest
}: StepsProps) {
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < total; i++) {
    if (i > 0) {
      nodes.push(
        <span
          key={`seg-${i}`}
          className={cx('mn-steps__seg', i <= current && 'is-done')}
        />,
      );
    }
    nodes.push(
      <span
        key={`dot-${i}`}
        className={cx(
          'mn-steps__dot',
          i < current && 'is-done',
          i === current && 'is-now',
        )}
      />,
    );
  }

  return (
    <div
      className={cx('mn-steps', className)}
      role="group"
      aria-label={label ?? `Step ${current + 1} of ${total}`}
      {...rest}
    >
      {nodes}
    </div>
  );
}
