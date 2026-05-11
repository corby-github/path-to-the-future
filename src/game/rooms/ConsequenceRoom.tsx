import { useEffect } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import type { ConsequenceRoomConfig } from '../types/room';

interface Props {
  config: ConsequenceRoomConfig;
  onContinue: () => void;
}

export function ConsequenceRoom({ config, onContinue }: Props) {
  const { palette } = useCareerPack();

  // Enter / Space dismisses, matching DecisionModal flavor + EventModal body.
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
      style={{
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
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: '0.1em', color: palette.inkMuted, margin: 0, marginBottom: 16, textTransform: 'uppercase' }}>
        {monthLabel(config.monthId)} · Consequence
      </p>
      <h2 style={{ fontSize: 30, fontWeight: 400, margin: 0, marginBottom: 24, textAlign: 'center', lineHeight: 1.25 }}>
        {config.title}
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 640, textAlign: 'center', margin: 0, marginBottom: 56, opacity: 0.85 }}>
        {config.body}
      </p>
      <button
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
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Continue
      </button>
    </div>
  );
}
