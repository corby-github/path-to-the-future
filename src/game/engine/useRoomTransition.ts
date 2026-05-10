import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { completeMonth } from '../state/slices/progressSlice';

const FADE_MS = 220;

export interface RoomTransition {
  fading: boolean;
  fadeMs: number;
  exitRoom: () => void;
}

export function useRoomTransition(): RoomTransition {
  const [fading, setFading] = useState(false);
  const dispatch = useAppDispatch();
  const currentMonth = useAppSelector((s) => s.progress.currentMonth);
  const fadingRef = useRef(false);

  const exitRoom = useCallback(() => {
    if (fadingRef.current) return;
    fadingRef.current = true;
    setFading(true);
    window.setTimeout(() => {
      dispatch(completeMonth(currentMonth));
      setFading(false);
      fadingRef.current = false;
    }, FADE_MS);
  }, [dispatch, currentMonth]);

  return { fading, fadeMs: FADE_MS, exitRoom };
}
