import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProgressState {
  currentMonth: number;
  completedMonths: number[];
  xp: number;
  classTier: string;
}

const initialState: ProgressState = {
  currentMonth: 1,
  completedMonths: [],
  xp: 0,
  classTier: 'novice',
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
    },
    setCurrentMonth(state, action: PayloadAction<number>) {
      state.currentMonth = Math.max(1, Math.min(120, action.payload));
    },
    addXp(state, action: PayloadAction<number>) {
      state.xp = Math.max(0, state.xp + action.payload);
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
    },
  },
});

export const { completeMonth, setCurrentMonth, addXp, setClassTier, skipMonths } = progressSlice.actions;
export default progressSlice.reducer;
