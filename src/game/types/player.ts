import type { Vector2 } from './geometry';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  facing: Direction;
  // Issue #92 — non-null when double-tap sprint is currently being
  // APPLIED to velocity (i.e., sprintAxis is set AND not suppressed by
  // external/knockback velocity AND the matching axis key is held).
  // DecisionRoom reads this to drive motion-lines rendering.
  sprintingAxis?: Direction | null;
}
