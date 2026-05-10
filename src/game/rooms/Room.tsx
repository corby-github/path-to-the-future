import { useMemo } from 'react';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import type { Bounds } from '../types/geometry';

const ROOM_WIDTH = 640;
const ROOM_HEIGHT = 400;
const PADDING = 20;

export function Room() {
  const bounds: Bounds = useMemo(() => ({
    minX: PADDING,
    minY: PADDING,
    maxX: ROOM_WIDTH - PADDING,
    maxY: ROOM_HEIGHT - PADDING,
  }), []);

  const playerState = usePlayerMovement({
    initialPosition: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 },
    bounds,
  });

  return (
    <svg
      width={ROOM_WIDTH}
      height={ROOM_HEIGHT}
      viewBox={`0 0 ${ROOM_WIDTH} ${ROOM_HEIGHT}`}
      style={{
        background: '#f5f1e8',
        border: '2px solid #2c2c2c',
        display: 'block',
      }}
    >
      {/* Room floor */}
      <rect x={0} y={0} width={ROOM_WIDTH} height={ROOM_HEIGHT} fill="#f5f1e8" />

      {/* Walls (visual only for now — collision arrives Day 2) */}
      <rect
        x={PADDING - 10}
        y={PADDING - 10}
        width={ROOM_WIDTH - (PADDING - 10) * 2}
        height={ROOM_HEIGHT - (PADDING - 10) * 2}
        fill="none"
        stroke="#2c2c2c"
        strokeWidth={2}
      />

      <Player state={playerState} />

      {/* Caption */}
      <text
        x={ROOM_WIDTH / 2}
        y={ROOM_HEIGHT - 8}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize={11}
        fill="#888"
      >
        January 2020 · Use Arrow Keys or WASD to move
      </text>
    </svg>
  );
}
