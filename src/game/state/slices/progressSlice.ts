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
  },
});

export const { completeMonth, setCurrentMonth, addXp, setClassTier } = progressSlice.actions;
export default progressSlice.reducer;
