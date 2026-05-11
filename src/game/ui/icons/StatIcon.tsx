import type { CSSProperties, ReactElement } from 'react';

// The eight stat icons. `technicalSkill` is the only career-specific glyph —
// other career packs (nurse, CPA, etc.) will theme this slot to a stethoscope,
// calculator, etc. via a future pack-level icon override.
export type StatIconName =
  | 'burnout'
  | 'savings'
  | 'network'
  | 'health'
  | 'relationship'
  | 'technicalSkill'
  | 'reputation'
  | 'xp';

interface Props {
  name: StatIconName;
  size?: number;
  /** Optional explicit color. Otherwise inherits via `currentColor`. */
  color?: string;
  /** Optional style override (merged after color). */
  style?: CSSProperties;
  /** Optional aria-label. Defaults to the stat name. */
  label?: string;
}

const FONT_STACK =
  "inherit";

// Body fragments — see docs/icons-preview/stat-icons.html for the original
// design exploration. Treatment A: line-art bodies with filled accents, plus
// letterform glyphs for `$` (savings) and `XP`.
const ICON_BODIES: Record<StatIconName, ReactElement> = {
  // Flame body outline + filled inner flame
  burnout: (
    <>
      <path d="M12 2.5 C15 5.5, 17.5 7, 18 11.5 C18.5 16.5, 15.5 21, 12 21 C8 21, 5 17.5, 5 13 C5 9, 9 7.5, 12 2.5 Z" />
      <path
        d="M12 11 C13.5 13, 14 14, 14 16 C14 17.5, 13 19, 12 19 C11 19, 10 17.5, 10 16 C10 14, 11 13, 12 11 Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  // "$" letterform (matched to xp)
  savings: (
    <text
      x={12}
      y={18}
      textAnchor="middle"
      fontFamily={FONT_STACK}
      fontSize={17}
      fontWeight={700}
      fill="currentColor"
      stroke="none"
    >
      $
    </text>
  ),
  // Three connected nodes — graph metaphor
  network: (
    <>
      <line x1={12} y1={6} x2={6} y2={17} />
      <line x1={12} y1={6} x2={18} y2={17} />
      <line x1={6} y1={18} x2={18} y2={18} />
      <circle cx={12} cy={5} r={2.25} fill="currentColor" stroke="none" />
      <circle cx={6} cy={18} r={2.25} fill="currentColor" stroke="none" />
      <circle cx={18} cy={18} r={2.25} fill="currentColor" stroke="none" />
    </>
  ),
  // First-aid kit: rounded rect + filled plus
  health: (
    <>
      <rect x={3} y={6} width={18} height={14} rx={2.5} ry={2.5} />
      <path
        d="M11 9 H13 V12 H16 V14 H13 V17 H11 V14 H8 V12 H11 Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  // Single outlined heart
  relationship: (
    <path d="M12 20.5 C12 20.5, 4 16, 4 10 C4 7, 6 5, 8.5 5 C10.3 5, 11.5 6, 12 7.5 C12.5 6, 13.7 5, 15.5 5 C18 5, 20 7, 20 10 C20 16, 12 20.5, 12 20.5 Z" />
  ),
  // Code brackets with thicker middle slash
  technicalSkill: (
    <>
      <polyline points="8 8 3 12 8 16" />
      <polyline points="16 8 21 12 16 16" />
      <line x1={14} y1={5} x2={10} y2={19} strokeWidth={2.5} />
    </>
  ),
  // Outlined 5-point star
  reputation: (
    <path d="M12 2.5 L14.7 9.2 L22 9.8 L16.4 14.5 L18.3 21.5 L12 17.6 L5.7 21.5 L7.6 14.5 L2 9.8 L9.3 9.2 Z" />
  ),
  // "XP" letterform (matched to savings)
  xp: (
    <text
      x={12}
      y={17.5}
      textAnchor="middle"
      fontFamily={FONT_STACK}
      fontSize={14}
      fontWeight={700}
      letterSpacing="-0.5"
      fill="currentColor"
      stroke="none"
    >
      XP
    </text>
  ),
};

const ARIA_LABELS: Record<StatIconName, string> = {
  burnout: 'Burnout',
  savings: 'Savings',
  network: 'Network',
  health: 'Health',
  relationship: 'Relationship',
  technicalSkill: 'Technical skill',
  reputation: 'Reputation',
  xp: 'Experience',
};

export function StatIcon({ name, size = 20, color, style, label }: Props) {
  const mergedStyle: CSSProperties = {
    display: 'block',
    flexShrink: 0,
    ...(color ? { color } : {}),
    ...style,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={mergedStyle}
      role="img"
      aria-label={label ?? ARIA_LABELS[name]}
    >
      {ICON_BODIES[name]}
    </svg>
  );
}
