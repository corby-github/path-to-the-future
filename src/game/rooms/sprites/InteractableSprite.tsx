import type { Palette } from '../../types/careerPack';

// Day 13b.2 — flat-color SVG sprites for the interactables system. Each art
// token maps to a small unique drawing. Palette-pure (no off-token colors)
// per §15. Bounding box stays inside ~52×80 so the existing proximity halo
// (INTERACTABLE_HALF_W/H = 28/36 in DecisionRoom) reads cleanly.
//
// The component returns an SVG <g> positioned at (x, y); the caller embeds
// it inside the room's main <svg>.

interface Props {
  art: string;
  kind: 'npc' | 'object';
  x: number;
  y: number;
  palette: Palette;
}

export function InteractableSprite({ art, kind, x, y, palette }: Props) {
  if (kind === 'npc') {
    switch (art) {
      case 'person-intern': return <NPCIntern x={x} y={y} palette={palette} />;
      case 'person-senior': return <NPCSenior x={x} y={y} palette={palette} />;
      case 'person-pm': return <NPCPm x={x} y={y} palette={palette} />;
      case 'person-designer': return <NPCDesigner x={x} y={y} palette={palette} />;
      case 'person-peer': return <NPCPeer x={x} y={y} palette={palette} />;
      case 'person-newhire': return <NPCNewhire x={x} y={y} palette={palette} />;
      case 'person-skip-level': return <NPCSkipLevel x={x} y={y} palette={palette} />;
      case 'kid-hazel': return <NPCKidHazel x={x} y={y} palette={palette} />;
      case 'kid-bram': return <NPCKidBram x={x} y={y} palette={palette} />;
      default: return <NPCDefault x={x} y={y} palette={palette} />;
    }
  }
  switch (art) {
    case 'coffee-machine': return <ObjCoffeeMachine x={x} y={y} palette={palette} />;
    case 'whiteboard': return <ObjWhiteboard x={x} y={y} palette={palette} />;
    case 'monitor': return <ObjMonitor x={x} y={y} palette={palette} />;
    case 'printer': return <ObjPrinter x={x} y={y} palette={palette} />;
    case 'plant': return <ObjPlant x={x} y={y} palette={palette} />;
    case 'calendar': return <ObjCalendar x={x} y={y} palette={palette} />;
    case 'stress-ball': return <ObjStressBall x={x} y={y} palette={palette} />;
    case 'water-cooler': return <ObjWaterCooler x={x} y={y} palette={palette} />;
    case 'locked-door': return <ObjLockedDoor x={x} y={y} palette={palette} />;
    case 'arcade-game': return <ObjArcadeGame x={x} y={y} palette={palette} />;
    case 'textbook-stack': return <ObjTextbookStack x={x} y={y} palette={palette} />;
    case 'art-bin': return <ObjArtBin x={x} y={y} palette={palette} />;
    case 'kitchen-table': return <ObjKitchenTable x={x} y={y} palette={palette} />;
    case 'fridge-drawing': return <ObjFridgeDrawing x={x} y={y} palette={palette} />;
    case 'couch-blanket': return <ObjCouchBlanket x={x} y={y} palette={palette} />;
    case 'coop-signup': return <ObjCoopSignup x={x} y={y} palette={palette} />;
    default: return <ObjDefault x={x} y={y} palette={palette} />;
  }
}

// ───────────────────────────── NPC shared ──────────────────────────────
//
// All NPCs share the same humanoid frame: rounded-rect body (36w × 48h)
// + circle head (r=14, centered above body). Differentiation is by small
// accessory: cup, glasses, clipboard, etc. — rendered after the base.

interface SpriteProps {
  x: number;
  y: number;
  palette: Palette;
}

