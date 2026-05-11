import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STAT_RANGES, resolveStatValue, type StatKey, type EffectOp } from '../../content/applyEffects';

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
    applyStatEffect(state, action: PayloadAction<{ stat: StatKey; op: EffectOp; magnitude: number }>) {
      const { stat, op, magnitude } = action.payload;
      const range = STAT_RANGES[stat];
      const current = state[stat];
      const next = resolveStatValue(current, { op, magnitude }, range);

      // Design doc §7: "Going to 0 ends relationship." On reaching 0 or below
      // via an effect, the relationship transitions back to null (single).
      if (stat === 'relationship' && next <= 0) {
        state.relationship = null;
      } else {
        (state as Record<StatKey, number | null>)[stat] = next;
      }
    },
    resetStats() {
      return initialState;
    },
  },
});

export const { setStats, applyStatEffect, resetStats } = statsSlice.actions;
export default statsSlice.reducer;
