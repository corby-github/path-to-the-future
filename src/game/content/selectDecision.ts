import type { DecisionDef } from '../types/careerPack';
import { passesRequires, type RequiresContext } from './evaluateRequires';

// mulberry32 — small, fast, deterministic seeded PRNG. Same seed → same sequence.
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
