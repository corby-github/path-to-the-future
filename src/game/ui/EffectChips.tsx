import type { CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { parseEffect, type StatKey } from '../content/applyEffects';
import { StatIcon, type StatIconName } from './icons/StatIcon';

// Renders the stat changes that ARE ABOUT TO APPLY when the player hits
// Continue on a decision flavor / event body. Reads raw `effects` (the schema
// map of stat → "+N" / "-N" / "=N" expression strings) and renders one chip
// per entry: [StatIcon] {signed delta}.
//
// Used on:
// - DecisionModal flavor phase (per the chosen option's effects)
// - EventModal body phase (per the event's effects)
//
// These are PREVIEW chips — they describe what's about to happen. The actual
// dispatch of applyStatEffect is deferred to the modal's Continue button so
// the HUD animation fires *after* the modal closes (when the player can see
// the HUD reacting), not silently behind the modal.

interface Props {
  effects: Record<string, string>;
}

export function EffectChips({ effects }: Props) {
  const { palette } = useCareerPack();

  const entries = Object.entries(effects).filter(([stat, expr]) => {
    if (!isStatKey(stat)) return false;
    const parsed = parseEffect(expr);
    return parsed !== null && parsed.magnitude !== 0;
  });

  if (entries.length === 0) return null;

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center',
    margin: 0,
    marginBottom: 28,
    padding: '12px 14px',
    border: `1px solid ${palette.surface}`,
    borderRadius: 4,
    background: 'transparent',
  };

  return (
    <div style={rowStyle} aria-label="Outcome">
      {entries.map(([stat, expr]) => (
        <EffectChip key={stat} stat={stat as StatKey} expr={expr} />
      ))}
    </div>
  );
}

// ---- single chip ----

interface ChipProps {
  stat: StatKey;
  expr: string;
}

function EffectChip({ stat, expr }: ChipProps) {
  const { palette } = useCareerPack();
  const parsed = parseEffect(expr);
  if (!parsed) return null;

  // '+' positive (sage), '-' negative (accent/warm-brown), '=' set absolute (ink/neutral).
  const color =
    parsed.op === '+'
      ? palette.positive
      : parsed.op === '-'
        ? palette.accent
        : palette.ink;

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    color,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style}>
      <StatIcon name={statToIconName(stat)} size={20} />
      {formatExpr(parsed.op, parsed.magnitude)}
    </span>
  );
}

// ---- helpers ----

const STAT_KEYS: StatKey[] = [
  'burnout',
  'savings',
  'network',
  'health',
  'relationship',
  'technicalSkill',
  'reputation',
];

function isStatKey(s: string): s is StatKey {
  return (STAT_KEYS as string[]).includes(s);
}

// Maps the Redux stat key to its StatIcon name (currently 1:1, but the type
// boundary makes future divergence safe — e.g., if a career pack overrides
// the icon for `technicalSkill`, the indirection lives here).
function statToIconName(stat: StatKey): StatIconName {
  return stat as StatIconName;
}

function formatExpr(op: '+' | '-' | '=', magnitude: number): string {
  const formatted = magnitude.toLocaleString('en-US');
  if (op === '+') return `+${formatted}`;
  if (op === '-') return `−${formatted}`; // U+2212 minus, not hyphen
  return `→ ${formatted}`;
}
