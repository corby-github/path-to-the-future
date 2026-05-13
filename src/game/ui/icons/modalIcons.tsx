import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { Palette } from '../../types/careerPack';

// Modal icon components (v1.3+). A small palette-aware SVG square shown
// alongside a Decision or Event modal. The lookup tables that map a
// decision/event `id` → icon component live in `modalIconRegistryData.ts` —
// a sibling that holds only the registry data so this file can stay
// "components-only" (HMR / fast-refresh friendly). The public-facing
// `DecisionIcon` / `EventIcon` wrappers (also in this file) consult the
// registry and render either the registered component or the placeholder.
//
// Real SVG art is authored incrementally. Each new icon is a new component in
// this file, plus a one-line registry entry. The DecisionModal / EventModal
// never change when art swaps in.

import { DECISION_ICONS, EVENT_ICONS } from './modalIconRegistryData';

export interface ModalIconProps {
  palette: Palette;
  size?: number;
}

export type ModalIconComponent = (props: ModalIconProps) => ReactElement;

// Shared 80×80 frame that every real modal icon renders inside. Owns the
// bounding rect and the Treatment A drawing context: line-art bodies in
// `palette.ink`, rounded caps/joins, no fill by default. Each concrete icon
// passes its inner SVG as children — line-art shapes, filled accents
// (`fill={palette.ink} stroke="none"`), or letterform glyphs.
function IconFrame({
  palette,
  variant,
  label,
  size = 80,
  children,
}: {
  palette: Palette;
  variant: string;
  label: string;
  size?: number;
  children: ReactNode;
}): ReactElement {
  const wrapperStyle: CSSProperties = { display: 'block', flexShrink: 0 };
  return (
    <svg
      data-region="modal-icon"
      data-icon-variant={variant}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      style={wrapperStyle}
      role="img"
      aria-label={label}
    >
      <rect
        x={1}
        y={1}
        width={78}
        height={78}
        fill="none"
        stroke={palette.ink}
        strokeWidth={2}
      />
      <g
        stroke={palette.ink}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {children}
      </g>
    </svg>
  );
}

/**
 * Placeholder icon — a bounded square with a muted question mark inside.
 * Used as the fallback for any unregistered id. Real art swaps in by
 * replacing the registry entry.
 */
export function PlaceholderIcon({ palette, size = 80 }: ModalIconProps): ReactElement {
  const wrapperStyle: CSSProperties = {
    display: 'block',
    flexShrink: 0,
  };
  return (
    <svg
      data-region="modal-icon"
      data-icon-variant="placeholder"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      style={wrapperStyle}
      role="img"
      aria-label="Modal icon placeholder"
    >
      <rect
        x={1}
        y={1}
        width={78}
        height={78}
        fill="none"
        stroke={palette.ink}
        strokeWidth={2}
      />
      <text
        x={40}
        y={52}
        textAnchor="middle"
        fontFamily="inherit"
        fontSize={36}
        fontWeight={500}
        fill={palette.inkMuted}
      >
        ?
      </text>
    </svg>
  );
}

// ── Anchor batch ─────────────────────────────────────────────────────────
// Four icons establishing the Treatment A vocabulary:
//   • IconStayLate     — line-art body + filled-accent pivot
//   • IconStandupTooLong — repeated humanoid line-art + tiny filled dot
//   • IconPandemicFurlough — pure line-art + light texture
//   • IconLightbulbIdea — line-art body + inner detail + outer rays
// Author the rest of the registry once these read right at the modal size.

// Note: each icon below is a `function` declaration (not `export const … =`)
// so it gets hoisted within the module. modalIconRegistryData.ts imports
// these and runs at module-eval time via the circular import path; with
// `const`, the bindings are in the temporal dead zone when the registry
// initializes → ReferenceError. Function declarations sidestep that.

