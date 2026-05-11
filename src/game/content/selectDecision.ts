import type { DecisionDef } from '../types/careerPack';
import { passesRequires, type RequiresContext } from './evaluateRequires';
import { seededRandom } from '../rooms/generator/seedRng';

export interface SelectDecisionInput {
  decisions: DecisionDef[];
  ctx: RequiresContext;
  monthId: number;
  // recentTags is the design-doc §8 "prevent back-to-back same-flavor" mechanism.
  // Plumbed through now; bias logic lands when there's enough content to need it.
  recentTags?: string[];
}

export function selectDecision({ decisions, ctx, monthId }: SelectDecisionInput): DecisionDef | null {
  const eligible = decisions.filter((d) => passesRequires(d.requires, ctx));
  if (eligible.length === 0) return null;

  const rng = seededRandom(monthId);
  const totalWeight = eligible.reduce((sum, d) => sum + d.weight, 0);
  let r = rng() * totalWeight;
  for (const d of eligible) {
    r -= d.weight;
    if (r <= 0) return d;
  }
  return eligible[eligible.length - 1];
}
