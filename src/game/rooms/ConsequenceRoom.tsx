import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import type { ConsequenceRoomConfig } from '../types/room';

interface Props {
  config: ConsequenceRoomConfig;
  onContinue: () => void;
}

export function ConsequenceRoom({ config, onContinue }: Props) {
  return (
    <div
      style={{
        width: ROOM_VIEWBOX.width,
        height: ROOM_VIEWBOX.height,
        background: '#f5f1e8',
        color: '#2c2c2c',
        border: '2px solid #2c2c2c',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: '0.1em', opacity: 0.6, margin: 0, marginBottom: 16, textTransform: 'uppercase' }}>
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
          color: '#2c2c2c',
          border: '1px solid #2c2c2c',
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