function NPCBase({ x, y, palette, bodyHeight = 48, headRadius = 14 }: SpriteProps & { bodyHeight?: number; headRadius?: number }) {
  return (
    <>
      <rect
        x={x - 18}
        y={y - 8}
        width={36}
        height={bodyHeight}
        rx={6}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      <circle
        cx={x}
        cy={y - 22}
        r={headRadius}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
    </>
  );
}

function NPCDefault({ x, y, palette }: SpriteProps) {
  return <g><NPCBase x={x} y={y} palette={palette} /></g>;
}

// Eager. Holds a coffee cup.
function NPCIntern({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} />
      {/* Coffee cup at right hand */}
      <rect
        x={x + 18}
        y={y + 4}
        width={8}
        height={10}
        rx={1}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* Cup handle */}
      <path
        d={`M ${x + 26} ${y + 6} q 3 0 3 3 q 0 3 -3 3`}
        fill="none"
        stroke={palette.ink}
        strokeWidth={1.5}
      />
    </g>
  );
}

// Senior. Glasses.
function NPCSenior({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} />
      {/* Two small ink ellipses on the head as glasses */}
      <circle cx={x - 5} cy={y - 22} r={3.5} fill="none" stroke={palette.ink} strokeWidth={1.5} />
      <circle cx={x + 5} cy={y - 22} r={3.5} fill="none" stroke={palette.ink} strokeWidth={1.5} />
      <line x1={x - 1.5} y1={y - 22} x2={x + 1.5} y2={y - 22} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// PM. Clipboard.
function NPCPm({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} />
      {/* Clipboard held at right side */}
      <rect
        x={x + 14}
        y={y + 4}
        width={14}
        height={18}
        rx={1}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* Two writing lines on clipboard */}
      <line x1={x + 17} y1={y + 9} x2={x + 25} y2={y + 9} stroke={palette.ink} strokeWidth={1} />
      <line x1={x + 17} y1={y + 13} x2={x + 23} y2={y + 13} stroke={palette.ink} strokeWidth={1} />
      <line x1={x + 17} y1={y + 17} x2={x + 24} y2={y + 17} stroke={palette.ink} strokeWidth={1} />
    </g>
  );
}

// Designer. Has a tuft of hair (small filled arc on head).
function NPCDesigner({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} />
      {/* Hair tuft — small filled ink shape on top-left of head */}
      <path
        d={`M ${x - 11} ${y - 30} q 3 -8 13 -6 q 8 2 6 6 q -2 4 -10 4 z`}
        fill={palette.ink}
      />
    </g>
  );
}

// Peer. Subtle — small watch on the wrist.
function NPCPeer({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} />
      {/* Pocket protector — lighter rect on upper-left of torso, with a
          pen tip peeking out the top. Classic engineer signature. */}
      <rect
        x={x - 12}
        y={y - 4}
        width={8}
        height={10}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
      <line
        x1={x - 9}
        y1={y - 7}
        x2={x - 9}
        y2={y - 3}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
    </g>
  );
}

// New hire. Backpack visible behind.
function NPCNewhire({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Backpack drawn first so it sits behind the body */}
      <rect
        x={x - 24}
        y={y - 4}
        width={10}
        height={28}
        rx={3}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      <NPCBase x={x} y={y} palette={palette} />
    </g>
  );
}

// Skip-level. Slightly taller + bigger head + tie line for gravitas.
function NPCSkipLevel({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCBase x={x} y={y} palette={palette} bodyHeight={54} headRadius={16} />
      {/* Tie — narrow ink rectangle down the center of the body */}
      <rect
        x={x - 2}
        y={y - 4}
        width={4}
        height={28}
        fill={palette.ink}
      />
    </g>
  );
}

// ────────────────────────────── Objects ────────────────────────────────

