import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Vector2, Bounds, Rect } from '../types/geometry';
import type { PlayerState } from '../types/player';
import { useKeyboardInput } from './useKeyboardInput';
import { useGameLoop } from './useGameLoop';
import { resolveMovement } from './collision';
import { PLAYER_RADIUS } from '../coordinates';

interface UsePlayerMovementOptions {
  initialPosition: Vector2;
  bounds: Bounds;
  obstacles?: Rect[];
  radius?: number;
  speed?: number;       // pixels per second
  active?: boolean;     // pause movement during transitions, dialogues, etc.
  onTick?: (state: PlayerState) => void;  // fires inside the rAF loop each frame
  // Optional override velocity. When `current` is non-null, the loop uses
  // it as the per-frame velocity (px/sec) and ignores keyboard input. Used
  // by DecisionRoom for moving-obstacle knockback slide — the caller sets
  // a westward velocity for a cooloff window, which lets the existing
  // bounds + static-obstacle resolution handle clamping/collision while
  // the player slides. Clearing the ref returns control to the keyboard.
  externalVelocityRef?: RefObject<Vector2 | null>;
  // Optional tap-to-move target. When `current` is non-null AND neither
  // external velocity nor keyboard input is driving the frame, the loop
  // walks the player toward this point at base speed. Auto-clears when
  // the player arrives (within TARGET_ARRIVED_DISTANCE) or when keyboard
  // input picks back up (keyboard wins). Used by DecisionRoom's mobile
  // path: pointerdown on the canvas sets a target so players without a
  // physical keyboard can move at all.
  targetRef?: RefObject<Vector2 | null>;
}

// Tap-to-move arrival threshold. Larger than 1px so the loop converges
// cleanly across the floating-point error in velocity * delta + collision
// resolution, and so the player visibly stops rather than slowly
// micro-stepping the last fraction of a pixel.
const TARGET_ARRIVED_DISTANCE = 3;

// v2.0.18 — return shape widened so callers can imperatively reposition the
// player (e.g. moving-obstacle knockback in DecisionRoom). `state` is the
// per-frame render state; `setPosition` halts momentum and snaps the
// internal ref to the new position so the next frame's collision math is
// clean.
export interface PlayerControl {
  state: PlayerState;
  setPosition: (pos: Vector2) => void;
}

const DEFAULT_SPEED = 180;
// Issue #92 — double-tap-to-sprint multiplier. Detection lives in
// useKeyboardInput (sets input.current.sprintAxis); this hook applies
// the multiplier to the matching axis component of the velocity vector.
// 2.0× gives a clear "I know where I'm going" gear without feeling
// twitchy. Tune in playtest.
const SPRINT_MULTIPLIER = 2.0;
const EMPTY_OBSTACLES: Rect[] = [];

