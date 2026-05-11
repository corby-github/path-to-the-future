import type { StatsState } from '../state/slices/statsSlice';

export type StatKey = keyof StatsState;
export type EffectOp = '+' | '-' | '=';

export interface ParsedEffect {
  op: EffectOp;
  magnitude: number;
}

// Stat ranges per design doc §7. savings has no upper bound.
export const STAT_RANGES: Record<StatKey, [number, number]> = {
  burnout: [0, 100],
  savings: [0, Number.POSITIVE_INFINITY],
  network: [0, 100],
  health: [0, 100],
  relationship: [0, 100],
  technicalSkill: [0, 100],
  reputation: [-100, 100],
};

const EFFECT_RE = /^([+\-=])\s*(\d+)$/;

export function parseEffect(expr: string): ParsedEffect | null {
  const m = EFFECT_RE.exec(expr.trim());
  if (!m) return null;
  return {
    op: m[1] as EffectOp,
    magnitude: parseInt(m[2], 10),
  };
}

export function resolveStatValue(
  current: number | null,
  effect: ParsedEffect,
  range: [number, number],
): number {
  // null treated as 0 for arithmetic per the Day-6 design decision.
  const base = current ?? 0;
  let next: number;
  if (effect.op === '=') next = effect.magnitude;
  else if (effect.op === '+') next = base + effect.magnitude;
  else next = base - effect.magnitude;

  return Math.max(range[0], Math.min(range[1], next));
}
