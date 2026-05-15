import { useEffect, useRef, useState } from 'react';
import type { MovingObstacle, Rect } from '../types/geometry';
import { useGameLoop } from './useGameLoop';

// Moving-obstacle motion + animation for medium-tier rooms (v2.0.18, §4).
//
// Each obstacle oscillates vertically around `baseRect.y`. At elapsed time
// `t` ms since the room mounted, the current y is:
//
//   baseRect.y + amplitude * sin((t / period) * 2π + phase)
//
// `currentRectFor` is pure (testable). `useMovingObstacles` is a thin React
// wrapper that drives per-frame re-renders so the SVG follows the motion.

export function currentRectFor(mo: MovingObstacle, tMs: number): Rect {
  const omega = (tMs / mo.period) * Math.PI * 2 + mo.phase;
  const dy = Math.sin(omega) * mo.amplitude;
  return {
    x: mo.baseRect.x,
    y: mo.baseRect.y + dy,
    width: mo.baseRect.width,
    height: mo.baseRect.height,
  };
}

// Returns the current `Rect[]` for the given moving-obstacle list, updating
// once per animation frame while `active` is true. The hook is no-op when
// the input list is empty (most simple/easy templates) — no rAF subscribed.
export function useMovingObstacles(
  obstacles: readonly MovingObstacle[] | undefined,
  active: boolean,
): readonly Rect[] {
  const list = obstacles ?? EMPTY_LIST;
  const hasMotion = list.length > 0;

  // Mount-time clock anchor. `useState`'s lazy initializer is the
  // sanctioned spot for impure calls like `performance.now()` — refs flag
  // the same call as impure-during-render.
  const [startedAt, setStartedAt] = useState<number>(() => performance.now());
  // Re-anchor the clock when the obstacle list identity changes (room
  // remount). Skips the initial render via a ref so we don't double-anchor.
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    setStartedAt(performance.now());
  }, [list]);

  const [rects, setRects] = useState<readonly Rect[]>(() =>
    list.map((mo) => currentRectFor(mo, 0)),
  );

  useGameLoop((_delta) => {
    void _delta;
    const t = performance.now() - startedAt;
    setRects(list.map((mo) => currentRectFor(mo, t)));
  }, hasMotion && active);

  return rects;
}

const EMPTY_LIST: readonly MovingObstacle[] = [];
