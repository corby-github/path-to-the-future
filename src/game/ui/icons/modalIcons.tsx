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
      {/* Facemask body */}
      <path d="M 22 32 Q 22 28 28 28 H 52 Q 58 28 58 32 V 46 Q 58 50 52 50 H 28 Q 22 50 22 46 Z" />
      {/* Ear straps curving behind */}
      <path d="M 22 30 Q 14 36 16 44 Q 18 50 22 50" />
      <path d="M 58 30 Q 66 36 64 44 Q 62 50 58 50" />
      {/* Pleats — light interior texture */}
      <line x1={26} y1={36} x2={54} y2={36} strokeWidth={1.5} />
      <line x1={26} y1={42} x2={54} y2={42} strokeWidth={1.5} />
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
      {/* Phone handset — two angled ovals + connector */}
      <ellipse cx={28} cy={28} rx={8} ry={6} transform="rotate(-35 28 28)" />
      <ellipse cx={52} cy={52} rx={8} ry={6} transform="rotate(-35 52 52)" />
      <line x1={32} y1={32} x2={48} y2={48} strokeWidth={3} />
      {/* Sound waves */}
      <path d="M 58 20 Q 64 26 58 32" strokeWidth={1.5} />
      <path d="M 62 14 Q 70 26 62 38" strokeWidth={1.5} />
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
      <rect x={18} y={28} width={44} height={18} rx={3} />
      <rect x={14} y={42} width={52} height={14} rx={3} />
      <line x1={18} y1={56} x2={18} y2={62} />
      <line x1={62} y1={56} x2={62} y2={62} />
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
      <line x1={40} y1={62} x2={40} y2={38} />
      <path d="M 40 38 Q 30 32 22 36" />
      <path d="M 40 38 Q 50 32 58 36" />
      <path d="M 40 38 Q 32 26 28 18" />
      <path d="M 40 38 Q 48 26 52 18" />
      <path d="M 40 38 Q 40 24 38 14" />
      <circle cx={42} cy={38} r={2} fill={palette.ink} stroke="none" />
    </IconFrame>
  );
}

export function IconHeartHands({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="univ-charity-donation" label="Charity donation" size={size}>
      <path d="M 40 28 Q 32 20 26 26 Q 20 34 40 48 Q 60 34 54 26 Q 48 20 40 28 Z" />
      <path d="M 20 52 Q 30 62 40 62 Q 50 62 60 52" />
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
      <rect x={20} y={18} width={26} height={48} rx={1} />
      <circle cx={40} cy={42} r={2} fill={palette.ink} stroke="none" />
      <circle cx={56} cy={36} r={5} />
      <line x1={56} y1={41} x2={56} y2={54} strokeWidth={2} />
      <line x1={56} y1={48} x2={62} y2={48} />
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
      <rect x={20} y={22} width={32} height={36} rx={3} />
      <rect x={24} y={26} width={24} height={14} />
      <circle cx={28} cy={50} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={36} cy={50} r={1.5} fill={palette.ink} stroke="none" />
      <circle cx={44} cy={50} r={1.5} fill={palette.ink} stroke="none" />
      <line x1={52} y1={22} x2={60} y2={14} strokeWidth={1.5} />
      <circle cx={62} cy={12} r={3} fill={palette.ink} stroke="none" />
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

// ── Finale ───────────────────────────────────────────────────────────────

export function IconThresholdDoor({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="finale-month-120" label="The closing door" size={size}>
      {/* Door frame (outer arch) */}
      <path d="M 22 64 V 22 Q 22 14 30 14 H 50 Q 58 14 58 22 V 64" />
      {/* Inner panel — door cracked open, hinged on the left */}
      <path d="M 30 64 V 26 Q 30 20 36 20 H 44" />
      {/* Light beams emerging through the opening */}
      <line x1={48} y1={30} x2={62} y2={26} strokeWidth={1.5} />
      <line x1={50} y1={40} x2={66} y2={40} strokeWidth={1.5} />
      <line x1={48} y1={50} x2={62} y2={54} strokeWidth={1.5} />
    </IconFrame>
  );
}

// ── Minigame icons ───────────────────────────────────────────────────────
// Exported as components; not registered in DECISION_ICONS / EVENT_ICONS.
// Consumer (MinigameReplayCard or a future registry) imports them directly.

export function IconCards({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="blackjack" label="Blackjack" size={size}>
      <rect x={20} y={22} width={26} height={38} rx={3} transform="rotate(-10 33 41)" />
      <rect x={34} y={22} width={26} height={38} rx={3} transform="rotate(10 47 41)" />
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
      {/* Letterform glyph — the answer, surfaced post-play when the joke
          is past tense. The menu row hides it; here the timeline reveal
          is the punchline. */}
      <text x={40} y={54} textAnchor="middle" fontFamily="inherit" fontSize={36} fontWeight={700} fill={palette.ink} stroke="none">42</text>
    </IconFrame>
  );
}

// ── Era event icons ──────────────────────────────────────────────────────

export function IconUpwardArrow({ palette, size }: ModalIconProps): ReactElement {
  return (
    <IconFrame palette={palette} variant="evt-era-rebound-promo-wave" label="Rebound promo wave" size={size}>
      <polyline points="14,54 26,42 38,48 52,30 62,30" strokeWidth={2.5} />
      <polyline points="56,28 62,30 60,36" strokeWidth={2.5} />
      <circle cx={14} cy={54} r={2} fill={palette.ink} stroke="none" />
      <circle cx={26} cy={42} r={2} fill={palette.ink} stroke="none" />
      <circle cx={38} cy={48} r={2} fill={palette.ink} stroke="none" />
      <circle cx={52} cy={30} r={2} fill={palette.ink} stroke="none" />
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
