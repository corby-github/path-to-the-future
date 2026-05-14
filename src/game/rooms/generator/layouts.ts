import type { Rect, Vector2 } from '../../types/geometry';
import { ROOM_VIEWBOX } from '../../coordinates';

export interface LayoutTemplate {
  id: string;
  label: string;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
  // Optional pack filter. Undefined = universal (eligible for every pack).
  // Listed = only that pack's rooms can roll this template. Matched by
  // `manifest.id` in `generateRoom`. See §4.
  packs?: readonly string[];
}

const DEFAULT_DOOR: Rect = {
  // 10px from canvas right edge — matches the `↩ return to {month}` label
  // anchor position and creates left/right symmetry with the rewind door
  // (which is also 10px from the canvas left edge).
  x: ROOM_VIEWBOX.width - 10 - 40,
  y: ROOM_VIEWBOX.height / 2 - 50,
  width: 40,
  height: 100,
};

const DEFAULT_SPAWN: Vector2 = { x: 80, y: ROOM_VIEWBOX.height / 2 };

// All templates put the door on the right wall and spawn the player on the
// left at door-height. Visual variety comes from obstacle placement. Each
// template's obstacles leave a navigable path to the door.
//
// Pack filtering (`packs?`) follows the §3 pack philosophy: office-coded
// templates (cubicles, shared-desks, open-office) are SWE-only; classroom
// is homeschool-only; everywhere both people go (library, park, store,
// kitchen, church, living room) is universal.
export const LAYOUT_TEMPLATES: ReadonlyArray<LayoutTemplate> = [
  {
    id: 'open-office',
    label: 'Open office',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 450, y: 100, width: 100, height: 80 },
    ],
    door: DEFAULT_DOOR,
    packs: ['software-engineering'],
  },
  {
    id: 'shared-desks',
    label: 'Shared desks',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 400, y: 80, width: 200, height: 60 },     // desk
      { x: 760, y: 200, width: 60, height: 60 },     // shelf-top
      { x: 760, y: 340, width: 60, height: 100 },    // shelf-bottom
      { x: 160, y: 420, width: 240, height: 60 },    // table
    ],
    door: DEFAULT_DOOR,
    packs: ['software-engineering'],
  },
  {
    id: 'cubicles',
    label: 'Cubicles',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 250, y: 150, width: 130, height: 100 },   // top-left cubicle
      { x: 600, y: 150, width: 130, height: 100 },   // top-right cubicle
      { x: 250, y: 360, width: 130, height: 100 },   // bottom-left cubicle
      { x: 600, y: 360, width: 130, height: 100 },   // bottom-right cubicle
    ],
    door: DEFAULT_DOOR,
    packs: ['software-engineering'],
  },
  {
    id: 'library',
    label: 'Library',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 200, y: 100, width: 500, height: 60 },    // upper shelf
      { x: 200, y: 440, width: 500, height: 60 },    // lower shelf
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'divided',
    label: 'Divided',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 450, y: 50, width: 60, height: 220 },     // wall-top, gap from y:270
      { x: 450, y: 330, width: 60, height: 220 },    // wall-bottom, gap to y:330
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'park',
    label: 'Park',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 350, y: 200, width: 200, height: 50 },    // long park bench
      { x: 620, y: 380, width: 120, height: 120 },   // tree-blob (square stand-in)
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'grocery-store',
    label: 'Grocery store',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 280, y: 80,  width: 60, height: 200 },    // aisle 1 top
      { x: 280, y: 360, width: 60, height: 160 },    // aisle 1 bottom
      { x: 500, y: 80,  width: 60, height: 200 },    // aisle 2 top
      { x: 500, y: 360, width: 60, height: 160 },    // aisle 2 bottom
      { x: 720, y: 80,  width: 60, height: 200 },    // aisle 3 top
      { x: 720, y: 360, width: 60, height: 160 },    // aisle 3 bottom
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 150, y: 100, width: 300, height: 60 },    // top counter
      { x: 700, y: 100, width: 60,  height: 200 },   // right wall counter
      { x: 350, y: 380, width: 200, height: 80 },    // center island
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'living-room',
    label: 'Living room',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 200, y: 180, width: 220, height: 80 },    // couch
      { x: 280, y: 320, width: 100, height: 60 },    // coffee table
      { x: 700, y: 200, width: 60,  height: 200 },   // TV stand
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'church',
    label: 'Church',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      // Top row of 3 pews (gap below for center aisle)
      { x: 180, y: 130, width: 140, height: 40 },
      { x: 380, y: 130, width: 140, height: 40 },
      { x: 580, y: 130, width: 140, height: 40 },
      // Bottom row of 3 pews
      { x: 180, y: 430, width: 140, height: 40 },
      { x: 380, y: 430, width: 140, height: 40 },
      { x: 580, y: 430, width: 140, height: 40 },
      // Plants flanking the front (near altar / east end)
      { x: 820, y: 100, width: 40, height: 40 },
      { x: 820, y: 460, width: 40, height: 40 },
    ],
    door: DEFAULT_DOOR,
  },
  {
    id: 'classroom',
    label: 'Classroom',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 250, y: 180, width: 100, height: 80 },    // student desk top-left
      { x: 550, y: 180, width: 100, height: 80 },    // student desk top-right
      { x: 250, y: 400, width: 100, height: 80 },    // student desk bottom-left
      { x: 550, y: 400, width: 100, height: 80 },    // student desk bottom-right
      { x: 800, y: 100, width: 120, height: 60 },    // teacher's desk near front
    ],
    door: DEFAULT_DOOR,
    packs: ['homeschool-parent'],
  },
];

export function getLayoutById(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id);
}

// Filter templates eligible for a given pack. `undefined` packs entries are
// universal; entries with `packs: [...]` only roll for matching pack ids.
// Returns at least the universal subset, so callers always have something
// to pick from even when a pack has no pack-specific entries authored.
export function eligibleTemplates(packId: string): readonly LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(
    (t) => t.packs === undefined || t.packs.includes(packId),
  );
}
