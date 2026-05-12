import { useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';

// First-run coachmark (Day 13c). Three sequential tip bubbles shown ONCE
// on the player's first DecisionRoom — points at the status bar, the
// interactables, and the door. Dismissed via Space / Enter / → (advance),
// Esc (skip), or ← (back a step). After the last step, `onDismiss` fires
// and the meta.tutorialDismissed flag is flipped so it never reappears
// until the player hits Begin Again (which resets meta).
//
// Visual register matches the game's cream/ink dialog idiom — bubble
// at the bottom of the viewport, no full backdrop dim (the player needs
// to SEE the regions being described). Gameplay is paused by the parent
// (DecisionRoom passes `active: false` to usePlayerMovement during the
// tutorial), so pointer-events here are limited to the bubble itself.

interface Step {
  title: string;
  body: string;
}

const STEPS: readonly Step[] = [
  {
    title: 'Status bar ↑',
    body: 'This is what you need to do.',
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

interface Props {
  onDismiss: () => void;
}

export function TutorialOverlay({ onDismiss }: Props) {
  const { palette } = useCareerPack();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

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

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 80,
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
      <div data-region="bubble" style={bubbleStyle}>
        <p style={titleStyle}>{current.title}</p>
        <p style={bodyStyle}>{current.body}</p>
        <p style={hintStyle}>
          {isLast ? 'Press Space to start' : 'Press Space to continue'}
          {' · '}
          {step + 1}/{STEPS.length}
        </p>
      </div>
    </div>
  );
}
