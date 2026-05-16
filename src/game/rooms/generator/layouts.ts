import type { MovingObstacle, Rect, Vector2 } from '../../types/geometry';
import { ROOM_VIEWBOX } from '../../coordinates';

// Room complexity tier (v2.0.9 — framework only). Drives the year → tier
// mix in `YEAR_TO_COMPLEXITY_MIX`. v1 ships with every existing template
// tagged `simple` (no moving obstacles, no physics challenges); harder
// tiers — `easy` (unmovable walls / maze patterns), `medium` (slow moving
// walls + collision push-back), `hard` (faster moving walls + paddle-style
// blockers), `expert` (deterministic sliding/zigzag obstacles) — get
// authored in follow-up PRs. See §4 *Complexity tiers* in the design doc.
export type ComplexityTier = 'simple' | 'easy' | 'medium' | 'hard' | 'expert';

// Ordered easier → harder so callers can degrade cleanly when no template
// is authored for a requested tier (see `eligibleTemplates`).
export const COMPLEXITY_TIERS: readonly ComplexityTier[] = [
  'simple', 'easy', 'medium', 'hard', 'expert',
] as const;

export interface LayoutTemplate {
  id: string;
  label: string;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
  // Required complexity tier. v2.0.9 ships every template as 'simple';
  // future PRs introduce easy/medium/hard/expert variants with moving
  // obstacles and physics. See §4.
  complexity: ComplexityTier;
  // Optional pack filter. Undefined = universal (eligible for every pack).
  // Listed = only that pack's rooms can roll this template. Matched by
  // `manifest.id` in `generateRoom`. See §4.
  packs?: readonly string[];
  // Optional vertically-oscillating obstacles (v2.0.18, §4 medium tier).
  // Detected separately from static `obstacles` — the player can walk
  // through but takes a knockback + health hit. See DecisionRoom's
  // moving-obstacle collision callback.
  movingObstacles?: readonly MovingObstacle[];
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
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
    complexity: 'simple',
    packs: ['homeschool-parent'],
  },
  {
    // Four vertical walls in a zigzag, each with a 60-px gap (PLAYER_RADIUS=14
    // so the gap is >2× player diameter). Gaps alternate center → top →
    // bottom → center to force the player to navigate up/down across the
    // canvas before reaching the door. Universal template — feels generic
    // enough that either pack can roll it.
    //
    // Path:  spawn(80,300) → east → wall-1 center gap (y=300) → up to
    //        y~110 → wall-2 top gap → down to y~490 → wall-3 bottom gap →
    //        up to y~300 → wall-4 center gap → east → door(950,300).
    //
    // Promoted simple → easy in v2.0.17 (PR3 of the §4 tier-ladder).
    id: 'maze',
    label: 'Maze',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      // Wall 1 — center gap (y=270..330)
      { x: 200, y: 0,   width: 60, height: 270 },
      { x: 200, y: 330, width: 60, height: 270 },
      // Wall 2 — top gap (y=80..140)
      { x: 400, y: 0,   width: 60, height: 80 },
      { x: 400, y: 140, width: 60, height: 460 },
      // Wall 3 — bottom gap (y=460..520)
      { x: 600, y: 0,   width: 60, height: 460 },
      { x: 600, y: 520, width: 60, height: 80 },
      // Wall 4 — center gap (y=270..330)
      { x: 800, y: 0,   width: 60, height: 270 },
      { x: 800, y: 330, width: 60, height: 270 },
    ],
    door: DEFAULT_DOOR,
    complexity: 'easy',
  },
  {
    // Two offset vertical walls in an S-pattern. First wall (x=300) extends
    // from y=200 to bottom, forcing the player up and over (gap: y=0..200).
    // Second wall (x=600) extends from top to y=400, forcing the player
    // down and under (gap: y=400..600). Player snakes UP → over → DOWN →
    // over → up to the door — three direction changes, no busy zigzag.
    // Lower cognitive load than `maze`; same family.
    //
    // Path:  spawn(80,300) → east, blocked by wall-1 → up to y<200 → east
    //        across y<200, blocked by wall-2 → down to y>400 → east across
    //        y>400 → past wall-2 (x>680) → north to door y=300.
    id: 's-curve',
    label: 'S-curve',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 300, y: 200, width: 80, height: 400 },  // wall 1: top gap (y=0..200)
      { x: 600, y: 0,   width: 80, height: 400 },  // wall 2: bottom gap (y=400..600)
    ],
    door: DEFAULT_DOOR,
    complexity: 'easy',
  },
  {
    // Two-wall maze-lite. Same family as `maze` but half the wall count and
    // larger gaps (200 px instead of 60), so it reads as a corridor twist
    // rather than a zigzag puzzle. Easy-tier sibling: gives the player
    // navigation work without filling the canvas.
    //
    // Path:  spawn(80,300) → east, blocked by wall-1 → south through bottom
    //        gap (y>400) → east, blocked by wall-2 → north through top gap
    //        (y<200) → east → south to door y=300.
    id: 'switchback',
    label: 'Switchback',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 350, y: 0,   width: 60, height: 400 },  // wall 1: bottom gap (y=400..600)
      { x: 650, y: 200, width: 60, height: 400 },  // wall 2: top gap (y=0..200)
    ],
    door: DEFAULT_DOOR,
    complexity: 'easy',
  },
  {
    // Single vertically-oscillating block in the middle of the canvas.
    // Wide swing (y=70..430) covers most of the room; player can sneak
    // around top or bottom when the block is at the opposite extreme, or
    // brute-force through and take a knockback + health hit. First medium
    // template — pure timing puzzle, no static-wall constraints.
    id: 'pendulum',
    label: 'Pendulum',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 470, y: 250, width: 60, height: 100 },
        amplitude: 180,
        period: 2400,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Two oscillating blocks at x=350 / x=650, phase-offset by π so when
    // one is at the top of its swing the other is at the bottom. Player
    // weaves between them; an unhurried player can always find a clear
    // window. Harder than `pendulum` because the second block punishes
    // hesitation past the first.
    id: 'shutters',
    label: 'Shutters',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 350, y: 250, width: 60, height: 100 },
        amplitude: 180,
        period: 2400,
        phase: 0,
      },
      {
        baseRect: { x: 650, y: 250, width: 60, height: 100 },
        amplitude: 180,
        period: 2400,
        phase: Math.PI,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Medium-tier (issue #94, batch 1 — v2.0.23 tuning pass): two static
    // walls form a single vertical gate at x=440..520 with a 200-px gap
    // (y=200..400). A larger paddle (h=80, amplitude 90) sweeps most of
    // the gap at period 3000 ms — matches the established medium tempo
    // (`pendulum` / `shutters` at 2400 ms). Clean pass exists only at
    // the paddle's extremes; player must commit to timing. v1 ship
    // (paddle h=40, amp 60, period 5000) read as easy. Composition:
    // static-gate + paddle.
    id: 'gate-paddle',
    label: 'Gate and paddle',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 440, y: 0,   width: 80, height: 200 },  // top wall
      { x: 440, y: 400, width: 80, height: 200 },  // bottom wall
    ],
    movingObstacles: [
      {
        baseRect: { x: 450, y: 260, width: 60, height: 80 },
        amplitude: 90,
        period: 3000,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Easy-tier (issue #94, batch 1 — v2.0.23 tuning pass, then
    // reclassified after playtest): reuses the easy-tier `s-curve` wall
    // geometry and adds TWO counter-direction patrols (upper corridor
    // y≈90 and lower corridor y≈480), period 2800 ms each. Originally
    // shipped as medium; playtest read it as easy because the s-curve's
    // 200-px corridor gaps leave generous clearance above the upper
    // patrol (y<90) and below the lower patrol (y>505), so the player
    // can route around the motion. Kept as a good easy-tier filler
    // (helps the +8 easy gap from issue #94's tier-gap table).
    // Composition: s-curve + patrol-pair-counter.
    id: 's-curve-patrol',
    label: 'S-curve patrol',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 300, y: 200, width: 80, height: 400 },  // wall 1: top gap (y=0..200)
      { x: 600, y: 0,   width: 80, height: 400 },  // wall 2: bottom gap (y=400..600)
    ],
    movingObstacles: [
      {
        baseRect: { x: 380, y: 90, width: 80, height: 25 },
        amplitude: 0,
        phase: 0,
        period: 2800,
        path: [
          { x: 380, y: 90 },
          { x: 600, y: 90 },
        ],
      },
      {
        baseRect: { x: 680, y: 480, width: 80, height: 25 },
        amplitude: 0,
        phase: 0,
        period: 2800,
        path: [
          { x: 680, y: 480 },
          { x: 380, y: 480 },
        ],
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'easy',
  },
  {
    // Medium-tier (issue #94, batch 1 — v2.0.23 tuning pass): reuses
    // the easy-tier `switchback` walls and adds TWO wide bar-paddles
    // spanning the full climb corridor (x=410..650) — one in the bottom
    // corridor and one in the top corridor, π-phase-offset so they
    // move in anti-correlation. Width 240 px prevents the v1 "route
    // around the narrow paddle" cheat. Period 2400 ms matches the
    // established medium tempo. v1 ship (single 20×80 paddle, period
    // 4500) read as simple-tier slow. Composition: switchback +
    // wide-bar-paddle-pair.
    id: 'switchback-paddle',
    label: 'Switchback paddle',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 350, y: 0,   width: 60, height: 400 },  // wall 1: bottom gap (y=400..600)
      { x: 650, y: 200, width: 60, height: 400 },  // wall 2: top gap (y=0..200)
    ],
    movingObstacles: [
      {
        baseRect: { x: 410, y: 460, width: 240, height: 40 },
        amplitude: 50,
        period: 2400,
        phase: 0,
      },
      {
        baseRect: { x: 410, y: 100, width: 240, height: 40 },
        amplitude: 50,
        period: 2400,
        phase: Math.PI,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Medium-tier (issue #94, batch 1 — v2.0.23 tuning pass): sentinel
    // tracing a rectangular orbit, FRAMED by top and bottom blocker
    // walls that force the player through the corridor (y=150..450)
    // where the orbit lives. Without the framing walls (v1 ship) the
    // player could route above or below the orbit and never engage with
    // it. Period 4000 ms = 1000 ms per segment — faster than v1's 6000
    // ms to match medium tempo. Composition: corridor-frame +
    // path-sentinel.
    id: 'slow-orbit',
    label: 'Corralled orbit',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 200, y: 0,   width: 600, height: 150 },  // top frame
      { x: 200, y: 450, width: 600, height: 150 },  // bottom frame
    ],
    movingObstacles: [
      {
        baseRect: { x: 320, y: 200, width: 40, height: 40 },
        amplitude: 0,
        phase: 0,
        period: 4000,
        path: [
          { x: 320, y: 200 },
          { x: 680, y: 200 },
          { x: 680, y: 400 },
          { x: 320, y: 400 },
        ],
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Medium-tier (issue #94, batch 1 — v2.0.23 tuning pass): top + bottom
    // frame walls compress the player into a center corridor (y=150..450),
    // then a center wall (x=470..530, y=220..380) splits the safe middle
    // and forces detour through one of the patrol bands. Two counter-
    // direction patrols at y=190 (top of corridor) and y=385 (bottom of
    // corridor) sweep x=280..720 at period 2800 ms. v1 ship (open room,
    // wide safe middle, period 5000) was a direct walk-through. Composition:
    // corridor-frame + center-wall + patrol-pair-counter.
    id: 'twin-patrols',
    label: 'Twin patrols',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 200, y: 0,   width: 600, height: 150 },  // top frame
      { x: 200, y: 450, width: 600, height: 150 },  // bottom frame
      { x: 470, y: 220, width: 60,  height: 160 },  // center wall splits safe middle
    ],
    movingObstacles: [
      {
        baseRect: { x: 280, y: 190, width: 80, height: 25 },
        amplitude: 0,
        phase: 0,
        period: 2800,
        path: [
          { x: 280, y: 190 },
          { x: 720, y: 190 },
        ],
      },
      {
        baseRect: { x: 720, y: 385, width: 80, height: 25 },
        amplitude: 0,
        phase: 0,
        period: 2800,
        path: [
          { x: 720, y: 385 },
          { x: 280, y: 385 },
        ],
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Medium-tier (issue #94, batch 1 — v2.0.23 tuning pass, then
    // amp #2 after playtest read "weak"): "half maze" (walls 1 + 4
    // from the easy-tier `maze`, both center-gap) + a WIDE bar-paddle
    // (540×40) spanning the entire middle (x=260..800) so the player
    // can't route around it at x≈300 or x≈700 the way the v2 narrow
    // 20-px paddle allowed. Amplitude 90, period 2800 ms (matching
    // switchback-paddle's tempo, which playtested as proper medium).
    // Player threads wall 1's center gap, faces the wide bar mid-room
    // and must time it, threads wall 4's center gap. Composition:
    // partial-maze + wide-bar-paddle. Same fix that made switchback-
    // paddle land at medium feel.
    id: 'maze-gauntlet',
    label: 'Maze gauntlet',
    spawn: DEFAULT_SPAWN,
    obstacles: [
      { x: 200, y: 0,   width: 60, height: 270 },  // wall 1 top half
      { x: 200, y: 330, width: 60, height: 270 },  // wall 1 bottom half
      { x: 800, y: 0,   width: 60, height: 270 },  // wall 4 top half
      { x: 800, y: 330, width: 60, height: 270 },  // wall 4 bottom half
    ],
    movingObstacles: [
      {
        baseRect: { x: 260, y: 280, width: 540, height: 40 },
        amplitude: 90,
        period: 2800,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'medium',
  },
  {
    // Hard-tier (PR5): same shape as `pendulum` but ~60% faster (period
    // 1500 vs 2400) and a slightly wider swing (amplitude 200 vs 180) so
    // both top + bottom passages compress. Showcases the "faster moving
    // obstacles" half of the §4 hard-tier spec.
    id: 'fast-pendulum',
    label: 'Fast pendulum',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 470, y: 250, width: 60, height: 100 },
        amplitude: 200,
        period: 1500,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'hard',
  },
  {
    // Hard-tier (PR5): pong-style paddle directly in front of the door.
    // 20×120 thin tall rect at x=880 (60 px gap from the door at x=950),
    // baseRect.y=240 + amplitude=220 sweeps y=20..460 — at the top extreme
    // (paddle bottom = 140) and bottom extreme (paddle top = 460) the
    // paddle is fully clear of the door's vertical range (y=250..350), so
    // the player must time their door approach to one of those windows.
    // Period 1500 ms gives ~250 ms of clear window at each extreme — wide
    // enough to slip through, tight enough to punish hesitation. Reuses
    // PR4's MovingObstacle machinery: mistimed approach reads as
    // collision → 200 ms slide + 800 ms stun → retry.
    id: 'paddle-gate',
    label: 'Paddle gate',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 880, y: 240, width: 20, height: 120 },
        amplitude: 220,
        period: 1500,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'hard',
  },
  {
    // Hard-tier (PR5, v2.0.21): five narrow vertical oscillators across
    // the room with mixed widths (10–30 px) and a 72° phase stagger so
    // the wave rolls L→R. Showcases the variable-width support — wider
    // blocks weren't *needed*, narrower blocks pack the room with more
    // moving hazards while keeping every gap > player diameter (28 px).
    // Spacing math: every wall-to-wall gap clears at least 100 px.
    id: 'pickets',
    label: 'Pickets',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      { baseRect: { x: 200, y: 240, width: 15, height: 120 }, amplitude: 180, period: 2200, phase: 0 },
      { baseRect: { x: 350, y: 240, width: 25, height: 120 }, amplitude: 180, period: 2200, phase: (2 * Math.PI) / 5 },
      { baseRect: { x: 500, y: 240, width: 10, height: 120 }, amplitude: 180, period: 2200, phase: (4 * Math.PI) / 5 },
      { baseRect: { x: 650, y: 240, width: 30, height: 120 }, amplitude: 180, period: 2200, phase: (6 * Math.PI) / 5 },
      { baseRect: { x: 800, y: 240, width: 20, height: 120 }, amplitude: 180, period: 2200, phase: (8 * Math.PI) / 5 },
    ],
    door: DEFAULT_DOOR,
    complexity: 'hard',
  },
  {
    // Hard-tier (PR5, v2.0.21): mixes the new horizontal axis with a
    // classic vertical pendulum so motion crosses the room on two
    // perpendicular axes — first hard template using axis: 'horizontal'.
    // Top sweeper: 80×30 bar travelling x=220..780 along y=200..230.
    // Middle pendulum: 25×100 oscillator y=150..450 at x=470. The two
    // hazard zones overlap spatially around the room center; player has
    // to time both passes.
    id: 'cross-traffic',
    label: 'Cross traffic',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 500, y: 200, width: 80, height: 30 },
        amplitude: 280,
        period: 2500,
        phase: 0,
        axis: 'horizontal',
      },
      {
        baseRect: { x: 470, y: 300, width: 25, height: 100 },
        amplitude: 150,
        period: 1800,
        phase: Math.PI,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'hard',
  },
  {
    // Expert-tier (PR6, v2.0.22): single deterministic 40×40 sentinel
    // tracing a bowtie loop through the 4 corners of the right half. All
    // 4 segments are meaningful traversals (2 horizontals + 2 diagonals)
    // so the loop never "teleports back" visibly. Period 8000 ms = 2 s
    // per segment — slow + readable per the §4 expert spec ("natural
    // safe zones exist"). Anywhere off the path (notably the middle
    // y-band x=500..900) is dead-air the player can pause in. NPCs
    // placed by the v2.0.22 left-half rule stay clear of the path.
    id: 'zigzag-sentinel',
    label: 'Zigzag sentinel',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 500, y: 100, width: 40, height: 40 },
        // unused when path is set — kept non-zero to satisfy the required-field shape.
        amplitude: 0,
        phase: 0,
        period: 8000,
        path: [
          { x: 500, y: 100 },
          { x: 900, y: 100 },
          { x: 500, y: 460 },
          { x: 900, y: 460 },
        ],
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'expert',
  },
  {
    // Expert-tier (PR6, v2.0.22): mixes motion modes per the §4 expert
    // spec ("medium/hard, plus a slow-moving deterministic block"). One
    // deterministic horizontal patrol (80×25 sliding x=500..880 at
    // y=280, period 4000 ms) + one sine paddle near the door (20×80,
    // baseRect.y=260, amplitude 180, period 1800 — sweeps y=80..440 so
    // at top/bottom extremes the paddle is fully clear of the door
    // range y=250..350). Periods are intentionally non-integer-ratio
    // (4000:1800 ≈ 2.22:1) so the combined hazard pattern doesn't
    // repeat — expert-tier demand on timing.
    id: 'patrol-and-paddle',
    label: 'Patrol & paddle',
    spawn: DEFAULT_SPAWN,
    obstacles: [],
    movingObstacles: [
      {
        baseRect: { x: 500, y: 280, width: 80, height: 25 },
        amplitude: 0,
        phase: 0,
        period: 4000,
        path: [
          { x: 500, y: 280 },
          { x: 880, y: 280 },
        ],
      },
      {
        baseRect: { x: 910, y: 260, width: 20, height: 80 },
        amplitude: 180,
        period: 1800,
        phase: 0,
      },
    ],
    door: DEFAULT_DOOR,
    complexity: 'expert',
  },
];

export function getLayoutById(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id);
}

