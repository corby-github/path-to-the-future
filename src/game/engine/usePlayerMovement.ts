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
}

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
}: UsePlayerMovementOptions): PlayerControl {
  const input = useKeyboardInput();

  // Internal mutable state — updated every frame, no re-renders here.
  const stateRef = useRef<PlayerState>({
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    facing: 'down',
  });

  // Render-state — updated each frame for React to redraw the SVG.
  // Lazy initializer creates an independent object so the ref and the
  // state slice don't alias each other.
  const [renderState, setRenderState] = useState<PlayerState>(() => ({
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    facing: 'down',
  }));

  // Keep the latest onTick pointer accessible from the game loop without
  // re-registering the loop on every callback identity change.
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useGameLoop((delta) => {
    // External velocity (e.g. moving-obstacle knockback slide) takes
    // precedence over keyboard input when set. Caller clears the ref to
    // return control to the player.
    const ext = externalVelocityRef?.current ?? null;

    let vx: number;
    let vy: number;
    let facing = stateRef.current.facing;

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
      const { up, down, left, right } = input.current;

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

      // Update facing direction (favour horizontal when both are pressed)
      if (dx > 0) facing = 'right';
      else if (dx < 0) facing = 'left';
      else if (dy > 0) facing = 'down';
      else if (dy < 0) facing = 'up';
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
    };

    setRenderState(stateRef.current);
    onTickRef.current?.(stateRef.current);
  }, active);

  const setPosition = useCallback((pos: Vector2) => {
    stateRef.current = {
      ...stateRef.current,
      position: { ...pos },
      velocity: { x: 0, y: 0 },
    };
    setRenderState(stateRef.current);
  }, []);

  return { state: renderState, setPosition };
}
