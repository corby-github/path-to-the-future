import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import progressReducer from './slices/progressSlice';
import statsReducer from './slices/statsSlice';
import flagsReducer from './slices/flagsSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    progress: progressReducer,
    stats: statsReducer,
    flags: flagsReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
