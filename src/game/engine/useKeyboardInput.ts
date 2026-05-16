import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

const MOVEMENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
]);

// Issue #92 — double-tap-to-sprint detection window. A second keydown
// within this many ms of the prior keyup (on the same direction key)
// enters sprint mode. Tuned to feel intentional (~280 ms is a comfortable
// double-tap rhythm — short enough to require deliberate action, long
// enough to forgive imprecise timing). Revisit in playtest.
const DOUBLE_TAP_WINDOW_MS = 280;

export type SprintDirection = 'up' | 'down' | 'left' | 'right';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  // Issue #92 — when non-null, the named direction is in sprint mode
  // (2× speed in that axis). Cleared on (a) keyup of the sprint key,
  // (b) keydown of any other direction key, or (c) window blur.
  sprintAxis: SprintDirection | null;
}

function keyToDirection(key: string): SprintDirection | null {
  const k = key.toLowerCase();
  if (k === 'arrowup' || k === 'w') return 'up';
  if (k === 'arrowdown' || k === 's') return 'down';
  if (k === 'arrowleft' || k === 'a') return 'left';
  if (k === 'arrowright' || k === 'd') return 'right';
  return null;
}

export function useKeyboardInput(): MutableRefObject<InputState> {
  const inputRef = useRef<InputState>({
    up: false, down: false, left: false, right: false,
    sprintAxis: null,
  });

  // Per-direction timestamps used for double-tap detection. A keydown
  // counts as the second tap of a double-tap iff the prior keyup
  // happened recently AND the prior keydown predated that keyup (i.e.,
  // a real tap-release-tap, not an OS key-repeat keydown which fires
  // without an intervening keyup).
  const lastKeyDownAtRef = useRef<Record<SprintDirection, number>>({
    up: 0, down: 0, left: 0, right: 0,
  });
  const lastKeyUpAtRef = useRef<Record<SprintDirection, number>>({
    up: 0, down: 0, left: 0, right: 0,
  });

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(e.key)) return;
      e.preventDefault();
      const dir = keyToDirection(e.key);
      if (!dir) return;
      const now = performance.now();

      // OS key-repeat fires keydown without an intervening keyup, so
      // lastKeyDownAt stays AFTER lastKeyUpAt while the key is held.
      // Repeats don't start a sprint and don't update timestamps.
      const wasReleased = lastKeyUpAtRef.current[dir] >= lastKeyDownAtRef.current[dir];

      if (wasReleased) {
        const elapsedSinceRelease = now - lastKeyUpAtRef.current[dir];
        const lastUpWasReal = lastKeyUpAtRef.current[dir] > 0;
        if (
          lastUpWasReal &&
          elapsedSinceRelease <= DOUBLE_TAP_WINDOW_MS
        ) {
          // Real tap-release-tap within the window → start sprint on
          // this direction. Replaces any prior sprintAxis.
          inputRef.current.sprintAxis = dir;
        } else if (
          inputRef.current.sprintAxis !== null &&
          inputRef.current.sprintAxis !== dir
        ) {
          // Fresh press of a DIFFERENT direction while sprinting cancels
          // sprint (issue #92 — "any other direction key ends sprint").
          inputRef.current.sprintAxis = null;
        }
        lastKeyDownAtRef.current[dir] = now;
      }

      inputRef.current[dir] = true;
    };

    const handleUp = (e: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(e.key)) return;
      e.preventDefault();
      const dir = keyToDirection(e.key);
      if (!dir) return;
      const now = performance.now();
      lastKeyUpAtRef.current[dir] = now;
      inputRef.current[dir] = false;
      // Releasing the sprint key clears the sprint state.
      if (inputRef.current.sprintAxis === dir) {
        inputRef.current.sprintAxis = null;
      }
    };

    const handleBlur = () => {
      // If the window loses focus, clear all keys so the player doesn't
      // keep walking when the user alt-tabs away. Sprint state also
      // clears — the player will need to re-double-tap on return.
      inputRef.current = {
        up: false, down: false, left: false, right: false,
        sprintAxis: null,
      };
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return inputRef;
}