// Coffee machine — tall body, pot below, button row.
function ObjCoffeeMachine({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 16}
        y={y - 24}
        width={32}
        height={36}
        rx={3}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Spout */}
      <rect x={x - 4} y={y - 6} width={8} height={4} fill={palette.ink} />
      {/* Carafe / pot below spout */}
      <rect
        x={x - 10}
        y={y - 2}
        width={20}
        height={18}
        rx={2}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* Button — small filled dot */}
      <circle cx={x + 9} cy={y - 18} r={1.5} fill={palette.ink} />
    </g>
  );
}

// Whiteboard — wide rectangle with horizontal squiggle hints.
function ObjWhiteboard({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 26}
        y={y - 18}
        width={52}
        height={36}
        rx={2}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Writing marks */}
      <line x1={x - 20} y1={y - 10} x2={x + 8} y2={y - 10} stroke={palette.ink} strokeWidth={1.5} />
      <line x1={x - 20} y1={y - 4} x2={x + 16} y2={y - 4} stroke={palette.ink} strokeWidth={1.5} />
      <line x1={x - 20} y1={y + 2} x2={x + 2} y2={y + 2} stroke={palette.ink} strokeWidth={1.5} />
      {/* A little circle-and-arrow — a stand-in for a system diagram */}
      <circle cx={x + 16} cy={y + 8} r={3} fill="none" stroke={palette.ink} strokeWidth={1.5} />
      <line x1={x + 8} y1={y + 8} x2={x + 13} y2={y + 8} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Monitor — screen on a stand.
function ObjMonitor({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 22}
        y={y - 20}
        width={44}
        height={30}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Screen inner */}
      <rect
        x={x - 18}
        y={y - 16}
        width={36}
        height={22}
        fill={palette.background}
        stroke="none"
      />
      {/* Stand */}
      <rect x={x - 3} y={y + 10} width={6} height={6} fill={palette.surface} stroke={palette.ink} strokeWidth={1.5} />
      <rect x={x - 12} y={y + 16} width={24} height={3} fill={palette.surface} stroke={palette.ink} strokeWidth={1.5} />
      {/* A hint of code on screen — three short ink lines */}
      <line x1={x - 14} y1={y - 10} x2={x - 4} y2={y - 10} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 14} y1={y - 6} x2={x + 6} y2={y - 6} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 14} y1={y - 2} x2={x - 2} y2={y - 2} stroke={palette.ink} strokeWidth={1} />
    </g>
  );
}

// Printer — wide block with paper slot and feed tray.
function ObjPrinter({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 24}
        y={y - 14}
        width={48}
        height={28}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Paper output slot */}
      <line x1={x - 18} y1={y - 4} x2={x + 18} y2={y - 4} stroke={palette.ink} strokeWidth={1.5} />
      {/* A sliver of paper sticking out */}
      <rect
        x={x - 8}
        y={y - 8}
        width={16}
        height={4}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Status light */}
      <circle cx={x + 18} cy={y - 10} r={1.5} fill={palette.ink} />
    </g>
  );
}

// Plant — terracotta pot + sage leaves.
function ObjPlant({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Pot — trapezoid via path */}
      <path
        d={`M ${x - 14} ${y + 4} L ${x + 14} ${y + 4} L ${x + 11} ${y + 22} L ${x - 11} ${y + 22} Z`}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Pot rim */}
      <rect x={x - 16} y={y} width={32} height={4} fill={palette.accent} stroke={palette.ink} strokeWidth={2} />
      {/* Leaves — overlapping rounded ellipses in palette.positive (sage) */}
      <ellipse cx={x - 7} cy={y - 8} rx={9} ry={11} fill={palette.positive} stroke={palette.ink} strokeWidth={1.5} />
      <ellipse cx={x + 7} cy={y - 10} rx={9} ry={11} fill={palette.positive} stroke={palette.ink} strokeWidth={1.5} />
      <ellipse cx={x} cy={y - 18} rx={8} ry={10} fill={palette.positive} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Calendar — rectangle with grid.
