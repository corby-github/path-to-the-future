import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STATE_VERSION } from '../persistence';

export interface MetaState {
  version: string;
  lastSaveAt: number | null;
  // First-run tutorial dismissal (Day 13c). Defaults to `false`; flipped
  // true when the player advances through the 4-step coachmark in their
  // first DecisionRoom. Resets to `false` on Begin Again (via `resetMeta`).
  // Old saves at v1.3.0 don't have this field — selectors read it with
  // `?? false` so missing/undefined → tutorial shows once on next play,
  // no STATE_VERSION bump required.
  tutorialDismissed: boolean;
  // Issue #92 — sprint tutorial step dismissal. Fires after ~5 s of
  // cumulative baseline movement (separate from the main coachmark);
  // flipped true when the player dismisses the sprint-teach overlay.
  // Same back-compat as `tutorialDismissed` — selectors read with
  // `?? false`. Resets on Begin Again.
  sprintTutorialDismissed: boolean;
}

// Pulled from persistence.STATE_VERSION so bumping the schema in one place
// (persistence.ts) cascades to fresh saves without a second literal to forget.
const initialState: MetaState = {
  version: STATE_VERSION,
  lastSaveAt: null,
  tutorialDismissed: false,
  sprintTutorialDismissed: false,
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
    dismissSprintTutorial(state) {
      state.sprintTutorialDismissed = true;
    },
    // Dev-only: force the tutorial to show again on the next DecisionRoom
    // mount without nuking the rest of meta (which `resetMeta` would do
    // alongside Begin Again). Used by the DevPanel "trigger" dropdown.
    resetTutorial(state) {
      state.tutorialDismissed = false;
      state.sprintTutorialDismissed = false;
    },
    resetMeta() {
      return initialState;
    },
  },
});

export const {
  markSaved,
  dismissTutorial,
  dismissSprintTutorial,
  resetTutorial,
  resetMeta,
} = metaSlice.actions;
export default metaSlice.reducer;
