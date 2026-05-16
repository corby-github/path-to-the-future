import { useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { KeysWidget } from './KeysWidget';

// First-run coachmark (Day 13c). Four sequential tip bubbles shown ONCE
// on the player's first DecisionRoom — points at the status bar, teaches
// keyboard movement (issue #89), then highlights interactables and the
// door. Dismissed via Space / Enter / → (advance), Esc (skip), or ←
// (back a step). After the last step, `onDismiss` fires and the
// meta.tutorialDismissed flag is flipped so it never reappears until
// the player hits Begin Again (which resets meta).
//
// Visual register matches the game's cream/ink dialog idiom — bubble
// at the bottom of the viewport, no full backdrop dim (the player needs
// to SEE the regions being described). Gameplay is paused by the parent
// (DecisionRoom passes `active: false` to usePlayerMovement during the
// tutorial), so pointer-events here are limited to the bubble itself.

interface Step {
  title: string;
  body: string;
  // Issue #89 — when set, render the keys-widget illustration below the
  // body copy. Identifies the "movement" step for downstream coordination
  // (e.g., misclick prompt suppresses while this step is showing).
  widget?: 'keys';
}

const STEPS: readonly Step[] = [
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
export const TUTORIAL_KEYS_STEP_INDEX = 1;

interface Props {
  onDismiss: () => void;
  // Issue #89 — DecisionRoom passes the current step index back to the
  // parent on every change so the misclick prompt can suppress while
  // the keys-widget step is showing. Optional: callers that don't care
  // about cross-component coordination can omit.
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
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) onDismiss();
        else setStep((s) => s + 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLast, onDismiss]);

  // Per-step bubble anchor. The overlay is positioned `absolute; inset: 0`
  // inside the DecisionRoom container (which is `width:
  // var(--canvas-display-width)` and `position: relative`), so the bubble
  // anchors to the canvas frame instead of the viewport — flex alignment
  // here positions it relative to the room itself:
  //   0: status bar         → top-center, just below the status row
  //   1: move with keyboard → middle-center (the widest bubble)
  //   2: objects & people   → middle-center (the room itself)
  //   3: the door           → middle-right (anchored to canvas right edge)
  // Bubble remounts on step change (see `key={step}` below) so the pop
  // keyframe replays as a "fresh arrival" cue between positions.
  const STEP_LAYOUTS: ReadonlyArray<{
    alignItems: CSSProperties['alignItems'];
    justifyContent: CSSProperties['justifyContent'];
    padding: string;
  }> = [
    // Top: paddingTop nudges the bubble down past the status bar row
    // (status bar minHeight 20 + 16 gap above the canvas wrapper) so
    // the bubble sits at the top of the canvas, with the ↑ arrow in
    // the title pointing up at the status bar that's visible just above.
    { alignItems: 'flex-start', justifyContent: 'center', padding: '22px 18px 0 16px' },
    // Move-with-keyboard: middle-center so the keys widget reads as
    // "this is how YOU move," with breathing room around the clusters.
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    { alignItems: 'center', justifyContent: 'center', padding: '0 16px' },
    // Right: small inset from the canvas border so the bubble sits just
    // inside the right edge, near the door rather than overlapping it.
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
    // Don't block the canvas click area — gameplay is already paused by
    // the parent. The bubble re-enables its own pointer-events below.
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
        <p style={hintStyle}>
          {isLast ? 'Press Space to start' : 'Press Space to continue'}
          {' · '}
          {step + 1}/{STEPS.length}
        </p>
      </div>
    </div>
  );
}