function ObjCalendar({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 18}
        y={y - 22}
        width={36}
        height={42}
        rx={2}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Header band */}
      <rect x={x - 18} y={y - 22} width={36} height={8} fill={palette.accent} stroke={palette.ink} strokeWidth={1.5} />
      {/* Grid lines */}
      {[0, 1, 2].map((row) => (
        <line
          key={`r${row}`}
          x1={x - 18}
          y1={y - 14 + row * 9 + 9}
          x2={x + 18}
          y2={y - 14 + row * 9 + 9}
          stroke={palette.ink}
          strokeWidth={1}
        />
      ))}
      {[0, 1, 2].map((col) => (
        <line
          key={`c${col}`}
          x1={x - 18 + (col + 1) * 9}
          y1={y - 14}
          x2={x - 18 + (col + 1) * 9}
          y2={y + 20}
          stroke={palette.ink}
          strokeWidth={1}
        />
      ))}
      {/* One circled day */}
      <circle cx={x + 4} cy={y + 1} r={3.5} fill="none" stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Stress ball — squished oval.
function ObjStressBall({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <ellipse
        cx={x}
        cy={y + 4}
        rx={18}
        ry={12}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Highlight crease — a small inner arc to hint at deformation */}
      <path
        d={`M ${x - 10} ${y + 1} q 10 -5 20 0`}
        fill="none"
        stroke={palette.ink}
        strokeWidth={1}
        opacity={0.5}
      />
    </g>
  );
}

// Water cooler — base with a jug on top.
function ObjWaterCooler({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Base unit */}
      <rect
        x={x - 13}
        y={y - 6}
        width={26}
        height={28}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Spigot */}
      <rect x={x - 3} y={y + 4} width={6} height={4} fill={palette.ink} />
      {/* Drip tray */}
      <line x1={x - 8} y1={y + 12} x2={x + 8} y2={y + 12} stroke={palette.ink} strokeWidth={1.5} />
      {/* Inverted jug on top — trapezoid */}
      <path
        d={`M ${x - 11} ${y - 6} L ${x + 11} ${y - 6} L ${x + 8} ${y - 22} L ${x - 8} ${y - 22} Z`}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Water-line hint inside the jug */}
      <line x1={x - 7} y1={y - 14} x2={x + 7} y2={y - 14} stroke={palette.ink} strokeWidth={1} opacity={0.4} />
    </g>
  );
}

// Arcade cabinet — upright body with a screen near the top, a joystick
// (ball-on-stick), and two round buttons below. Universal interactable
// per issue #31; the [E] press opens a menu of every minigame the
// current career pack supports. Footprint stays inside the ~52×80 spec
// the other sprites use, but the cabinet is a touch taller (body 60
// tall) since real arcade cabinets read as vertical.
function ObjArcadeGame({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Marquee / top band */}
      <rect
        x={x - 18}
        y={y - 32}
        width={36}
        height={8}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Cabinet body */}
      <rect
        x={x - 20}
        y={y - 24}
        width={40}
        height={52}
        rx={3}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Screen — bezel + dark inner */}
      <rect
        x={x - 14}
        y={y - 20}
        width={28}
        height={18}
        rx={1.5}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* A hint of pixel content on the screen — three short ink lines */}
      <line x1={x - 10} y1={y - 14} x2={x + 2} y2={y - 14} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 10} y1={y - 10} x2={x + 6} y2={y - 10} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 10} y1={y - 6} x2={x - 2} y2={y - 6} stroke={palette.ink} strokeWidth={1} />
      {/* Control deck — small recessed strip for the joystick + buttons */}
      <rect
        x={x - 16}
        y={y + 4}
        width={32}
        height={12}
        rx={1}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Joystick — shaft + ball on top */}
      <line
        x1={x - 8}
        y1={y + 14}
        x2={x - 8}
        y2={y + 6}
        stroke={palette.ink}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={x - 8}
        cy={y + 4}
        r={3}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* Two action buttons */}
      <circle cx={x + 2} cy={y + 10} r={2} fill={palette.ink} />
      <circle cx={x + 9} cy={y + 10} r={2} fill={palette.accent} stroke={palette.ink} strokeWidth={1} />
      {/* Coin slot */}
      <rect
        x={x - 4}
        y={y + 19}
        width={8}
        height={2}
        fill={palette.ink}
      />
    </g>
  );
}

