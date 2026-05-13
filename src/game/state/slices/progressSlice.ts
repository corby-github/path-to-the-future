import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { classTierForXp } from '../../content/classes';
import type { MinigameVariant } from '../../types/room';

// XP economy. Baseline accumulation (per decision) is small and steady; the
// jumps come from minigame wins and decision options tagged with an explicit
// `xp` effect (promotions, new jobs, big stretches). 120-decision arcs land
// a "play it safe" Novice in low-Skilled (~6000 XP) and a "go for it" run
// in mid-to-high-Skilled (~9-13000 XP). Vanguard (15000+) stays out of reach
// for v1.
export const XP_PER_DECISION = 50;
export const XP_MINIGAME_WIN = 250;
export const XP_MINIGAME_PARTIAL = 100;
export const XP_MINIGAME_FAIL = 25;

export interface ProgressState {
  currentMonth: number;
  completedMonths: number[];
  xp: number;
  classTier: string;
  // True once the player has completed month 120 (or an endsGame event fired).
  // Drives App.tsx routing to <EndgameScreen /> instead of <RoomRenderer />.
  // Once true, the only escape is "Begin again" which dispatches resetProgress.
  gameOver: boolean;
  // Backward-door replay target (issue #33). `null` = viewing the live
  // current month. When non-null, room rendering uses this id instead of
  // `currentMonth`, and behaviors are suppressed (no decisions fire, no
  // events roll, NPC dialogue effects are dropped, the forward door
  // becomes a "return" door). See §11.x Backward replay.
  viewingMonth: number | null;
  // Fade-start cue for the HUD month-emit (issue #30). Incrementing nonce
  // dispatched by `useRoomTransition.exitRoom` at the instant the canvas
  // begins to fade — lets the Hud's `+1 mo` floater fire as cause for the
  // visual "world dims" beat, instead of trailing it. The subsequent
  // `completeMonth` advance then suppresses its natural duplicate emit.
  monthAdvanceCueNonce: number;
  // Issue #31 — last epoch-ms timestamp an arcade play awarded XP for each
  // minigame variant. The arcade interactable lets the player drop into
  // any minigame at will, but XP / stat effects are throttled to once per
  // real-time hour per variant. 0 means "never awarded yet" (ready). The
  // scheduled minigame slots (months 32 / 60 / 90) don't touch this — only
  // arcade plays write it.
  lastArcadeXpAt: Record<MinigameVariant, number>;
}

export const ARCADE_THROTTLE_MS = 60 * 60 * 1000;

const initialLastArcadeXpAt: Record<MinigameVariant, number> = {
  blackjack: 0,
  'code-review': 0,
  'reaction-sprint': 0,
};

const initialState: ProgressState = {
  currentMonth: 1,
  completedMonths: [],
  xp: 0,
  classTier: 'novice',
  gameOver: false,
  viewingMonth: null,
  monthAdvanceCueNonce: 0,
  lastArcadeXpAt: { ...initialLastArcadeXpAt },
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    completeMonth(state, action: PayloadAction<number>) {
      const id = action.payload;
      if (!state.completedMonths.includes(id)) {
        state.completedMonths.push(id);
      }
      state.currentMonth = Math.min(120, id + 1);
      // Last month completed → game over.
      if (id >= 120) state.gameOver = true;
    },
    setCurrentMonth(state, action: PayloadAction<number>) {
      state.currentMonth = Math.max(1, Math.min(120, action.payload));
    },
    addXp(state, action: PayloadAction<number>) {
      state.xp = Math.max(0, state.xp + action.payload);
      // Tier follows xp automatically (§14 "Class tier updates automatically as
      // XP crosses thresholds"). Single source of truth — every caller of addXp
      // gets the promotion for free.
      state.classTier = classTierForXp(state.xp).id;
    },
    setClassTier(state, action: PayloadAction<string>) {
      state.classTier = action.payload;
    },
    // Jump multiple months at once (event.advanceMonths). Marks each skipped
    // month as completed and clamps at 120.
    skipMonths(state, action: PayloadAction<number>) {
      const n = action.payload;
      if (n <= 0) return;
      for (let i = 0; i < n; i++) {
        const id = state.currentMonth + i;
        if (id >= 1 && id <= 120 && !state.completedMonths.includes(id)) {
          state.completedMonths.push(id);
        }
      }
      state.currentMonth = Math.min(120, state.currentMonth + n);
      if (state.currentMonth >= 120 && state.completedMonths.includes(120)) {
        state.gameOver = true;
      }
    },
    setGameOver(state, action: PayloadAction<boolean>) {
      state.gameOver = action.payload;
    },
    // Issue #33 — enter backward-replay view. Payload is the past month to
    // view. Caller is responsible for skipping consequence rooms (they're
    // "punchlines" per user design call; replay isn't for them). Month 1
    // (2020 NarrativeRoom intro) is also off-limits — one-time framing beat.
    enterReplay(state, action: PayloadAction<number>) {
      const target = action.payload;
      if (target < 2) return;
      if (target >= state.currentMonth) return; // can't view future or current
      state.viewingMonth = target;
    },
    // Issue #33 — exit replay, return to the live current month.
    exitReplay(state) {
      state.viewingMonth = null;
    },
    // Issue #30 — cue the HUD that a forward month advance is starting RIGHT
    // NOW (room is beginning to fade). HUD watches the nonce, emits the
    // `+1 mo` floater on change, and dedups against the subsequent
    // `completeMonth` advance. Dispatched by `useRoomTransition.exitRoom`
    // before flipping the fade flag.
    cueMonthAdvance(state) {
      state.monthAdvanceCueNonce += 1;
    },
    // Issue #31 — stamp the throttle clock for a minigame variant when an
    // arcade play awards XP. Dispatched only when the play was eligible
    // (>= ARCADE_THROTTLE_MS since the last stamped play of the same
    // variant); the caller computes eligibility. Older saves without this
    // field rehydrate via STATE_VERSION mismatch (1.3.0 → 1.4.0 discards).
    setLastArcadeXpAt(state, action: PayloadAction<{ variant: MinigameVariant; at: number }>) {
      state.lastArcadeXpAt[action.payload.variant] = action.payload.at;
    },
    resetProgress() {
      return initialState;
    },
  },
});

export const {
  completeMonth,
  setCurrentMonth,
  addXp,
  setClassTier,
  skipMonths,
  setGameOver,
  enterReplay,
  exitReplay,
  cueMonthAdvance,
  setLastArcadeXpAt,
  resetProgress,
} = progressSlice.actions;
export default progressSlice.reducer;
