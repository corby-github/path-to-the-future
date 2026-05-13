import type { InteractableDef } from '../../types/careerPack';
import type { Vector2, Rect } from '../../types/geometry';
import type { RequiresContext } from '../../content/evaluateRequires';
import { passesRequires } from '../../content/evaluateRequires';
import { seededRandom } from './seedRng';

// Day 13b.1 — places 1-3 interactables per room from the career pack pool,
// avoiding the player spawn, the door, the room's obstacles, and other
// already-placed interactables. Seeded so the same room state yields the
// same arrangement.

export interface PlacedInteractable {
  def: InteractableDef;
  // Center position. For NPCs, this is also the center of their wander zone.
  spawn: Vector2;
}

// Logical area where interactables can land. Tighter than ROOM_BOUNDS so
// they don't hug the room edges.
const PLACEMENT_AREA = { minX: 150, maxX: 850, minY: 100, maxY: 500 };

// Approximate per-interactable bounding box used for non-overlap checks.
const HALF_W = 40;
const HALF_H = 50;

// Keep interactables clear of:
// - player spawn (so they aren't blocking the start)
// - door (so they aren't blocking the exit)
// - other interactables (so they don't visually merge)
const SPAWN_AVOID_RADIUS = 90;
const DOOR_AVOID_RADIUS = 90;
const INTERACTABLE_AVOID_GAP = 30; // px past each one's half-width

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function rectOverlaps(cx: number, cy: number, rect: Rect, padding = 6): boolean {
  return (
    cx + HALF_W + padding >= rect.x &&
    cx - HALF_W - padding <= rect.x + rect.width &&
    cy + HALF_H + padding >= rect.y &&
    cy - HALF_H - padding <= rect.y + rect.height
  );
}

function pickCount(rng: () => number): number {
  // Weighted toward 1-2 so rooms don't feel crowded; 3 is the rare upper bound.
  const r = rng();
  if (r < 0.4) return 1;
  if (r < 0.85) return 2;
  return 3;
}

function weightedPickIndex(rng: () => number, weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return 0;
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export interface PlaceArgs {
  seed: number;
  pool: readonly InteractableDef[];
  ctx: RequiresContext;
  spawn: Vector2;
  door: Rect;
  obstacles: readonly Rect[];
  // Optional dev-only forcing — if any of these ids exist in the pool and
  // pass requires, they're placed first and don't compete with the seeded
  // weighted selection. Used by the DevPanel "force arcade" toggle so
  // testers can land in a room with the arcade cabinet without wandering.
  forceIds?: readonly string[];
}

export function placeInteractables({
  seed,
  pool,
  ctx,
  spawn,
  door,
  obstacles,
  forceIds,
}: PlaceArgs): PlacedInteractable[] {
  const eligible = pool.filter((i) => passesRequires(i.requires, ctx));
  if (eligible.length === 0) return [];

  const rng = seededRandom(seed);
  const targetCount = Math.min(pickCount(rng), eligible.length);
  const placed: PlacedInteractable[] = [];
  const remaining = [...eligible];

  // Forced ids: pull them out of `remaining` and put them at the front of
  // the placement queue. Non-existent / requires-blocked ids are silently
  // ignored so the toggle is safe across packs that don't author the id.
  const forcedDefs: InteractableDef[] = [];
  if (forceIds && forceIds.length > 0) {
    for (const id of forceIds) {
      const idx = remaining.findIndex((d) => d.id === id);
      if (idx >= 0) {
        forcedDefs.push(remaining.splice(idx, 1)[0]);
      }
    }
  }

  const doorCx = door.x + door.width / 2;
  const doorCy = door.y + door.height / 2;

  // Effective slot count is the seeded target plus any forced defs that
  // are above the natural cap — the forced entries always get a slot.
  const slots = Math.max(targetCount, forcedDefs.length);

  for (let i = 0; i < slots; i++) {
    let def: InteractableDef | null = null;
    if (forcedDefs.length > 0) {
      def = forcedDefs.shift()!;
    } else if (remaining.length > 0) {
      const weights = remaining.map((d) => d.weight);
      const idx = weightedPickIndex(rng, weights);
      def = remaining.splice(idx, 1)[0];
    }
    if (!def) break;

    // Find a non-overlapping position. 40 attempts is plenty for a 1000×600
    // canvas with 1-3 items; we just skip the entry if it can't fit.
    let pos: Vector2 | null = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = PLACEMENT_AREA.minX + rng() * (PLACEMENT_AREA.maxX - PLACEMENT_AREA.minX);
      const y = PLACEMENT_AREA.minY + rng() * (PLACEMENT_AREA.maxY - PLACEMENT_AREA.minY);
      if (distance(x, y, spawn.x, spawn.y) < SPAWN_AVOID_RADIUS) continue;
      if (distance(x, y, doorCx, doorCy) < DOOR_AVOID_RADIUS) continue;
      if (obstacles.some((o) => rectOverlaps(x, y, o))) continue;
      if (
        placed.some(
          (p) => distance(x, y, p.spawn.x, p.spawn.y) < HALF_W * 2 + INTERACTABLE_AVOID_GAP,
        )
      ) {
        continue;
      }
      pos = { x, y };
      break;
    }
    if (pos) placed.push({ def, spawn: pos });
  }

  return placed;
}
