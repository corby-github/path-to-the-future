import { useEffect, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { KeysWidget, type SprintPulseDirection } from './KeysWidget';

// Issue #92 — second tutorial step, fires AFTER the main 4-step
// coachmark dismisses AND after the player has accumulated ~5 s of
// baseline movement. Single-step overlay: shows the keys widget with
// a pulse on the player's most-used direction + a "tap twice and hold
// to run" caption. Dismisses on any keypress or click; never reappears
// after first dismissal (persisted via `meta.sprintTutorialDismissed`).
//
// Why separate from TutorialOverlay: the trigger condition is
// time-based, not user-paced — separating the components keeps each
// dismissal flow independent. Visual register matches the main
// coachmark (cream/ink bubble, center-canvas anchor).

interface Props {
  onDismiss: () => void;
  // Direction to pulse in the keys widget. Picked by DecisionRoom based
  // on the most-recently-used direction at trigger time; falls back to
  // 'right' (the most natural "I want to get there" direction given the
  // door is east).
  pulseDirection?: SprintPulseDirection;
}

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
      data-component="SprintTutorialOverlay"
      style={overlayStyle}
      role="dialog"
      aria-label="Sprint tutorial"
      aria-modal="false"
    >
      <div data-region="bubble" style={bubbleStyle}>
        <p style={titleStyle}>Tap twice and hold to run</p>
        <p style={bodyStyle}>
          Double-tap any direction to sprint. Release to slow back down.
        </p>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <KeysWidget palette={palette} size={36} pulseDirection={pulseDirection} />
        </div>
        <p style={hintStyle}>Press any key to dismiss</p>
      </div>
    </div>
  );
}