function ObjDefault({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <rect
        x={x - 26}
        y={y - 26}
        width={52}
        height={52}
        rx={4}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
    </g>
  );
}

// Kid sprites for the homeschool pack. Same humanoid base as the adult
// NPCs but smaller (body 36h × 24w, head r=10) so the kids read as
// child-scale alongside adult interactables. Two variants:
// - Hazel: book held in front of the torso (age-flex; she's a reader
//   from month 1).
// - Bram: small backpack visible behind, plus a tousled-hair tuft so the
//   two kids are visually distinct at a glance.
function NPCKidBase({ x, y, palette }: SpriteProps) {
  return (
    <>
      <rect
        x={x - 12}
        y={y - 2}
        width={24}
        height={36}
        rx={5}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      <circle
        cx={x}
        cy={y - 14}
        r={10}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
    </>
  );
}

// Hazel — eldest, the reader. Book held in front of body.
function NPCKidHazel({ x, y, palette }: SpriteProps) {
  return (
    <g>
      <NPCKidBase x={x} y={y} palette={palette} />
      {/* Book — flat-bottom rectangle held against the torso */}
      <rect
        x={x - 9}
        y={y + 6}
        width={18}
        height={12}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      {/* Spine line down the middle of the book */}
      <line
        x1={x}
        y1={y + 6}
        x2={x}
        y2={y + 18}
        stroke={palette.ink}
        strokeWidth={1}
      />
    </g>
  );
}

// Bram — younger, backpack + hair tuft.
function NPCKidBram({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Backpack behind body */}
      <rect
        x={x - 17}
        y={y + 2}
        width={7}
        height={22}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      <NPCKidBase x={x} y={y} palette={palette} />
      {/* Hair tuft — small filled shape on top of head */}
      <path
        d={`M ${x - 7} ${y - 22} q 2 -5 8 -4 q 5 1 4 4 q -1 3 -6 3 z`}
        fill={palette.ink}
      />
    </g>
  );
}

// Textbook stack — three stacked books with visible spines. Used by the
// homeschool pack for the kitchen-table-as-school flavor. Treatment-A
// flat-color, palette-pure. Footprint ~40×40 so the stack reads as a
// chunky desk object next to the standard 52×80 sprite frame.
function ObjTextbookStack({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Bottom book — widest, accent color */}
      <rect
        x={x - 22}
        y={y + 6}
        width={44}
        height={10}
        rx={1}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Bottom book spine band */}
      <line
        x1={x - 22}
        y1={y + 13}
        x2={x + 22}
        y2={y + 13}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Middle book — slightly narrower, surface color */}
      <rect
        x={x - 19}
        y={y - 4}
        width={38}
        height={10}
        rx={1}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      <line
        x1={x - 19}
        y1={y + 3}
        x2={x + 19}
        y2={y + 3}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Top book — narrowest, positive (sage) color so the stack reads
          as three distinct volumes */}
      <rect
        x={x - 16}
        y={y - 14}
        width={32}
        height={10}
        rx={1}
        fill={palette.positive}
        stroke={palette.ink}
        strokeWidth={2}
      />
      <line
        x1={x - 16}
        y1={y - 7}
        x2={x + 16}
        y2={y - 7}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* A small bookmark / sticky note peeking out the top book's right edge */}
      <rect
        x={x + 8}
        y={y - 18}
        width={4}
        height={6}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
    </g>
  );
}

