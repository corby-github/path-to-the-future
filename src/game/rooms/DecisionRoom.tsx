import { useEffect, useRef } from 'react';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { monthLabel } from '../calendar';
import {
  ROOM_VIEWBOX,
  ROOM_BOUNDS,
  ROOM_PADDING,
  PLAYER_RADIUS,
} from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import type { DecisionRoomConfig } from '../types/room';
import type { Rect } from '../types/geometry';

// Day-4 placeholder obstacles. Replaced by the room generator on Day 7.
const DEMO_OBSTACLES: Rect[] = [
  { x: 400, y: 80, width: 200, height: 60 },
  { x: 760, y: 200, width: 60, height: 240 },
  { x: 160, y: 420, width: 240, height: 60 },
];

const DOOR: Rect = {
  x: ROOM_VIEWBOX.width - ROOM_PADDING - 40,
  y: ROOM_VIEWBOX.height / 2 - 50,
  width: 40,
  height: 100,
};

interface Props {
  config: DecisionRoomConfig;
  onExit: () => void;
}

function playerOverlapsDoor(px: number, py: number): boolean {
  return (
    px + PLAYER_RADIUS >= DOOR.x &&
    px - PLAYER_RADIUS <= DOOR.x + DOOR.width &&
    py + PLAYER_RADIUS >= DOOR.y &&
    py - PLAYER_RADIUS <= DOOR.y + DOOR.height
  );
}

export function DecisionRoom({ config, onExit }: Props) {
  const { palette } = useCareerPack();
  const playerState = usePlayerMovement({
    initialPosition: { x: 80, y: ROOM_VIEWBOX.height / 2 },
    bounds: ROOM_BOUNDS,
    obstacles: DEMO_OBSTACLES,
  });

  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    const { x, y } = playerState.position;
    if (playerOverlapsDoor(x, y)) {
      triggered.current = true;
      onExit();
    }
  }, [playerState.position, onExit]);

  return (
    <svg
      width={ROOM_VIEWBOX.width}
      height={ROOM_VIEWBOX.height}
      viewBox={`0 0 ${ROOM_VIEWBOX.width} ${ROOM_VIEWBOX.height}`}
      style={{
        background: palette.background,
        border: `2px solid ${palette.ink}`,
        display: 'block',
      }}
    >
      <rect
        x={0}
        y={0}
        width={ROOM_VIEWBOX.width}
        height={ROOM_VIEWBOX.height}
        fill={palette.background}
      />

      <rect
        x={ROOM_PADDING - 10}
        y={ROOM_PADDING - 10}
        width={ROOM_VIEWBOX.width - (ROOM_PADDING - 10) * 2}
        height={ROOM_VIEWBOX.height - (ROOM_PADDING - 10) * 2}
        fill="none"
        stroke={palette.ink}
        strokeWidth={2}
      />

      <rect
        x={DOOR.x}
        y={DOOR.y}
        width={DOOR.width}
        height={DOOR.height}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
        rx={2}
      />
      <circle
        cx={DOOR.x + DOOR.width - 8}
        cy={DOOR.y + DOOR.height / 2}
        r={2.5}
        fill={palette.ink}
      />

      {DEMO_OBSTACLES.map((o, i) => (
        <rect
          key={i}
          x={o.x}
          y={o.y}
          width={o.width}
          height={o.height}
          fill={palette.surface}
          stroke={palette.ink}
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
        fill={palette.inkMuted}
      >
        {monthLabel(config.monthId)} · Walk to the door →
      </text>
    </svg>
  );
}
