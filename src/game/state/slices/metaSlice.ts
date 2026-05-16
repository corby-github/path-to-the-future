import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STATE_VERSION } from '../persistence';

export interface MetaState {
  version: string;
  lastSaveAt: number | null;
  // First-run tutorial dismissal (Day 13c). Defaults to `false`; flipped
  // true when the player advances through the multi-step coachmark in
  // their first DecisionRoom (5 steps as of v2.0.32 — intro, status bar,
  // movement, sprint, objects & people, door). Resets to `false` on
  // Begin Again (via `resetMeta`). Old saves at v1.3.0 don't have this
  // field — selectors read it with `?? false` so missing/undefined →
  // tutorial shows once on next play, no STATE_VERSION bump required.
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
    // Dev-only: force the tutorial to show again on the next DecisionRoom
    // mount without nuking the rest of meta (which `resetMeta` would do
    // alongside Begin Again). Used by the DevPanel "trigger" dropdown.
    resetTutorial(state) {
      state.tutorialDismissed = false;
    },
    resetMeta() {
      return initialState;
    },
  },
});

export const {
  markSaved,
  dismissTutorial,
  resetTutorial,
  resetMeta,
} = metaSlice.actions;
export default metaSlice.reducer;