// ───────────────────── Homeschool object sprites ──────────────────────────
// Authored to replace SWE sprite tokens that were placeholder-reused per
// design doc §26 deferred follow-ups (stress-ball→art-bin, whiteboard→
// kitchen-table, calendar→fridge-drawing, plant→couch-blanket, monitor→
// coop-signup). Same palette-pure + ~52×80 bounding-box conventions.

// Art-supplies bin — trapezoidal container with paintbrushes/markers
// sticking out the top.
function ObjArtBin({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Bin body — trapezoid (wider at top) */}
      <path
        d={`M ${x - 18} ${y - 8} L ${x + 18} ${y - 8} L ${x + 15} ${y + 22} L ${x - 15} ${y + 22} Z`}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Bin rim */}
      <rect x={x - 20} y={y - 12} width={40} height={5} fill={palette.surface} stroke={palette.ink} strokeWidth={2} />
      {/* Paintbrush 1 — positive (sage) handle, ink ferrule, ink tip */}
      <rect x={x - 14} y={y - 24} width={6} height={14} fill={palette.positive} stroke={palette.ink} strokeWidth={1.5} />
      <path d={`M ${x - 14} ${y - 24} L ${x - 11} ${y - 30} L ${x - 8} ${y - 24} Z`} fill={palette.ink} stroke="none" />
      {/* Paintbrush 2 — surface handle */}
      <rect x={x - 4} y={y - 28} width={6} height={18} fill={palette.surface} stroke={palette.ink} strokeWidth={1.5} />
      <path d={`M ${x - 4} ${y - 28} L ${x - 1} ${y - 34} L ${x + 2} ${y - 28} Z`} fill={palette.ink} stroke="none" />
      {/* Paintbrush 3 — background (white-ish) marker */}
      <rect x={x + 6} y={y - 22} width={6} height={12} fill={palette.background} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Kitchen table — flat top + four legs (two visible from front) +
// a worksheet on top with pencil-scribble lines.
function ObjKitchenTable({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Worksheet on top of the table (drawn first so the table covers its bottom edge) */}
      <rect
        x={x - 12}
        y={y - 14}
        width={20}
        height={10}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
      <line x1={x - 9} y1={y - 11} x2={x + 5} y2={y - 11} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 9} y1={y - 8} x2={x + 2} y2={y - 8} stroke={palette.ink} strokeWidth={1} />
      {/* Tabletop */}
      <rect
        x={x - 24}
        y={y - 6}
        width={48}
        height={6}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Two visible front legs */}
      <rect x={x - 22} y={y} width={4} height={24} fill={palette.accent} stroke={palette.ink} strokeWidth={1.5} />
      <rect x={x + 18} y={y} width={4} height={24} fill={palette.accent} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Fridge with a kid drawing taped to the front. Tall body, freezer/main
// split, two handles, drawing in the middle of the main door.
function ObjFridgeDrawing({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Fridge body */}
      <rect
        x={x - 16}
        y={y - 32}
        width={32}
        height={56}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Freezer / main split */}
      <line x1={x - 16} y1={y - 18} x2={x + 16} y2={y - 18} stroke={palette.ink} strokeWidth={1.5} />
      {/* Freezer handle */}
      <line x1={x + 11} y1={y - 28} x2={x + 11} y2={y - 22} stroke={palette.ink} strokeWidth={2} />
      {/* Main handle */}
      <line x1={x + 11} y1={y - 14} x2={x + 11} y2={y - 6} stroke={palette.ink} strokeWidth={2} />
      {/* Drawing taped to the main door */}
      <rect
        x={x - 10}
        y={y - 10}
        width={16}
        height={14}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Stick figure on the drawing — head + body + arms */}
      <circle cx={x - 2} cy={y - 6} r={1.5} stroke={palette.ink} strokeWidth={1} fill="none" />
      <line x1={x - 2} y1={y - 4} x2={x - 2} y2={y + 1} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 5} y1={y - 2} x2={x + 1} y2={y - 2} stroke={palette.ink} strokeWidth={1} />
      {/* Magnet dot */}
      <circle cx={x - 2} cy={y - 10} r={1.2} fill={palette.ink} />
    </g>
  );
}

