import type { Vector2, Bounds, Rect } from '../types/geometry';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function circleIntersectsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function resolveMovement(
  current: Vector2,
  desired: Vector2,
  radius: number,
  obstacles: Rect[],
  bounds: Bounds,
): Vector2 {
  const minX = bounds.minX + radius;
  const maxX = bounds.maxX - radius;
  const minY = bounds.minY + radius;
  const maxY = bounds.maxY - radius;

  // Slide axis-by-axis so the player doesn't jam in corners — resolve X
  // first, then Y from the already-resolved X.
  const tryX = clamp(desired.x, minX, maxX);
  const hitsX = obstacles.some((o) => circleIntersectsRect(tryX, current.y, radius, o));
  const nextX = hitsX ? current.x : tryX;

  const tryY = clamp(desired.y, minY, maxY);
  const hitsY = obstacles.some((o) => circleIntersectsRect(nextX, tryY, radius, o));
  const nextY = hitsY ? current.y : tryY;

  return { x: nextX, y: nextY };
}
