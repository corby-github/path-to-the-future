// Class tier meta-list per §14. The eight-tier XP progression is universal
// across careers — the labels here are the canonical names. Per-career packs
// supply starting stats / XP via `manifest.entryClasses[id]` for the IDs they
// allow as entry points (in v1 = `novice` and `skilled` for SWE).
//
// `xpMin` is the inclusive lower bound of the tier in XP. A player whose XP
// crosses the next tier's `xpMin` automatically promotes (§14: "Class tier
// updates automatically as XP crosses thresholds. You can gain XP, but not
// lose it.").

export interface ClassTier {
  id: string;
  label: string;
  role: string;
  xpMin: number;
  xpMax: number;
}

export const CLASSES: readonly ClassTier[] = [
  {
    id: 'novice',
    label: 'Novice Initiate',
    role: 'Intern / Apprentice',
    xpMin: 0,
    xpMax: 999,
  },
  {
    id: 'junior',
    label: 'Junior Adventurer',
    role: 'Junior Engineer',
    xpMin: 1_000,
    xpMax: 4_999,
  },
  {
    id: 'skilled',
    label: 'Skilled Operative',
    role: 'Software Engineer II',
    xpMin: 5_000,
    xpMax: 14_999,
  },
  {
    id: 'vanguard',
    label: 'Vanguard Strategist',
    role: 'Senior / Principal Engineer',
    xpMin: 15_000,
    xpMax: 59_999,
  },
  {
    id: 'commander',
    label: 'Commander Architect',
    role: 'Tech Lead / Director',
    xpMin: 60_000,
    xpMax: 129_999,
  },
  {
    id: 'legendary',
    label: 'Legendary Leader',
    role: 'VP / CTO (Hands-On)',
    xpMin: 130_000,
    xpMax: 199_999,
  },
  {
    id: 'mythic',
    label: 'Mythic Visionary',
    role: 'Founder / CEO / Chief Architect',
    xpMin: 200_000,
    xpMax: 299_999,
  },
  {
    id: 'oracle',
    label: 'Elite Oracle',
    role: 'Founder-of-Founders',
    xpMin: 300_000,
    xpMax: Number.POSITIVE_INFINITY,
  },
] as const;

/** Resolve a class id from a raw XP value. Returns the tier whose range contains xp. */
export function classTierForXp(xp: number): ClassTier {
  for (const tier of CLASSES) {
    if (xp >= tier.xpMin && xp <= tier.xpMax) return tier;
  }
  return CLASSES[CLASSES.length - 1];
}
