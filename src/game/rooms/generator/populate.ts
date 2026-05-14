import type { Rect, Vector2 } from '../../types/geometry';
import {
  LAYOUT_TEMPLATES,
  eligibleTemplates,
  getLayoutById,
  type LayoutTemplate,
} from './layouts';
import { seededRandom, pickFrom } from './seedRng';

export interface RoomLayout {
  templateId: string;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
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
    spawn: template.spawn,
    obstacles: template.obstacles,
    door: template.door,
  };
}

// `packId` filters the template pool to entries eligible for the active
// career pack (see `eligibleTemplates`). A `forcedTemplateId` (DevPanel) is
// honored regardless of pack — devs may want to preview a template the
// active pack normally wouldn't roll.
export function generateRoom(
  seed: number,
  packId: string,
  forcedTemplateId?: string | null,
): RoomLayout {
  let layout: RoomLayout;
  if (forcedTemplateId) {
    const forced = getLayoutById(forcedTemplateId);
    layout = forced
      ? toLayout(forced)
      : toLayout(pickFrom(seededRandom(seed), eligibleTemplates(packId)));
  } else {
    const rng = seededRandom(seed);
    const pool = eligibleTemplates(packId);
    // Defensive: if a pack id matches nothing (shouldn't happen — universals
    // are always present), fall back to the full pool so the room still
    // renders. Surfaces as a dev-mode warning.
    const picked = pool.length > 0
      ? pickFrom(rng, pool)
      : pickFrom(rng, LAYOUT_TEMPLATES);
    if (pool.length === 0 && import.meta.env.DEV) {
      console.warn(
        `[room-generator] No eligible templates for packId "${packId}"; ` +
        `falling back to the universal+all pool. Add at least one universal ` +
        `template (omit \`packs\`) or tag entries with this pack id.`,
      );
    }
    layout = toLayout(picked);
  }
  assertDoorAccessible(layout);
  return layout;
}
