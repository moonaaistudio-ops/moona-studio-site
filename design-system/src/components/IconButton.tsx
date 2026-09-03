import * as React from 'react';
import { cx } from './cx';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — the control carries no visible text. */
  'aria-label': string;
}

/**
 * A 44px round control that sits over video: gold hairline on a void scrim,
 * so it stays legible on any frame.
 *
 * 44px is the floor everywhere on this site. The custom cursor trails its
 * true position, and a small target is not worth aiming at with a cursor
 * that lies.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx('mn-iconbtn', className)}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
