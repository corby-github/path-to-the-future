import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STATE_VERSION } from '../persistence';

export interface MetaState {
  version: string;
  lastSaveAt: number | null;
}

// Pulled from persistence.STATE_VERSION so bumping the schema in one place
// (persistence.ts) cascades to fresh saves without a second literal to forget.
const initialState: MetaState = {
  version: STATE_VERSION,
  lastSaveAt: null,
};

const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    markSaved(state, action: PayloadAction<number>) {
      state.lastSaveAt = action.payload;
    },
    resetMeta() {
      return initialState;
    },
  },
});

export const { markSaved, resetMeta } = metaSlice.actions;
export default metaSlice.reducer;
