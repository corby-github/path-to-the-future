import { useCallback, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { completeMonth, cueMonthAdvance } from '../state/slices/progressSlice';
import { markSaved } from '../state/slices/metaSlice';
import { persistState } from '../state/persistence';
import type { RootState } from '../state/store';

const FADE_MS = 220;

export interface RoomTransition {
  fading: boolean;
  fadeMs: number;
  exitRoom: () => void;
}

export function useRoomTransition(): RoomTransition {
  const [fading, setFading] = useState(false);
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const currentMonth = useAppSelector((s) => s.progress.currentMonth);
  const fadingRef = useRef(false);

  const exitRoom = useCallback(() => {
    if (fadingRef.current) return;
    fadingRef.current = true;
    // Issue #30 — cue the HUD month-emit BEFORE flipping fade. The `+1 mo`
    // floater now fires AS the canvas dims, not 220ms later when the room
    // remounts. Reads as cause-and-effect ("a month passed, so the world
    // dimmed") instead of empty-then-explanation.
    dispatch(cueMonthAdvance());
    setFading(true);
    window.setTimeout(() => {
      dispatch(completeMonth(currentMonth));
      const savedAt = Date.now();
      dispatch(markSaved(savedAt));
      persistState(store.getState());
      setFading(false);
      fadingRef.current = false;
    }, FADE_MS);
  }, [dispatch, store, currentMonth]);

  return { fading, fadeMs: FADE_MS, exitRoom };
}
