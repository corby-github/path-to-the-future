import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useTrackPageview } from '../analytics/track';
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
  useTrackPageview('/init/class');
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

  // Outer = canvas frame; inner card is a transparent layout column.
  // Dark page wrapper comes from App.tsx's <PageFrame>. Same pattern as
  // CareerPicker / NameEntry / IntroScene.
  const screenStyle: CSSProperties = {
    width: 'var(--canvas-display-width)',
    aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
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
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  };

  const cardStyle: CSSProperties = {
    background: 'transparent',
    padding: 0,
    maxWidth: 640,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    // Matches EndgameScreen / TitleScreen / CareerPicker.
    letterSpacing: '0.02em',
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

  // Outlined modal-button style — matches DecisionModal Continue,
  // CreditsScreen Close, EndgameScreen actions. Centered.
  const buttonStyle: CSSProperties = {
    alignSelf: 'center',
    padding: '12px 32px',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: pickedId ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    opacity: pickedId ? 1 : 0.4,
    transition: 'background 120ms, opacity 120ms',
  };

  return (
    <div data-component="ClassPicker" style={screenStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Choose your starting class</h1>
        <p style={subtitleStyle}>
          You'll climb the rest as you gain XP.
        </p>
        <p
          style={{
            ...subtitleStyle,
            fontStyle: 'italic',
            opacity: 0.85,
            marginTop: -8,
          }}
        >
          This is where you'll start, not where you'll end up (hopefully). Play your cards right.
        </p>

        <div
          data-region="options"
          role="group"
          aria-label="Class options"
          style={optionsStyle}
        >
          {CLASSES.map((c) => {
            const playable = Boolean(pack.manifest.entryClasses[c.id]);
            const override = pack.manifest.classLabels?.[c.id];
            return (
              <ClassOption
                key={c.id}
                id={c.id}
                label={override?.label ?? c.label}
                role={override?.role ?? c.role}
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
          data-action="continue"
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
  id: string;
  label: string;
  role: string;
  xpRange: string;
  playable: boolean;
  selected: boolean;
  onClick: () => void;
  palette: ReturnType<typeof useCareerPack>['palette'];
}

function ClassOption({
  id,
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
      data-class-id={id}
      data-selected={selected || undefined}
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
