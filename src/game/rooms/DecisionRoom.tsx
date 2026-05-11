import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { ROOM_VIEWBOX, ROOM_BOUNDS } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { useDevControls } from '../dev/useDevControls';
import { useCurrentRoom } from '../ui/currentRoomContextValue';
import { selectDecision } from '../content/selectDecision';
import { parseEffect } from '../content/applyEffects';
import { applyStatEffect } from '../state/slices/statsSlice';
import { recordDecision, recordEvent } from '../state/slices/historySlice';
import { skipMonths } from '../state/slices/progressSlice';
import { rollEvents, findEventById } from '../content/rollEvents';
import { applyEvent } from '../content/applyEvent';
import { passesRequires } from '../content/evaluateRequires';
import { DecisionModal } from '../ui/DecisionModal';
import { EventModal } from '../ui/EventModal';
import { NPCModal } from '../ui/NPCModal';
import { computeRoomSeed } from './generator/seedRng';
import { generateRoom } from './generator/populate';
import { placeInteractables, type PlacedInteractable } from './generator/placeInteractables';
import { InteractableSprite } from './sprites/InteractableSprite';
import type { DecisionRoomConfig } from '../types/room';
import type { DecisionDef, EventDef, InteractableDef, InteractableDialogue } from '../types/careerPack';
import type { StatKey } from '../content/applyEffects';
import type { PlayerState } from '../types/player';
import type { Rect, Vector2 } from '../types/geometry';
import type { RootState } from '../state/store';

const BASE_SPEED = 180;
const DEFAULT_EVENT_CHANCE = 0.4;
const INTERACTABLE_HALF_W = 28;
const INTERACTABLE_HALF_H = 36;
// Player center within this many virtual units of an interactable center
// counts as "adjacent" — E-key opens the modal for the nearest one.
const INTERACT_PROXIMITY = 75;
// Distinct salt so interactable placement doesn't co-vary with decision /
// event picks at the same monthId.
const INTERACTABLE_SEED_SALT = 991;

// NPC wander parameters. NPCs random-walk within a small zone around their
// PLACED spawn so the player can reliably find them. They stop when the
// player is adjacent to any of them and when any modal is open. Objects are
// stationary — these knobs don't apply.
const NPC_WANDER_RADIUS = 80;
const NPC_SPEED_MIN = 40;
const NPC_SPEED_MAX = 70;
const NPC_DIRECTION_CHANGE_MIN_MS = 1500;
const NPC_DIRECTION_CHANGE_MAX_MS = 3000;
const NPC_IDLE_PROBABILITY = 0.3;

// "Going through the door" fade — Zelda-style. When the player enters the
// door, the canvas fades to 0 opacity (dark app background shows through)
// over DOOR_FADE_MS, and the decision modal pops at MODAL_POP_DELAY_MS so
// it lands on a fully-faded canvas. Status bar / HUD stay visible (they're
// chrome, not the game world).
const DOOR_FADE_MS = 300;
const MODAL_POP_DELAY_MS = 300;
// After Continue: close the modal, dispatch effects (HUD floating-delta
// runs ~900ms), and swap the status bar to a "time passes" line. The pause
// outlives the HUD pop by ~500ms so the message has its own beat to land
// after the numbers settle. POST_EFFECT_PAUSE_MS controls when the next
// state fires (event modal or room fade).
const POST_EFFECT_PAUSE_MS = 1400;

interface Props {
  config: DecisionRoomConfig;
  onExit: () => void;
}

