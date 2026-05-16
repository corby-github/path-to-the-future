import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { Player } from '../entities/Player';
import { usePlayerMovement } from '../engine/usePlayerMovement';
import { useMovingObstacles } from '../engine/useMovingObstacles';
import { circleIntersectsRect } from '../engine/collision';
import { ROOM_VIEWBOX, ROOM_BOUNDS, PLAYER_RADIUS } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { useDevControls } from '../dev/useDevControls';
import { useCurrentRoom } from '../ui/currentRoomContextValue';
import { selectDecision } from '../content/selectDecision';
import { parseEffect } from '../content/applyEffects';
import { applyStatEffect } from '../state/slices/statsSlice';
import { recordDecision, recordEvent } from '../state/slices/historySlice';
import { skipMonths, addXp, XP_PER_DECISION, XP_TIER_BONUS_UNTOUCHED, enterReplay, exitReplay } from '../state/slices/progressSlice';
import { rollEvents, findEventById } from '../content/rollEvents';
import { applyEvent } from '../content/applyEvent';
import { passesRequires } from '../content/evaluateRequires';
import { labelFor } from '../content/interactableLabel';
import { DecisionModal } from '../ui/DecisionModal';
import { EventModal } from '../ui/EventModal';
import { NPCModal } from '../ui/NPCModal';
import { ArcadeModal } from '../ui/ArcadeModal';
import { TutorialOverlay, TUTORIAL_KEYS_STEP_INDEX } from '../ui/TutorialOverlay';
import { SprintTutorialOverlay } from '../ui/SprintTutorialOverlay';
import { KeysWidget } from '../ui/KeysWidget';
import { useMisclickPrompt } from '../engine/useMisclickPrompt';
import { dismissTutorial, dismissSprintTutorial } from '../state/slices/metaSlice';
import { persistState } from '../state/persistence';
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

const BASE_SPEED = (180*2);
const DEFAULT_EVENT_CHANCE = 0.4;
const INTERACTABLE_HALF_W = 28;
const INTERACTABLE_HALF_H = 36;

// Medium-tier moving-obstacle tuning (v2.0.18, §4). Sized for the first
// content drop; revisit after playtest. The cooldown is wide enough that
// a single sustained overlap counts as one hit, not 60.
const MOVING_OBSTACLE_COOLDOWN_MS = 600;
const MOVING_OBSTACLE_KNOCKBACK_PX = 100;
const MOVING_OBSTACLE_HEALTH_HIT = 4;
const MOVING_OBSTACLE_BURNOUT_THRESHOLD = 8;
const MOVING_OBSTACLE_BURNOUT_MAGNITUDE = 5;
// Two-phase input lock after a hit:
//   Phase 1 (SLIDE_MS): westward shove at `KNOCKBACK_PX / SLIDE_MS` px/sec.
//   Phase 2 (TOTAL_LOCK_MS - SLIDE_MS): frozen-stunned, input ignored,
//   no motion. Both phases derive from `lastMovingObstacleHitAtRef`, so a
//   cascading hit during either phase restarts the full sequence.
// On stun-end, usePlayerMovement's must-release gate kicks in: any
// direction key held through the lock stays ignored until physically
// released, then a re-press fires normally.
// Cascading rule unchanged: per-obstacle dedupe (COOLDOWN_MS) lets a
// different obstacle in the slide path re-hit even before 600ms elapses.
const MOVING_OBSTACLE_SLIDE_MS = 200;
const MOVING_OBSTACLE_TOTAL_LOCK_MS = 1000;
// In-canvas damage floater (above the player) on each moving-obstacle
// hit. Mirrors the HUD chip's "−N" so the impact reads at the player,
// not just the HUD chip. Same envelope as StatChip's DELTA_DURATION_MS.
const DAMAGE_FLOATER_DURATION_MS = 900;

interface DamageFloater {
  id: number;
  x: number;
  y: number;
  magnitude: number;
}

// Issue #77 — when entering a room via the REWIND_DOOR (back-walk into
// replay of the previous month), spawn the player just LEFT of the
// forward door rather than at the layout's default left-edge spawn.
// Reads as "you stepped out of the door you originally exited" —
// symmetric to the right→left door trip the player just took. The
// standard left spawn is still used for live room entry + exitReplay
// (return to live).
//
// Door-guarded templates (e.g., gauntlet at hard tier — wall 3 extends to
// x=920, exactly the ideal replay-spawn x) can place obstacles right at
// the ideal spawn point. To prevent the player spawning inside a wall
// and freezing, search westward from the ideal x in fixed steps until a
// position clear of all static obstacles is found; final fallback is the
// layout's left-edge spawn.
const REPLAY_SPAWN_DOOR_GAP = 30;
const REPLAY_SPAWN_SEARCH_STEP = 30;
function replaySpawnFor(
  door: Rect,
  obstacles: readonly Rect[],
  leftSpawn: Vector2,
): Vector2 {
  const y = door.y + door.height / 2;
  const idealX = door.x - REPLAY_SPAWN_DOOR_GAP;
  for (let x = idealX; x >= leftSpawn.x; x -= REPLAY_SPAWN_SEARCH_STEP) {
    const blocked = obstacles.some((r) =>
      circleIntersectsRect(x, y, PLAYER_RADIUS, r),
    );
    if (!blocked) return { x, y };
  }
  return leftSpawn;
}

// Rewind door for backward replay (#33). Bottom-left of the canvas, away
// from the standard middle-left spawn so the player doesn't accidentally
// walk into it on entry. Same palette as the forward door (accent fill,
// ink stroke) — initial pass used palette.surface for a "subdued" read,
// but it blended into the desk obstacles. Position alone differentiates
// it from the forward door now. 10px from canvas left edge — matches
// the `← {prev}` label anchor and creates symmetry with the forward
// door (10px from canvas right edge).
const REWIND_DOOR: Rect = {
  x: 10,
  y: ROOM_VIEWBOX.height - 100 - 20,
  width: 40,
  height: 100,
};

