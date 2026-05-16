import { useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import type { Palette } from '../types/careerPack';
import { KeysWidget } from './KeysWidget';

// First-run coachmark (Day 13c, expanded v2.0.32). Five sequential tip
// bubbles shown ONCE on the player's first DecisionRoom:
//
//   0: intro       — "Quick tutorial intro" (center-anchored)
//   1: status bar  — "This is what you need to do." (top)
//   2: movement    — "Move with the keyboard" + KeysWidget (center)
//   3: sprint      — "Press 2× to sprint" + ExampleRow (center)
//   4: people/obj  — "Objects & people" (center)
//   5: door        — "The door →" (right)
//
// Dismissed via Space / Enter / → (advance), Esc (skip), or ← (back a
// step). After the last step, `onDismiss` fires and the
// meta.tutorialDismissed flag is flipped so it never reappears until
// the player hits Begin Again (which resets meta).
//
// v2.0.32 — the sprint step moved here from its own SprintTutorialOverlay
// (which fired after 5 s of cumulative movement). Inlining keeps the
// teach sequential rather than time-triggered: the player learns
// baseline movement then immediately learns the sprint upgrade, in one
// dismiss flow.
//
// Visual register matches the game's cream/ink dialog idiom — bubble
// at the bottom of the viewport, no full backdrop dim (the player needs
// to SEE the regions being described). Gameplay is paused by the parent
// (DecisionRoom passes `active: false` to usePlayerMovement during the
// tutorial), so pointer-events here are limited to the bubble itself.

interface Step {
  title: string;
  body: string;
  // When set, render the named illustration below the body copy. The
  // misclick prompt suppresses while the `keys` step is showing (avoids
  // stacking a keys-widget overlay on the keys-widget tutorial bubble).
  widget?: 'keys' | 'sprint';
}

const STEPS: readonly Step[] = [
  {
    title: 'Quick tutorial',
    body: 'I’ll show you how to play. Any key to continue.',
  },
  {
    title: 'Status bar ↑',
    body: 'This is what you need to do.',
  },
  {
    title: 'Move with the keyboard',
    body: 'Arrow keys or WASD. Clicking won’t do anything — the game is keyboard-only.',
    widget: 'keys',
  },
  {
    title: 'Press 2× to sprint',
    body: 'Press the direction key 2 times to go faster.',
    widget: 'sprint',
  },
  {
    title: 'Objects & people',
    body: 'You can inspect objects and talk to people — maybe you’ll learn something. But, probably not.',
  },
  {
    title: 'The door →',
    body: 'When you’re done, head to the door.',
  },
];

// Index of the keys-widget step. Exported so DecisionRoom can suppress
// the misclick prompt while this step is showing (avoids a redundant
// keys-widget overlay on top of the keys-widget tutorial bubble).
export const TUTORIAL_KEYS_STEP_INDEX = 2;

interface Props {
  onDismiss: () => void;
  // DecisionRoom passes the current step index back on every change so
  // the misclick prompt can suppress while the keys-widget step is
  // showing. Optional: callers that don't care about cross-component
  // coordination can omit.
  onStepChange?: (stepIndex: number) => void;
}

export function TutorialOverlay({ onDismiss, onStepChange }: Props) {
  const { palette } = useCareerPack();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
        return;
      }
      // Step 0 ("Quick tutorial intro") advances on ANY key (per the
      // step body's "Any key to continue" hint). Later steps stick to
      // Space / Enter / → so the player can hold a direction key to
      // pre-load movement without skipping past unread copy.
      if (step === 0) {
        e.preventDefault();
        setStep((s) => s + 1);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) onDismiss();
        else setStep((s) => s + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLast, onDismiss, step]);

  // Per-step bubble anchor. The overlay is positioned `absolute; inset: 0`
  // inside the DecisionRoom container, so the bubble anchors to the
  // canvas frame instead of the viewport. Flex alignment positions it
  // relative to the room. Bubble remounts on step change (see
  // `key={step}` below) so the pop keyframe replays per arrival.
  const STEP_LAYOUTS: ReadonlyArray<{
    alignItems: CSSProperties['alignItems'];
    justifyContent: CSSProperties['justifyContent'];
    padding: string;
  }> = [
    // 0: intro — middle-center, full focus.
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    // 1: status bar — top, paddingTop nudges the bubble below the status row.
    { alignItems: 'flex-start', justifyContent: 'center', padding: '22px 18px 0 16px' },
    // 2: move with keyboard — middle-center.
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    // 3: sprint — middle-center.
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    // 4: objects & people — middle-center.
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    // 5: door — middle-right, small inset from canvas border.
    { alignItems: 'center', justifyContent: 'flex-end', padding: '40px 40px 0px' },
  ];
  const layout = STEP_LAYOUTS[step] ?? STEP_LAYOUTS[0];

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: layout.alignItems,
    justifyContent: layout.justifyContent,
    padding: layout.padding,
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

  return (
    <div
      data-component="TutorialOverlay"
      data-step={step}
      style={overlayStyle}
      role="dialog"
      aria-label="Tutorial"
      aria-modal="false"
    >
      <div key={step} data-region="bubble" style={bubbleStyle}>
        <p style={titleStyle}>{current.title}</p>
        <p style={bodyStyle}>{current.body}</p>
        {current.widget === 'keys' && (
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
            <KeysWidget palette={palette} size={36} />
          </div>
        )}
        {current.widget === 'sprint' && (
          <>
            <p style={exampleLabelStyle}>Example</p>
            <SprintExampleRow palette={palette} />
          </>
        )}
        <p style={hintStyle}>
          {step === 0
            ? 'Any key to continue'
            : isLast
            ? 'Press Space to start'
            : 'Press Space to continue'}
          {' · '}
          {step + 1}/{STEPS.length}
        </p>
      </div>
    </div>
  );
}

// Literal "→ + → goes fast right" example row for the sprint step.
// Two bordered glyph cells with a "+" between them, then the human-
// readable label. Defaults to the rightward direction since the door
// is east — that's the natural "I want to get there faster" beat. No
// pulse animation (user playtest preference: cleaner without it; the
// "+" reads the rhythm clearly enough).
function SprintExampleRow({ palette }: { palette: Palette }) {
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
      <span style={cellStyle}>→</span>
      <span style={plusStyle}>+</span>
      <span style={cellStyle}>→</span>
      <p style={labelStyle}>Go fast right</p>
    </div>
  );
}
