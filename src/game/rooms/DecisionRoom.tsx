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
import { DecisionModal } from '../ui/DecisionModal';
import { EventModal } from '../ui/EventModal';
import { computeRoomSeed } from './generator/seedRng';
import { generateRoom } from './generator/populate';
import type { DecisionRoomConfig } from '../types/room';
import type { DecisionDef, EventDef } from '../types/careerPack';
import type { StatKey } from '../content/applyEffects';
import type { PlayerState } from '../types/player';
import type { Rect } from '../types/geometry';
import type { RootState } from '../state/store';

const BASE_SPEED = 180;
const DEFAULT_EVENT_CHANCE = 0.4;
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

  const handleTick = useCallback((state: PlayerState) => {
    if (triggered.current) return;
    if (!playerInsideDoor(layout.door, state.position.x, state.position.y)) return;
    triggered.current = true;
    // committed=true starts the canvas fade-out immediately (via CSS
    // transition on the SVG below). Modal pop / exit are deferred so the
    // fade reads as a discrete "you stepped through" moment.
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
  }, [layout.door, pack.decisions, ctx, config.monthId, onExit]);

  const playerState = usePlayerMovement({
    initialPosition: layout.spawn,
    bounds: ROOM_BOUNDS,
    obstacles: layout.obstacles,
    active: !committed && activeDecision === null && activeEvent === null,
    speed: BASE_SPEED * speedMultiplier,
    onTick: handleTick,
  });

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
      // Force a specific event by id (dev panel selection).
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
    // Apply the chosen decision's effects (deferred from handleChoose) so the
    // HUD animation lands when the modal closes, not behind it.
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

    // Close the decision modal immediately so the HUD is visible while the
    // floating-delta animation plays.
    setActiveDecision(null);

    // Roll against POST-decision state (pickEvent reads live store).
    const event = pickEvent();

    // Show the "time passes" overlay during the 900ms beat. Canvas blurs;
    // line floats centered. Both fade with the same keyframe.
    setTransitionMessage(pickTransitionMessage());

    // Hold for ~the HUD animation duration so the player sees the full pop
    // before any modal/transition starts. This gives the stat change its own
    // discrete "beat" instead of racing the room fade.
    window.setTimeout(() => {
      if (event) {
        // Clear the message so the status bar reverts behind the event
        // modal (no exit happening — we stay in this room for the event).
        setTransitionMessage(null);
        dispatch(recordEvent({
          monthId: config.monthId,
          eventId: event.id,
          timestamp: Date.now(),
        }));
        setActiveEvent(event);
        // event.effects are also deferred — see handleEventContinue.
      } else {
        // DON'T clear the message before onExit — clearing re-keys the
        // status-bar span and starts a fade-in animation that fights the
        // RoomRenderer's wrapper fade-out. Leave the message in place;
        // the wrapper fade carries it out cleanly, and the next room
        // mounts with its own default status content.
        onExit();
      }
    }, POST_EFFECT_PAUSE_MS);
  }, [activeDecision, pendingOptionIndex, pickEvent, dispatch, config.monthId, onExit, pickTransitionMessage]);

  const handleEventContinue = useCallback(() => {
    // Apply event effects on Continue (deferred from when the event was
    // rolled, for the same HUD-animation-visibility reason as decisions).
    if (activeEvent) {
      applyEvent(activeEvent, dispatch);
    }
    // advanceMonths handling: if the event jumped time, dispatch the extra
    // skip BEFORE the normal +1 fade. Total advance = event.advanceMonths.
    if (activeEvent?.advanceMonths && activeEvent.advanceMonths > 1) {
      dispatch(skipMonths(activeEvent.advanceMonths - 1));
    }
    // Close the event modal so the HUD is visible during the animation.
    setActiveEvent(null);
    // Same "time passes" overlay treatment as the decision-continue beat.
    setTransitionMessage(pickTransitionMessage());
    // Hold for ~the HUD animation duration before triggering room exit.
    // Don't clear the message — it should fade with the wrapper, not via
    // an inner re-key animation that fights the cross-fade.
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
          // Width tracks the canvas display so HUD/status/canvas stay aligned
          // when the viewport shrinks (matches --canvas-display-width).
          width: 'var(--canvas-display-width)',
          // Match the App-level 16px gap so the status bar sits visually
          // centered between the HUD above and the canvas below.
          gap: 16,
        }}
      >
        {/* Status / current-task bar. Sits between the HUD and the canvas so
            the reading flow is: identity (HUD) → context + next action (this
            bar) → game (canvas). The same slot doubles as the post-Continue
            "time passes" line — when transitionMessage is set, the bar
            shows that instead of the instructional copy. Re-keyed per swap
            so each text change retriggers the fade. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: palette.surface,
            letterSpacing: '0.03em',
            // Reserve vertical room so the bar height doesn't jump between
            // single-line states.
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

        <svg
          viewBox={`0 0 ${ROOM_VIEWBOX.width} ${ROOM_VIEWBOX.height}`}
          style={{
            // Card treatment to match the HUD strip above. Dropping the hard
            // 2px ink border + the inner-frame rect: the door and obstacles
            // are visual markers enough, and the §15 "generous negative
            // space" rule reads better without a heavy frame.
            background: palette.background,
            border: `1px solid ${palette.surface}`,
            borderRadius: 6,
            display: 'block',
            // Responsive: width fills the parent column (which itself is
            // bounded by --canvas-display-width). Height auto-derives from
            // the viewBox's 5:3 aspect ratio. Internal coordinates and all
            // room layouts remain on the 1000×600 virtual grid.
            width: '100%',
            height: 'auto',
            // Zelda-style "stepping through the door" fade. When committed
            // (door triggered), the canvas fades to 0 over DOOR_FADE_MS —
            // dark app background shows through. Modal pop is delayed to
            // land on the faded canvas. Restores naturally on the next
            // room (new instance, committed=false from the start).
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

          <Player state={playerState} />
        </svg>
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
    </>
  );
}