// Status-bar flavor lines for replay (#33). Picked randomly per room mount
// to keep the journey-through-the-past feeling moody and a little playful.
// The "key" lines are user-favorites that may evolve into a real mechanic
// later — for now they're just hints of déjà vu.
const REPLAY_STATUS_MESSAGES: ReadonlyArray<string> = [
  'Looking back... it looks the same.',
  'Hindsight is 20/20.',
  'Be kind. Rewind',
  'Roads? Where we’re going, we don’t need roads.',
  'Flashback!',
  "Haven't I been here before?",
  'The past is in the past. Why am I here again?',
  'Something about a key.',
  "I don't remember seeing a key.",
  'Walking back through nothing important.',
  'Different month. Same coffee stain.',
  "The room remembers you. You don't remember it.",
  'If only you could un-decide.',
  'Nothing changed. Why would it have?',
  'Déjà vu, but the cheap kind.',
  'Still no key.',
  'The room is exactly as you left it. Mostly.',
  'Walking through your own footprints.',
  'The conversation already happened.',
];
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
// MODAL_POP_DELAY_MS is intentionally LONGER than DOOR_FADE_MS so the canvas
// has a small "settled dark" beat (~200ms) before the modal arrives — pre-#30
// they were equal (both 300ms) and the modal snap-in raced the fade's final
// frames, reading as the fade being interrupted. The modal itself now fades
// in via the `decision-modal-pop` keyframe (see global.css), so the arrival
// is choreographed: canvas dims → dark beat → modal eases in.
const DOOR_FADE_MS = 300;
const MODAL_POP_DELAY_MS = 500;
// After Continue: close the modal, dispatch effects (HUD floating-delta
// runs ~900ms), and swap the status bar to a "time passes" line.
// POST_EFFECT_PAUSE_MS controls when the next state fires (event modal or
// room fade). Tightened from 1400 → 900 in #30: the original 1400 made the
// transition feel ceremonial because the message lingered well past the
// HUD pop. 900 aligns the message hang with the HUD-delta animation —
// status, stat numbers, and fade-start now all land in one beat instead
// of four sequential events.
const POST_EFFECT_PAUSE_MS = 900;

// Finale month — December 2029, the player's last room. Special case: two
// doors stacked on the right side instead of the usual one, the top one
// "locked" (decorative, never opens — just shows a wry status-bar line when
// the player walks into it), the bottom one routing to a hardcoded
// FINALE_DECISION instead of a pack-selected one. After Continue, normal
// onExit flow fires → completeMonth(70) → gameOver=true → EndgameScreen.
//
// Both doors live at the right edge, vertically separated. Door dims match
// the standard 40×100. monthId moved 120 → 70 in v2.0.8 when the playthrough
// was halved (1 cinematic + 6 playable months/year × 10 years).
const FINALE_MONTH_ID = 70;
const FINALE_LOCKED_DOOR: Rect = {
  x: ROOM_VIEWBOX.width - 40 - 10,
  y: 110,
  width: 40,
  height: 100,
};
const FINALE_FORWARD_DOOR: Rect = {
  x: ROOM_VIEWBOX.width - 40 - 10,
  y: ROOM_VIEWBOX.height - 100 - 110,
  width: 40,
  height: 100,
};
const FINALE_LOCKED_MESSAGE =
  "This one is locked! You don't seem to have the key... oh well.";

// Synthetic interactable for the finale locked door. Reuses the NPCModal
// flow (icon-left sprite + speaker header + typewriter body) so the
// "locked door" reads as something you *examine* — like an NPC or object —
// instead of a status-bar string that fires on contact. Player walks
// nearby → [E] hint appears → press E → modal pops, shows the message,
// any key closes. `kind: 'object'` so the existing baseline +1 network
// effect in NPCModal.handleClose doesn't fire (objects don't grant it).
const LOCKED_DOOR_INTERACTABLE: InteractableDef = {
  id: 'finale-locked-door',
  kind: 'object',
  art: 'locked-door',
  label: 'Locked door',
  tags: ['finale'],
  weight: 0, // never pool-selected; opened directly via E-key in DecisionRoom
  dialogues: [
    {
      tier: 1,
      prompt: FINALE_LOCKED_MESSAGE,
    },
  ],
};

// Hardcoded final decision — replaces pack-selected decision for the finale.
// Empty effects across all options: stat changes here would have no audible
// downstream impact (score is computed from the state BEFORE this final
// pick lands and the player never sees the room again). The deadpan options
// are the point: a wry button-press to close the loop, not a meaningful
// choice. Kept inline rather than added to the pack so it can't be
// accidentally selected for non-finale months by the pool filter.
const FINALE_DECISION: DecisionDef = {
  id: 'finale-month',
  pool: 'universal',
  tags: ['finale'],
  weight: 0,
  prompt: 'Congratulations on Ten Years of Button-Mashing Excellence! After a full decade of gameplay, what’s your proudest accomplishment?',
  options: [
    {
      label: "I mastered the art of doing nothing… but with incredible consistency.",
      effects: {},
      flavor: 'Sounds about right. Ten years of elite idling is nothing to sneeze at.',
    },
    {
      label: "Ten years of story, and I couldn't explain the plot with a gun to my head.",
      effects: {},
      flavor: "Fair. You played the whole saga like it was background noise.",
    },
    {
      label: 'My only real skill is pressing the wrong button faster than anyone else alive.',
      effects: {},
      flavor: 'Nailed it. Ten years of muscle memory, zero years of accuracy.',
    },
  ],
};

interface Props {
  config: DecisionRoomConfig;
  onExit: () => void;
}

function playerInsideDoor(door: Rect, px: number, py: number): boolean {
  return px >= door.x && px <= door.x + door.width
      && py >= door.y && py <= door.y + door.height;
}

