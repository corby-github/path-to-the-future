import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { classTierForXp } from '../../content/classes';

// Flat per-decision XP grant. 120 decisions × 50 = 6000 XP → a clean Novice
// run lands mid-Skilled by month 120 (Junior threshold at ~month 20, Skilled
// at ~month 100). Tune here if the arc feels too fast or too slow.
export const XP_PER_DECISION = 50;

export interface ProgressState {
  currentMonth: number;
  completedMonths: number[];
  xp: number;
  classTier: string;
  // True once the player has completed month 120 (or an endsGame event fired).
  // Drives App.tsx routing to <EndgameScreen /> instead of <RoomRenderer />.
  // Once true, the only escape is "Begin again" which dispatches resetProgress.
  gameOver: boolean;
}

const initialState: ProgressState = {
  currentMonth: 1,
  completedMonths: [],
  xp: 0,
  classTier: 'novice',
  gameOver: false,
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
  resetProgress,
} = progressSlice.actions;
export default progressSlice.reducer;
