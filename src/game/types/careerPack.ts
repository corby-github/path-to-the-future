export interface Palette {
  background: string;
  ink: string;
  inkMuted: string;
  surface: string;
  accent: string;
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
  effects: Record<string, string>;
  advanceMonths?: number;
  consequence?: string;
  endsGame?: boolean;
}

export interface CareerPack {
  manifest: Manifest;
  months: MonthEntry[];
  decisions: DecisionDef[];
  events: EventDef[];
}
