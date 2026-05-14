import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  name: string;
  careerPack: string;
  entryClass: string;
  createdAt: number | null;
  // True once the player has completed the full init flow (career → name →
  // class → intro). Drives whether App renders InitFlow or the game.
  initComplete: boolean;
  // Issue #76 — player-controlled kid names for the homeschool-parent pack.
  // Defaults match the original hardcoded names so old saves + SWE runs are
  // unaffected. Init flow only prompts for them when the active pack
  // declares `manifest.requiresKidNames`. `{kidA}` / `{kidB}` tokens in
  // pack content interpolate to these. `kidNamesSet` flips true once the
  // player completes (or skips with defaults) the kid-names init phase —
  // the phase resolver uses it to avoid re-prompting on every re-render.
  kidAName: string;
  kidBName: string;
  kidNamesSet: boolean;
}

const initialState: ProfileState = {
  name: '',
  careerPack: '',
  entryClass: '',
  createdAt: null,
  initComplete: false,
  kidAName: 'Hazel',
  kidBName: 'Bram',
  kidNamesSet: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Partial<ProfileState>>) {
      Object.assign(state, action.payload);
    },
    resetProfile() {
      return initialState;
    },
  },
});

export const { setProfile, resetProfile } = profileSlice.actions;
export default profileSlice.reducer;
