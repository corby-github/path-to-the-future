import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface StatsState {
  burnout: number;
  savings: number;
  network: number;
  health: number;
  relationship: number | null;
  technicalSkill: number;
  reputation: number;
}

const initialState: StatsState = {
  burnout: 0,
  savings: 0,
  network: 0,
  health: 100,
  relationship: null,
  technicalSkill: 0,
  reputation: 0,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats(state, action: PayloadAction<Partial<StatsState>>) {
      Object.assign(state, action.payload);
    },
    resetStats() {
      return initialState;
    },
  },
});

export const { setStats, resetStats } = statsSlice.actions;
export default statsSlice.reducer;
