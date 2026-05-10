import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { useAppSelector } from '../state/hooks';
import { monthLabel } from '../calendar';
import { ROOM_VIEWBOX, ROOM_BOUNDS, ROOM_PADDING } from '../coordinates';
import type { Rect } from '../types/geometry';

// Day-3 placeholder obstacles. Replaced by the room generator on Day 7.
const DEMO_OBSTACLES: Rect[] = [
  { x: 400, y: 80, width: 200, height: 60 },    // desk near the top
  { x: 760, y: 200, width: 60, height: 240 },   // shelf on the right
  { x: 160, y: 420, width: 240, height: 60 },   // table lower-left
];

export function Room() {
  const playerState = usePlayerMovement({
    initialPosition: { x: ROOM_VIEWBOX.width / 2, y: ROOM_VIEWBOX.height / 2 },
    bounds: ROOM_BOUNDS,
    obstacles: DEMO_OBSTACLES,
  });

  const currentMonth = useAppSelector((state) => state.progress.currentMonth);

  return (
    <svg
      width={ROOM_VIEWBOX.width}
      height={ROOM_VIEWBOX.height}
      viewBox={`0 0 ${ROOM_VIEWBOX.width} ${ROOM_VIEWBOX.height}`}
      style={{
        background: '#f5f1e8',
        border: '2px solid #2c2c2c',
        display: 'block',
      }}
    >
      <rect x={0} y={0} width={ROOM_VIEWBOX.width} height={ROOM_VIEWBOX.height} fill="#f5f1e8" />

      <rect
        x={ROOM_PADDING - 10}
        y={ROOM_PADDING - 10}
        width={ROOM_VIEWBOX.width - (ROOM_PADDING - 10) * 2}
        height={ROOM_VIEWBOX.height - (ROOM_PADDING - 10) * 2}
        fill="none"
        stroke="#2c2c2c"
        strokeWidth={2}
      />

      {DEMO_OBSTACLES.map((o, i) => (
        <rect
          key={i}
          x={o.x}
          y={o.y}
          width={o.width}
          height={o.height}
          fill="#cfc8b6"
          stroke="#5b5340"
          strokeWidth={2}
          rx={4}
        />
      ))}

      <Player state={playerState} />

      <text
        x={ROOM_VIEWBOX.width / 2}
        y={ROOM_VIEWBOX.height - 8}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize={11}
        fill="#888"
      >
        {monthLabel(currentMonth)} · Use Arrow Keys or WASD to move
      </text>
    </svg>
  );
}
