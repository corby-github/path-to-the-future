import { useEffect } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import type { NarrativeRoomConfig } from '../types/room';

interface Props {
  config: NarrativeRoomConfig;
  onContinue: () => void;
}

export function NarrativeRoom({ config, onContinue }: Props) {
  const { palette } = useCareerPack();

  // Enter / Space dismisses, matching DecisionModal flavor + EventModal body.
  // Without this, year-change narrative screens were mouse-only.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onContinue]);

  return (
    <div
      data-component="NarrativeRoom"
      data-month-id={config.monthId}
      style={{
        // Responsive sizing matching DecisionRoom's canvas. Aspect ratio
        // keeps the 1000:600 layout intent for narrative copy.
        width: 'var(--canvas-display-width)',
        aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
        background: palette.background,
        color: palette.ink,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        fontFamily: 'inherit',
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: '0.1em', color: palette.inkMuted, margin: 0, marginBottom: 24, textTransform: 'uppercase' }}>
        {monthLabel(config.monthId)}
      </p>
      <h2 style={{ fontSize: 32, fontWeight: 400, margin: 0, marginBottom: 24, textAlign: 'center', lineHeight: 1.2 }}>
        {config.title}
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 640, textAlign: 'center', margin: 0, marginBottom: 56, opacity: 0.85 }}>
        {config.body}
      </p>
      <button
        data-action="continue"
        onClick={onContinue}
        style={{
          padding: '12px 32px',
          background: 'transparent',
          color: palette.ink,
          border: `1px solid ${palette.ink}`,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {config.continueLabel ?? 'Continue'}
      </button>
    </div>
  );
}