// Sick-day couch — low back + two rolled armrests + seat cushion + blanket
// draped over one side.
function ObjCouchBlanket({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Backrest */}
      <rect
        x={x - 22}
        y={y - 16}
        width={44}
        height={14}
        rx={3}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Left armrest */}
      <rect
        x={x - 26}
        y={y - 10}
        width={6}
        height={18}
        rx={2}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Right armrest */}
      <rect
        x={x + 20}
        y={y - 10}
        width={6}
        height={18}
        rx={2}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Seat cushion */}
      <rect
        x={x - 20}
        y={y - 4}
        width={40}
        height={12}
        rx={2}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Two short feet */}
      <rect x={x - 22} y={y + 8} width={4} height={4} fill={palette.ink} />
      <rect x={x + 18} y={y + 8} width={4} height={4} fill={palette.ink} />
      {/* Blanket draped over the right side */}
      <path
        d={`M ${x + 4} ${y - 4} L ${x + 24} ${y - 4} L ${x + 28} ${y + 12} L ${x + 8} ${y + 14} Z`}
        fill={palette.positive}
        stroke={palette.ink}
        strokeWidth={1.5}
      />
    </g>
  );
}

// Co-op sign-up clipboard — clip at top, paper with sign-up lines, one
// line with a signature mark.
function ObjCoopSignup({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Clipboard body */}
      <rect
        x={x - 14}
        y={y - 22}
        width={28}
        height={44}
        rx={2}
        fill={palette.accent}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Clip at top */}
      <rect
        x={x - 6}
        y={y - 26}
        width={12}
        height={6}
        rx={1}
        fill={palette.ink}
        stroke="none"
      />
      {/* Paper inside */}
      <rect
        x={x - 11}
        y={y - 18}
        width={22}
        height={36}
        fill={palette.background}
        stroke={palette.ink}
        strokeWidth={1}
      />
      {/* Five sign-up lines */}
      <line x1={x - 9} y1={y - 12} x2={x + 9} y2={y - 12} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 9} y1={y - 6} x2={x + 9} y2={y - 6} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 9} y1={y} x2={x + 9} y2={y} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 9} y1={y + 6} x2={x + 9} y2={y + 6} stroke={palette.ink} strokeWidth={1} />
      <line x1={x - 9} y1={y + 12} x2={x + 9} y2={y + 12} stroke={palette.ink} strokeWidth={1} />
      {/* Signature mark on the first line */}
      <line x1={x - 7} y1={y - 13} x2={x - 1} y2={y - 11} stroke={palette.ink} strokeWidth={1.5} />
    </g>
  );
}

// Locked door speaker icon for the finale month. Renders inside the
// NPCModal speaker column when the player tries the top-right door on
// month 120. Shape: a padlock — shackle above, square body below. Scaled
// to roughly match the NPC/object 52×80 footprint so it sits naturally
// in the icon-left layout without throwing off the dialog's vertical
// rhythm.
function ObjLockedDoor({ x, y, palette }: SpriteProps) {
  return (
    <g>
      {/* Shackle (the curved metal loop on top). */}
      <path
        d={`M ${x - 16} ${y - 6}
            V ${y - 22}
            a 16 16 0 0 1 32 0
            V ${y - 6}`}
        fill="none"
        stroke={palette.ink}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* Body. */}
      <rect
        x={x - 24}
        y={y - 6}
        width={48}
        height={40}
        rx={4}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      {/* Keyhole. */}
      <circle cx={x} cy={y + 8} r={4} fill={palette.ink} />
      <rect
        x={x - 1.5}
        y={y + 8}
        width={3}
        height={12}
        fill={palette.ink}
      />
    </g>
  );
}
