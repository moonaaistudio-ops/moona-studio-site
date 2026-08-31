import * as React from 'react';
import { cx } from './cx';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The small mono line above the title. Gold by default. */
  eyebrow?: React.ReactNode;
  /**
   * `index` styles the eyebrow as a section number — ice, wider tracking.
   * Use it for "01 / WORK", keep the default gold for a named eyebrow.
   */
  eyebrowVariant?: 'accent' | 'index';
  /** The serif headline. Wrap a phrase in `<em>` for the gold emphasis. */
  title: React.ReactNode;
  /** One paragraph under the title. Capped near 44ch — it is a note, not a page. */
  note?: React.ReactNode;
  /** Heading level. Only one `h1` per page. */
  as?: 'h1' | 'h2' | 'h3';
}

/**
 * Eyebrow, serif headline, note — the three-part section opener used by
 * every section on the site.
 *
 * The `em` inside the title renders italic gold in Latin. Instrument Serif's
 * Hebrew fallback has no italic, so under `html[lang="he"]` the emphasis
 * switches to weight and colour instead. That rule lives in components.css;
 * you only ever write `<em>`.
 */
export function SectionHeading({
  eyebrow,
  eyebrowVariant = 'accent',
  title,
  note,
  as: Tag = 'h2',
  className,
  ...rest
}: SectionHeadingProps) {
  return (
    <div className={cx('mn-heading', className)} {...rest}>
      {eyebrow && (
        <span
          className={cx(
            'mn-heading__eyebrow',
            eyebrowVariant === 'index' && 'mn-heading__eyebrow--index',
          )}
        >
          {eyebrow}
        </span>
      )}
      <Tag className="mn-heading__title">{title}</Tag>
      {note && <p className="mn-heading__note">{note}</p>}
    </div>
  );
}
