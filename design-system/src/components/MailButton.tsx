import * as React from 'react';
import { cx } from './cx';

export interface MailButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Address to open. Rendered as a `mailto:` link. */
  email: string;
  /** Label text. Defaults to the address itself. */
  children?: React.ReactNode;
}

/**
 * The second door, beside the primary CTA. Dark with a gold hairline so it
 * reads as a real control without competing with the white one.
 *
 * Anyone who will not fill in a form still has a way to reach the studio.
 */
export function MailButton({
  email,
  className,
  children,
  ...rest
}: MailButtonProps) {
  return (
    <a
      href={`mailto:${email}`}
      className={cx('mn-mail', className)}
      {...rest}
    >
      <svg
        className="mn-mail__ico"
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <rect x="1.5" y="3" width="13" height="10" rx="2" />
        <path d="M2 4.5 8 9l6-4.5" />
      </svg>
      <span>{children ?? email}</span>
      <i className="mn-caret" aria-hidden="true" />
    </a>
  );
}
