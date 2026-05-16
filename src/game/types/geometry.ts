export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Oscillating obstacle for medium / hard-tier rooms (v2.0.18, §4).
// `baseRect` is the rest-position rect (the *center* of the oscillation).
// At time t (ms since mount), the current position along `axis` is:
//
//   baseRect.{axis} + amplitude * sin((t / period) * 2π + phase)
//
// `amplitude` is half the peak-to-peak swing in px. `period` is one full
// oscillation in ms. `phase` (rad) lets paired obstacles sit out-of-sync.
// `axis` defaults to 'vertical' (back-compat with v2.0.18 templates that
// predate horizontal support); 'horizontal' swings along x instead of y.
//
// Detected separately from static obstacles — the player can walk through
// (taking a hit + knockback) rather than being hard-blocked. See
// DecisionRoom's collision callback.
export interface MovingObstacle {
  baseRect: Rect;
  amplitude: number;
  period: number;
  phase: number;
  axis?: 'horizontal' | 'vertical';
}
