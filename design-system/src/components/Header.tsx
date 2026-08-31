import * as React from 'react';
import { cx } from './cx';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * The fixed top bar. It is a gradient, not a solid: the page reads through
 * it, and it never becomes a shelf the hero has to sit under.
 *
 * The bar itself is click-through (`pointer-events:none`); only its children
 * take the pointer, so the hero stays draggable underneath.
 */
export function Header({ className, children, ...rest }: HeaderProps) {
  return (
    <header className={cx('mn-header', className)} {...rest}>
      {children}
    </header>
  );
}

export interface LockupProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The iris mark. An `<img>` or inline `<svg>`. */
  mark: React.ReactNode;
  /** The wordmark. Drops below a 350px header — the mark still reads as home. */
  name?: React.ReactNode;
}

/** Mark plus wordmark, linking home. Always at least a 44px target. */
export function Lockup({ mark, name, className, ...rest }: LockupProps) {
  return (
    <a href="/" className={cx('mn-lockup', className)} {...rest}>
      <span className="mn-lockup__mark" aria-hidden="true">
        {mark}
      </span>
      {name && <span className="mn-lockup__name">{name}</span>}
    </a>
  );
}

export interface NavProps extends React.HTMLAttributes<HTMLElement> {}

export function Nav({ className, children, ...rest }: NavProps) {
  return (
    <nav className={cx('mn-nav', className)} {...rest}>
      {children}
    </nav>
  );
}

export interface NavLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * A nav entry. It is a button, not an anchor: navigation here scrolls to a
 * section rather than changing the URL.
 *
 * Hebrew nav labels are wider than the Latin ones. The `letter-spacing:0`
 * rule under `html[lang="he"]` is what keeps the row fitting a 375px phone.
 */
export function NavLink({ className, children, ...rest }: NavLinkProps) {
  return (
    <button type="button" className={cx('mn-nav__link', className)} {...rest}>
      {children}
    </button>
  );
}

export interface RoundButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
}

/**
 * The 44px circle in the header — language toggle, menu toggle. Short mono
 * text or a single icon; nothing longer fits.
 */
export function RoundButton({ className, children, ...rest }: RoundButtonProps) {
  return (
    <button type="button" className={cx('mn-round', className)} {...rest}>
      {children}
    </button>
  );
}
