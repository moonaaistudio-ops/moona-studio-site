import * as React from 'react';
import { cx } from './cx';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Draw the hairline rule above. Sections are separated by light, not boxes. */
  divided?: boolean;
  /** 1560px instead of 1200px — the flagship film only. */
  wide?: boolean;
}

/**
 * A page section: vertical rhythm in viewport units, a max width, and the
 * fluid gutter that every other block on the site shares.
 */
export function Section({
  divided = false,
  wide = false,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cx('mn-section', divided && 'mn-section--divided', className)}
      {...rest}
    >
      <div
        className={cx(
          'mn-section__inner',
          wide && 'mn-section__inner--wide',
        )}
      >
        {children}
      </div>
    </section>
  );
}
