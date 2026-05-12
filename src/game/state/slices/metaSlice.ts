import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STATE_VERSION } from '../persistence';

export interface MetaState {
  version: string;
  lastSaveAt: number | null;
  // First-run tutorial dismissal (Day 13c). Defaults to `false`; flipped
  // true when the player advances through the 3-step coachmark in their
  // first DecisionRoom. Resets to `false` on Begin Again (via `resetMeta`).
  // Old saves at v1.3.0 don't have this field — selectors read it with
  // `?? false` so missing/undefined → tutorial shows once on next play,
  // no STATE_VERSION bump required.
  tutorialDismissed: boolean;
}

// Pulled from persistence.STATE_VERSION so bumping the schema in one place
// (persistence.ts) cascades to fresh saves without a second literal to forget.
const initialState: MetaState = {
  version: STATE_VERSION,
  lastSaveAt: null,
  tutorialDismissed: false,
};

const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    markSaved(state, action: PayloadAction<number>) {
      state.lastSaveAt = action.payload;
    },
    dismissTutorial(state) {
      state.tutorialDismissed = true;
    },
    resetMeta() {
      return initialState;
    },
  },
});

export const { markSaved, dismissTutorial, resetMeta } = metaSlice.actions;
export default metaSlice.reducer;
