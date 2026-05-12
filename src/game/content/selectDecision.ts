import type { DecisionDef } from '../types/careerPack';
import type { DecisionRecord } from '../state/slices/historySlice';
import { passesRequires, type RequiresContext } from './evaluateRequires';
import { seededRandom } from '../rooms/generator/seedRng';

// Two-tier de-dup window for decisions (issue #34). A decision picked within
// the last N months is filtered out hard; among what remains, never-seen
// decisions are preferred over previously-seen ones. If both tiers exhaust,
// fall back to the raw eligible pool so the selector never returns null due
// to filtering alone.
const RECENT_WINDOW_MONTHS = 5;

export interface SelectDecisionInput {
  decisions: DecisionDef[];
  ctx: RequiresContext;
  monthId: number;
  // History records used for de-duplication. Optional — callers that want
  // pure weighted-random (e.g. tests) can omit.
  history?: DecisionRecord[];
  // recentTags is the design-doc §8 "prevent back-to-back same-flavor" mechanism.
  // Plumbed through now; bias logic lands when there's enough content to need it.
  recentTags?: string[];
}

export function selectDecision({
  decisions,
  ctx,
  monthId,
  history,
}: SelectDecisionInput): DecisionDef | null {
  const eligible = decisions.filter((d) => passesRequires(d.requires, ctx));
  if (eligible.length === 0) return null;

  const pool = applyHistoryFilter(eligible, history ?? [], monthId);

  const rng = seededRandom(monthId);
  const totalWeight = pool.reduce((sum, d) => sum + d.weight, 0);
  let r = rng() * totalWeight;
  for (const d of pool) {
    r -= d.weight;
    if (r <= 0) return d;
  }
  return pool[pool.length - 1];
}

// Two-tier filter — see RECENT_WINDOW_MONTHS. Always returns a non-empty
// array as long as `eligible` is non-empty; falls through
// neverSeen → notRecent → eligible.
function applyHistoryFilter(
  eligible: DecisionDef[],
  history: DecisionRecord[],
  currentMonth: number,
): DecisionDef[] {
  const recentlySeenIds = new Set(
    history
      .filter((r) => currentMonth - r.monthId < RECENT_WINDOW_MONTHS)
      .map((r) => r.decisionId),
  );
  const notRecent = eligible.filter((d) => !recentlySeenIds.has(d.id));
  if (notRecent.length === 0) return eligible;

  const everSeenIds = new Set(history.map((r) => r.decisionId));
  const neverSeen = notRecent.filter((d) => !everSeenIds.has(d.id));
  return neverSeen.length > 0 ? neverSeen : notRecent;
}
