import { combineReducers, configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import progressReducer from './slices/progressSlice';
import statsReducer from './slices/statsSlice';
import flagsReducer from './slices/flagsSlice';
import historyReducer from './slices/historySlice';
import metaReducer from './slices/metaSlice';
import { loadPersistedState, persistState } from './persistence';

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

// Auto-persist on every dispatch. Originally persistence only fired
// from `useRoomTransition.exitRoom` (and a few one-offs), which meant
// anything done BEFORE the first room exit — career pick, name entry,
// class selection — got lost on refresh. The subscriber catches every
// state change at minimal cost; Redux dispatches in this game map to
// discrete events (decisions, room transitions, init steps), not
// per-frame movement, so the write cost is negligible.
store.subscribe(() => {
  persistState(store.getState());
});

export type AppDispatch = typeof store.dispatch;
