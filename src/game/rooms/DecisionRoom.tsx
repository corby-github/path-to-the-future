import { useCallback, useMemo, useRef, useState } from 'react';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { monthLabel } from '../calendar';
import { ROOM_VIEWBOX, ROOM_BOUNDS, ROOM_PADDING } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { useDevControls } from '../dev/useDevControls';
import { selectDecision } from '../content/selectDecision';
import { parseEffect } from '../content/applyEffects';
import { applyStatEffect } from '../state/slices/statsSlice';
import { recordDecision } from '../state/slices/historySlice';
import { DecisionModal } from '../ui/DecisionModal';
import { computeRoomSeed } from './generator/seedRng';
import { generateRoom } from './generator/populate';
import type { DecisionRoomConfig } from '../types/room';
import type { DecisionDef } from '../types/careerPack';
import type { StatKey } from '../content/applyEffects';
import type { PlayerState } from '../types/player';
import type { Rect } from '../types/geometry';

const BASE_SPEED = 180;

interface Props {
  config: DecisionRoomConfig;
  onExit: () => void;
}

function playerInsideDoor(door: Rect, px: number, py: number): boolean {
  return px >= door.x && px <= door.x + door.width
      && py >= door.y && py <= door.y + door.height;
}

export function DecisionRoom({ config, onExit }: Props) {
  const { palette, pack } = useCareerPack();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.profile);
  const progress = useAppSelector((s) => s.progress);
  const stats = useAppSelector((s) => s.stats);
  const flags = useAppSelector((s) => s.flags);
  const { speedMultiplier, forcedLayout } = useDevControls();

  // Generate the room ONCE at mount via a useState lazy initializer. State
  // changes mid-modal (e.g., picking a decision that shifts stats) don't
  // regenerate the room — the player would see obstacles teleporting.
  const [layout] = useState(() => {
    const seed = computeRoomSeed({
      packId: profile.careerPack,
      entryClass: profile.entryClass,
      monthId: config.monthId,
      state: { progress, stats, flags },
    });
    return generateRoom(seed, forcedLayout);
  });

  const [activeDecision, setActiveDecision] = useState<DecisionDef | null>(null);

  const ctx = useMemo(() => ({
    stats,
    flags,
    currentMonth: config.monthId,
  }), [stats, flags, config.monthId]);

  const triggered = useRef(false);

  const handleTick = useCallback((state: PlayerState) => {
    if (triggered.current) return;
    if (!playerInsideDoor(layout.door, state.position.x, state.position.y)) return;
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
  }, [layout.door, pack.decisions, ctx, config.monthId, onExit]);

  const playerState = usePlayerMovement({
    initialPosition: layout.spawn,
    bounds: ROOM_BOUNDS,
    obstacles: layout.obstacles,
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
          x={layout.door.x}
          y={layout.door.y}
          width={layout.door.width}
          height={layout.door.height}
          fill={palette.accent}
          stroke={palette.ink}
          strokeWidth={2}
          rx={2}
        />
        <circle
          cx={layout.door.x + layout.door.width - 8}
          cy={layout.door.y + layout.door.height / 2}
          r={2.5}
          fill={palette.ink}
        />

        {layout.obstacles.map((o, i) => (
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
          {monthLabel(config.monthId)} · {layout.templateId} · Walk into the door →
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
