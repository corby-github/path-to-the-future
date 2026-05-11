import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { CLASSES } from '../content/classes';

// Class picker per §14 / §16 step 3. Lists all eight class tiers; selectability
// is determined at runtime by checking the loaded career pack's
// `manifest.entryClasses` map. In v1 (SWE pack), only `novice` and `skilled`
// have entries, so the other six show as "Coming Soon".
//
// Keyboard: ↑↓←→ cycles through PLAYABLE entries only; Enter/Space confirms.
//
// Calls `onSelect(classId)` when the user clicks Continue.

interface Props {
  onSelect: (classId: string) => void;
}

export function ClassPicker({ onSelect }: Props) {
  const { pack, palette } = useCareerPack();

  // Which class ids are playable for this career pack (from manifest).
  // Stable per pack mount — computed once.
  const playableIds = useMemo(
    () => new Set(Object.keys(pack.manifest.entryClasses)),
    [pack.manifest.entryClasses],
  );

  const adjacentPlayableIndex = useMemo(
    () => (current: number, dir: 1 | -1): number => {
      let i = current;
      for (let step = 0; step < CLASSES.length; step++) {
        i = (i + dir + CLASSES.length) % CLASSES.length;
        if (playableIds.has(CLASSES[i].id)) return i;
      }
      return current;
    },
    [playableIds],
  );

  const [pickedId, setPickedId] = useState<string | null>(() => {
    const first = CLASSES.find((c) => playableIds.has(c.id));
    return first?.id ?? null;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setPickedId((cur) => {
          const idx = cur ? CLASSES.findIndex((c) => c.id === cur) : -1;
          const next = adjacentPlayableIndex(idx >= 0 ? idx : 0, 1);
          return CLASSES[next].id;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPickedId((cur) => {
          const idx = cur ? CLASSES.findIndex((c) => c.id === cur) : -1;
          const next = adjacentPlayableIndex(idx >= 0 ? idx : 0, -1);
          return CLASSES[next].id;
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
  }, [pickedId, onSelect, adjacentPlayableIndex]);

  const screenStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: palette.background,
    color: palette.ink,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
    padding: 32,
    gap: 32,
  };

  const cardStyle: CSSProperties = {
    background: palette.background,
    border: `1px solid ${palette.surface}`,
    borderRadius: 8,
    padding: '32px 40px',
    maxWidth: 640,
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
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  };

  const buttonStyle: CSSProperties = {
    alignSelf: 'flex-end',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 22px',
    border: 'none',
    borderRadius: 4,
    background: pickedId ? palette.ink : palette.surface,
    color: pickedId ? palette.background : palette.inkMuted,
    cursor: pickedId ? 'pointer' : 'not-allowed',
    letterSpacing: '0.02em',
    transition: 'background 120ms ease',
  };

  return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Choose your starting class</h1>
        <p style={subtitleStyle}>
          Two playable in v1. You'll climb the rest as you gain XP.
        </p>
        <p
          style={{
            ...subtitleStyle,
            fontStyle: 'italic',
            opacity: 0.85,
            marginTop: -8,
          }}
        >
          Where you start. Not where you'll end. Play your cards right.
        </p>

        <div style={optionsStyle}>
          {CLASSES.map((c) => {
            const playable = Boolean(pack.manifest.entryClasses[c.id]);
            return (
              <ClassOption
                key={c.id}
                label={c.label}
                role={c.role}
                xpRange={formatXpRange(c.xpMin, c.xpMax)}
                playable={playable}
                selected={pickedId === c.id}
                onClick={() => playable && setPickedId(c.id)}
                palette={palette}
              />
            );
          })}
        </div>

        <button
          type="button"
          style={buttonStyle}
          disabled={!pickedId}
          onClick={() => pickedId && onSelect(pickedId)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ---- option card ----

interface OptionProps {
  label: string;
  role: string;
  xpRange: string;
  playable: boolean;
  selected: boolean;
  onClick: () => void;
  palette: ReturnType<typeof useCareerPack>['palette'];
}

function ClassOption({
  label,
  role,
  xpRange,
  playable,
  selected,
  onClick,
  palette,
}: OptionProps) {
  const baseBorder = selected ? palette.accent : palette.surface;
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '12px 14px',
    border: `1.5px solid ${baseBorder}`,
    borderRadius: 6,
    background: selected ? `${palette.accent}10` : 'transparent',
    cursor: playable ? 'pointer' : 'not-allowed',
    opacity: playable ? 1 : 0.4,
    transition: 'border-color 120ms ease, background 120ms ease',
    textAlign: 'left',
    userSelect: 'none',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: palette.ink,
  };

  const lockTagStyle: CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    border: `1px solid ${palette.surface}`,
    borderRadius: 3,
    padding: '1px 5px',
  };

  const roleStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    fontStyle: 'italic',
  };

  const xpStyle: CSSProperties = {
    fontSize: 10,
    color: palette.inkMuted,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
    marginTop: 4,
  };

  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      disabled={!playable}
      aria-pressed={selected}
    >
      <span style={headerStyle}>
        {label}
        {!playable && <span style={lockTagStyle}>Soon</span>}
      </span>
      <span style={roleStyle}>{role}</span>
      <span style={xpStyle}>{xpRange} XP</span>
    </button>
  );
}

function formatXpRange(min: number, max: number): string {
  if (!isFinite(max)) return `${min.toLocaleString('en-US')}+`;
  return `${min.toLocaleString('en-US')}–${max.toLocaleString('en-US')}`;
}
