import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { classTierForXp } from '../../content/classes';

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
}

const initialState: ProgressState = {
  currentMonth: 1,
  completedMonths: [],
  xp: 0,
  classTier: 'novice',
  gameOver: false,
  viewingMonth: null,
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
  resetProgress,
} = progressSlice.actions;
export default progressSlice.reducer;
