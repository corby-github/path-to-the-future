import type { Rect, Vector2 } from '../../types/geometry';
import { ROOM_VIEWBOX } from '../../coordinates';

export interface LayoutTemplate {
  id: string;
  label: string;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
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
export const LAYOUT_TEMPLATES: ReadonlyArray<LayoutTemplate> = [
  {
    id: 'open-office',
    label: 'Open office',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 450, y: 100, width: 100, height: 80 },
    ],
    door: DEFAULT_DOOR,
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
];

export function getLayoutById(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id);
}
