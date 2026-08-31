import * as React from 'react';
import { cx } from './cx';

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The engraved numeral, e.g. "01". Stays LTR inside Hebrew copy. */
  number?: string;
  /** Mono label beside the numeral. */
  label?: React.ReactNode;
  /** The hook — one line in the headline voice. */
  title: React.ReactNode;
  /** Tilt on pointer move. Off by default; it costs a listener per card. */
  tilt?: boolean;
}

const MAX_TILT = 6;

/**
 * A story beat: void glass with an ember-gold and ice glow rising from the
 * floor, a lit bottom edge, and an optional 3D tilt.
 *
 * The tilt lives on an inner element so it never fights the reveal
 * transform on the wrapper — animating both on one node makes the card
 * jump when it enters the viewport.
 */
export function Card({
  number,
  label,
  title,
  tilt = false,
  className,
  children,
  ...rest
}: CardProps) {
  const inner = React.useRef<HTMLDivElement>(null);

  const onMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!tilt || !inner.current) return;
      const r = inner.current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      inner.current.style.setProperty('--ry', `${px * MAX_TILT}deg`);
      inner.current.style.setProperty('--rx', `${-py * MAX_TILT}deg`);
    },
    [tilt],
  );

  const onLeave = React.useCallback(() => {
    if (!inner.current) return;
    inner.current.style.setProperty('--ry', '0deg');
    inner.current.style.setProperty('--rx', '0deg');
  }, []);

  return (
    <article
      className={cx('mn-card', className)}
      onMouseMove={tilt ? onMove : undefined}
      onMouseLeave={tilt ? onLeave : undefined}
      {...rest}
    >
      <div className="mn-card__inner" ref={inner}>
        <div className="mn-card__glow" aria-hidden="true" />
        <div className="mn-card__edge" aria-hidden="true" />
        {(number || label) && (
          <div className="mn-card__head">
            {number && <span className="mn-card__num">{number}</span>}
            {label && <span className="mn-card__label">{label}</span>}
          </div>
        )}
        <h3 className="mn-card__title">{title}</h3>
        {children && <div className="mn-card__body">{children}</div>}
      </div>
    </article>
  );
}
