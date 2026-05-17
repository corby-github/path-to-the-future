import { useEffect, useState, type CSSProperties } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useTrackPageview } from '../analytics/track';
import { CAREERS } from '../content/careers';

// Career picker per §16 step 1. Lists all five v1 careers; only `playable: true`
// entries (Software Engineering + Homeschool Parent in v2.0.1+) are selectable.
// Others appear grayed with a "Coming Soon" tag.
//
// Keyboard: ↑↓ (or ←→) cycles through PLAYABLE entries only; Enter/Space
// confirms the current pick and advances. Mouse two-step (click option →
// click Continue) is preserved.
//
// Calls `onSelect(careerId)` when the user clicks Continue.

interface Props {
  onSelect: (careerId: string) => void;
}

// Index in CAREERS of the first playable entry — used to auto-select on mount
// so keyboard users can hit Enter immediately.
function firstPlayableIndex(): number {
  return CAREERS.findIndex((c) => c.playable);
}

function adjacentPlayableIndex(current: number, dir: 1 | -1): number {
  let i = current;
  for (let step = 0; step < CAREERS.length; step++) {
    i = (i + dir + CAREERS.length) % CAREERS.length;
    if (CAREERS[i]?.playable) return i;
  }
  return current;
}

export function CareerPicker({ onSelect }: Props) {
  useTrackPageview('/init/career');
  const { palette } = useCareerPack();
  const [pickedId, setPickedId] = useState<string | null>(() => {
    const idx = firstPlayableIndex();
    return idx >= 0 ? CAREERS[idx].id : null;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setPickedId((cur) => {
          const idx = cur ? CAREERS.findIndex((c) => c.id === cur) : -1;
          const next = adjacentPlayableIndex(idx >= 0 ? idx : 0, 1);
          return CAREERS[next].id;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPickedId((cur) => {
          const idx = cur ? CAREERS.findIndex((c) => c.id === cur) : -1;
          const next = adjacentPlayableIndex(idx >= 0 ? idx : 0, -1);
          return CAREERS[next].id;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (pickedId) {
          e.preventDefault();
          onSelect(pickedId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pickedId, onSelect]);

  // Outer = canvas frame (1000×600 aspect ratio at the responsive
  // canvas-display-width). Mirrors EndgameScreen / TitleScreen so every
  // non-Game screen sits in the same bounded envelope on the dark page
  // (the dark page wrapper comes from App.tsx's <PageFrame>).
  //
  // The aspect ratio is a *minimum*, not a lock: at very short viewports
  // (e.g. 915×412 → canvas ~286×172) the picker's 5 options + title +
  // button can't fit inside 0.6× the canvas width, so we let the frame
  // grow taller and let the page scroll. `containerType: inline-size`
  // lets the inner padding / gap / fonts size off canvas width via `cqw`
  // so the layout also tightens proportionally on narrow viewports.
  const screenStyle: CSSProperties = {
    width: 'var(--canvas-display-width)',
    minHeight: `calc(var(--canvas-display-width) * ${ROOM_VIEWBOX.height} / ${ROOM_VIEWBOX.width})`,
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.surface}`,
    borderRadius: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(12px, 3.2cqw, 32px)',
    gap: 'clamp(8px, 2.4cqw, 24px)',
    overflow: 'visible',
    containerType: 'inline-size',
  };

  // Inner card — width-constrained content column. Outer canvas frame
  // is the only visible border now; this card is a transparent layout
  // container that keeps the content readable on a wide canvas.
  const cardStyle: CSSProperties = {
    background: 'transparent',
    padding: 0,
    maxWidth: 560,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(8px, 2cqw, 20px)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'clamp(14px, 2.2cqw, 22px)',
    fontWeight: 600,
    margin: 0,
    // Matches EndgameScreen / TitleScreen — was -0.01em which read
    // slightly tighter than the rest of the app's typography.
    letterSpacing: '0.02em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'clamp(10px, 1.3cqw, 13px)',
    color: palette.inkMuted,
    margin: 0,
  };

  const optionsStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(4px, 0.8cqw, 8px)',
  };

  return (
    <div data-component="CareerPicker" style={screenStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Choose your career</h1>
        <p style={subtitleStyle}>
          Five paths in v1 — two playable. More on the way.
        </p>

        <div
          data-region="options"
          role="group"
          aria-label="Career options"
          style={optionsStyle}
        >
          {CAREERS.map((c) => (
            <CareerOption
              key={c.id}
              id={c.id}
              name={c.name}
              tagline={c.tagline}
              playable={c.playable}
              selected={pickedId === c.id}
              onClick={() => c.playable && onSelect(c.id)}
              palette={palette}
            />
          ))}
        </div>

        <ContinueButton
          enabled={pickedId !== null}
          onClick={() => pickedId && onSelect(pickedId)}
          palette={palette}
        />
      </div>
    </div>
  );
}

// ---- option row ----

interface OptionProps {
  id: string;
  name: string;
  tagline: string;
  playable: boolean;
  selected: boolean;
  onClick: () => void;
  palette: ReturnType<typeof useCareerPack>['palette'];
}

function CareerOption({
  id,
  name,
  tagline,
  playable,
  selected,
  onClick,
  palette,
}: OptionProps) {
  const baseBorder = selected ? palette.accent : palette.surface;
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 'clamp(8px, 1.4cqw, 14px) clamp(10px, 1.6cqw, 16px)',
    border: `1.5px solid ${baseBorder}`,
    borderRadius: 6,
    background: selected ? `${palette.accent}10` : 'transparent',
    cursor: playable ? 'pointer' : 'not-allowed',
    opacity: playable ? 1 : 0.45,
    transition: 'border-color 120ms ease, background 120ms ease',
    userSelect: 'none',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 'clamp(11px, 1.4cqw, 14px)',
    fontWeight: 600,
    color: palette.ink,
  };

  const lockTagStyle: CSSProperties = {
    fontSize: 'clamp(8px, 1cqw, 10px)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    border: `1px solid ${palette.surface}`,
    borderRadius: 3,
    padding: '1px 6px',
  };

  const taglineStyle: CSSProperties = {
    fontSize: 'clamp(10px, 1.2cqw, 12px)',
    color: palette.inkMuted,
    fontStyle: 'italic',
  };

  return (
    <button
      type="button"
      data-career-id={id}
      data-selected={selected || undefined}
      style={style}
      onClick={onClick}
      disabled={!playable}
      aria-pressed={selected}
    >
      <span style={headerStyle}>
        {name}
        {!playable && <span style={lockTagStyle}>Coming Soon</span>}
      </span>
      <span style={taglineStyle}>{tagline}</span>
    </button>
  );
}

// ---- continue button (shared shape; tiny enough to inline) ----

interface ContinueButtonProps {
  enabled: boolean;
  onClick: () => void;
  palette: ReturnType<typeof useCareerPack>['palette'];
}

function ContinueButton({ enabled, onClick, palette }: ContinueButtonProps) {
  // Outlined modal-button style — matches DecisionModal Continue,
  // CreditsScreen Close, EndgameScreen actions. Centered (alignSelf
  // moves it off the trailing edge of the column where the previous
  // filled-button style sat). Disabled: 0.4 opacity + not-allowed
  // cursor; border + color stay the same so the button doesn't shift
  // size when the input becomes valid.
  const style: CSSProperties = {
    alignSelf: 'center',
    padding: 'clamp(8px, 1.2cqw, 12px) clamp(20px, 3.2cqw, 32px)',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 'clamp(11px, 1.3cqw, 13px)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    opacity: enabled ? 1 : 0.4,
    transition: 'background 120ms, opacity 120ms',
  };
  return (
    <button
      type="button"
      data-action="continue"
      style={style}
      disabled={!enabled}
      onClick={onClick}
    >
      Continue
    </button>
  );
}
