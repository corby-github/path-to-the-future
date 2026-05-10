import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import type { MinigameRoomConfig } from '../types/room';

interface Props {
  config: MinigameRoomConfig;
  onComplete: () => void;
}

export function MinigameRoom({ config, onComplete }: Props) {
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
      <p style={{ fontSize: 12, letterSpacing: '0.1em', opacity: 0.6, margin: 0, marginBottom: 24, textTransform: 'uppercase' }}>
        {monthLabel(config.monthId)} · Mini-game
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 400, margin: 0, marginBottom: 16, textAlign: 'center' }}>
        {config.variant}
      </h2>
      <p style={{ fontSize: 14, opacity: 0.6, margin: 0, marginBottom: 48, textAlign: 'center' }}>
        Mini-game arrives Day 11. Skip for now.
      </p>
      <button
        onClick={onComplete}
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
        Skip
      </button>
    </div>
  );
}
