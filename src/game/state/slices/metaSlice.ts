import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MetaState {
  version: string;
  lastSaveAt: number | null;
}

const initialState: MetaState = {
  version: '1.0.0',
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
