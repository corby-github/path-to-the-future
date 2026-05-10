import type { Direction, PlayerState } from '../types/player';

interface PlayerProps {
  state: PlayerState;
  size?: number;
}

const FACING_ROTATION: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export function Player({ state, size = 28 }: PlayerProps) {
  const { position, facing } = state;
  const rotation = FACING_ROTATION[facing];

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{ pointerEvents: 'none' }}
    >
      <g transform={`rotate(${rotation})`}>
        {/* Body */}
        <circle
          cx={0}
          cy={0}
          r={size / 2}
          fill="#4a90e2"
          stroke="#1f3a5f"
          strokeWidth={2}
        />
        {/* Direction notch */}
        <polygon
          points={`0,${-size / 2 - 4} -5,${-size / 2 + 4} 5,${-size / 2 + 4}`}
          fill="#1f3a5f"
        />
      </g>
    </g>
  );
}
