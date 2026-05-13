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
