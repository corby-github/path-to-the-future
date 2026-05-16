import type { MovingObstacle, Rect, Vector2 } from '../../types/geometry';
import {
  LAYOUT_TEMPLATES,
  MONTH_SLOT_OVERRIDES,
  eligibleTemplates,
  getLayoutById,
  pickComplexityTier,
  type LayoutTemplate,
  type ComplexityTier,
} from './layouts';
import { seededRandom, pickFrom } from './seedRng';

export interface RoomLayout {
  templateId: string;
  // The complexity tier the generator picked. Surfaces in dev tooling and
  // drives downstream room behaviors (e.g. moving-obstacle collision +
  // side-effects in medium-tier rooms — see DecisionRoom).
  complexity: ComplexityTier;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
  // Vertically-oscillating obstacles for medium-tier rooms (v2.0.18, §4).
  // Empty / undefined for simple + easy + replay-only viewing.
  movingObstacles?: readonly MovingObstacle[];
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width
      && a.x + a.width > b.x
      && a.y < b.y + b.height
      && a.y + a.height > b.y;
}

// Trivial pathability check: no obstacle should overlap the door rect.
// Catches the "obstacle placed on top of the door" authoring mistake.
// Real pathfinding (spawn → door reachable through the obstacle field) is
// deferred until we add seeded variation within templates — at that point a
// flood-fill validation runs at generation time.
function assertDoorAccessible(layout: RoomLayout): void {
  if (!import.meta.env.DEV) return;
  for (const o of layout.obstacles) {
    if (rectsIntersect(o, layout.door)) {
      console.warn(
        `[room-generator] Template "${layout.templateId}" has an obstacle ` +
        `intersecting the door rect. This will likely produce an un-exitable room.`,
        { obstacle: o, door: layout.door },
      );
    }
  }
}

function toLayout(template: LayoutTemplate): RoomLayout {
  return {
    templateId: template.id,
    complexity: template.complexity,
    spawn: template.spawn,
    obstacles: template.obstacles,
    door: template.door,
    movingObstacles: template.movingObstacles,
  };
}

// `packId` filters the template pool to entries eligible for the active
// career pack (see `eligibleTemplates`). `year` (v2.0.9) drives the
// complexity-tier roll via `pickComplexityTier` — early years skew toward
// `simple`, late years toward `hard`/`expert`. A `forcedTemplateId`
// (DevPanel) is honored regardless of pack or tier — devs may want to
// preview any template in any run.
//
// `monthId` (v2.0.27) consults `MONTH_SLOT_OVERRIDES` for per-month
// anchor slots (currently: monthId=2 → `library` for the Feb 2020 calm
// intro). DevPanel's `forcedTemplateId` still wins over the override.
// Pack incompatibility (override names a template restricted to a
// different pack) falls back to the random pool with a dev warning.
export function generateRoom(
  seed: number,
  packId: string,
  year: number,
  monthId: number,
  forcedTemplateId?: string | null,
): RoomLayout {
  let layout: RoomLayout;
  if (forcedTemplateId) {
    const forced = getLayoutById(forcedTemplateId);
    layout = forced
      ? toLayout(forced)
      : toLayout(pickFrom(seededRandom(seed), eligibleTemplates(packId)));
  } else if (MONTH_SLOT_OVERRIDES[monthId]) {
    const slotId = MONTH_SLOT_OVERRIDES[monthId];
    const slotted = getLayoutById(slotId);
    const slotPackOk =
      slotted !== undefined &&
      (slotted.packs === undefined || slotted.packs.includes(packId));
    if (slotted && slotPackOk) {
      layout = toLayout(slotted);
    } else {
      if (import.meta.env.DEV) {
        console.warn(
          `[room-generator] MONTH_SLOT_OVERRIDES[${monthId}] = "${slotId}" ` +
          (slotted
            ? `restricts to packs ${JSON.stringify(slotted.packs)} (active: "${packId}")`
            : `does not match any template id`) +
          `; falling back to the random pool.`,
        );
      }
      const rng = seededRandom(seed);
      const complexity = pickComplexityTier(year, rng);
      const pool = eligibleTemplates(packId, complexity);
      layout = toLayout(pool.length > 0 ? pickFrom(rng, pool) : pickFrom(rng, LAYOUT_TEMPLATES));
    }
  } else {
    const rng = seededRandom(seed);
    // Roll the complexity tier first (year-driven), then narrow the pool
    // to that tier (with cascading fallback inside `eligibleTemplates`
    // when the tier has no authored templates yet).
    const complexity = pickComplexityTier(year, rng);
    const pool = eligibleTemplates(packId, complexity);
    // Defensive: if a pack id matches nothing (shouldn't happen — universals
    // are always present), fall back to the full pool so the room still
    // renders. Surfaces as a dev-mode warning.
    const picked = pool.length > 0
      ? pickFrom(rng, pool)
      : pickFrom(rng, LAYOUT_TEMPLATES);
    if (pool.length === 0 && import.meta.env.DEV) {
      console.warn(
        `[room-generator] No eligible templates for packId "${packId}" ` +
        `(tier "${complexity}"); falling back to the universal+all pool. ` +
        `Add at least one universal template (omit \`packs\`) or tag ` +
        `entries with this pack id.`,
      );
    }
    layout = toLayout(picked);
  }
  assertDoorAccessible(layout);
  return layout;
}