export function usePlayerMovement({
  initialPosition,
  bounds,
  obstacles = EMPTY_OBSTACLES,
  radius = PLAYER_RADIUS,
  speed = DEFAULT_SPEED,
  active = true,
  onTick,
  externalVelocityRef,
  targetRef,
}: UsePlayerMovementOptions): PlayerControl {
  const input = useKeyboardInput();

  // Internal mutable state — updated every frame, no re-renders here.
  const stateRef = useRef<PlayerState>({
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    facing: 'down',
    sprintingAxis: null,
  });

  // Render-state — updated each frame for React to redraw the SVG.
  // Lazy initializer creates an independent object so the ref and the
  // state slice don't alias each other.
  const [renderState, setRenderState] = useState<PlayerState>(() => ({
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    facing: 'down',
    sprintingAxis: null,
  }));

  // Keep the latest onTick pointer accessible from the game loop without
  // re-registering the loop on every callback identity change.
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  // "Must-release" input gate. When externalVelocity transitions from
  // non-null back to null (e.g. moving-obstacle stun ends), any direction
  // key that was being held at that moment stays ignored until it's seen
  // released — so a sustained "right hold" through the stun doesn't
  // immediately resume motion. Each key clears independently on release,
  // and a released-then-pressed key fires normally.
  const wasExternalRef = useRef(false);
  const blockedKeysRef = useRef({ up: false, down: false, left: false, right: false });

  useGameLoop((delta) => {
    // External velocity (e.g. moving-obstacle knockback slide) takes
    // precedence over keyboard input when set. Caller clears the ref to
    // return control to the player.
    const ext = externalVelocityRef?.current ?? null;
    const wasExt = wasExternalRef.current;
    wasExternalRef.current = ext !== null;

    let vx: number;
    let vy: number;
    let facing = stateRef.current.facing;
    // Issue #92 — true when the sprint multiplier was APPLIED this frame
    // (sprintAxis set AND matching key held AND not under external
    // velocity). DecisionRoom reads stateRef.sprintingAxis to render
    // motion lines only when sprint is genuinely active.
    let sprintingAxis: PlayerState['sprintingAxis'] = null;

    if (ext) {
      vx = ext.x;
      vy = ext.y;
      // Face the direction of forced motion so the sprite reads as
      // "being shoved" rather than frozen-but-sliding.
      if (ext.x < 0) facing = 'left';
      else if (ext.x > 0) facing = 'right';
      else if (ext.y < 0) facing = 'up';
      else if (ext.y > 0) facing = 'down';
    } else {
      const raw = input.current;
      const blocked = blockedKeysRef.current;

      // Snapshot currently-held keys at the moment external control
      // ends — those keys remain blocked until physically released.
      if (wasExt) {
        blocked.up = raw.up;
        blocked.down = raw.down;
        blocked.left = raw.left;
        blocked.right = raw.right;
      }
      // Auto-clear: any blocked key the player has now released is
      // un-armed. Next press will fire normally.
      if (!raw.up) blocked.up = false;
      if (!raw.down) blocked.down = false;
      if (!raw.left) blocked.left = false;
      if (!raw.right) blocked.right = false;

      const up = raw.up && !blocked.up;
      const down = raw.down && !blocked.down;
      const left = raw.left && !blocked.left;
      const right = raw.right && !blocked.right;

      // Build the intent vector
      let dx = (right ? 1 : 0) - (left ? 1 : 0);
      let dy = (down ? 1 : 0) - (up ? 1 : 0);

      // Normalise diagonals so moving up-right isn't faster than moving right
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv;
        dy *= inv;
      }

      vx = dx * speed;
      vy = dy * speed;

      // Issue #92 — apply sprint multiplier to the matching axis
      // component AFTER diagonal normalization. The player double-taps
      // a single direction; if they're also holding a perpendicular,
      // only the sprint axis gets the 2× boost (the perpendicular axis
      // stays baseline). External velocity (knockback) is handled by
      // the `if (ext)` branch above and never reaches this block —
      // sprint is suppressed during knockback by virtue of that.
      const sprintAxis = raw.sprintAxis;
      if (sprintAxis === 'right' && right) {
        vx *= SPRINT_MULTIPLIER;
        sprintingAxis = 'right';
      } else if (sprintAxis === 'left' && left) {
        vx *= SPRINT_MULTIPLIER;
        sprintingAxis = 'left';
      } else if (sprintAxis === 'down' && down) {
        vy *= SPRINT_MULTIPLIER;
        sprintingAxis = 'down';
      } else if (sprintAxis === 'up' && up) {
        vy *= SPRINT_MULTIPLIER;
        sprintingAxis = 'up';
      }

      // Update facing direction (favour horizontal when both are pressed)
      if (dx > 0) facing = 'right';
      else if (dx < 0) facing = 'left';
      else if (dy > 0) facing = 'down';
      else if (dy < 0) facing = 'up';
    }

    // Tap-to-move (mobile / mouse-only path). Only runs when neither
    // external knockback nor keyboard input is driving the frame —
    // keyboard wins by virtue of setting vx/vy non-zero above. A
    // non-zero keyboard frame also clears any in-progress target so
    // subsequent keyboard-idle frames don't snap back to the old tap.
    if (!ext && targetRef?.current) {
      if (vx !== 0 || vy !== 0) {
        targetRef.current = null;
      } else {
        const target = targetRef.current;
        const curPos = stateRef.current.position;
        const tdx = target.x - curPos.x;
        const tdy = target.y - curPos.y;
        const dist = Math.hypot(tdx, tdy);
        if (dist <= TARGET_ARRIVED_DISTANCE) {
          targetRef.current = null;
        } else {
          vx = (tdx / dist) * speed;
          vy = (tdy / dist) * speed;
          // Face toward dominant axis so the sprite reads as walking
          // *toward* the destination, not just whichever cardinal it
          // last picked. Same horizontal-favouring tie-break as the
          // keyboard branch above.
          if (Math.abs(tdx) > Math.abs(tdy)) {
            facing = tdx > 0 ? 'right' : 'left';
          } else {
            facing = tdy > 0 ? 'down' : 'up';
          }
        }
      }
    }

    const desired = {
      x: stateRef.current.position.x + vx * delta,
      y: stateRef.current.position.y + vy * delta,
    };

    const resolved = resolveMovement(
      stateRef.current.position,
      desired,
      radius,
      obstacles,
      bounds,
    );

    stateRef.current = {
      position: resolved,
      velocity: { x: vx, y: vy },
      facing,
      sprintingAxis,
    };

    setRenderState(stateRef.current);
    onTickRef.current?.(stateRef.current);
  }, active);

  const setPosition = useCallback((pos: Vector2) => {
    stateRef.current = {
      ...stateRef.current,
      position: { ...pos },
      velocity: { x: 0, y: 0 },
      sprintingAxis: null,
    };
    setRenderState(stateRef.current);
  }, []);

  return { state: renderState, setPosition };
}
