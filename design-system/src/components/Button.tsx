import * as React from 'react';
import { cx } from './cx';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `md` is the body CTA, `lg` the hero, `sm` the header. */
  size?: ButtonSize;
  /** Draw the trailing caret. It flips automatically under `dir="rtl"`. */
  caret?: boolean;
  /** Render as an anchor instead of a button. */
  href?: string;
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'mn-btn--sm',
  md: '',
  lg: 'mn-btn--lg',
};

/**
 * The primary call to action — a white pill inside an animated warm-gold
 * border. The ramp cycles every `--speed` (2s) and halves on hover, so the
 * button reads as live without ever moving.
 *
 * There is exactly one of these per view. A second primary makes neither
 * primary.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { size = 'md', caret = true, href, className, children, ...rest },
    ref,
  ) {
    const cls = cx('mn-btn', sizeClass[size], className);
    const content = (
      <>
        {children}
        {caret && <i className="mn-caret" aria-hidden="true" />}
      </>
    );

    if (href) {
      return (
        <a
          href={href}
          className={cls}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button ref={ref} type="button" className={cls} {...rest}>
        {content}
      </button>
    );
  },
);
