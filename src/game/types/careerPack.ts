export interface Palette {
  background: string;
  ink: string;
  inkMuted: string;
  surface: string;
  accent: string;
  // Positive-delta color. Used for HUD floating "+N" deltas and EffectChips
  // positive values. Must be a muted hue that survives era-mood HSL shifts
  // (e.g., a sage / olive green next to the warm-brown accent).
  positive: string;
  player: string;
  playerInk: string;
  // NPC body fills + outline strokes (v2.0.15) — split out from `accent` so
  // people stop reading the same color as doors / furniture / arcade cabinet.
  // Adult/child split mirrors the player/playerInk pattern.
  npcAdult: string;
  npcAdultInk: string;
  npcChild: string;
  npcChildInk: string;
}

export interface EraMood {
  saturation: number;
  lightness: number;
  hueShift: number;
}

export interface EntryClassStartingStats {
  burnout?: number;
  savings?: number;
  network?: number;
  health?: number;
  relationship?: number | null;
  technicalSkill?: number;
  reputation?: number;
}

export interface EntryClass {
  label: string;
  startingXp: number;
  startingStats: EntryClassStartingStats;
}

export interface ClassLabel {
  label: string;
  role?: string;
}

export interface Manifest {
  id: string;
  name: string;
  tagline: string;
  palette: Palette;
  eras: Record<string, EraMood>;
  entryClasses: Record<string, EntryClass>;
  // Probability that an event fires after each decision (0..1).
  // Optional with a default of 0.4 if omitted.
  eventChance?: number;
  // Pre-game narrative shown after class pick, before the first month (§16).
  // Each entry is a single line; lines fade in/out sequentially via ScenePlayer.
  // Supports {playerName} interpolation.
  intro?: string[];
  // Short flavor lines randomly drawn during the post-decision / post-event
  // beat (canvas blurs, this line floats centered while the HUD animates).
  // Career-pack themed: SWE uses "...and life goes on" / etc.; a nurse pack
  // might use shift-themed copy.
  monthTransitions?: string[];
  // Per §26 (v2.0): optional display-name override for canonical stat keys.
  // Keys are the canonical engine stat names from §7 (decisions/events JSON
  // and computeScore keep referencing those names). Values are the strings
  // the HUD / EffectChips / EndgameScreen show. Omitted keys default to the
  // engine label. One source of truth, one fallback. SWE pack omits this
  // entirely and renders with default labels.
  statLabels?: Partial<Record<StatLabelKey, string>>;
  // Per-pack display override for class tiers (§14). Keys are class IDs from
  // CLASSES (novice / junior / skilled / vanguard / commander / legendary /
  // mythic / oracle). Values override the universal labels in ClassPicker and
  // Hud. Omitted keys fall through to the universal CLASSES.label / .role.
  // SWE pack omits this entirely (universal labels are already SWE-flavored).
  // Homeschool pack overrides all 8 tiers for the parenting register.
  classLabels?: Partial<Record<string, ClassLabel>>;
  // Issue #76 — number of kid-name slots the pack expects the player to
  // fill during init. Homeschool sets `2` (kidA = older, kidB = younger).
  // When set, InitFlow inserts a kid-name phase after the career pick;
  // content can interpolate `{kidA}` / `{kidB}` against `profile.kidAName`
  // / `profile.kidBName`. Packs that don't reference kids omit the field
  // entirely (SWE) and the init phase is skipped.
  requiresKidNames?: number;
}

// Canonical stat keys eligible for relabeling. Mirrors §7 plus `xp`. Kept as
// a string literal union here (not imported from applyEffects.ts) so the
// content-type module stays free of state-slice imports.
export type StatLabelKey =
  | 'burnout'
  | 'savings'
  | 'network'
  | 'health'
  | 'relationship'
  | 'technicalSkill'
  | 'reputation'
  | 'xp';

export type MonthRoomType = 'decision' | 'minigame' | 'narrative' | 'consequence';

export interface MonthEntry {
  id: number;
  year: number;
  monthNum: number;
  era: string;
  theme?: string;
  roomType?: MonthRoomType;
  title?: string;
  body?: string;
  continueLabel?: string;
  variant?: string;
}

export interface DecisionOption {
  label: string;
  effects: Record<string, string>;
  flavor?: string;
  // Optional cinematic scene played after the option is chosen and before the
  // flavor confirmation. Each entry is a single line; lines fade in/out
  // sequentially. Missing or empty = skip straight to flavor.
  scene?: string[];
}

export interface DecisionDef {
  id: string;
  // `pool` is content metadata for human authors (e.g. `'universal'`,
  // `'swe'`, `'homeschool-parent'`). The engine never branches on it —
  // selectDecision / rollEvents pull from one combined pack-merged array
  // already. Typed as `string` so adding a new pack doesn't require
  // touching this union per §26.
  pool: string;
  tags: string[];
  requires?: Record<string, string>;
  weight: number;
  prompt: string;
  options: DecisionOption[];
}

export interface EventDef {
  id: string;
  // `pool` is content metadata for human authors (e.g. `'universal'`,
  // `'swe'`, `'homeschool-parent'`). The engine never branches on it —
  // selectDecision / rollEvents pull from one combined pack-merged array
  // already. Typed as `string` so adding a new pack doesn't require
  // touching this union per §26.
  pool: string;
  era: string[];
  tags: string[];
  weight: number;
  trigger?: Record<string, string>;
  title: string;
  body: string;
  scene?: string[];
  effects: Record<string, string>;
  flags?: Partial<{ inRelationship: boolean; hasKids: boolean; inGradSchool: boolean }>;
  advanceMonths?: number;
  consequence?: string;
  endsGame?: boolean;
}

// NPC / object dialogue per §8b. tier=1 is read-only flavor (no options,
// any key advances/closes). tier=2 is an interactive prompt with options
// that carry stat effects, similar to DecisionDef options but lighter-touch.
export interface InteractableDialogue {
  tier: 1 | 2;
  prompt: string;
  options?: { label: string; effects: Record<string, string>; flavor?: string }[];
  requires?: Record<string, string>;
}

export interface InteractableDef {
  id: string;
  kind: 'npc' | 'object';
  // Short display label shown under the [E] hint when the player is
  // adjacent (e.g. "Plant", "Intern", "Boss's boss"). Optional for
  // backward-compat with packs that haven't authored labels yet; the
  // renderer falls back to a kind-cased derivation of `id`.
  label?: string;
  // Sprite token — later resolved to SVG art. For Day 13a we render
  // kind-based shapes; real art tokens come in 13b.
  art: string;
  // Optional feature flag — when set, E-key opens a feature-specific
  // modal instead of the standard NPCModal dialogue flow. 'arcade' routes
  // to ArcadeModal (issue #31): a menu of all minigames the current pack
  // supports, with XP throttled to once per real-time hour per game.
  // Dialogues are still authored but only consulted when no feature
  // takes priority.
  feature?: 'arcade';
  tags: string[];
  weight: number;
  requires?: Record<string, string>;
  dialogues: InteractableDialogue[];
}

export interface CareerPack {
  manifest: Manifest;
  months: MonthEntry[];
  decisions: DecisionDef[];
  events: EventDef[];
  interactables: InteractableDef[];
}
