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
    <div style={rowStyle} role="list" aria-label="Outcome">
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

  // Screen-reader friendly label: "Burnout +5" / "Savings −10" / "Health
  // set to 50" — one phrase per chip so AT users hear stat-and-change as
  // a unit, not "burnout" then "plus 5" split across reads.
  const a11yLabel = formatForScreenReader(stat, parsed.op, parsed.magnitude);

  return (
    <span role="listitem" aria-label={a11yLabel} style={style}>
      {/* Visual content hidden from AT — the parent listitem's aria-label
          is the single source of truth for screen readers. */}
      <span
        aria-hidden="true"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <StatIcon name={statToIconName(stat)} size={20} />
        {formatExpr(parsed.op, parsed.magnitude)}
      </span>
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

// Human-readable stat names for the screen-reader chip label. Mirrors the
// HUD's display vocabulary so AT users hear the same phrasing as sighted
// players see (e.g., "technicalSkill" → "Technical skill"). Kept local to
// this file because no other consumer needs the screen-reader phrasing —
// StatIcon's own ARIA_LABELS serve a slightly different purpose (icon-
// only context).
const STAT_NAMES_FOR_AT: Record<StatKey, string> = {
  burnout: 'Burnout',
  savings: 'Savings',
  network: 'Network',
  health: 'Health',
  relationship: 'Relationship',
  technicalSkill: 'Technical skill',
  reputation: 'Reputation',
};

function formatForScreenReader(stat: StatKey, op: '+' | '-' | '=', magnitude: number): string {
  const name = STAT_NAMES_FOR_AT[stat];
  if (op === '+') return `${name} +${magnitude}`;
  if (op === '-') return `${name} −${magnitude}`;
  return `${name} set to ${magnitude}`;
}
