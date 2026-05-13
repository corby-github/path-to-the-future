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
}

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
  pool: 'universal' | 'swe';
  tags: string[];
  requires?: Record<string, string>;
  weight: number;
  prompt: string;
  options: DecisionOption[];
}

export interface EventDef {
  id: string;
  pool: 'universal' | 'swe';
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
