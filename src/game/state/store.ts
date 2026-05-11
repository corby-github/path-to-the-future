import { combineReducers, configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import progressReducer from './slices/progressSlice';
import statsReducer from './slices/statsSlice';
import flagsReducer from './slices/flagsSlice';
import historyReducer from './slices/historySlice';
import metaReducer from './slices/metaSlice';
import { loadPersistedState } from './persistence';

const rootReducer = combineReducers({
  profile: profileReducer,
  progress: progressReducer,
  stats: statsReducer,
  flags: flagsReducer,
  history: historyReducer,
  meta: metaReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPersistedState() as Partial<RootState> | undefined,
});

export type AppDispatch = typeof store.dispatch;
