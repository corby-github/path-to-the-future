import { useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { CAREERS } from '../content/careers';

// Career picker per §16 step 1. Lists all five v1 careers; only `playable: true`
// entries (in v1, just Software Engineering) are selectable. Others appear
// grayed with a "Coming Soon" tag.
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

  const screenStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: palette.background,
    color: palette.ink,
    fontFamily:
      "inherit",
    padding: 32,
    gap: 32,
  };

  const cardStyle: CSSProperties = {
    background: palette.background,
    border: `1px solid ${palette.surface}`,
    borderRadius: 8,
    padding: '32px 40px',
    maxWidth: 560,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  };

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.01em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    color: palette.inkMuted,
    margin: 0,
  };

  const optionsStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  return (
    <div data-component="CareerPicker" style={screenStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Choose your career</h1>
        <p style={subtitleStyle}>
          Five paths in v1 — one playable. More on the way.
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
              onClick={() => c.playable && setPickedId(c.id)}
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
    padding: '14px 16px',
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
    fontSize: 14,
    fontWeight: 600,
    color: palette.ink,
  };

  const lockTagStyle: CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    border: `1px solid ${palette.surface}`,
    borderRadius: 3,
    padding: '1px 6px',
  };

  const taglineStyle: CSSProperties = {
    fontSize: 12,
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
  const style: CSSProperties = {
    alignSelf: 'flex-end',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 22px',
    border: 'none',
    borderRadius: 4,
    background: enabled ? palette.ink : palette.surface,
    color: enabled ? palette.background : palette.inkMuted,
    cursor: enabled ? 'pointer' : 'not-allowed',
    letterSpacing: '0.02em',
    transition: 'background 120ms ease',
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