// Year → complexity tier mix (v2.0.9). Each year names a weighted set of
// tiers; the room generator rolls one tier per room using the weights. The
// progression is "100% simple" in 2020 → "50% hard, 50% expert" by 2029.
// All weights in a year-row sum to 1.0; rows are kept sorted ascending by
// tier so reading them top-down feels like the difficulty curve.
//
// Until easy/medium/hard/expert templates ship in follow-up PRs, every
// roll degrades to 'simple' via the `eligibleTemplates` fallback below —
// so the game today plays identically. The mix data is the seam.
export interface ComplexityMixEntry {
  tier: ComplexityTier;
  weight: number;
}

export const YEAR_TO_COMPLEXITY_MIX: Record<number, ComplexityMixEntry[]> = {
  2020: [{ tier: 'simple', weight: 1.0 }],
  2021: [{ tier: 'simple', weight: 0.75 }, { tier: 'easy', weight: 0.25 }],
  2022: [{ tier: 'simple', weight: 0.5 },  { tier: 'easy', weight: 0.5 }],
  2023: [{ tier: 'easy',   weight: 0.5 },  { tier: 'medium', weight: 0.5 }],
  2024: [{ tier: 'easy',   weight: 0.5 },  { tier: 'medium', weight: 0.5 }],
  2025: [{ tier: 'easy',   weight: 0.5 },  { tier: 'medium', weight: 0.5 }],
  2026: [{ tier: 'easy',   weight: 0.2 },  { tier: 'medium', weight: 0.8 }],
  2027: [{ tier: 'medium', weight: 0.5 },  { tier: 'hard',   weight: 0.5 }],
  2028: [{ tier: 'medium', weight: 0.2 },  { tier: 'hard',   weight: 0.8 }],
  2029: [{ tier: 'hard',   weight: 0.5 },  { tier: 'expert', weight: 0.5 }],
};

