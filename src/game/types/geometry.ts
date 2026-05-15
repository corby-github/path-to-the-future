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

// Vertically-oscillating obstacle for medium-tier rooms (v2.0.18, §4).
// `baseRect` is the rest-position rect (the *center* of the oscillation).
// At time t (ms since mount), the current rect's y is:
//
//   baseRect.y + amplitude * sin((t / period) * 2π + phase)
//
// `amplitude` is half the peak-to-peak swing in px. `period` is one full
// oscillation in ms. `phase` (rad) lets paired obstacles sit out-of-sync.
//
// Detected separately from static obstacles — the player can walk through
// (taking a hit + knockback) rather than being hard-blocked. See
// DecisionRoom's collision callback.
export interface MovingObstacle {
  baseRect: Rect;
  amplitude: number;
  period: number;
  phase: number;
}
