import { useEffect, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import type { Palette } from '../types/careerPack';
import type { SprintPulseDirection } from './KeysWidget';

// Issue #92 — second tutorial step, fires AFTER the main 4-step
// coachmark dismisses AND after the player has accumulated ~5 s of
// baseline movement. Single-step overlay; teaches the double-tap
// sprint with explicit "press 2 times" copy + a literal worked
// example showing one direction glyph tapped twice. Dismisses on any
// keypress or click; never reappears after first dismissal (persisted
// via `meta.sprintTutorialDismissed`).
//
// Copy revised post-playtest: original "Tap twice and hold to run" +
// "Double-tap any direction to sprint" didn't read as "press 2x" to
// the player. The example row (`→ + → Go fast right`) is the
// load-bearing teach.
//
// Why separate from TutorialOverlay: the trigger condition is
// time-based, not user-paced — separating the components keeps each
// dismissal flow independent. Visual register matches the main
// coachmark (cream/ink bubble, center-canvas anchor).

interface Props {
  onDismiss: () => void;
  // Direction to use in the example row + pulse the example glyph.
  // Picked by DecisionRoom based on the most-recently-used direction
  // at trigger time; falls back to 'right' (the most natural "I want
  // to get there" direction given the door is east).
  pulseDirection?: SprintPulseDirection;
}

const GLYPH_FOR: Record<NonNullable<SprintPulseDirection>, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const LABEL_FOR: Record<NonNullable<SprintPulseDirection>, string> = {
  up: 'Go fast up',
  down: 'Go fast down',
  left: 'Go fast left',
  right: 'Go fast right',
};

export function SprintTutorialOverlay({
  onDismiss,
  pulseDirection = 'right',
}: Props) {
  const { palette } = useCareerPack();

  useEffect(() => {
    const dismiss = () => onDismiss();
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Any keypress dismisses. The player's already moving — the next
      // input they fire is intent, not navigation through the bubble.
      e.preventDefault();
      dismiss();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', dismiss);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', dismiss);
    };
  }, [onDismiss]);

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    pointerEvents: 'none',
    zIndex: 80,
  };

  const bubbleStyle: CSSProperties = {
    pointerEvents: 'auto',
    background: palette.background,
    color: palette.ink,
    border: `2px solid ${palette.ink}`,
    borderRadius: 6,
    padding: '14px 22px',
    maxWidth: 'min(540px, 90vw)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
    animation: 'decision-modal-dialog-pop 240ms ease-out',
    fontFamily: 'inherit',
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    marginBottom: 6,
  };

  const bodyStyle: CSSProperties = {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: palette.ink,
  };

  const exampleLabelStyle: CSSProperties = {
    margin: '12px 0 6px 0',
    fontSize: 11,
    color: palette.inkMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  const hintStyle: CSSProperties = {
    margin: '10px 0 0 0',
    fontSize: 11,
    color: palette.inkMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.7,
  };

  const dir = pulseDirection ?? 'right';
  const glyph = GLYPH_FOR[dir];
  const label = LABEL_FOR[dir];

  return (
    <div
      data-component="SprintTutorialOverlay"
      style={overlayStyle}
      role="dialog"
      aria-label="Sprint tutorial"
      aria-modal="false"
    >
      <div data-region="bubble" style={bubbleStyle}>
        <p style={titleStyle}>Press 2× to sprint</p>
        <p style={bodyStyle}>
          Press the direction key 2 times to go faster.
        </p>
        <p style={exampleLabelStyle}>Example</p>
        <ExampleRow palette={palette} glyph={glyph} label={label} />
        <p style={hintStyle}>Press any key to dismiss</p>
      </div>
    </div>
  );
}

interface ExampleRowProps {
  palette: Palette;
  glyph: string;
  label: string;
}

// Literal "→ + → goes fast right" example row. Renders two bordered
// glyph cells with a "+" between them, then the human-readable label.
// The second glyph cell pulses ("keys-widget-pulse" keyframe in
// global.css) so the eye reads the rhythm of "press twice."
function ExampleRow({ palette, glyph, label }: ExampleRowProps) {
  const cellSize = 36;
  const cellStyle: CSSProperties = {
    width: cellSize,
    height: cellSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.background,
    color: palette.ink,
    border: `2px solid ${palette.ink}`,
    borderRadius: 4,
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: Math.round(cellSize * 0.45),
    lineHeight: 1,
  };
  const plusStyle: CSSProperties = {
    fontSize: 18,
    color: palette.ink,
    fontWeight: 600,
  };
  const labelStyle: CSSProperties = {
    margin: 0,
    fontSize: 14,
    color: palette.ink,
    fontWeight: 500,
  };

  return (
    <div
      data-region="example-row"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={cellStyle}>{glyph}</span>
      <span style={plusStyle}>+</span>
      <span
        style={{
          ...cellStyle,
          animation: 'keys-widget-pulse 900ms ease-in-out infinite',
        }}
      >
        {glyph}
      </span>
      <p style={labelStyle}>{label}</p>
    </div>
  );
}
