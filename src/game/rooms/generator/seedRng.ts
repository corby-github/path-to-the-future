// Deterministic seeded RNG + room-seed computation per design doc §4.
// "Same seed → same room." Macro state (XP tier, burnout tier, flags) feeds
// the seed; raw stat numbers do not, so small fluctuations don't regenerate
// the room.

export interface RoomSeedState {
  progress: { xp: number };
  stats: { burnout: number };
  flags: { inRelationship: boolean; hasKids: boolean; inGradSchool: boolean };
}

export interface RoomSeedInput {
  packId: string;
  entryClass: string;
  monthId: number;
  state: RoomSeedState;
}

// XP → class tier (§14). Boundaries from design-doc table.
const XP_TIERS: ReadonlyArray<{ max: number; name: string }> = [
  { max: 999, name: 'novice' },
  { max: 4999, name: 'junior' },
  { max: 14999, name: 'skilled' },
  { max: 59999, name: 'vanguard' },
  { max: 129999, name: 'commander' },
  { max: 199999, name: 'legendary' },
  { max: 299999, name: 'mythic' },
  { max: Number.POSITIVE_INFINITY, name: 'elite' },
];

export function xpToTier(xp: number): string {
  for (const tier of XP_TIERS) {
    if (xp <= tier.max) return tier.name;
  }
  return 'elite';
}

export type BurnoutTier = 'low' | 'med' | 'high';

export function burnoutToTier(b: number): BurnoutTier {
  if (b < 33) return 'low';
  if (b < 66) return 'med';
  return 'high';
}

export function macroStateHash(state: RoomSeedState): string {
  return [
    xpToTier(state.progress.xp),
    burnoutToTier(state.stats.burnout),
    state.flags.inRelationship ? '1' : '0',
    state.flags.hasKids ? '1' : '0',
    state.flags.inGradSchool ? '1' : '0',
  ].join('|');
}

// FNV-1a — small, fast, deterministic 32-bit hash. No dependencies.
function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function computeRoomSeed(input: RoomSeedInput): number {
  const stateHash = macroStateHash(input.state);
  return fnv1a(`${input.packId}|${input.entryClass}|${input.monthId}|${stateHash}`);
}

// mulberry32 — small, fast, deterministic PRNG. Same seed → same sequence.
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(rng: () => number, items: ReadonlyArray<T>): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<T>(
  rng: () => number,
  items: ReadonlyArray<T>,
  weight: (item: T) => number,
): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let r = rng() * total;
  for (const item of items) {
    r -= weight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