// Default mix for any year not in the table — keep the game playable.
const DEFAULT_COMPLEXITY_MIX: ComplexityMixEntry[] = [
  { tier: 'simple', weight: 1.0 },
];

export function complexityMixForYear(year: number): ComplexityMixEntry[] {
  return YEAR_TO_COMPLEXITY_MIX[year] ?? DEFAULT_COMPLEXITY_MIX;
}

// Pick a complexity tier from a year's mix using the provided rng.
// Treats the weight list as a discrete distribution; the rng yields a
// number in [0, 1). Returns the LAST tier if the rng hits the upper
// boundary, defensively.
export function pickComplexityTier(year: number, rng: () => number): ComplexityTier {
  const mix = complexityMixForYear(year);
  const total = mix.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return 'simple';
  const target = rng() * total;
  let acc = 0;
  for (const entry of mix) {
    acc += entry.weight;
    if (target < acc) return entry.tier;
  }
  return mix[mix.length - 1].tier;
}

// Filter templates eligible for a given pack. `undefined` packs entries are
// universal; entries with `packs: [...]` only roll for matching pack ids.
// Returns at least the universal subset, so callers always have something
// to pick from even when a pack has no pack-specific entries authored.
//
// `complexity` (v2.0.9) optionally narrows to a tier. When provided and the
// tier has no eligible templates, falls back DOWN the difficulty ladder
// (expert → hard → medium → easy → simple). Stops at 'simple' which always
// has templates today. This keeps the game playable while harder tiers are
// being authored.
export function eligibleTemplates(
  packId: string,
  complexity?: ComplexityTier,
): readonly LayoutTemplate[] {
  const byPack = LAYOUT_TEMPLATES.filter(
    (t) => t.packs === undefined || t.packs.includes(packId),
  );
  if (!complexity) return byPack;
  // Try requested tier; if empty, walk down the ladder.
  const startIdx = COMPLEXITY_TIERS.indexOf(complexity);
  for (let i = startIdx; i >= 0; i--) {
    const tier = COMPLEXITY_TIERS[i];
    const filtered = byPack.filter((t) => t.complexity === tier);
    if (filtered.length > 0) return filtered;
  }
  // No template matches at any tier for this pack — return the unfiltered
  // pack pool so the caller still has something to render.
  return byPack;
}
