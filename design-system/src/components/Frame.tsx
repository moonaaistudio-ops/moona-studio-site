import * as React from 'react';
import { cx } from './cx';

export type FrameRatio = '16/9' | '16/9.18' | '9/16' | '1/1';

export interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The aperture is closed until this is true, then the circle opens over
   * ~1s. Drive it from an IntersectionObserver, not from load.
   */
  open?: boolean;
  /** `stage` is the flagship size — deeper shadow, wider final aperture. */
  variant?: 'grid' | 'stage';
  /** The box holds this ratio whether or not the video ever loads. */
  ratio?: FrameRatio;
  /** Poster image. Painted as the background so the frame is never empty. */
  poster?: string;
  /** Badges, bottom-left. Usually `<Chip variant="spec">`. */
  badges?: React.ReactNode;
  /** Controls, bottom-right. Usually `<IconButton>`. */
  controls?: React.ReactNode;
  /** Playback progress, 0–1. Renders the hairline along the bottom edge. */
  progress?: number;
}

/**
 * The media surface, and the site's signature move: a circle that opens
 * from the centre when the frame comes into view.
 *
 * Two things this deliberately does NOT do. The box never derives its size
 * from the video — the ratio is declared, so nothing reflows when the file
 * arrives. And the video is only mounted while it is the piece you are near:
 * a video layer costs the compositor whether or not it is playing, and four
 * of them at this size halve the frame rate across the page. Unmount the
 * children when the piece is far away; the poster holds the frame.
 */
export function Frame({
  open = false,
  variant = 'grid',
  ratio = '16/9',
  poster,
  badges,
  controls,
  progress,
  className,
  style,
  children,
  ...rest
}: FrameProps) {
  return (
    <div
      className={cx(
        'mn-frame',
        variant === 'stage' && 'mn-frame--stage',
        open && 'is-open',
        className,
      )}
      data-ratio={ratio}
      style={{
        ...style,
        ...(poster ? { backgroundImage: `url(${poster})` } : null),
      }}
      {...rest}
    >
      {children}
      {badges && <div className="mn-frame__badges">{badges}</div>}
      {controls && <div className="mn-frame__controls">{controls}</div>}
      {progress != null && (
        <div
          className="mn-frame__progress"
          style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
        />
      )}
    </div>
  );
}
