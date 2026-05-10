import type { Direction, PlayerState } from '../types/player';
import { PLAYER_RADIUS } from '../coordinates';

interface PlayerProps {
  state: PlayerState;
  radius?: number;
}

const FACING_ROTATION: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export function Player({ state, radius = PLAYER_RADIUS }: PlayerProps) {
  const { position, facing } = state;
  const rotation = FACING_ROTATION[facing];

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{ pointerEvents: 'none' }}
    >
      <g transform={`rotate(${rotation})`}>
        <circle
          cx={0}
          cy={0}
          r={radius}
          fill="#4a90e2"
          stroke="#1f3a5f"
          strokeWidth={2}
        />
        <polygon
          points={`0,${-radius - 4} -5,${-radius + 4} 5,${-radius + 4}`}
          fill="#1f3a5f"
        />
      </g>
    </g>
  );
}
