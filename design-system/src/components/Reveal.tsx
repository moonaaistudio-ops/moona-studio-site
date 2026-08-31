import * as React from 'react';
import { cx } from './cx';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger siblings, e.g. '.12s' for the second card in a row. */
  delay?: string;
  /** Fraction of the element that must be visible. */
  threshold?: number;
  /** Render as something other than a div. */
  as?: React.ElementType;
}

/**
 * Rise-and-fade on first sight. Once seen, it stays seen — content that
 * re-animates on every scroll past reads as a page that cannot settle.
 *
 * Under `prefers-reduced-motion` the CSS shows the content outright, so an
 * observer that never fires can never leave the page blank.
 */
export function Reveal({
  delay,
  threshold = 0.15,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);

  return (
    <Tag
      ref={ref}
      className={cx('mn-reveal', seen && 'is-seen', className)}
      style={{ ...style, ...(delay ? { transitionDelay: delay } : null) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