export function IconStayLate({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame
      palette={palette}
      variant="univ-stay-late-vs-log-off"
      label="Stay late or log off"
      size={size}
    >
      {/* Clock face */}
      <circle cx={40} cy={40} r={22} />
      {/* Hour hand toward 10 (evening), minute hand toward 6. */}
      <line x1={40} y1={40} x2={29} y2={34} />
      <line x1={40} y1={40} x2={40} y2={58} />
      {/* Quarter-hour tick marks */}
      <line x1={40} y1={20} x2={40} y2={22.5} />
      <line x1={60} y1={40} x2={57.5} y2={40} />
      <line x1={40} y1={60} x2={40} y2={57.5} />
      <line x1={20} y1={40} x2={22.5} y2={40} />
      {/* Center pivot — filled-accent dot */}
      <circle cx={40} cy={40} r={2.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconStandupTooLong({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame
      palette={palette}
      variant="univ-standup-too-long"
      label="Standup too long"
      size={size}
    >
      {/* Three line-art figures, faces forward. */}
      <circle cx={22} cy={30} r={5} />
      <path d="M 16 56 V 42 Q 16 38 22 38 Q 28 38 28 42 V 56" />
      <circle cx={40} cy={30} r={5} />
      <path d="M 34 56 V 42 Q 34 38 40 38 Q 46 38 46 42 V 56" />
      <circle cx={58} cy={30} r={5} />
      <path d="M 52 56 V 42 Q 52 38 58 38 Q 64 38 64 42 V 56" />
      {/* Speech ellipsis above the middle figure — "still going". */}
      <circle cx={36} cy={18} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={18} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={44} cy={18} r={1.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconPandemicFurlough({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame
      palette={palette}
      variant="evt-era-pandemic-furlough-friend"
      label="Pandemic furlough friend"
      size={size}
    >
      {/* Empty office chair — the colleague isn't in it.
          Backrest (rounded rectangle), seat (ellipse for slight 3/4 read),
          armrests, center pillar, and a five-leg star base. */}
      {/* Backrest */}
      <path d="M 28 16 Q 28 12 32 12 H 48 Q 52 12 52 16 V 40 H 28 Z" />
      {/* Seat */}
      <ellipse cx={40} cy={44} rx={18} ry={4} />
      {/* Armrests */}
      <path d="M 28 24 H 22 V 38" />
      <path d="M 52 24 H 58 V 38" />
      {/* Center pillar */}
      <line x1={40} y1={48} x2={40} y2={56} strokeWidth={3} />
      {/* Five-leg star base */}
      <line x1={40} y1={56} x2={22} y2={66} />
      <line x1={40} y1={56} x2={31} y2={68} />
      <line x1={40} y1={56} x2={40} y2={68} />
      <line x1={40} y1={56} x2={49} y2={68} />
      <line x1={40} y1={56} x2={58} y2={66} />
    </IconFrame>
  );
}

export function IconVideoCall({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-pandemic-zoom-fatigue" label="Pandemic zoom fatigue" size={size}>
      {/* 2×2 grid of distinct video tiles — each tile a bordered cell with
          a tiny person silhouette (head + shoulders). The visible gaps
          between cells are what made the previous "floating circles in a
          chromed window" version read as infinity symbols. */}
      {/* Top-left tile */}
      <rect x={14} y={16} width={24} height={24} rx={2} />
      <circle cx={26} cy={26} r={3} />
      <path d="M 20 38 Q 20 32 26 32 Q 32 32 32 38" />
      {/* Top-right tile */}
      <rect x={42} y={16} width={24} height={24} rx={2} />
      <circle cx={54} cy={26} r={3} />
      <path d="M 48 38 Q 48 32 54 32 Q 60 32 60 38" />
      {/* Bottom-left tile */}
      <rect x={14} y={44} width={24} height={24} rx={2} />
      <circle cx={26} cy={54} r={3} />
      <path d="M 20 66 Q 20 60 26 60 Q 32 60 32 66" />
      {/* Bottom-right tile */}
      <rect x={42} y={44} width={24} height={24} rx={2} />
      <circle cx={54} cy={54} r={3} />
      <path d="M 48 66 Q 48 60 54 60 Q 60 60 60 66" />
    </IconFrame>
  );
}

export function IconLightbulbIdea({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame
      palette={palette}
      variant="swe-2am-idea"
      label="2am idea"
      size={size}
    >
      {/* Bulb body — pear with cap */}
      <path d="M 40 18 Q 28 18 26 30 Q 26 38 33 42 V 48 H 47 V 42 Q 54 38 54 30 Q 52 18 40 18 Z" />
      {/* Filament — small X inside the bulb */}
      <path d="M 34 32 L 46 38 M 46 32 L 34 38" strokeWidth={1.5} />
      {/* Cap rings below */}
      <line x1={34} y1={52} x2={46} y2={52} strokeWidth={2} />
      <line x1={36} y1={56} x2={44} y2={56} strokeWidth={2} />
      {/* Light rays — short dashes around the bulb */}
      <line x1={18} y1={28} x2={22} y2={28} strokeWidth={1.5} />
      <line x1={58} y1={28} x2={62} y2={28} strokeWidth={1.5} />
      <line x1={22} y1={18} x2={26} y2={20} strokeWidth={1.5} />
      <line x1={58} y1={18} x2={54} y2={20} strokeWidth={1.5} />
      <line x1={40} y1={10} x2={40} y2={14} strokeWidth={1.5} />
    </IconFrame>
  );
}

// ── Universal decision icons ─────────────────────────────────────────────

export function IconRecruiterCall({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-recruiter-call" label="Recruiter call" size={size}>
      {/* ☎️ — vintage desk phone. Rectangular base with a rotary dial,
          horizontal handset resting on top via two short cradle posts. */}
      {/* Base */}
      <rect x={12} y={46} width={56} height={16} rx={3} />
      {/* Rotary dial */}
      <circle cx={40} cy={54} r={6} />
      <circle cx={40} cy={54} r={1.5} fill={palette.ink} stroke="none" />
      {/* Dial finger-holes — 5 small dots around the dial edge */}
      <circle cx={40} cy={50} r={0.9} fill={palette.ink} stroke="none" />
      <circle cx={44} cy={52} r={0.9} fill={palette.ink} stroke="none" />
      <circle cx={44} cy={56} r={0.9} fill={palette.ink} stroke="none" />
      <circle cx={36} cy={56} r={0.9} fill={palette.ink} stroke="none" />
      <circle cx={36} cy={52} r={0.9} fill={palette.ink} stroke="none" />
      {/* Cradle posts connecting base to handset */}
      <line x1={20} y1={46} x2={20} y2={42} strokeWidth={2} />
      <line x1={60} y1={46} x2={60} y2={42} strokeWidth={2} />
      {/* Handset resting horizontally on top — capsule with flared ends */}
      <path d="M 12 32 Q 12 24 20 24 Q 26 24 28 32 L 52 32 Q 54 24 60 24 Q 68 24 68 32 V 38 Q 68 42 60 42 Q 54 42 52 38 L 28 38 Q 26 42 20 42 Q 12 42 12 38 Z" />
    </IconFrame>
  );
}

export function IconDie({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-vegas-bonus-vs-rest" label="Vegas bonus or rest" size={size}>
      <rect x={20} y={20} width={40} height={40} rx={4} />
      <circle cx={30} cy={30} r={2.5} fill={palette.ink} stroke="none" />
      <circle cx={50} cy={30} r={2.5} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={40} r={2.5} fill={palette.ink} stroke="none" />
      <circle cx={30} cy={50} r={2.5} fill={palette.ink} stroke="none" />
      <circle cx={50} cy={50} r={2.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconScale({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-bury-vs-balance" label="Bury in work or balance" size={size}>
      <line x1={40} y1={22} x2={40} y2={58} />
      <line x1={20} y1={30} x2={60} y2={30} />
      <path d="M 20 30 L 14 42" />
      <path d="M 20 30 L 26 42" />
      <path d="M 12 42 Q 20 50 28 42" />
      <path d="M 60 30 L 54 42" />
      <path d="M 60 30 L 66 42" />
      <path d="M 52 42 Q 60 50 68 42" />
      <circle cx={40} cy={58} r={2.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconChatBubbleMoney({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-mlm-pitch" label="MLM pitch" size={size}>
      <path d="M 18 24 H 58 Q 64 24 64 30 V 44 Q 64 50 58 50 H 36 L 28 58 V 50 H 24 Q 18 50 18 44 Z" />
      <text x={41} y={45} textAnchor="middle" fontFamily="inherit" fontSize={20} fontWeight={700} fill={palette.ink} stroke="none">$</text>
    </IconFrame>
  );
}

export function IconDumbbell({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-gym-membership" label="Gym membership" size={size}>
      <line x1={26} y1={40} x2={54} y2={40} strokeWidth={4} />
      <rect x={14} y={30} width={8} height={20} fill={palette.ink} stroke="none" />
      <rect x={58} y={30} width={8} height={20} fill={palette.ink} stroke="none" />
      <line x1={14} y1={26} x2={14} y2={54} />
      <line x1={66} y1={26} x2={66} y2={54} />
    </IconFrame>
  );
}

export function IconHouse({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-buy-house-or-rent" label="Buy house or rent" size={size}>
      <path d="M 16 42 L 40 22 L 64 42" />
      <path d="M 22 42 V 62 H 58 V 42" />
      <rect x={36} y={48} width={8} height={14} />
      <rect x={26} y={47} width={6} height={6} />
    </IconFrame>
  );
}

export function IconRings({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-friends-wedding-far" label="Friend's wedding far" size={size}>
      <circle cx={30} cy={40} r={14} />
      <circle cx={50} cy={40} r={14} />
    </IconFrame>
  );
}

export function IconCouch({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-therapy-first-session" label="First therapy session" size={size}>
      {/* Classic 3-seat sofa, front view. Tall rounded backrest, two
          armrests flanking, seat with three cushion divisions, four
          short legs. Reads unambiguously as a couch (the prior chaise
          profile was reading as a piano). */}
      {/* Backrest */}
      <rect x={14} y={18} width={52} height={22} rx={4} />
      {/* Left armrest */}
      <rect x={10} y={30} width={10} height={24} rx={3} />
      {/* Right armrest */}
      <rect x={60} y={30} width={10} height={24} rx={3} />
      {/* Seat with cushions */}
      <rect x={18} y={40} width={44} height={16} rx={2} />
      {/* Cushion division lines */}
      <line x1={33} y1={40} x2={33} y2={56} strokeWidth={1.5} />
      <line x1={47} y1={40} x2={47} y2={56} strokeWidth={1.5} />
      {/* Four short legs */}
      <line x1={16} y1={56} x2={16} y2={62} strokeWidth={2} />
      <line x1={30} y1={56} x2={30} y2={62} strokeWidth={2} />
      <line x1={50} y1={56} x2={50} y2={62} strokeWidth={2} />
      <line x1={64} y1={56} x2={64} y2={62} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconPawPrint({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-dog" label="Get a dog" size={size}>
      <ellipse cx={40} cy={54} rx={14} ry={10} />
      <ellipse cx={22} cy={36} rx={5} ry={6} />
      <ellipse cx={34} cy={28} rx={5} ry={6} />
      <ellipse cx={46} cy={28} rx={5} ry={6} />
      <ellipse cx={58} cy={36} rx={5} ry={6} />
    </IconFrame>
  );
}

export function IconPalmTree({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-cash-out-pto" label="Cash out PTO" size={size}>
      {/* 🏝️ — curved palm trunk rising from the CENTER of the island
          (not from the top edge), gentle S-curve, drooping fronds at the
          crown. Reference: the island-palm emoji silhouette. */}
      {/* Island base */}
      <ellipse cx={40} cy={62} rx={24} ry={4} />
      {/* Trunk — single cubic bezier from inside the island, sweeping up
          and bending to the right. Strokewidth bumped for tree weight. */}
      <path d="M 40 64 C 40 50 54 42 50 22" strokeWidth={3} />
      {/* Trunk rings — short cross-hatches for palm-bark texture */}
      <line x1={42} y1={54} x2={46} y2={54} strokeWidth={1.5} />
      <line x1={46} y1={42} x2={50} y2={42} strokeWidth={1.5} />
      <line x1={49} y1={32} x2={53} y2={32} strokeWidth={1.5} />
      {/* Drooping fronds radiating from the crown at (50, 22) */}
      <path d="M 50 22 Q 60 12 70 14" />
      <path d="M 50 22 Q 56 8 64 6" />
      <path d="M 50 22 Q 46 8 40 8" />
      <path d="M 50 22 Q 38 14 28 14" />
      <path d="M 50 22 Q 36 24 24 32" />
      <path d="M 50 22 Q 60 24 68 30" />
      {/* Coconut */}
      <circle cx={52} cy={24} r={2} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconHeartHands({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-charity-donation" label="Charity donation" size={size}>
      {/* Heart with a $ inside — donation glyph, stripped of the hands
          that were over-engineered and unclear. */}
      <path d="M 40 18 Q 28 6 16 18 Q 4 36 40 64 Q 76 36 64 18 Q 52 6 40 18 Z" />
      <text
        x={40}
        y={48}
        textAnchor="middle"
        fontFamily="inherit"
        fontSize={28}
        fontWeight={700}
        fill={palette.ink}
        stroke="none"
      >
        $
      </text>
    </IconFrame>
  );
}

export function IconPhoneCross({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-parent-needs-help" label="Parent needs help" size={size}>
      <rect x={28} y={16} width={24} height={48} rx={3} />
      <line x1={28} y1={24} x2={52} y2={24} />
      <line x1={28} y1={56} x2={52} y2={56} />
      <path d="M 37 34 H 43 V 38 H 47 V 44 H 43 V 48 H 37 V 44 H 33 V 38 H 37 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconSuitcase({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-move-cities-for-job" label="Move cities for job" size={size}>
      <rect x={18} y={32} width={44} height={28} rx={3} />
      <path d="M 32 32 V 26 Q 32 22 36 22 H 44 Q 48 22 48 26 V 32" />
      <line x1={38} y1={42} x2={42} y2={42} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconCar({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-buy-car" label="Buy a car" size={size}>
      <rect x={14} y={40} width={52} height={14} rx={3} />
      <path d="M 22 40 L 28 30 H 52 L 58 40" />
      <circle cx={24} cy={54} r={6} fill={palette.ink} stroke="none" />
      <circle cx={56} cy={54} r={6} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconLaptopSpark({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-side-project" label="Side project" size={size}>
      <rect x={20} y={24} width={40} height={26} rx={2} />
      <path d="M 14 50 H 66 L 60 58 H 20 Z" />
      <path d="M 40 30 L 42 36 L 48 38 L 42 40 L 40 46 L 38 40 L 32 38 L 38 36 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconDoorKey({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-roommate-buyout" label="Roommate buyout" size={size}>
      {/* Door on the left + a clearly-drawn key on the right.
          Key has a large round bow with a visible hole, a thick straight
          shaft, and two perpendicular teeth at the bit end. */}
      {/* Door */}
      <rect x={14} y={14} width={24} height={52} rx={1} />
      <circle cx={32} cy={40} r={2} fill={palette.ink} stroke="none" />
      {/* Key bow (round head) with hole */}
      <circle cx={54} cy={22} r={8} strokeWidth={3} />
      <circle cx={54} cy={22} r={3} />
      {/* Key shaft */}
      <line x1={54} y1={30} x2={54} y2={62} strokeWidth={3} />
      {/* Key teeth (bit end) */}
      <line x1={54} y1={52} x2={62} y2={52} strokeWidth={3} />
      <line x1={54} y1={60} x2={64} y2={60} strokeWidth={3} />
    </IconFrame>
  );
}

export function IconPhoneHeart({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-date-app-match" label="Date app match" size={size}>
      <rect x={28} y={16} width={24} height={48} rx={3} />
      <line x1={28} y1={24} x2={52} y2={24} />
      <line x1={28} y1={56} x2={52} y2={56} />
      <path d="M 40 34 Q 36 30 32 34 Q 30 38 40 46 Q 50 38 48 34 Q 44 30 40 34 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

// ── SWE specifics ────────────────────────────────────────────────────────

export function IconCodeBrackets({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-framework-rewrite-vs-patch" label="Framework rewrite vs patch" size={size}>
      <polyline points="22,28 12,40 22,52" strokeWidth={3} />
      <polyline points="58,28 68,40 58,52" strokeWidth={3} />
      <line x1={48} y1={22} x2={32} y2={58} strokeWidth={3} />
    </IconFrame>
  );
}

export function IconPager({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-oncall-volunteer" label="Oncall volunteer" size={size}>
      {/* Smartphone in portrait orientation with an alert badge in the
          upper-right corner + buzz waves on the right edge. Pagers were
          retired with the cell-phone era; on-call now lands on a phone.
          Function name kept (IconPager) to avoid the import-cascade
          rework; only the SVG changed. */}
      {/* Phone body */}
      <rect x={26} y={12} width={28} height={56} rx={4} />
      {/* Top speaker slot */}
      <line x1={34} y1={17} x2={46} y2={17} strokeWidth={1.5} />
      {/* Screen */}
      <rect x={28} y={22} width={24} height={36} />
      {/* Home indicator at bottom */}
      <line x1={36} y1={63} x2={44} y2={63} strokeWidth={1.5} />
      {/* Buzz waves on the right edge — phone vibrating */}
      <path d="M 60 32 Q 66 36 60 40" strokeWidth={2} />
      <path d="M 64 26 Q 72 36 64 46" strokeWidth={2} />
    </IconFrame>
  );
}

export function IconMicrophone({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-conference-talk-cfp" label="Conference talk CFP" size={size}>
      <rect x={32} y={16} width={16} height={28} rx={8} />
      <path d="M 24 38 Q 24 52 40 52 Q 56 52 56 38" />
      <line x1={40} y1={52} x2={40} y2={62} />
      <line x1={30} y1={62} x2={50} y2={62} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconRocket({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-friday-deploy" label="Friday deploy" size={size}>
      {/* Rocket body — bullet silhouette, rounded nose. */}
      <path d="M 40 12 Q 32 24 32 38 V 50 H 48 V 38 Q 48 24 40 12 Z" />
      {/* Porthole window */}
      <circle cx={40} cy={30} r={4} />
      {/* Fins — line-art triangles outside the body */}
      <path d="M 32 44 L 22 56 L 32 52 Z" />
      <path d="M 48 44 L 58 56 L 48 52 Z" />
      {/* Exhaust flame — filled accent below the body */}
      <path d="M 36 50 Q 36 62 40 66 Q 44 62 44 50" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconMentorJunior({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-mentor-junior" label="Mentor a junior" size={size}>
      {/* Mentor (left, larger figure) */}
      <circle cx={22} cy={26} r={6} />
      <path d="M 14 58 V 42 Q 14 36 22 36 Q 30 36 30 42 V 58" />
      {/* Junior (right, smaller and shorter) */}
      <circle cx={56} cy={32} r={5} />
      <path d="M 49 58 V 44 Q 49 39 56 39 Q 63 39 63 44 V 58" />
      {/* Knowledge spark — small filled 4-point star passing between them */}
      <path d="M 40 40 L 41 44 L 45 45 L 41 46 L 40 50 L 39 46 L 35 45 L 39 44 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconHackathon({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-hackathon-weekend" label="Hackathon weekend" size={size}>
      {/* Laptop screen */}
      <rect x={18} y={26} width={38} height={24} rx={2} />
      {/* Laptop base */}
      <path d="M 12 50 H 62 L 56 58 H 18 Z" />
      {/* Lightning bolt on the screen — "hack speed" energy */}
      <path d="M 40 30 L 32 42 H 38 L 36 48 L 44 38 H 38 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconPandemicClose({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-pandemic-close" label="Pandemic close" size={size}>
      {/* Calendar body */}
      <rect x={14} y={18} width={52} height={46} rx={2} />
      {/* Header band separator */}
      <line x1={14} y1={26} x2={66} y2={26} strokeWidth={2} />
      {/* Hanger tabs */}
      <line x1={26} y1={14} x2={26} y2={22} strokeWidth={2} />
      <line x1={54} y1={14} x2={54} y2={22} strokeWidth={2} />
      {/* Grid — three rows of three cells (rough month layout) */}
      <line x1={14} y1={36} x2={66} y2={36} strokeWidth={1.5} />
      <line x1={14} y1={46} x2={66} y2={46} strokeWidth={1.5} />
      <line x1={14} y1={56} x2={66} y2={56} strokeWidth={1.5} />
      <line x1={27} y1={26} x2={27} y2={64} strokeWidth={1.5} />
      <line x1={40} y1={26} x2={40} y2={64} strokeWidth={1.5} />
      <line x1={53} y1={26} x2={53} y2={64} strokeWidth={1.5} />
      {/* Big X — pandemic shuts the calendar down */}
      <line x1={20} y1={32} x2={60} y2={60} strokeWidth={4} />
      <line x1={60} y1={32} x2={20} y2={60} strokeWidth={4} />
    </IconFrame>
  );
}

// ── Finale ───────────────────────────────────────────────────────────────

export function IconThresholdDoor({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="finale-month-120" label="The closing door" size={size}>
      {/* Door frame — plain rectangle (was an arch). Door panel inside
          swings outward (ajar), hinged on the LEFT, so the right edge of
          the panel is offset and you can see through the opening. An
          arrow exits through that opening to the right. */}
      {/* Door frame */}
      <rect x={14} y={14} width={36} height={52} />
      {/* Door panel — ajar, opening outward. Hinge at x=14. Right edge of
          the panel pulled in toward the hinge so a clear gap shows. */}
      <path d="M 14 18 L 38 22 L 38 58 L 14 62" />
      {/* Door knob on the panel */}
      <circle cx={34} cy={40} r={1.8} fill={palette.ink} stroke="none" />
      {/* Exit arrow passing through the open gap */}
      <line x1={50} y1={40} x2={68} y2={40} strokeWidth={3} />
      <path d="M 64 36 L 68 40 L 64 44" strokeWidth={3} />
    </IconFrame>
  );
}

// ── Minigame icons ───────────────────────────────────────────────────────
// Exported as components; not registered in DECISION_ICONS / EVENT_ICONS.
// Consumer (MinigameReplayCard or a future registry) imports them directly.

export function IconCards({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="blackjack" label="Blackjack" size={size}>
      {/* Two playing cards fanned. Spade card is rendered FIRST (back),
          heart card SECOND with a background-fill rect so it visibly
          occludes the spade where they overlap — heart card reads as
          "on top of" the spade card, not "transparent next to" it. */}
      {/* Back card: spade (right, tilted +10°) */}
      <g transform="rotate(10 50 42)">
        <rect x={37} y={22} width={26} height={38} rx={3} />
        {/* Spade — inverted teardrop with stem */}
        <path d="M 50 30 Q 58 38 58 44 Q 58 48 54 48 Q 52 48 50 46 Q 48 48 46 48 Q 42 48 42 44 Q 42 38 50 30 Z" fill={palette.ink} stroke="none" />
        <path d="M 48 50 Q 50 46 52 50 Q 52 52 50 52 Q 48 52 48 50 Z" fill={palette.ink} stroke="none" />
      </g>
      {/* Front card: heart (left, tilted -10°). Background fill on the
          rect occludes the spade card behind it where they overlap. */}
      <g transform="rotate(-10 30 42)">
        <rect x={17} y={22} width={26} height={38} rx={3} fill={palette.background} />
        {/* Heart */}
        <path d="M 30 32 Q 26 28 22 32 Q 20 38 30 46 Q 40 38 38 32 Q 34 28 30 32 Z" fill={palette.ink} stroke="none" />
      </g>
    </IconFrame>
  );
}

export function IconCheckmark({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="code-review" label="Code review" size={size}>
      <line x1={18} y1={26} x2={44} y2={26} strokeWidth={2} />
      <line x1={18} y1={36} x2={36} y2={36} strokeWidth={2} />
      <line x1={18} y1={46} x2={42} y2={46} strokeWidth={2} />
      <line x1={18} y1={56} x2={32} y2={56} strokeWidth={2} />
      <path d="M 48 42 L 56 50 L 68 32" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconLightning({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="reaction-sprint" label="Reaction sprint" size={size}>
      <path d="M 44 12 L 24 42 H 38 L 32 68 L 56 36 H 42 Z" />
    </IconFrame>
  );
}

export function IconPaddles({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="pong" label="Pong" size={size}>
      <rect x={16} y={28} width={4} height={24} fill={palette.ink} stroke="none" />
      <rect x={60} y={28} width={4} height={24} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={40} r={4} fill={palette.ink} stroke="none" />
      <line x1={40} y1={18} x2={40} y2={26} strokeWidth={1.5} opacity={0.5} />
      <line x1={40} y1={36} x2={40} y2={44} strokeWidth={1.5} opacity={0.5} />
      <line x1={40} y1={54} x2={40} y2={62} strokeWidth={1.5} opacity={0.5} />
    </IconFrame>
  );
}

export function IconFortyTwo({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="forty-two" label="The Ultimate Question" size={size}>
      {/* Deep Thought (2005 Hitchhiker's Guide film silhouette) — wedge-
          shaped CRT-monitor "head" tilted forward, mounted on a tripod
          A-frame stand. Avoids the "42" glyph that would spoil the
          minigame punchline if the icon shows pre-play. */}
      {/* Head — trapezoidal monitor, top edge wider than bottom, tilted */}
      <path
        d="M 14 10 L 64 8 L 62 40 L 16 42 Z"
        fill={palette.ink}
        stroke="none"
      />
      {/* Small screen-glint accent (kept palette.background to read as a
          highlight on the dark face) */}
      <line x1={22} y1={22} x2={32} y2={24} stroke={palette.background} strokeWidth={1.5} />
      {/* Neck — narrowing wedge connecting head to stand */}
      <path
        d="M 28 42 L 52 42 L 48 50 L 32 50 Z"
        fill={palette.ink}
        stroke="none"
      />
      {/* Tripod legs — A-frame */}
      <line x1={32} y1={50} x2={14} y2={68} strokeWidth={4} />
      <line x1={48} y1={50} x2={66} y2={68} strokeWidth={4} />
      {/* Cross-brace stabilizer */}
      <line x1={22} y1={60} x2={58} y2={60} strokeWidth={3} />
    </IconFrame>
  );
}

// ── Era event icons ──────────────────────────────────────────────────────

export function IconUpwardArrow({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-rebound-promo-wave" label="Rebound promo wave" size={size}>
      {/* Ascending staircase — three stair treads climbing left to right,
          with a bold up-arrow rising past the top step. Reads as
          "leveling up / promo ladder," matching the "promo wave" event. */}
      {/* Staircase outline (stepped polyline) */}
      <polyline
        points="12,64 12,52 30,52 30,40 48,40 48,28 66,28 66,64 12,64"
        strokeWidth={2.5}
      />
      {/* Bold up-arrow rising past the top step */}
      <line x1={58} y1={20} x2={58} y2={6} strokeWidth={4} />
      <path d="M 52 12 L 58 6 L 64 12" strokeWidth={4} />
    </IconFrame>
  );
}

export function IconSparkle({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-ai-shift-junior-anxiety" label="AI shift" size={size}>
      {/* Main 4-point star */}
      <path d="M 40 14 L 44 36 L 64 40 L 44 44 L 40 66 L 36 44 L 16 40 L 36 36 Z" />
      {/* Small twinkles */}
      <path d="M 22 22 L 23 26 L 27 27 L 23 28 L 22 32 L 21 28 L 17 27 L 21 26 Z" fill={palette.ink} stroke="none" />
      <path d="M 58 56 L 59 60 L 63 61 L 59 62 L 58 66 L 57 62 L 53 61 L 57 60 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconHourglass({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-uncertain-decade-mark" label="Decade mark" size={size}>
      <path d="M 24 16 H 56 L 44 38 L 56 60 H 24 L 36 38 Z" />
      <line x1={24} y1={16} x2={56} y2={16} strokeWidth={2.5} />
      <line x1={24} y1={60} x2={56} y2={60} strokeWidth={2.5} />
      <circle cx={40} cy={36} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={42} r={1.5} fill={palette.ink} stroke="none" />
      <path d="M 32 58 Q 40 52 48 58" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

// ── Stat-trigger event icons ─────────────────────────────────────────────

export function IconBurnoutFlame({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-stat-burnout-doctor" label="Burnout — see the doctor" size={size}>
      <path d="M 40 14 Q 50 26 52 38 Q 52 52 40 60 Q 28 52 28 40 Q 30 30 40 14 Z" />
      <path d="M 40 36 Q 44 42 43 50 Q 43 56 40 56 Q 37 56 37 50 Q 36 42 40 36 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconThermometer({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-stat-low-health-cold" label="Low health — cold" size={size}>
      <circle cx={40} cy={56} r={8} fill={palette.ink} stroke={palette.ink} />
      <rect x={36} y={22} width={8} height={36} />
      <rect x={37.5} y={28} width={5} height={26} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={20} r={4} />
      <line x1={46} y1={30} x2={50} y2={30} strokeWidth={1.5} />
      <line x1={46} y1={38} x2={50} y2={38} strokeWidth={1.5} />
      <line x1={46} y1={46} x2={50} y2={46} strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconNetwork({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-stat-high-network-intro" label="High network — intro" size={size}>
      <line x1={40} y1={22} x2={22} y2={50} />
      <line x1={40} y1={22} x2={58} y2={50} />
      <line x1={22} y1={50} x2={58} y2={50} />
      <circle cx={40} cy={22} r={6} fill={palette.ink} stroke="none" />
      <circle cx={22} cy={50} r={6} fill={palette.ink} stroke="none" />
      <circle cx={58} cy={50} r={6} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconCreditCard({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-stat-low-savings-card" label="Low savings — declined card" size={size}>
      <rect x={14} y={24} width={52} height={32} rx={3} />
      <rect x={14} y={30} width={52} height={6} fill={palette.ink} stroke="none" />
      <circle cx={22} cy={48} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={28} cy={48} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={34} cy={48} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={40} cy={48} r={1.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

// ── SWE-specific decisions (remaining 9) ─────────────────────────────────

export function IconStackoverflowAnswer({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-stackoverflow-mentor" label="Mentor on Stack Overflow" size={size}>
      {/* Speech bubble with code lines inside — helpful answer */}
      <path d="M 14 22 H 60 Q 66 22 66 28 V 46 Q 66 52 60 52 H 36 L 26 60 V 52 H 20 Q 14 52 14 46 Z" />
      <line x1={22} y1={32} x2={50} y2={32} strokeWidth={2} />
      <line x1={22} y1={38} x2={42} y2={38} strokeWidth={2} />
      <line x1={22} y1={44} x2={48} y2={44} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconInternClock({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-intern-late-review" label="Intern late review" size={size}>
      {/* Junior figure on the left */}
      <circle cx={24} cy={26} r={6} />
      <path d="M 16 60 V 40 Q 16 34 24 34 Q 32 34 32 40 V 60" />
      {/* Clock on the right — hands at evening */}
      <circle cx={56} cy={40} r={12} />
      <line x1={56} y1={40} x2={56} y2={30} strokeWidth={2} />
      <line x1={56} y1={40} x2={64} y2={40} strokeWidth={2} />
      <circle cx={56} cy={40} r={1.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconForkedPath({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-coder-vs-architect" label="Coder or architect" size={size}>
      {/* Y-shaped fork */}
      <path d="M 40 60 V 40" strokeWidth={3} />
      <path d="M 40 40 L 22 20" strokeWidth={3} />
      <path d="M 40 40 L 58 20" strokeWidth={3} />
      {/* Arrowheads */}
      <path d="M 22 20 L 28 22 M 22 20 L 24 26" strokeWidth={3} />
      <path d="M 58 20 L 52 22 M 58 20 L 56 26" strokeWidth={3} />
      {/* Base dot */}
      <circle cx={40} cy={62} r={3} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconOrgChart({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-people-manager-vs-tech-lead" label="People manager or tech lead" size={size}>
      {/* Top node */}
      <circle cx={40} cy={22} r={5} />
      {/* Trunk */}
      <line x1={40} y1={28} x2={40} y2={38} />
      {/* Branches */}
      <line x1={22} y1={38} x2={58} y2={38} />
      <line x1={22} y1={38} x2={22} y2={48} />
      <line x1={40} y1={38} x2={40} y2={48} />
      <line x1={58} y1={38} x2={58} y2={48} />
      {/* Three reports */}
      <circle cx={22} cy={54} r={4} />
      <circle cx={40} cy={54} r={4} />
      <circle cx={58} cy={54} r={4} />
    </IconFrame>
  );
}

export function IconMortarboard({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-masters-degree" label="Master's degree" size={size}>
      {/* Mortarboard diamond top */}
      <path d="M 12 32 L 40 22 L 68 32 L 40 42 Z" />
      {/* Cap base */}
      <path d="M 22 36 V 50 Q 40 56 58 50 V 36" />
      {/* Tassel */}
      <line x1={40} y1={32} x2={58} y2={42} strokeWidth={1.5} />
      <circle cx={58} cy={44} r={2.5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconBriefcaseSpark({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-startup-offer" label="Startup offer" size={size}>
      {/* Briefcase */}
      <rect x={14} y={30} width={48} height={32} rx={3} />
      <path d="M 28 30 V 24 Q 28 20 32 20 H 44 Q 48 20 48 24 V 30" />
      <line x1={34} y1={44} x2={42} y2={44} strokeWidth={2} />
      {/* Spark upper-right (startup energy) */}
      <path d="M 64 16 L 65 20 L 69 21 L 65 22 L 64 26 L 63 22 L 59 21 L 63 20 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconWhiteboardSystem({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-architecture-review-defend" label="Architecture review" size={size}>
      {/* Whiteboard */}
      <rect x={12} y={18} width={56} height={36} rx={2} />
      {/* Stand legs */}
      <line x1={20} y1={54} x2={20} y2={62} />
      <line x1={60} y1={54} x2={60} y2={62} />
      {/* Three connected boxes */}
      <rect x={18} y={28} width={12} height={8} />
      <rect x={34} y={28} width={12} height={8} />
      <rect x={50} y={28} width={12} height={8} />
      <line x1={30} y1={32} x2={34} y2={32} strokeWidth={1.5} />
      <line x1={46} y1={32} x2={50} y2={32} strokeWidth={1.5} />
      {/* Arrow up into first box */}
      <line x1={24} y1={48} x2={24} y2={38} strokeWidth={1.5} />
      <path d="M 22 40 L 24 38 L 26 40" strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconBus({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-throw-colleague-under-bus" label="Throw colleague under the bus" size={size}>
      {/* Bus body */}
      <rect x={14} y={24} width={48} height={28} rx={4} />
      {/* Windows */}
      <rect x={18} y={28} width={9} height={8} />
      <rect x={29} y={28} width={9} height={8} />
      <rect x={40} y={28} width={9} height={8} />
      <rect x={51} y={28} width={7} height={8} />
      {/* Door */}
      <rect x={18} y={40} width={6} height={12} />
      {/* Wheels */}
      <circle cx={24} cy={56} r={5} fill={palette.ink} stroke="none" />
      <circle cx={56} cy={56} r={5} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconCodeHeart({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="swe-opensource-maintainer" label="Open-source maintainer" size={size}>
      {/* Heart */}
      <path d="M 40 22 Q 32 14 24 22 Q 18 32 40 52 Q 62 32 56 22 Q 48 14 40 22 Z" />
      {/* Code brackets + slash inside */}
      <polyline points="32,30 28,34 32,38" strokeWidth={1.5} />
      <polyline points="48,30 52,34 48,38" strokeWidth={1.5} />
      <line x1={44} y1={28} x2={36} y2={40} strokeWidth={1.5} />
    </IconFrame>
  );
}

// ── Universal events (remaining 15) ──────────────────────────────────────

export function IconSunset({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-sunset" label="Sunset moment" size={size}>
      {/* Horizon */}
      <line x1={10} y1={52} x2={70} y2={52} strokeWidth={2.5} />
      {/* Half-sun rising/setting */}
      <path d="M 22 52 Q 22 32 40 32 Q 58 32 58 52 Z" />
      {/* Rays */}
      <line x1={40} y1={20} x2={40} y2={26} />
      <line x1={22} y1={32} x2={26} y2={36} />
      <line x1={58} y1={32} x2={54} y2={36} />
      <line x1={14} y1={42} x2={18} y2={42} />
      <line x1={62} y1={42} x2={66} y2={42} />
    </IconFrame>
  );
}

export function IconDollarQuestion({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-bank-error" label="Bank error" size={size}>
      {/* $ */}
      <text x={26} y={52} textAnchor="middle" fontFamily="inherit" fontSize={34} fontWeight={700} fill={palette.ink} stroke="none">$</text>
      {/* ? */}
      <text x={54} y={52} textAnchor="middle" fontFamily="inherit" fontSize={34} fontWeight={700} fill={palette.ink} stroke="none">?</text>
    </IconFrame>
  );
}

export function IconCoffeeCup({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-skip-breakfast" label="Skipped breakfast" size={size}>
      {/* Cup body */}
      <path d="M 20 30 H 54 V 52 Q 54 58 48 58 H 26 Q 20 58 20 52 Z" />
      {/* Handle */}
      <path d="M 54 36 Q 64 36 64 44 Q 64 52 54 52" />
      {/* Steam */}
      <path d="M 28 24 Q 30 20 28 16" strokeWidth={1.5} />
      <path d="M 36 24 Q 38 20 36 16" strokeWidth={1.5} />
      <path d="M 44 24 Q 46 20 44 16" strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconTwoFiguresHeart({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-old-friend" label="Old friend" size={size}>
      {/* Two figures */}
      <circle cx={22} cy={34} r={6} />
      <path d="M 14 60 V 44 Q 14 38 22 38 Q 30 38 30 44 V 60" />
      <circle cx={58} cy={34} r={6} />
      <path d="M 50 60 V 44 Q 50 38 58 38 Q 66 38 66 44 V 60" />
      {/* Heart between, near top */}
      <path d="M 40 18 Q 36 14 32 18 Q 30 22 40 30 Q 50 22 48 18 Q 44 14 40 18 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconReturnOffice({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-return-office" label="Return to office" size={size}>
      {/* Building */}
      <rect x={30} y={18} width={36} height={48} />
      {/* Windows grid */}
      <rect x={36} y={26} width={6} height={6} />
      <rect x={46} y={26} width={6} height={6} />
      <rect x={56} y={26} width={6} height={6} />
      <rect x={36} y={36} width={6} height={6} />
      <rect x={46} y={36} width={6} height={6} />
      <rect x={56} y={36} width={6} height={6} />
      {/* Door */}
      <rect x={44} y={52} width={8} height={14} />
      {/* Arrow pointing into building */}
      <line x1={12} y1={42} x2={28} y2={42} strokeWidth={3} />
      <path d="M 24 38 L 28 42 L 24 46" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconGearSparkle({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-ai-tooling" label="AI tooling" size={size}>
      {/* Gear */}
      <circle cx={32} cy={42} r={11} />
      <circle cx={32} cy={42} r={5} />
      {/* Teeth (8) */}
      <line x1={32} y1={28} x2={32} y2={32} strokeWidth={3} />
      <line x1={32} y1={52} x2={32} y2={56} strokeWidth={3} />
      <line x1={18} y1={42} x2={22} y2={42} strokeWidth={3} />
      <line x1={42} y1={42} x2={46} y2={42} strokeWidth={3} />
      <line x1={23} y1={33} x2={26} y2={36} strokeWidth={3} />
      <line x1={41} y1={33} x2={38} y2={36} strokeWidth={3} />
      <line x1={23} y1={51} x2={26} y2={48} strokeWidth={3} />
      <line x1={41} y1={51} x2={38} y2={48} strokeWidth={3} />
      {/* Sparkle upper-right */}
      <path d="M 58 18 L 60 24 L 66 26 L 60 28 L 58 34 L 56 28 L 50 26 L 56 24 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconEnvelope({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-talk-invite" label="Talk invite" size={size}>
      {/* Envelope */}
      <rect x={14} y={24} width={52} height={32} rx={2} />
      <polyline points="14,24 40,42 66,24" />
      {/* Stamp star */}
      <path d="M 56 32 L 57 35 L 60 36 L 57 37 L 56 40 L 55 37 L 52 36 L 55 35 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconCashFound({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-found-twenty" label="Found twenty" size={size}>
      {/* Bill rectangle */}
      <rect x={12} y={28} width={56} height={24} rx={2} />
      {/* "$20" text */}
      <text x={40} y={47} textAnchor="middle" fontFamily="inherit" fontSize={16} fontWeight={700} fill={palette.ink} stroke="none">$20</text>
      {/* Corner medallions */}
      <circle cx={22} cy={36} r={2.5} />
      <circle cx={58} cy={36} r={2.5} />
    </IconFrame>
  );
}

export function IconBrowserTabX({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-deleted-tab" label="Deleted tab" size={size}>
      {/* Single document/window with a folder-style tab notch at the top-left
          and a few content lines inside. Matches the user-supplied
          reference shape. */}
      <path d="M 10 22 L 14 14 L 30 14 L 34 22 L 70 22 L 70 66 L 10 66 Z" />
      <line x1={16} y1={36} x2={62} y2={36} strokeWidth={2} />
      <line x1={16} y1={46} x2={62} y2={46} strokeWidth={2} />
      <line x1={16} y1={54} x2={50} y2={54} strokeWidth={2} />
      <line x1={16} y1={62} x2={62} y2={62} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconHouseUpArrow({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-rent-hike" label="Rent hike" size={size}>
      {/* House */}
      <path d="M 18 42 L 36 26 L 54 42 V 60 H 18 Z" />
      <rect x={30} y={48} width={6} height={12} />
      <rect x={40} y={45} width={6} height={6} />
      {/* Up arrow on right */}
      <line x1={64} y1={56} x2={64} y2={24} strokeWidth={3} />
      <path d="M 60 28 L 64 24 L 68 28" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconAirplaneClock({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-flight-delay" label="Flight delay" size={size}>
      {/* Airplane silhouette */}
      <path d="M 14 34 L 30 34 L 26 26 H 30 L 38 34 H 50 Q 54 34 54 36 Q 54 38 50 38 H 38 L 30 46 H 26 L 30 38 H 14 Q 12 36 14 34 Z" />
      {/* Small clock in lower-right */}
      <circle cx={58} cy={54} r={8} />
      <line x1={58} y1={54} x2={58} y2={48} strokeWidth={1.5} />
      <line x1={58} y1={54} x2={62} y2={54} strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconLostWallet({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-lost-wallet" label="Lost wallet" size={size}>
      {/* Bi-fold wallet (right side of frame) with a card + bill peeking
          out the top, a center fold crease, and motion lines trailing to
          the left — the wallet was just dropped / fell away. */}
      {/* Wallet body */}
      <rect x={28} y={32} width={40} height={26} rx={2} />
      {/* Center fold crease */}
      <line x1={48} y1={32} x2={48} y2={58} strokeWidth={1.5} />
      {/* Stitching along the bottom edge */}
      <line x1={32} y1={54} x2={36} y2={54} strokeWidth={1} />
      <line x1={40} y1={54} x2={44} y2={54} strokeWidth={1} />
      <line x1={52} y1={54} x2={56} y2={54} strokeWidth={1} />
      <line x1={60} y1={54} x2={64} y2={54} strokeWidth={1} />
      {/* Card peeking from the top of the right fold */}
      <rect x={52} y={26} width={14} height={8} rx={1} />
      {/* $ symbol on the wallet face */}
      <text
        x={38}
        y={50}
        textAnchor="middle"
        fontFamily="inherit"
        fontSize={14}
        fontWeight={700}
        fill={palette.ink}
        stroke="none"
      >
        $
      </text>
      {/* Motion lines trailing to the LEFT — the wallet is dropping/lost */}
      <line x1={8} y1={36} x2={22} y2={36} strokeWidth={2} />
      <line x1={4} y1={44} x2={22} y2={44} strokeWidth={2} />
      <line x1={8} y1={52} x2={22} y2={52} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconHeartCheck({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-good-physical" label="Good physical" size={size}>
      {/* Heart */}
      <path d="M 40 22 Q 32 14 24 22 Q 18 32 40 54 Q 62 32 56 22 Q 48 14 40 22 Z" />
      {/* Checkmark inside */}
      <path d="M 30 34 L 36 42 L 50 28" strokeWidth={3.5} />
    </IconFrame>
  );
}

export function IconCloudLightning({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-storm" label="Storm" size={size}>
      {/* Cloud */}
      <path d="M 22 38 Q 14 38 14 30 Q 14 22 22 22 Q 24 14 34 14 Q 46 14 46 22 Q 54 22 54 28 Q 60 30 60 36 Q 60 42 54 42 H 22 Z" />
      {/* Lightning bolt below */}
      <path d="M 38 46 L 30 58 H 36 L 32 66 L 44 52 H 36 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconSpeakerSound({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-univ-voice-reminder-mishap" label="Voice reminder mishap" size={size}>
      {/* Speaker */}
      <path d="M 14 32 V 48 H 24 L 36 58 V 22 L 24 32 Z" />
      {/* Sound waves */}
      <path d="M 42 30 Q 48 36 48 40 Q 48 44 42 50" strokeWidth={2} />
      <path d="M 50 24 Q 60 36 60 40 Q 60 44 50 56" strokeWidth={2} />
    </IconFrame>
  );
}

// ── SWE-specific events (4) ──────────────────────────────────────────────

export function IconDocumentTrending({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-swe-blog-traction" label="Blog traction" size={size}>
      {/* Document */}
      <rect x={18} y={18} width={36} height={46} rx={2} />
      <line x1={24} y1={26} x2={48} y2={26} strokeWidth={2} />
      <line x1={24} y1={32} x2={48} y2={32} strokeWidth={1.5} />
      <line x1={24} y1={38} x2={44} y2={38} strokeWidth={1.5} />
      <line x1={24} y1={44} x2={46} y2={44} strokeWidth={1.5} />
      <line x1={24} y1={50} x2={42} y2={50} strokeWidth={1.5} />
      {/* Up arrow next to it */}
      <line x1={62} y1={58} x2={62} y2={26} strokeWidth={3} />
      <path d="M 58 30 L 62 26 L 66 30" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconInboxBlast({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-swe-recruiter-blast" label="Recruiter blast" size={size}>
      {/* Inbox tray with a row of downward arrows pouring into it — the
          "blast" reads as volume of incoming traffic, not a few floating
          envelopes (which were ambiguous as boxes). */}
      {/* Inbox tray */}
      <path d="M 12 44 H 24 L 28 52 H 52 L 56 44 H 68 V 64 H 12 Z" />
      {/* Three incoming down-arrows above the tray, staggered for "blast" feel */}
      {/* Left arrow */}
      <line x1={22} y1={10} x2={22} y2={36} strokeWidth={3} />
      <path d="M 16 30 L 22 36 L 28 30" strokeWidth={3} />
      {/* Center arrow (slightly taller) */}
      <line x1={40} y1={6} x2={40} y2={38} strokeWidth={3} />
      <path d="M 34 32 L 40 38 L 46 32" strokeWidth={3} />
      {/* Right arrow */}
      <line x1={58} y1={10} x2={58} y2={36} strokeWidth={3} />
      <path d="M 52 30 L 58 36 L 64 30" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconTrophy({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-swe-stackoverflow-rep" label="Stack Overflow rep" size={size}>
      {/* Cup */}
      <path d="M 24 22 H 56 V 32 Q 56 44 40 44 Q 24 44 24 32 Z" />
      {/* Handles */}
      <path d="M 24 26 Q 16 26 16 32 Q 16 36 22 36" />
      <path d="M 56 26 Q 64 26 64 32 Q 64 36 58 36" />
      {/* Stem + base */}
      <line x1={40} y1={44} x2={40} y2={54} strokeWidth={2} />
      <rect x={28} y={54} width={24} height={6} />
      {/* Star on cup */}
      <path d="M 40 28 L 42 32 L 46 32 L 43 35 L 44 39 L 40 37 L 36 39 L 37 35 L 34 32 L 38 32 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconFlowWaves({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-swe-flow-state" label="Flow state" size={size}>
      {/* Three flowing wave lines */}
      <path d="M 12 26 Q 24 20 36 26 Q 48 32 60 26 Q 66 24 68 26" strokeWidth={3} />
      <path d="M 12 40 Q 24 34 36 40 Q 48 46 60 40 Q 66 38 68 40" strokeWidth={3} />
      <path d="M 12 54 Q 24 48 36 54 Q 48 60 60 54 Q 66 52 68 54" strokeWidth={3} />
    </IconFrame>
  );
}

// ── Era events (remaining 10) ────────────────────────────────────────────

export function IconRoommateFriction({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-pandemic-roommate-friction" label="Roommate friction" size={size}>
      {/* Two figures */}
      <circle cx={22} cy={28} r={6} />
      <path d="M 14 60 V 42 Q 14 36 22 36 Q 30 36 30 42 V 60" />
      <circle cx={58} cy={28} r={6} />
      <path d="M 50 60 V 42 Q 50 36 58 36 Q 66 36 66 42 V 60" />
      {/* Friction lines (small X) between */}
      <line x1={36} y1={36} x2={44} y2={44} strokeWidth={2} />
      <line x1={44} y1={36} x2={36} y2={44} strokeWidth={2} />
    </IconFrame>
  );
}

export function IconWalker({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-pandemic-walk-routine" label="Walk routine" size={size}>
      {/* Walking figure in profile — head connected to torso via a short
          neck, torso vertical, arms swinging in opposition (front + back),
          legs in mid-stride. Ground line below; small motion dashes
          trailing behind to confirm motion direction. */}
      {/* Head */}
      <circle cx={38} cy={16} r={5} />
      {/* Neck connecting head to torso */}
      <line x1={38} y1={21} x2={38} y2={26} strokeWidth={2.5} />
      {/* Torso */}
      <line x1={38} y1={26} x2={38} y2={44} strokeWidth={3} />
      {/* Front arm (swinging forward) */}
      <line x1={38} y1={30} x2={50} y2={38} strokeWidth={2.5} />
      {/* Back arm (swinging back, slightly up) */}
      <line x1={38} y1={30} x2={28} y2={26} strokeWidth={2.5} />
      {/* Front leg (forward stride) */}
      <line x1={38} y1={44} x2={50} y2={60} strokeWidth={2.5} />
      {/* Back leg (back stride) */}
      <line x1={38} y1={44} x2={28} y2={60} strokeWidth={2.5} />
      {/* Ground */}
      <line x1={12} y1={62} x2={66} y2={62} strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconDollarUpArrow({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-rebound-comp-jump" label="Comp jump" size={size}>
      {/* $ */}
      <text x={32} y={52} textAnchor="middle" fontFamily="inherit" fontSize={32} fontWeight={700} fill={palette.ink} stroke="none">$</text>
      {/* Up arrow next to it */}
      <line x1={58} y1={58} x2={58} y2={24} strokeWidth={3} />
      <path d="M 54 28 L 58 24 L 62 28" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconDoorExit({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-rebound-leaving-wave" label="Leaving wave" size={size}>
      {/* Door */}
      <rect x={16} y={16} width={28} height={48} rx={1} />
      <circle cx={38} cy={40} r={2} fill={palette.ink} stroke="none" />
      {/* Exit arrow */}
      <line x1={48} y1={40} x2={68} y2={40} strokeWidth={3} />
      <path d="M 64 36 L 68 40 L 64 44" strokeWidth={3} />
    </IconFrame>
  );
}

export function IconLayoffsExit({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-ai-shift-adjacent-layoffs" label="Adjacent layoffs" size={size}>
      {/* Building */}
      <rect x={14} y={20} width={28} height={44} />
      <rect x={20} y={26} width={5} height={5} />
      <rect x={31} y={26} width={5} height={5} />
      <rect x={20} y={36} width={5} height={5} />
      <rect x={31} y={36} width={5} height={5} />
      {/* Open door */}
      <path d="M 22 56 V 64 H 34 V 56" />
      {/* Figure walking away with box */}
      <circle cx={56} cy={30} r={5} />
      <line x1={56} y1={36} x2={56} y2={50} strokeWidth={2.5} />
      <line x1={56} y1={50} x2={50} y2={60} strokeWidth={2.5} />
      <line x1={56} y1={50} x2={62} y2={60} strokeWidth={2.5} />
      {/* Box being carried */}
      <rect x={60} y={40} width={8} height={8} />
    </IconFrame>
  );
}

export function IconBubbleSparkle({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-ai-shift-tooling-evangelism" label="Tooling evangelism" size={size}>
      {/* Speech bubble */}
      <path d="M 14 22 H 60 Q 66 22 66 28 V 44 Q 66 50 60 50 H 36 L 26 58 V 50 H 20 Q 14 50 14 44 Z" />
      {/* Sparkle inside */}
      <path d="M 40 28 L 42 34 L 48 36 L 42 38 L 40 44 L 38 38 L 32 36 L 38 34 Z" fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconArchiveBox({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-uncertain-old-codebase" label="Old codebase" size={size}>
      {/* Lid (slightly raised) */}
      <rect x={12} y={22} width={56} height={10} />
      {/* Box body */}
      <path d="M 14 32 H 66 L 60 62 H 20 Z" />
      <line x1={14} y1={32} x2={66} y2={32} strokeWidth={2.5} />
      {/* Label tag on front */}
      <rect x={32} y={42} width={16} height={10} />
      <line x1={36} y1={47} x2={44} y2={47} strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconMentorPointing({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-uncertain-becoming-mentor" label="Becoming a mentor" size={size}>
      {/* Two figures — mentor (left, larger) and mentee (right, smaller).
          Size difference + adjacency carries the "mentor / mentee"
          reading; the pointing arm was over-explaining. */}
      {/* Mentor (left, larger) */}
      <circle cx={26} cy={22} r={7} />
      <path d="M 16 58 V 34 Q 16 28 26 28 Q 36 28 36 34 V 58" />
      {/* Mentee (right, smaller) */}
      <circle cx={56} cy={30} r={5} />
      <path d="M 50 58 V 42 Q 50 38 56 38 Q 62 38 62 42 V 58" />
    </IconFrame>
  );
}

export function IconCycleArrow({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-uncertain-cycle-reborn" label="Cycle reborn" size={size}>
      {/* Sun rising over a horizon — the "new dawn / starting over"
          reading of cycle-reborn. Half-sun above a horizon line, with
          rays radiating outward + upward. */}
      {/* Horizon */}
      <line x1={10} y1={52} x2={70} y2={52} strokeWidth={2} />
      {/* Half-sun above horizon */}
      <path d="M 22 52 A 18 18 0 0 1 58 52" strokeWidth={2.5} />
      {/* Rays — top, upper-left, upper-right, mid-left, mid-right, between */}
      <line x1={40} y1={18} x2={40} y2={24} strokeWidth={2.5} />
      <line x1={20} y1={24} x2={24} y2={30} strokeWidth={2.5} />
      <line x1={60} y1={24} x2={56} y2={30} strokeWidth={2.5} />
      <line x1={10} y1={38} x2={16} y2={40} strokeWidth={2.5} />
      <line x1={70} y1={38} x2={64} y2={40} strokeWidth={2.5} />
      <line x1={28} y1={14} x2={32} y2={22} strokeWidth={2} />
      <line x1={52} y1={14} x2={48} y2={22} strokeWidth={2} />
      {/* A small ground-line beneath the horizon (suggests land) */}
      <line x1={10} y1={58} x2={70} y2={58} strokeWidth={1.5} />
    </IconFrame>
  );
}

export function IconEconomyDown({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-uncertain-economy" label="Uncertain economy" size={size}>
      {/* Axes */}
      <line x1={14} y1={60} x2={66} y2={60} strokeWidth={2} />
      <line x1={14} y1={60} x2={14} y2={16} strokeWidth={2} />
      {/* Downward line graph — polyline ends at (60, 56). */}
      <polyline points="18,22 28,32 38,28 48,42 60,56" strokeWidth={2.5} />
      {/* Down-arrow head at the endpoint — clean chevron (V) opening upward,
          point at (60, 56). Wings go up-left and up-right. */}
      <path d="M 54 50 L 60 56 L 66 50" strokeWidth={2.5} />
      {/* Dots on key inflection points */}
      <circle cx={18} cy={22} r={2} fill={palette.ink} stroke="none" />
      <circle cx={38} cy={28} r={2} fill={palette.ink} stroke="none" />
      <circle cx={48} cy={42} r={2} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

interface DecisionIconProps {
  decisionId: string;
  palette: Palette;
  size?: number;
}

interface EventIconProps {
  eventId: string;
  palette: Palette;
  size?: number;
}

/**
 * Renders the icon registered for a given decision id, or the placeholder
 * if the id is unregistered. The lookup happens here so callers never see
 * the registry — `<DecisionIcon decisionId={...} palette={...} />` is the
 * full integration surface from the modal's perspective. `size` defaults
 * to the icon's own default (80px) — pass a smaller value (e.g. 32) for
 * the endgame timeline rows.
 */
export function DecisionIcon({ decisionId, palette, size }: DecisionIconProps): ReactElement {
  const render = DECISION_ICONS[decisionId] ?? PlaceholderIcon;
  return render({ palette, size });
}

/**
 * Renders the icon registered for a given event id, or the placeholder
 * if the id is unregistered.
 */
export function EventIcon({ eventId, palette, size }: EventIconProps): ReactElement {
  const render = EVENT_ICONS[eventId] ?? PlaceholderIcon;
  return render({ palette, size });
}
