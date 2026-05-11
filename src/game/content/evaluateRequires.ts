import type { StatsState } from '../state/slices/statsSlice';
import type { FlagsState } from '../state/slices/flagsSlice';

export interface RequiresContext {
  stats: StatsState;
  flags: FlagsState;
  currentMonth: number;
}

const REQUIRE_RE = /^(>=|<=|==|!=|>|<)\s*(-?\d+|null)$/;

function resolveLhs(key: string, ctx: RequiresContext): number | null | undefined {
  if (key === 'month') return ctx.currentMonth;
  if (key in ctx.stats) return ctx.stats[key as keyof StatsState];
  if (key in ctx.flags) return ctx.flags[key as keyof FlagsState] ? 1 : 0;
  return undefined;
}

export function evaluateOne(lhs: number | null, expr: string): boolean {
  const trimmed = expr.trim();
  const m = REQUIRE_RE.exec(trimmed);
  if (!m) return false;
  const op = m[1];
  const rhs = m[2] === 'null' ? null : parseInt(m[2], 10);

  if (op === '==') return lhs === rhs;
  if (op === '!=') return lhs !== rhs;

  // Numeric comparisons require both sides numeric.
  if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
  switch (op) {
    case '>': return lhs > rhs;
    case '<': return lhs < rhs;
    case '>=': return lhs >= rhs;
    case '<=': return lhs <= rhs;
    default: return false;
  }
}

export function passesRequires(
  requires: Record<string, string> | undefined,
  ctx: RequiresContext,
): boolean {
  if (!requires) return true;
  for (const [key, expr] of Object.entries(requires)) {
    const lhs = resolveLhs(key, ctx);
    if (lhs === undefined) return false;
    if (!evaluateOne(lhs, expr)) return false;
  }
  return true;
}
