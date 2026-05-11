import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  name: string;
  careerPack: string;
  entryClass: string;
  createdAt: number | null;
  // True once the player has completed the full init flow (career → name →
  // class → intro). Drives whether App renders InitFlow or the game.
  initComplete: boolean;
}

const initialState: ProfileState = {
  name: '',
  careerPack: '',
  entryClass: '',
  createdAt: null,
  initComplete: false,
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
