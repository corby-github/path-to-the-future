import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface FlagsState {
  inRelationship: boolean;
  hasKids: boolean;
  inGradSchool: boolean;
}

const initialState: FlagsState = {
  inRelationship: false,
  hasKids: false,
  inGradSchool: false,
};

const flagsSlice = createSlice({
  name: 'flags',
  initialState,
  reducers: {
    setFlag(state, action: PayloadAction<{ key: keyof FlagsState; value: boolean }>) {
      state[action.payload.key] = action.payload.value;
    },
    resetFlags() {
      return initialState;
    },
  },
});

export const { setFlag, resetFlags } = flagsSlice.actions;
export default flagsSlice.reducer;