// Find the closest past **decision** month for replay (#33). Skips:
//   - `consequence` rooms — punchlines, replay feels wrong (user design call).
//   - `narrative` rooms — the cinematic Januaries are forward-only beats
//     (year-transition cinematic). Back-walking from Feb 2021 should land
//     on Dec 2020, not Jan 2021. Same rule for month 1: 2020 opening
//     NarrativeRoom is a one-time framing beat; the loop also bails at
//     id < 2 as a defensive lower bound.
// Returns null if no eligible past month exists.
function previousReplayableMonth(
  months: { id: number; roomType?: string }[],
  fromMonthId: number,
): number | null {
  for (let id = fromMonthId - 1; id >= 2; id--) {
    const m = months.find((e) => e.id === id);
    if (!m) continue;
    if (m.roomType === 'consequence' || m.roomType === 'narrative') continue;
    return id;
  }
  return null;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function DecisionRoom({ config, onExit }: Props) {
  const { palette, pack, currentMonth: monthEntry, isReplay, liveMonth } = useCareerPack();
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
  const { speedMultiplier, forcedLayout, eventMode, forceArcade } = useDevControls();
  const { setRoomInfo } = useCurrentRoom();
  // Issue #76 — interactable labels in pack JSON may use `{kidA}` / `{kidB}` /
  // `{playerName}` tokens (homeschool kid NPCs). Resolved against the live
  // profile so sprite captions in the room reflect the player's chosen names.
  const interpolationVars: Record<string, string | undefined> = useMemo(
    () => ({
      playerName: profile.name || 'you',
      kidA: profile.kidAName,
      kidB: profile.kidBName,
    }),
    [profile.name, profile.kidAName, profile.kidBName],
  );

  const [layout] = useState(() => {
    const seed = computeRoomSeed({
      packId: profile.careerPack,
      entryClass: profile.entryClass,
      monthId: config.monthId,
      state: { progress, stats, flags },
    });
    // Pass the room's calendar year so the generator can roll a
    // year-appropriate complexity tier (v2.0.9 — `YEAR_TO_COMPLEXITY_MIX`).
    return generateRoom(seed, profile.careerPack, monthEntry.year, forcedLayout);
  });

  // Interactables placed in this room (1-3, seeded, non-overlapping with
  // spawn / door / obstacles / each other). Stable for the room's lifetime.
  // DevPanel `forceArcade` toggle (issue #31) adds `obj-arcade-game` to
  // the guaranteed-id list so the cabinet appears in every subsequent
  // room mount — useful for testing the arcade flow without wandering.
  const [placements] = useState<PlacedInteractable[]>(() => {
    const seedCtx = { stats, flags, currentMonth: config.monthId };
    return placeInteractables({
      seed: config.monthId + INTERACTABLE_SEED_SALT,
      pool: pack.interactables,
      ctx: seedCtx,
      spawn: layout.spawn,
      door: layout.door,
      obstacles: layout.obstacles,
      forceIds: forceArcade ? ['obj-arcade-game'] : undefined,
      complexity: layout.complexity,
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

  // Replay status-bar flavor (#33). One random pick per room mount —
  // changes as the player walks deeper into the past. Null when not in
  // replay. Lazy initializer + no setter, so it stays stable across
  // re-renders of THIS mount.
  const [replayStatusMessage] = useState<string | null>(() => {
    if (!isReplay) return null;
    return REPLAY_STATUS_MESSAGES[Math.floor(Math.random() * REPLAY_STATUS_MESSAGES.length)];
  });

  // Active dialogue state — set when the player engages with an interactable.
  const [activeInteractable, setActiveInteractable] = useState<InteractableDef | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<InteractableDialogue | null>(null);

  // Finale month (December 2029, the player's last room). Replays of the
  // finale use the normal layout — the finale is a one-time live beat, not
  // a walkable replay state. Two doors render, the top one decorative-locked
  // and the bottom one routing to the hardcoded FINALE_DECISION.
  const isFinale = config.monthId === FINALE_MONTH_ID && !isReplay;
  // True while the player is within INTERACT_PROXIMITY of the locked-door
  // center. Drives the [E] hint render near the door + gates the E-key
  // branch that opens LOCKED_DOOR_INTERACTABLE in the NPCModal. Updated
  // from handleTick each player tick.
  const [lockedDoorAdjacent, setLockedDoorAdjacent] = useState(false);

  // First-run tutorial (Day 13c). Reads meta.tutorialDismissed with a `??
  // false` default so older saves (pre-this-feature) without the field
  // gracefully fall through to "show on next play." Shown only outside
  // replay — walking back through the past doesn't need a tutorial. The
  // overlay is mounted in this room's render below; movement / E-key /
  // door entry are gated via `tutorialActive` so the player can't trigger
  // gameplay until they advance past the last step.
  const tutorialDismissed = useAppSelector((s) => s.meta.tutorialDismissed ?? false);
  const tutorialActive = !tutorialDismissed && !isReplay;
  const handleTutorialDismiss = useCallback(() => {
    dispatch(dismissTutorial());
    // Persist immediately so the flag survives a reload even if the player
    // closes the tab before finishing the first month. Normal persistence
    // fires on room exit (`useRoomTransition`), which would be too late here.
    persistState(store.getState());
  }, [dispatch, store]);

  // Issue #92 — sprint tutorial step. Fires AFTER the main coachmark
  // dismisses + the player has accumulated ~5 s of baseline movement.
  // `tutorialStepIndex` tracks the current main-tutorial step so the
  // misclick prompt (below) can suppress while the keys-widget step
  // is showing.
  const sprintTutorialDismissed = useAppSelector(
    (s) => s.meta.sprintTutorialDismissed ?? false,
  );
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [showSprintTutorial, setShowSprintTutorial] = useState(false);
  const [sprintPulseDirection, setSprintPulseDirection] = useState<
    'up' | 'down' | 'left' | 'right'
  >('right');
  const handleSprintTutorialDismiss = useCallback(() => {
    dispatch(dismissSprintTutorial());
    setShowSprintTutorial(false);
    persistState(store.getState());
  }, [dispatch, store]);

  // Issue #89 — misclick prompt. Bound to the canvas wrapper below.
  // Suppressed during modals + during the keys-widget tutorial step
  // (no point stacking another keys widget on top of the bubble) +
  // during the sprint tutorial overlay.
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const onKeysWidgetTutorialStep =
    tutorialActive && tutorialStepIndex === TUTORIAL_KEYS_STEP_INDEX;
  const misclickSuppressed =
    tutorialActive ||
    showSprintTutorial ||
    onKeysWidgetTutorialStep ||
    activeDecision !== null ||
    activeEvent !== null ||
    activeInteractable !== null;
  const misclickPrompt = useMisclickPrompt({
    containerRef: canvasWrapperRef,
    suppressed: misclickSuppressed,
  });

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

  // Publish this room's layout id + complexity tier to the HUD via
  // CurrentRoomContext so the location column can show "Aug 2020 ·
  // open-office · SIMPLE". Clears on unmount so a non-decision room
  // (Narrative / Consequence) doesn't show stale info.
  useEffect(() => {
    setRoomInfo({ template: layout.templateId, tier: layout.complexity });
    return () => setRoomInfo({ template: null, tier: null });
  }, [layout.templateId, layout.complexity, setRoomInfo]);

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

  // Issue #92 — cumulative-baseline-movement timer for the sprint
  // tutorial step. Accumulates milliseconds with non-zero velocity AND
  // sprint inactive (baseline movement only); fires the sprint overlay
  // once the threshold is reached. Refs over state so the ticker
  // (60 Hz) doesn't thrash React renders.
  const SPRINT_TUTORIAL_THRESHOLD_MS = 5000;
  const cumulativeBaselineMoveMsRef = useRef(0);
  const lastTickAtRef = useRef<number | null>(null);
  const sprintTutorialFiredRef = useRef(false);

  const handleTick = useCallback((state: PlayerState) => {
    // Issue #92 — accumulate baseline-movement time for the sprint
    // tutorial step trigger. Only count BASELINE motion (sprint
    // inactive) so the player can't trigger the sprint teach by
    // already sprinting — the teach is meant to reward "I've been
    // walking for a while" with the upgrade reveal.
    const tickAt = performance.now();
    if (
      tutorialDismissed &&
      !sprintTutorialDismissed &&
      !isReplay &&
      !sprintTutorialFiredRef.current
    ) {
      const lastAt = lastTickAtRef.current;
      lastTickAtRef.current = tickAt;
      if (lastAt !== null) {
        const dt = tickAt - lastAt;
        const moving = state.velocity.x !== 0 || state.velocity.y !== 0;
        const sprintActive = state.sprintingAxis !== undefined && state.sprintingAxis !== null;
        if (moving && !sprintActive) {
          cumulativeBaselineMoveMsRef.current += dt;
          // Track the latest baseline-movement direction for the pulse.
          const ax = Math.abs(state.velocity.x);
          const ay = Math.abs(state.velocity.y);
          if (ax >= ay) {
            setSprintPulseDirection(state.velocity.x >= 0 ? 'right' : 'left');
          } else {
            setSprintPulseDirection(state.velocity.y >= 0 ? 'down' : 'up');
          }
          if (cumulativeBaselineMoveMsRef.current >= SPRINT_TUTORIAL_THRESHOLD_MS) {
            sprintTutorialFiredRef.current = true;
            setShowSprintTutorial(true);
          }
        }
      }
    }

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

    // Finale month locked-door proximity. Independent of `triggered` so
    // adjacency tracks the player in and out of range continuously.
    // Distance is to the door's centre, capped at INTERACT_PROXIMITY —
    // same threshold as room interactables for a consistent feel.
    if (isFinale) {
      const lockedCx = FINALE_LOCKED_DOOR.x + FINALE_LOCKED_DOOR.width / 2;
      const lockedCy = FINALE_LOCKED_DOOR.y + FINALE_LOCKED_DOOR.height / 2;
      const lockedDist = distance(state.position.x, state.position.y, lockedCx, lockedCy);
      const nearLocked = lockedDist < INTERACT_PROXIMITY;
      setLockedDoorAdjacent((cur) => (cur === nearLocked ? cur : nearLocked));
    }

    if (triggered.current) return;

    // Moving-obstacle collision (medium-tier, v2.0.18 + two-phase lock
    // follow-up). Detected separately from static obstacles — the player
    // walks through but takes a hit + a fast westward shove + a frozen
    // stun. Suppressed in replay so revisited rooms don't redispatch
    // side-effects. Per-obstacle dedupe: the same obstacle can't re-fire
    // within COOLDOWN_MS, but a *different* obstacle in the slide path
    // can — so a chain across the two `shutters` blocks (or any future
    // multi-block layout) cascades naturally.
    const movingRects = movingObstacleRectsRef.current;
    const now = performance.now();
    if (!isReplay && movingRects.length > 0) {
      for (let i = 0; i < movingRects.length; i++) {
        const rect = movingRects[i];
        if (!circleIntersectsRect(state.position.x, state.position.y, PLAYER_RADIUS, rect)) continue;
        const sinceLast = now - lastMovingObstacleHitAtRef.current;
        const sameObstacleStillCoolingDown =
          i === lastHitObstacleIndexRef.current && sinceLast < MOVING_OBSTACLE_COOLDOWN_MS;
        if (sameObstacleStillCoolingDown) continue;

        lastMovingObstacleHitAtRef.current = now;
        lastHitObstacleIndexRef.current = i;
        movingObstacleHitCountRef.current += 1;

        // Phase 1 begins immediately: westward velocity until SLIDE_MS
        // elapses. The slide→stun transition + total unlock are handled
        // in the timing block below so a cascading mid-stun hit re-enters
        // Phase 1 cleanly.
        const slideSpeedPxPerSec =
          MOVING_OBSTACLE_KNOCKBACK_PX / (MOVING_OBSTACLE_SLIDE_MS / 1000);
        knockbackVelocityRef.current = { x: -slideSpeedPxPerSec, y: 0 };
        setIsStunnedRef.current(true);

        // Side-effects per §4: small health hit on each contact;
        // burnout +5 once a per-room hit threshold is crossed (so
        // brute-forcing through the obstacle stings).
        dispatch(applyStatEffect({ stat: 'health', op: '-', magnitude: MOVING_OBSTACLE_HEALTH_HIT }));
        if (movingObstacleHitCountRef.current === MOVING_OBSTACLE_BURNOUT_THRESHOLD) {
          dispatch(applyStatEffect({ stat: 'burnout', op: '+', magnitude: MOVING_OBSTACLE_BURNOUT_MAGNITUDE }));
        }
        // Emit an in-canvas "−N" floater anchored at the impact point
        // so the player reads damage at the player sprite, not just on
        // the HUD chip. Auto-removes after the animation completes.
        const floaterId = ++damageFloaterIdRef.current;
        const floaterX = state.position.x;
        const floaterY = state.position.y;
        setDamageFloatersRef.current((d) => [
          ...d,
          { id: floaterId, x: floaterX, y: floaterY, magnitude: MOVING_OBSTACLE_HEALTH_HIT },
        ]);
        window.setTimeout(() => {
          setDamageFloatersRef.current((d) => d.filter((f) => f.id !== floaterId));
        }, DAMAGE_FLOATER_DURATION_MS);
        break;
      }
    }
    // Phase transitions, driven off the last-hit timestamp so a cascading
    // hit naturally restarts at Phase 1. Phase 1 → Phase 2 zeroes the
    // velocity (still input-locked, no motion). Phase 2 → unlock clears
    // the ref so usePlayerMovement returns control; its must-release
    // gate ignores any direction key that was held through the lock until
    // it's physically released.
    if (knockbackVelocityRef.current !== null) {
      const sinceHit = now - lastMovingObstacleHitAtRef.current;
      if (sinceHit >= MOVING_OBSTACLE_TOTAL_LOCK_MS) {
        knockbackVelocityRef.current = null;
        setIsStunnedRef.current(false);
      } else if (sinceHit >= MOVING_OBSTACLE_SLIDE_MS && knockbackVelocityRef.current.x !== 0) {
        knockbackVelocityRef.current = { x: 0, y: 0 };
      }
    }

    // Rewind door (#33). Walking in enters replay of the previous
    // (non-consequence) past month, or — if already in replay — goes
    // further back. Hidden / inert if no eligible past month exists.
    if (playerInsideDoor(REWIND_DOOR, state.position.x, state.position.y)) {
      const prevMonthId = previousReplayableMonth(pack.months, config.monthId);
      if (prevMonthId === null) return;
      triggered.current = true;
      setCommitted(true);
      window.setTimeout(() => {
        dispatch(enterReplay(prevMonthId));
      }, DOOR_FADE_MS);
      return;
    }

    // Finale forward-door substitutes for layout.door on the finale. The
    // locked door (top) is never a commit target — it just shows a
    // status-bar message via lockedDoorActive above.
    const forwardDoor = isFinale ? FINALE_FORWARD_DOOR : layout.door;
    if (!playerInsideDoor(forwardDoor, state.position.x, state.position.y)) return;
    triggered.current = true;
    setCommitted(true);

    // Bonus XP for an untouched traversal of a room that had moving
    // obstacles (v2.0.18, §4). Suppressed in replay (no rewards on
    // revisit) and on the finale (no engine rewards land at month 70).
    if (
      !isReplay &&
      !isFinale &&
      (layout.movingObstacles?.length ?? 0) > 0 &&
      movingObstacleHitCountRef.current === 0 &&
      !untouchedBonusFiredRef.current
    ) {
      untouchedBonusFiredRef.current = true;
      dispatch(addXp(XP_TIER_BONUS_UNTOUCHED));
    }

    // Replay (#33): forward door is the "↩ Return" exit. No decision
    // fires, no event rolls, no state change — just dispatch exitReplay
    // and let the new (live) room mount.
    if (isReplay) {
      window.setTimeout(() => {
        dispatch(exitReplay());
      }, DOOR_FADE_MS);
      return;
    }

    // Finale month overrides pack-selected decision with the hardcoded
    // FINALE_DECISION (snarky 3-option wrap-up). Otherwise normal pool
    // selection per §8 / PR #35.
    const picked = isFinale
      ? FINALE_DECISION
      : selectDecision({
          decisions: pack.decisions,
          ctx,
          monthId: config.monthId,
          history: store.getState().history.decisions,
        });
    window.setTimeout(() => {
      if (picked) {
        setActiveDecision(picked);
      } else {
        onExit();
      }
    }, MODAL_POP_DELAY_MS);
  }, [layout.door, layout.movingObstacles, pack.decisions, pack.months, ctx, config.monthId, onExit, placements, store, isReplay, isFinale, dispatch, tutorialDismissed, sprintTutorialDismissed]);

  const initialSpawn = useMemo<Vector2>(
    () =>
      isReplay
        ? replaySpawnFor(layout.door, layout.obstacles, layout.spawn)
        : layout.spawn,
    [isReplay, layout.door, layout.obstacles, layout.spawn],
  );

  const playerActive =
    !committed &&
    activeDecision === null &&
    activeEvent === null &&
    activeInteractable === null &&
    !tutorialActive;

  // Knockback velocity ref — declared above usePlayerMovement so it can
  // be passed as `externalVelocityRef`. While `current` is non-null, the
  // hook reads it instead of keyboard input. The two-phase timing
  // (slide + stun + unlock) is driven from `lastMovingObstacleHitAtRef`
  // inside handleTick; no separate "until" timestamp needed.
  const knockbackVelocityRef = useRef<{ x: number; y: number } | null>(null);

  const player = usePlayerMovement({
    initialPosition: initialSpawn,
    bounds: ROOM_BOUNDS,
    obstacles: layout.obstacles,
    active: playerActive,
    speed: BASE_SPEED * speedMultiplier,
    onTick: handleTick,
    externalVelocityRef: knockbackVelocityRef,
  });
  const playerState = player.state;

  // Per-frame positions of any moving obstacles (medium-tier rooms,
  // v2.0.18). Empty for simple/easy templates — the hook short-circuits
  // and doesn't subscribe to rAF when there's no motion to drive.
  const movingObstacleRects = useMovingObstacles(
    layout.movingObstacles,
    playerActive,
  );
  // Per-room moving-obstacle hit accounting (v2.0.18). Resets per mount
  // because DecisionRoom is keyed by `monthId` in RoomRenderer.
  const movingObstacleHitCountRef = useRef(0);
  const lastMovingObstacleHitAtRef = useRef(0);
  // Per-obstacle dedupe (v2.0.18 follow-up). A new obstacle can re-hit
  // the player even if the global cooldown hasn't elapsed; same obstacle
  // re-firing within the cooldown is suppressed.
  const lastHitObstacleIndexRef = useRef<number>(-1);
  const untouchedBonusFiredRef = useRef(false);
  const [damageFloaters, setDamageFloaters] = useState<DamageFloater[]>([]);
  const damageFloaterIdRef = useRef(0);
  // Render-only flag: drives the "stunned" stars above the player for
  // the 1-sec lock window. Mirrors the lifetime of knockbackVelocityRef
  // (set on hit, cleared on unlock) but lives in state so React re-renders.
  const [isStunned, setIsStunned] = useState(false);
  const setIsStunnedRef = useRef(setIsStunned);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { setIsStunnedRef.current = setIsStunned; }, [setIsStunned]);
  // Mirror the per-frame moving-obstacle rects + the player setter so
  // handleTick (a stable useCallback declared above) can read fresh
  // values without rebinding the game-loop subscription each frame.
  // Same pattern as Pong.tsx's score/paddle refs; the react-hooks
  // immutability rule is over-eager on the custom-hook-return path.
  const movingObstacleRectsRef = useRef(movingObstacleRects);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { movingObstacleRectsRef.current = movingObstacleRects; }, [movingObstacleRects]);
  // Mirror trick for setDamageFloaters: handleTick is declared earlier
  // in the file as a stable useCallback, so reading the setter through
  // a ref keeps the react-hooks/immutability lint rule happy without
  // rebinding the loop. Same pattern as Pong.tsx's score/paddle refs.
  const setDamageFloatersRef = useRef(setDamageFloaters);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { setDamageFloatersRef.current = setDamageFloaters; }, [setDamageFloaters]);

  // E-key opens the nearest interactable's modal when the player is adjacent
  // and no other modal is active. Picks a random eligible dialogue. The
  // finale locked door piggybacks on the same key + modal — `nearLocked`
  // wins over a regular adjacent interactable (the locked door is at the
  // right edge, where no regular placement would land anyway).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      if (committed) return;
      if (tutorialActive) return;
      if (activeDecision || activeEvent || activeInteractable) return;

      // Finale locked-door branch — open the synthetic interactable in
      // NPCModal so the message reads like a "the door speaks" beat
      // rather than a status-bar swap.
      if (isFinale && lockedDoorAdjacent) {
        e.preventDefault();
        setActiveInteractable(LOCKED_DOOR_INTERACTABLE);
        setActiveDialogue(LOCKED_DOOR_INTERACTABLE.dialogues[0]);
        return;
      }

      if (placements.length === 0) return;
      if (adjacentIndex === null) return;
      e.preventDefault();
      const target = placements[adjacentIndex];
      if (!target) return;
      // Feature-flagged interactables (issue #31 arcade) bypass the
      // dialogue pool and open their feature modal directly. The sprite
      // and label still come from the InteractableDef; only the modal
      // routing branches.
      if (target.def.feature === 'arcade') {
        setActiveInteractable(target.def);
        setActiveDialogue(null);
        return;
      }
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
    tutorialActive,
    activeDecision,
    activeEvent,
    activeInteractable,
    isFinale,
    lockedDoorAdjacent,
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
      history: live.history.events,
    });
  }, [eventMode, pack.events, pack.manifest.eventChance, monthEntry.era, store, config.monthId]);

  const handleDecisionContinue = useCallback(() => {
    if (activeDecision && pendingOptionIndex !== null) {
      const option = activeDecision.options[pendingOptionIndex];
      for (const [stat, expr] of Object.entries(option.effects)) {
        const parsed = parseEffect(expr);
        if (!parsed) continue;
        // `xp` is not a StatKey — it routes to addXp, additive on top of the
        // baseline grant below. Author bonuses like `"xp": "+300"` on options
        // that represent promotions, new jobs, or big stretches.
        if (stat === 'xp') {
          dispatch(addXp(parsed.op === '-' ? -parsed.magnitude : parsed.magnitude));
          continue;
        }
        dispatch(applyStatEffect({
          stat: stat as StatKey,
          op: parsed.op,
          magnitude: parsed.magnitude,
        }));
      }
      // Every committed decision grants baseline XP — addXp recomputes
      // classTier so promotions land automatically.
      dispatch(addXp(XP_PER_DECISION));
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
        data-component="DecisionRoom"
        data-month-id={config.monthId}
        data-tutorial-step={tutorialActive ? tutorialStepIndex : -1}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: 'var(--canvas-display-width)',
          gap: 16,
          // Establishes a positioning context for child overlays
          // (TutorialOverlay below renders position:absolute inside this
          // container so its bubble anchors to the canvas frame, not the
          // viewport — the viewport-anchored version pushed the bubble
          // off the right edge of the canvas on widescreens).
          position: 'relative',
        }}
      >
        {/* Status / current-task bar. */}
        <div
          data-region="status-bar"
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
            key={transitionMessage ?? replayStatusMessage ?? 'instructional'}
            style={{
              animation: 'status-swap-fade 280ms ease forwards',
              fontStyle: (transitionMessage || replayStatusMessage) ? 'italic' : 'normal',
            }}
          >
            {transitionMessage
              ?? replayStatusMessage
              ?? 'Walk into the door →'}
          </span>
        </div>

        {/* Canvas wrapper — wireframe border survives the door-commit fade. */}
        <div
          ref={canvasWrapperRef}
          data-region="canvas"
          style={{
            border: `1px solid ${palette.surface}`,
            borderRadius: 6,
            overflow: 'hidden',
            lineHeight: 0,
            position: 'relative',
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

          {/* Forward door — uses FINALE_FORWARD_DOOR coords on the finale
              (right edge, bottom-half) so a fixed locked door can sit
              symmetrically above it. Other months use the generator's
              layout.door position. */}
          {(() => {
            const door = isFinale ? FINALE_FORWARD_DOOR : layout.door;
            return (
              <>
                <rect
                  data-region="forward-door"
                  x={door.x}
                  y={door.y}
                  width={door.width}
                  height={door.height}
                  fill={palette.accent}
                  stroke={palette.ink}
                  strokeWidth={2}
                  rx={2}
                />
                <circle
                  cx={door.x + door.width - 8}
                  cy={door.y + door.height / 2}
                  r={2.5}
                  fill={palette.ink}
                />
                {isReplay && (
                  <text
                    data-region="forward-door-label"
                    x={ROOM_VIEWBOX.width - 10}
                    y={door.y - 8}
                    textAnchor="end"
                    fontSize={12}
                    fontWeight={600}
                    letterSpacing="0.04em"
                    fill={palette.ink}
                  >
                    {`↩ return to ${monthLabel(liveMonth.id)}`}
                  </text>
                )}
              </>
            );
          })()}

          {/* Finale locked door (decorative). Appears only on the finale,
              top-right of canvas. Walking into the rect swaps the status
              bar to FINALE_LOCKED_MESSAGE via lockedDoorActive — no
              commit, no transition. Visually distinct: surface fill +
              muted ink stroke + reduced opacity, "Locked" label below. */}
          {isFinale && (
            <g data-region="finale-locked-door-group">
              <rect
                data-region="finale-locked-door"
                x={FINALE_LOCKED_DOOR.x}
                y={FINALE_LOCKED_DOOR.y}
                width={FINALE_LOCKED_DOOR.width}
                height={FINALE_LOCKED_DOOR.height}
                fill={palette.surface}
                stroke={palette.inkMuted}
                strokeWidth={2}
                strokeDasharray="6 4"
                rx={2}
                opacity={0.85}
              />
              {/* Lock glyph — a tiny shackle + body in the centre of the
                  door. SVG path, palette.inkMuted. */}
              <g
                data-region="finale-lock-icon"
                transform={`translate(${FINALE_LOCKED_DOOR.x + FINALE_LOCKED_DOOR.width / 2 - 7}, ${FINALE_LOCKED_DOOR.y + FINALE_LOCKED_DOOR.height / 2 - 7})`}
              >
                <path
                  d="M 4 6 V 4 a 3 3 0 0 1 6 0 V 6"
                  fill="none"
                  stroke={palette.inkMuted}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <rect
                  x={2}
                  y={6}
                  width={10}
                  height={8}
                  rx={1.5}
                  fill={palette.background}
                  stroke={palette.inkMuted}
                  strokeWidth={1.5}
                />
              </g>
              <text
                data-region="finale-locked-door-label"
                x={ROOM_VIEWBOX.width - 10}
                y={FINALE_LOCKED_DOOR.y - 8}
                textAnchor="end"
                fontSize={11}
                fontWeight={600}
                letterSpacing="0.04em"
                fill={palette.inkMuted}
              >
                Locked
              </text>
              {/* [E] proximity hint — appears when the player is close
                  enough to "try the handle." Mirrors the interactable
                  hint pattern in `placements.map(...)` below. */}
              {lockedDoorAdjacent && !activeInteractable && (
                <text
                  data-region="finale-locked-door-hint"
                  x={FINALE_LOCKED_DOOR.x + FINALE_LOCKED_DOOR.width / 2}
                  y={FINALE_LOCKED_DOOR.y + FINALE_LOCKED_DOOR.height + 18}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={palette.ink}
                >
                  [E] try
                </text>
              )}
            </g>
          )}

          {/* Rewind door (#33). Renders when an eligible past month exists. */}
          {(() => {
            const prevId = previousReplayableMonth(pack.months, config.monthId);
            if (prevId === null) return null;
            const prevLabel = monthLabel(prevId);
            return (
              <g data-region="rewind-door-group">
                <rect
                  data-region="rewind-door"
                  x={REWIND_DOOR.x}
                  y={REWIND_DOOR.y}
                  width={REWIND_DOOR.width}
                  height={REWIND_DOOR.height}
                  fill={palette.accent}
                  stroke={palette.ink}
                  strokeWidth={2}
                  rx={2}
                />
                <text
                  data-region="rewind-door-label"
                  x={10}
                  y={REWIND_DOOR.y - 8}
                  textAnchor="start"
                  fontSize={11}
                  fontWeight={600}
                  letterSpacing="0.04em"
                  fill={palette.inkMuted}
                >
                  {`← ${prevLabel}`}
                </text>
              </g>
            );
          })()}

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

          {/* Moving obstacles (medium-tier, v2.0.18). Same visual
              register as static obstacles but tinted with `palette.accent`
              + a thicker stroke so the player reads "this one moves." */}
          {movingObstacleRects.map((rect, i) => (
            <rect
              key={`mo-${i}`}
              data-region="moving-obstacle"
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={palette.accent}
              stroke={palette.ink}
              strokeWidth={3}
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
              <g
                key={p.def.id + '-' + i}
                data-interactable-id={p.def.id}
                data-interactable-kind={p.def.kind}
                data-adjacent={isNearest || undefined}
              >
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
                      data-region="interact-hint"
                      x={ipos.x}
                      y={ipos.y - INTERACTABLE_HALF_H - 12}
                      textAnchor="middle"
                      fontSize={14}
                      fontWeight={600}
                      fill={palette.ink}
                    >
                      [E] {p.def.feature === 'arcade' ? 'play' : p.def.kind === 'npc' ? 'talk' : 'look'}
                    </text>
                    <text
                      data-region="interact-label"
                      x={ipos.x}
                      y={ipos.y + INTERACTABLE_HALF_H + 16}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill={palette.ink}
                      letterSpacing="0.04em"
                    >
                      {labelFor(p.def, interpolationVars)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Issue #92 — motion lines render BEHIND the player while
              sprint is genuinely active (sprintingAxis set in
              usePlayerMovement only when multiplier was applied this
              frame; null during knockback). 3 short stroke segments
              trailing in the opposite direction of travel. */}
          {playerState.sprintingAxis && (
            <g data-region="motion-lines" pointerEvents="none">
              {(() => {
                const cx = playerState.position.x;
                const cy = playerState.position.y;
                const r = PLAYER_RADIUS;
                const lineLen = 14;
                const gap = 4;
                // Trailing direction is OPPOSITE of sprintingAxis.
                let segments: ReadonlyArray<{ x1: number; y1: number; x2: number; y2: number }>;
                if (playerState.sprintingAxis === 'right') {
                  // Trail left of the player; 3 horizontal segments at varying y.
                  const x2 = cx - r - gap;
                  const x1 = x2 - lineLen;
                  segments = [
                    { x1, y1: cy - 6, x2, y2: cy - 6 },
                    { x1, y1: cy,     x2, y2: cy     },
                    { x1, y1: cy + 6, x2, y2: cy + 6 },
                  ];
                } else if (playerState.sprintingAxis === 'left') {
                  const x1 = cx + r + gap;
                  const x2 = x1 + lineLen;
                  segments = [
                    { x1, y1: cy - 6, x2, y2: cy - 6 },
                    { x1, y1: cy,     x2, y2: cy     },
                    { x1, y1: cy + 6, x2, y2: cy + 6 },
                  ];
                } else if (playerState.sprintingAxis === 'down') {
                  const y2 = cy - r - gap;
                  const y1 = y2 - lineLen;
                  segments = [
                    { x1: cx - 6, y1, x2: cx - 6, y2 },
                    { x1: cx,     y1, x2: cx,     y2 },
                    { x1: cx + 6, y1, x2: cx + 6, y2 },
                  ];
                } else {
                  // up
                  const y1 = cy + r + gap;
                  const y2 = y1 + lineLen;
                  segments = [
                    { x1: cx - 6, y1, x2: cx - 6, y2 },
                    { x1: cx,     y1, x2: cx,     y2 },
                    { x1: cx + 6, y1, x2: cx + 6, y2 },
                  ];
                }
                return segments.map((s, i) => (
                  <line
                    key={i}
                    x1={s.x1}
                    y1={s.y1}
                    x2={s.x2}
                    y2={s.y2}
                    stroke={palette.ink}
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.4}
                  />
                ));
              })()}
            </g>
          )}

          <Player state={playerState} />

          {/* "Stunned" stars during the 1-sec moving-obstacle lock. Three
              ★ characters in a small fan above the player's head, each
              twinkling at a 200ms phase offset for a wave effect. Follow
              the player position so they ride along with the slide and
              then sit above the stationary stunned player. */}
          {isStunned && (
            <g data-region="stun-stars" pointerEvents="none">
              <text
                x={playerState.position.x - 16}
                y={playerState.position.y - PLAYER_RADIUS - 14}
                fontSize={16}
                fill="#ffd54f"
                textAnchor="middle"
                style={{ animation: 'stun-twinkle 600ms ease-in-out infinite' }}
              >
                ★
              </text>
              <text
                x={playerState.position.x}
                y={playerState.position.y - PLAYER_RADIUS - 22}
                fontSize={18}
                fill="#ffd54f"
                textAnchor="middle"
                style={{ animation: 'stun-twinkle 600ms ease-in-out infinite 200ms' }}
              >
                ★
              </text>
              <text
                x={playerState.position.x + 16}
                y={playerState.position.y - PLAYER_RADIUS - 14}
                fontSize={16}
                fill="#ffd54f"
                textAnchor="middle"
                style={{ animation: 'stun-twinkle 600ms ease-in-out infinite 400ms' }}
              >
                ★
              </text>
            </g>
          )}

          {/* Moving-obstacle damage floaters (v2.0.18). Rendered after
              the player so they layer on top. `text-anchor="middle"`
              centers horizontally; the keyframe handles rise + fade. */}
          {damageFloaters.map((f) => (
            <text
              key={f.id}
              data-region="damage-floater"
              x={f.x - 75}
              y={f.y - PLAYER_RADIUS - 6}
              textAnchor="middle"
              fontSize={20}
              fontWeight={700}
              fill={palette.accent}
              pointerEvents="none"
              style={{
                animation: `damage-float ${DAMAGE_FLOATER_DURATION_MS}ms ease-out forwards`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              −{f.magnitude}
            </text>
          ))}
        </svg>
        {/* Issue #89 — misclick prompt. Surfaces the keys widget when
            the player clicks the canvas (the game is keyboard-only).
            zIndex 70 sits above gameplay (SVG) but below modals
            (zIndex 100+) and below the tutorial overlay (zIndex 80).
            Re-keyed by `version` so each fresh pop replays the
            pop-in animation. */}
        {misclickPrompt.visible && (
          <div
            key={misclickPrompt.version}
            data-component="MisclickPrompt"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 70,
              animation: 'decision-modal-dialog-pop 200ms ease-out',
            }}
          >
            <div
              data-region="bubble"
              style={{
                pointerEvents: 'auto',
                background: palette.background,
                color: palette.ink,
                border: `2px solid ${palette.ink}`,
                borderRadius: 6,
                padding: '18px 26px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                fontFamily: 'inherit',
              }}
            >
              <KeysWidget palette={palette} size={42} caption="Use the keyboard" />
            </div>
          </div>
        )}
        </div>

        {tutorialActive && (
          <TutorialOverlay
            onDismiss={handleTutorialDismiss}
            onStepChange={setTutorialStepIndex}
          />
        )}
        {showSprintTutorial && !tutorialActive && (
          <SprintTutorialOverlay
            onDismiss={handleSprintTutorialDismiss}
            pulseDirection={sprintPulseDirection}
          />
        )}
      </div>

      {activeDecision && (
        <DecisionModal
          decision={activeDecision}
          onChoose={handleChoose}
          onContinue={handleDecisionContinue}
          finale={activeDecision.id === FINALE_DECISION.id}
        />
      )}

      {activeEvent && (
        <EventModal
          event={activeEvent}
          onContinue={handleEventContinue}
        />
      )}

      {activeInteractable && activeInteractable.feature === 'arcade' && (
        <ArcadeModal
          interactable={activeInteractable}
          onClose={handleInteractableClose}
        />
      )}

      {activeInteractable && !activeInteractable.feature && activeDialogue && (
        <NPCModal
          interactable={activeInteractable}
          dialogue={activeDialogue}
          onClose={handleInteractableClose}
        />
      )}
    </>
  );
}
