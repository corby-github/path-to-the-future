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
