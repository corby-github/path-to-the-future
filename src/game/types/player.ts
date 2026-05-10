import type { Vector2 } from './geometry';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  facing: Direction;
}
