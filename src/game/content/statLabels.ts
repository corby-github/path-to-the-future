import type { Manifest, StatLabelKey } from '../types/careerPack';

// Default display labels for the canonical stat keys (§7). Matches the
// vocabulary the SWE pack has shipped with since v1 — the EffectChips
// `aria-label`, EndgameScreen `<StatRow>` labels, and StatIcon aria-labels
// all referenced this set independently. Centralizing here is the §26 v2.0
// "one source of truth" promise.
//
// `xp` is included because it surfaces in the same UI (HUD chip, endgame
// score panel) and any pack that relabels e.g. `technicalSkill` → "Teaching"
// may also want to keep XP as-is. Most packs will only override 2-3 keys.
export const DEFAULT_STAT_LABELS: Record<StatLabelKey, string> = {
  burnout: 'Burnout',
  savings: 'Savings',
  network: 'Network',
  health: 'Health',
  relationship: 'Relationship',
  technicalSkill: 'Technical Skill',
  reputation: 'Reputation',
  xp: 'Experience',
};

// One lookup, one fallback. Per §26: `pack.statLabels?.[key] ?? default`.
// All UI sites that name a stat MUST go through this — the alternative is
// silently divergent vocabulary between HUD / EffectChips / EndgameScreen
// when a pack relabels half the surface and forgets the other half.
export function statLabelFor(
  manifest: Manifest | undefined,
  key: StatLabelKey,
): string {
  return manifest?.statLabels?.[key] ?? DEFAULT_STAT_LABELS[key];
}