function playerInsideDoor(door: Rect, px: number, py: number): boolean {
  return px >= door.x && px <= door.x + door.width
      && py >= door.y && py <= door.y + door.height;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function DecisionRoom({ config, onExit }: Props) {
  const { palette, pack, currentMonth: monthEntry } = useCareerPack();
  const dispatch = useAppDispatch();
  // useStore for direct getState() reads inside callbacks. Needed when we
  // dispatch effects and then immediately roll events in the same handler —
  // useAppSelector values are stale within that synchronous block because
  // the component hasn't re-rendered yet.
  const store = useStore<RootState>();
  const profile = useAppSelector((s) => s.profile);
  const progress = useAppSelector((s) => s.progress);
  const stats = useAppSelector((s) => s.stats);
  const flags = useAppSelector((s) => s.flags);
  const { speedMultiplier, forcedLayout, eventMode } = useDevControls();
  const { setTemplate } = useCurrentRoom();

  const [layout] = useState(() => {
    const seed = computeRoomSeed({
      packId: profile.careerPack,
      entryClass: profile.entryClass,
      monthId: config.monthId,
      state: { progress, stats, flags },
    });
    return generateRoom(seed, forcedLayout);
  });

  // Interactables placed in this room (1-3, seeded, non-overlapping with
  // spawn / door / obstacles / each other). Stable for the room's lifetime.
  const [placements] = useState<PlacedInteractable[]>(() => {
    const seedCtx = { stats, flags, currentMonth: config.monthId };
    return placeInteractables({
      seed: config.monthId + INTERACTABLE_SEED_SALT,
      pool: pack.interactables,
      ctx: seedCtx,
      spawn: layout.spawn,
      door: layout.door,
      obstacles: layout.obstacles,
    });
    // Placement is deterministic for the room's lifetime — useState's lazy
    // initializer runs once on mount and never re-evaluates.
  });

  const [activeDecision, setActiveDecision] = useState<DecisionDef | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDef | null>(null);
  // The chosen option index, set when the player picks but BEFORE effects
  // apply. Effects are dispatched in handleDecisionContinue so the HUD
  // animation fires after the modal closes (when the player can see it),
  // not silently behind the modal.
  const [pendingOptionIndex, setPendingOptionIndex] = useState<number | null>(null);
  // Atmospheric flavor line shown over a blurred canvas during the post-
  // Continue beat. Random pick from `manifest.monthTransitions`. Set when
  // the pause starts, cleared when it ends. Null = no overlay rendered.
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  // Active dialogue state — set when the player engages with an interactable.
  const [activeInteractable, setActiveInteractable] = useState<InteractableDef | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<InteractableDialogue | null>(null);

  // Index into placements of the nearest interactable within proximity, or
  // null when none. Drives the halo / [E] hint and gates the E-key.
  const [adjacentIndex, setAdjacentIndex] = useState<number | null>(null);

  // Per-interactable live position. Objects sit at their spawn; NPCs drift
  // via the random-walk RAF below. Parallel array indexed against placements.
  const [npcPositions, setNpcPositions] = useState<Vector2[]>(() =>
    placements.map((p) => ({ ...p.spawn })),
  );

  const pickTransitionMessage = useCallback((): string | null => {
    const lines = pack.manifest.monthTransitions;
    if (!lines || lines.length === 0) return null;
    return lines[Math.floor(Math.random() * lines.length)];
  }, [pack.manifest.monthTransitions]);

  // Publish this room's layout id to the HUD via CurrentRoomContext so the
  // identity column can show "Aug 2020 · open-office". Clears on unmount so
  // a non-decision room (Narrative / Consequence) doesn't show a stale
  // template.
  useEffect(() => {
    setTemplate(layout.templateId);
    return () => setTemplate(null);
  }, [layout.templateId, setTemplate]);

  const ctx = useMemo(() => ({
    stats,
    flags,
    currentMonth: config.monthId,
  }), [stats, flags, config.monthId]);

  // `triggered.current` is the synchronous in-callback guard (prevents
  // double-fire if onTick is called rapidly within a single frame).
  // `committed` is the state mirror that flips `active` off — once the
  // door is entered, movement is frozen for the rest of this room's
  // lifetime, even through the gaps between modals (decision close →
  // event open, post-Continue transition beat, etc.). The room unmounts
  // when the next month loads (key={config.monthId} on RoomRenderer),
  // so committed resets naturally.
  const triggered = useRef(false);
  const [committed, setCommitted] = useState(false);

  // Live positions ref so the NPC-movement RAF (below) can see the latest
  // positions without re-binding the loop every frame. Synced via effect.
  const npcPositionsRef = useRef<Vector2[]>(npcPositions);
  useEffect(() => {
    npcPositionsRef.current = npcPositions;
  }, [npcPositions]);

  // Per-NPC pause logic. Refs mirror state so the RAF closure stays cheap.
  //
  // GLOBAL pause (all NPCs stop): committed (player walked through door),
  // any DecisionModal or EventModal open. These are room-level "the world
  // pauses" beats — everyone freezes.
  //
  // PER-NPC pause: an NPC stops when (a) the player is adjacent to them
  // (the [E] target needs to be stable), or (b) the player is engaged with
  // THAT NPC's modal (talking to them). Other NPCs keep wandering — and
  // object interactions (printer, plant, etc.) never pause NPCs.
  const globalPauseRef = useRef(false);
  useEffect(() => {
    globalPauseRef.current =
      committed || activeDecision !== null || activeEvent !== null;
  }, [committed, activeDecision, activeEvent]);

  const adjacentIndexRef = useRef<number | null>(null);
  useEffect(() => {
    adjacentIndexRef.current = adjacentIndex;
  }, [adjacentIndex]);

  const activeInteractableIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeInteractableIdRef.current = activeInteractable?.id ?? null;
  }, [activeInteractable]);

  const handleTick = useCallback((state: PlayerState) => {
    // Find the nearest interactable within proximity. NPCs use their live
    // wander position; objects use their fixed spawn.
    let nearest: number | null = null;
    let nearestDist = INTERACT_PROXIMITY;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const ipos = p.def.kind === 'npc' ? npcPositionsRef.current[i] : p.spawn;
      if (!ipos) continue;
      const d = distance(state.position.x, state.position.y, ipos.x, ipos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    setAdjacentIndex((cur) => (cur === nearest ? cur : nearest));

    if (triggered.current) return;
    if (!playerInsideDoor(layout.door, state.position.x, state.position.y)) return;
    triggered.current = true;
    setCommitted(true);
    const picked = selectDecision({
      decisions: pack.decisions,
      ctx,
      monthId: config.monthId,
    });
    window.setTimeout(() => {
      if (picked) {
        setActiveDecision(picked);
      } else {
        onExit();
      }
    }, MODAL_POP_DELAY_MS);
  }, [layout.door, pack.decisions, ctx, config.monthId, onExit, placements]);

  const playerState = usePlayerMovement({
    initialPosition: layout.spawn,
    bounds: ROOM_BOUNDS,
    obstacles: layout.obstacles,
    active:
      !committed &&
      activeDecision === null &&
      activeEvent === null &&
      activeInteractable === null,
    speed: BASE_SPEED * speedMultiplier,
    onTick: handleTick,
  });

  // E-key opens the nearest interactable's modal when the player is adjacent
  // and no other modal is active. Picks a random eligible dialogue.
  useEffect(() => {
    if (placements.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      if (committed) return;
      if (activeDecision || activeEvent || activeInteractable) return;
      if (adjacentIndex === null) return;
      e.preventDefault();
      const target = placements[adjacentIndex];
      if (!target) return;
      const reqCtx = { stats, flags, currentMonth: config.monthId };
      const eligible = target.def.dialogues.filter((d) =>
        passesRequires(d.requires, reqCtx),
      );
      if (eligible.length === 0) return;
      // Random pick — fresh variety on repeat interactions, no determinism
      // needed since the player only encounters this room once.
      const picked = eligible[Math.floor(Math.random() * eligible.length)];
      setActiveInteractable(target.def);
      setActiveDialogue(picked);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    placements,
    adjacentIndex,
    committed,
    activeDecision,
    activeEvent,
    activeInteractable,
    stats,
    flags,
    config.monthId,
  ]);

  const handleInteractableClose = useCallback(() => {
    setActiveInteractable(null);
    setActiveDialogue(null);
  }, []);

  // NPC random-walk loop. One RAF iterates all NPCs each frame; per-NPC
  // direction + decision-time tracked in a local array (only mutated inside
  // the RAF callback so React state isn't churned for direction changes).
  // Position changes do go through setNpcPositions (async via setTimeout/RAF,
  // so the setState-in-effect lint rule isn't tripped).
  useEffect(() => {
    if (placements.length === 0) return;
    const hasAnyNpc = placements.some((p) => p.def.kind === 'npc');
    if (!hasAnyNpc) return;

    interface NpcMotionState {
      dx: number;
      dy: number;
      nextChangeAt: number;
    }
    const motion: NpcMotionState[] = placements.map(() => ({
      dx: 0,
      dy: 0,
      nextChangeAt: 0, // 0 forces an immediate first direction-pick
    }));

    let raf: number | null = null;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      // Global pause (door commit / decision / event modal) freezes all NPCs.
      // Per-NPC paused-state is checked inside the map below.
      if (globalPauseRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      setNpcPositions((cur) => {
        // Map old → new. Objects stay at spawn. Each NPC checks its own
        // pause: adjacent to player OR currently being talked to.
        return cur.map((pos, i) => {
          const p = placements[i];
          if (p.def.kind !== 'npc') return pos;

          // Per-NPC pause checks.
          if (adjacentIndexRef.current === i) return pos;
          if (activeInteractableIdRef.current === p.def.id) return pos;

          const m = motion[i];

          if (now >= m.nextChangeAt) {
            if (Math.random() < NPC_IDLE_PROBABILITY) {
              m.dx = 0;
              m.dy = 0;
            } else {
              const angle = Math.random() * 2 * Math.PI;
              const speed = NPC_SPEED_MIN + Math.random() * (NPC_SPEED_MAX - NPC_SPEED_MIN);
              m.dx = Math.cos(angle) * speed;
              m.dy = Math.sin(angle) * speed;
            }
            m.nextChangeAt =
              now +
              NPC_DIRECTION_CHANGE_MIN_MS +
              Math.random() * (NPC_DIRECTION_CHANGE_MAX_MS - NPC_DIRECTION_CHANGE_MIN_MS);
          }

          let nx = pos.x + m.dx * dt;
          let ny = pos.y + m.dy * dt;
          const minX = p.spawn.x - NPC_WANDER_RADIUS;
          const maxX = p.spawn.x + NPC_WANDER_RADIUS;
          const minY = p.spawn.y - NPC_WANDER_RADIUS;
          const maxY = p.spawn.y + NPC_WANDER_RADIUS;
          if (nx < minX) {
            nx = minX;
            m.dx = 0;
          }
          if (nx > maxX) {
            nx = maxX;
            m.dx = 0;
          }
          if (ny < minY) {
            ny = minY;
            m.dy = 0;
          }
          if (ny > maxY) {
            ny = maxY;
            m.dy = 0;
          }
          return { x: nx, y: ny };
        });
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [placements]);

  const handleChoose = useCallback((index: number) => {
    if (!activeDecision) return;
    const option = activeDecision.options[index];
    // Track the choice but DON'T dispatch effects yet — those fire on
    // Continue (see handleDecisionContinue). The history record is fine to
    // write now since it's a fact about the player's action, not the outcome.
    setPendingOptionIndex(index);
    dispatch(recordDecision({
      monthId: config.monthId,
      decisionId: activeDecision.id,
      optionTaken: option.label,
      timestamp: Date.now(),
    }));
  }, [activeDecision, dispatch, config.monthId]);

  // Roll an event after the decision flavor's Continue. Returns the event to
  // fire next (or null to skip straight to fade). Reads LIVE Redux state via
  // store.getState() so that decision effects dispatched in the same handler
  // (just before this call) are visible — useSelector-closed ctx would be
  // stale within a single synchronous block.
  const pickEvent = useCallback((): EventDef | null => {
    if (eventMode === 'never') return null;
    if (eventMode !== 'auto') {
      return findEventById(pack.events, eventMode);
    }
    const chance = pack.manifest.eventChance ?? DEFAULT_EVENT_CHANCE;
    const live = store.getState();
    return rollEvents({
      events: pack.events,
      eventChance: chance,
      era: monthEntry.era,
      ctx: {
        stats: live.stats,
        flags: live.flags,
        currentMonth: config.monthId,
      },
      monthId: config.monthId,
    });
  }, [eventMode, pack.events, pack.manifest.eventChance, monthEntry.era, store, config.monthId]);

  const handleDecisionContinue = useCallback(() => {
    if (activeDecision && pendingOptionIndex !== null) {
      const option = activeDecision.options[pendingOptionIndex];
      for (const [stat, expr] of Object.entries(option.effects)) {
        const parsed = parseEffect(expr);
        if (!parsed) continue;
        dispatch(applyStatEffect({
          stat: stat as StatKey,
          op: parsed.op,
          magnitude: parsed.magnitude,
        }));
      }
    }
    setPendingOptionIndex(null);

    setActiveDecision(null);

    const event = pickEvent();

    setTransitionMessage(pickTransitionMessage());

    window.setTimeout(() => {
      if (event) {
        setTransitionMessage(null);
        dispatch(recordEvent({
          monthId: config.monthId,
          eventId: event.id,
          timestamp: Date.now(),
        }));
        setActiveEvent(event);
      } else {
        onExit();
      }
    }, POST_EFFECT_PAUSE_MS);
  }, [activeDecision, pendingOptionIndex, pickEvent, dispatch, config.monthId, onExit, pickTransitionMessage]);

  const handleEventContinue = useCallback(() => {
    if (activeEvent) {
      applyEvent(activeEvent, dispatch);
    }
    const jump = activeEvent?.advanceMonths ?? 1;
    if (jump > 1) {
      dispatch(skipMonths(jump - 1));
    }
    setActiveEvent(null);
    // For multi-month jumps, replace the random "life goes on" line with an
    // explicit "N months pass." in the status bar — the HUD floater says
    // the same thing, but the status-bar message gives a second beat at a
    // larger reading register.
    if (jump > 1) {
      setTransitionMessage(`${jump} months pass.`);
    } else {
      setTransitionMessage(pickTransitionMessage());
    }
    window.setTimeout(() => {
      onExit();
    }, POST_EFFECT_PAUSE_MS);
  }, [activeEvent, dispatch, onExit, pickTransitionMessage]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: 'var(--canvas-display-width)',
          gap: 16,
        }}
      >
        {/* Status / current-task bar. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 500,
            color: palette.surface,
            letterSpacing: '0.03em',
            minHeight: 20,
          }}
        >
          <span
            key={transitionMessage ?? 'instructional'}
            style={{
              animation: 'status-swap-fade 280ms ease forwards',
              fontStyle: transitionMessage ? 'italic' : 'normal',
            }}
          >
            {transitionMessage ?? 'Walk into the door →'}
          </span>
        </div>

        {/* Canvas wrapper — wireframe border survives the door-commit fade. */}
        <div
          style={{
            border: `1px solid ${palette.surface}`,
            borderRadius: 6,
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
        <svg
          viewBox={`0 0 ${ROOM_VIEWBOX.width} ${ROOM_VIEWBOX.height}`}
          style={{
            background: palette.background,
            display: 'block',
            width: '100%',
            height: 'auto',
            opacity: committed ? 0 : 1,
            transition: `opacity ${DOOR_FADE_MS}ms ease`,
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

          {/* Interactables. Real sprites land per the `art` token via
              <InteractableSprite> (Day 13b.2). NPCs render at their live
              wander position; objects at the fixed placed spawn. The
              adjacency halo + [E] hint render on the nearest in-range
              interactable only. */}
          {placements.map((p, i) => {
            const ipos = p.def.kind === 'npc' ? (npcPositions[i] ?? p.spawn) : p.spawn;
            const isNearest = adjacentIndex === i && !activeInteractable;
            return (
              <g key={p.def.id + '-' + i}>
                <InteractableSprite
                  art={p.def.art}
                  kind={p.def.kind}
                  x={ipos.x}
                  y={ipos.y}
                  palette={palette}
                />
                {isNearest && (
                  <>
                    <rect
                      x={ipos.x - INTERACTABLE_HALF_W - 4}
                      y={ipos.y - INTERACTABLE_HALF_H - 4}
                      width={(INTERACTABLE_HALF_W + 4) * 2}
                      height={(INTERACTABLE_HALF_H + 4) * 2}
                      rx={8}
                      fill="none"
                      stroke={palette.accent}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      opacity={0.85}
                    />
                    <text
                      x={ipos.x}
                      y={ipos.y - INTERACTABLE_HALF_H - 12}
                      textAnchor="middle"
                      fontSize={14}
                      
                      fontWeight={600}
                      fill={palette.ink}
                    >
                      [E] {p.def.kind === 'npc' ? 'talk' : 'look'}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          <Player state={playerState} />
        </svg>
        </div>
      </div>

      {activeDecision && (
        <DecisionModal
          decision={activeDecision}
          onChoose={handleChoose}
          onContinue={handleDecisionContinue}
        />
      )}

      {activeEvent && (
        <EventModal
          event={activeEvent}
          onContinue={handleEventContinue}
        />
      )}

      {activeInteractable && activeDialogue && (
        <NPCModal
          interactable={activeInteractable}
          dialogue={activeDialogue}
          onClose={handleInteractableClose}
        />
      )}
    </>
  );
}
