import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  name: string;
  careerPack: string;
  entryClass: string;
  createdAt: number | null;
}

const initialState: ProfileState = {
  name: '',
  careerPack: 'software-engineering',
  entryClass: 'novice',
  createdAt: null,
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
