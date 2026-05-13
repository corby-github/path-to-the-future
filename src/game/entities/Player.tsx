import type { Direction, PlayerState } from '../types/player';
import { useCareerPack } from '../content/useCareerPack';

interface PlayerProps {
  state: PlayerState;
}

// Facing chevron rotation. 'up' is the un-rotated reference (chevron points
// up out of the top of the head), then each cardinal rotates around the head
// center. Body stays upright in all four facings; only the chevron rotates.
const FACING_ROTATION: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

// Sprite anchor at (state.position.x, state.position.y). Body spans roughly
// y - 25 (top of head) to y + 34 (bottom of body), width 28 — comparable to
// the NPC sprite footprint (36×56) so the player reads at the same scale
// as people in the room. Collision still uses PLAYER_RADIUS = 14; the
// visual sprite is intentionally a touch larger than the hit circle.
const BODY_W = 28;
const BODY_H = 36;
const HEAD_R = 11;
const HEAD_CY = -14;
const CHEVRON_OFFSET = HEAD_R + 4;

export function Player({ state }: PlayerProps) {
  const { palette } = useCareerPack();
  const { position, facing } = state;
  const chevronRotation = FACING_ROTATION[facing];

  return (
    <g
      data-component="Player"
      data-facing={facing}
      transform={`translate(${position.x}, ${position.y})`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Body — rounded rect, upright in all four facings. */}
      <rect
        x={-BODY_W / 2}
        y={-2}
        width={BODY_W}
        height={BODY_H}
        rx={6}
        fill={palette.player}
        stroke={palette.playerInk}
        strokeWidth={2}
      />
      {/* Head — solid disc above body. */}
      <circle
        cx={0}
        cy={HEAD_CY}
        r={HEAD_R}
        fill={palette.player}
        stroke={palette.playerInk}
        strokeWidth={2}
      />
      {/* Facing chevron — small filled triangle on the head, rotates with
          facing. The chevron group is centered on the head; the rotation
          point is (0, HEAD_CY) so the triangle orbits the head edge. */}
      <g transform={`rotate(${chevronRotation} 0 ${HEAD_CY})`}>
        <polygon
          points={`0,${HEAD_CY - CHEVRON_OFFSET} -4,${HEAD_CY - CHEVRON_OFFSET + 6} 4,${HEAD_CY - CHEVRON_OFFSET + 6}`}
          fill={palette.playerInk}
        />
      </g>
    </g>
  );
}
