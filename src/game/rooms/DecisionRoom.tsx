import { useCallback, useMemo, useRef, useState } from 'react';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { monthLabel } from '../calendar';
import {
  ROOM_VIEWBOX,
  ROOM_BOUNDS,
  ROOM_PADDING,
} from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { useDevControls } from '../dev/useDevControls';
import { selectDecision } from '../content/selectDecision';
import { parseEffect } from '../content/applyEffects';
import { applyStatEffect } from '../state/slices/statsSlice';
import { recordDecision } from '../state/slices/historySlice';
import { DecisionModal } from '../ui/DecisionModal';
import type { DecisionRoomConfig } from '../types/room';
import type { Rect } from '../types/geometry';
import type { DecisionDef } from '../types/careerPack';
import type { StatKey } from '../content/applyEffects';
import type { PlayerState } from '../types/player';

const BASE_SPEED = 180;

// Day-4 placeholder obstacles. Replaced by the room generator on Day 7.
// The shelf-top + shelf-bottom split leaves a vertical gap at y:290–350 so
// the player can walk due east from spawn (y:300) straight to the door.
const DEMO_OBSTACLES: Rect[] = [
  { x: 400, y: 80, width: 200, height: 60 },     // desk
  { x: 760, y: 200, width: 60, height: 90 },     // shelf-top    (200–290)
  { x: 760, y: 350, width: 60, height: 90 },     // shelf-bottom (350–440)
  { x: 160, y: 420, width: 240, height: 60 },    // table
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

// Player must walk into the door — center inside the rect, not just edge touch.
function playerInsideDoor(px: number, py: number): boolean {
  return px >= DOOR.x && px <= DOOR.x + DOOR.width
      && py >= DOOR.y && py <= DOOR.y + DOOR.height;
}

export function DecisionRoom({ config, onExit }: Props) {
  const { palette, pack } = useCareerPack();
  const dispatch = useAppDispatch();
  const stats = useAppSelector((s) => s.stats);
  const flags = useAppSelector((s) => s.flags);
  const { speedMultiplier } = useDevControls();

  const [activeDecision, setActiveDecision] = useState<DecisionDef | null>(null);

  const ctx = useMemo(() => ({
    stats,
    flags,
    currentMonth: config.monthId,
  }), [stats, flags, config.monthId]);

  const triggered = useRef(false);

  const handleTick = useCallback((state: PlayerState) => {
    if (triggered.current) return;
    if (!playerInsideDoor(state.position.x, state.position.y)) return;
    triggered.current = true;
    const picked = selectDecision({
      decisions: pack.decisions,
      ctx,
      monthId: config.monthId,
    });
    if (picked) {
      setActiveDecision(picked);
    } else {
      onExit();
    }
  }, [pack.decisions, ctx, config.monthId, onExit]);

  const playerState = usePlayerMovement({
    initialPosition: { x: 80, y: ROOM_VIEWBOX.height / 2 },
    bounds: ROOM_BOUNDS,
    obstacles: DEMO_OBSTACLES,
    active: activeDecision === null,
    speed: BASE_SPEED * speedMultiplier,
    onTick: handleTick,
  });

  const handleChoose = useCallback((index: number) => {
    if (!activeDecision) return;
    const option = activeDecision.options[index];
    for (const [stat, expr] of Object.entries(option.effects)) {
      const parsed = parseEffect(expr);
      if (!parsed) continue;
      dispatch(applyStatEffect({
        stat: stat as StatKey,
        op: parsed.op,
        magnitude: parsed.magnitude,
      }));
    }
    dispatch(recordDecision({
      monthId: config.monthId,
      decisionId: activeDecision.id,
      optionTaken: option.label,
      timestamp: Date.now(),
    }));
  }, [activeDecision, dispatch, config.monthId]);

  const handleContinue = useCallback(() => {
    setActiveDecision(null);
    onExit();
  }, [onExit]);

  return (
    <>
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
          {monthLabel(config.monthId)} · Walk into the door →
        </text>
      </svg>

      {activeDecision && (
        <DecisionModal
          decision={activeDecision}
          onChoose={handleChoose}
          onContinue={handleContinue}
        />
      )}
    </>
  );
}
