import * as React from 'react';
import { cx } from './cx';

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Run right-to-left instead, at the slower 52s speed. */
  reverse?: boolean;
  /** Cycle duration. Two rows must not share one, or they lock together. */
  duration?: string;
}

/**
 * An endless strip of work.
 *
 * The track is duplicated so the loop has no seam, and the row is masked at
 * both edges so it bleeds away instead of stopping at a hard line. Two rows
 * run at two speeds on purpose — matched speeds read as one wide image
 * sliding, not as a gallery.
 *
 * Pass `children` once; this renders the copy for you.
 */
export function Marquee({
  reverse = false,
  duration,
  className,
  children,
  style,
  ...rest
}: MarqueeProps) {
  return (
    <div
      className={cx('mn-marquee', reverse && 'mn-marquee--reverse', className)}
      style={{ ...style, ...(duration ? { '--dur': duration } : null) } as React.CSSProperties}
      {...rest}
    >
      <div className="mn-marquee__track">{children}</div>
      <div className="mn-marquee__track" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export interface MarqueeItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 3:4 instead of square — a film keeps its own shape beside the stills. */
  tall?: boolean;
}

/** One tile. A button, because clicking it opens the lightbox. */
export function MarqueeItem({
  tall = false,
  className,
  children,
  ...rest
}: MarqueeItemProps) {
  return (
    <button
      type="button"
      className={cx(
        'mn-marquee__item',
        tall && 'mn-marquee__item--tall',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
