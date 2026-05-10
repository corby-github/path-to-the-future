import { useRef, useState } from 'react';
import type { Vector2, Bounds } from '../types/geometry';
import type { PlayerState } from '../types/player';
import { useKeyboardInput } from './useKeyboardInput';
import { useGameLoop } from './useGameLoop';

interface UsePlayerMovementOptions {
  initialPosition: Vector2;
  bounds: Bounds;
  speed?: number;       // pixels per second
  active?: boolean;     // pause movement during transitions, dialogues, etc.
}

const DEFAULT_SPEED = 180;

export function usePlayerMovement({
  initialPosition,
  bounds,
  speed = DEFAULT_SPEED,
  active = true,
}: UsePlayerMovementOptions): PlayerState {
  const input = useKeyboardInput();

  // Internal mutable state — updated every frame, no re-renders here.
  const stateRef = useRef<PlayerState>({
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    facing: 'down',
  });

  // Render-state — updated each frame for React to redraw the SVG.
  const [renderState, setRenderState] = useState<PlayerState>(stateRef.current);

  useGameLoop((delta) => {
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

    const vx = dx * speed;
    const vy = dy * speed;

    // Apply movement
    let nextX = stateRef.current.position.x + vx * delta;
    let nextY = stateRef.current.position.y + vy * delta;

    // Boundary clamping. This is the seam where the collision system will plug in.
    nextX = Math.max(bounds.minX, Math.min(bounds.maxX, nextX));
    nextY = Math.max(bounds.minY, Math.min(bounds.maxY, nextY));

    // Update facing direction (favour horizontal when both are pressed)
    let facing = stateRef.current.facing;
    if (dx > 0) facing = 'right';
    else if (dx < 0) facing = 'left';
    else if (dy > 0) facing = 'down';
    else if (dy < 0) facing = 'up';

    stateRef.current = {
      position: { x: nextX, y: nextY },
      velocity: { x: vx, y: vy },
      facing,
    };

    setRenderState(stateRef.current);
  }, active);

  return renderState;
}
