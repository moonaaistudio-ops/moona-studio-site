import * as React from 'react';
import { cx } from './cx';

export interface FileDropProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onDrop' | 'title'> {
  /** The action, in the body face. "Add a reference", not "UPLOAD". */
  title: React.ReactNode;
  /** Mono sub-line: the constraint. Types, count, size. */
  hint?: React.ReactNode;
  /** Text on the visible Browse control. Hidden below 560px. */
  ctaLabel?: React.ReactNode;
  accept?: string;
  multiple?: boolean;
  /** Fires for both the picker and a drop. */
  onFiles?: (files: FileList) => void;
}

/**
 * The attachment control.
 *
 * A `<label>` is inline by default: with padding and a border it renders as
 * a collapsed sliver with the text outside it — hence the explicit flex box.
 * It also has to look like something you can act on, so it carries an icon,
 * a plain-language action in the body face, and a visible Browse control.
 * Mono at .18em is a label, not an invitation.
 */
export function FileDrop({
  title,
  hint,
  ctaLabel = 'Browse',
  accept,
  multiple,
  onFiles,
  className,
  ...rest
}: FileDropProps) {
  const [over, setOver] = React.useState(false);

  return (
    <label
      className={cx('mn-drop', over && 'is-over', className)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles?.(e.dataTransfer.files);
      }}
      {...rest}
    >
      <span className="mn-drop__ico" aria-hidden="true">
        <svg
          width="17"
          height="17"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M9 12.5V3M5.5 6.5 9 3l3.5 3.5M3 12v2.5h12V12" />
        </svg>
      </span>
      <span className="mn-drop__txt">
        <span className="mn-drop__title">{title}</span>
        {hint && <span className="mn-drop__sub">{hint}</span>}
      </span>
      <span className="mn-drop__cta">{ctaLabel}</span>
      <input
        type="file"
        className="mn-drop__input"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files?.length) onFiles?.(e.target.files);
        }}
      />
    </label>
  );
}
