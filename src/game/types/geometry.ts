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

// Moving obstacle for medium / hard / expert-tier rooms (v2.0.18, §4).
// Two motion modes:
//
// 1. **Sine oscillation** (medium + hard). `baseRect` is the rest-position
//    rect; at time t (ms since mount), the active coordinate is:
//
//      baseRect.{axis} + amplitude * sin((t / period) * 2π + phase)
//
//    `amplitude` = half the peak-to-peak swing in px. `period` = one full
//    oscillation in ms. `phase` (rad) lets paired obstacles sit out-of-sync.
//    `axis` defaults to 'vertical' (back-compat with v2.0.18 templates);
//    'horizontal' swings along x instead.
//
// 2. **Deterministic path** (expert, v2.0.22). `path` is a closed loop
//    of absolute top-left positions the rect cycles through; `period` is
//    the total cycle time, split evenly across segments (linear interp
//    between adjacent waypoints, loops `path[N-1] → path[0]`). Slow,
//    predictable, natural safe zones exist anywhere off the path. When
//    `path` is set, the sine fields (`amplitude` / `phase` / `axis`) are
//    ignored and `baseRect.x/y` are seeded from `path[0]` for rendering.
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
  path?: readonly Vector2[];
}
