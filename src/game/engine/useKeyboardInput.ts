import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

const MOVEMENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
]);

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function useKeyboardInput(): MutableRefObject<InputState> {
  const inputRef = useRef<InputState>({
    up: false, down: false, left: false, right: false,
  });

  useEffect(() => {
    const setKey = (key: string, pressed: boolean) => {
      const k = key.toLowerCase();
      if (k === 'arrowup' || k === 'w') inputRef.current.up = pressed;
      else if (k === 'arrowdown' || k === 's') inputRef.current.down = pressed;
      else if (k === 'arrowleft' || k === 'a') inputRef.current.left = pressed;
      else if (k === 'arrowright' || k === 'd') inputRef.current.right = pressed;
    };

    const handleDown = (e: KeyboardEvent) => {
      if (MOVEMENT_KEYS.has(e.key)) {
        e.preventDefault();
        setKey(e.key, true);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      if (MOVEMENT_KEYS.has(e.key)) {
        e.preventDefault();
        setKey(e.key, false);
      }
    };
    const handleBlur = () => {
      // If the window loses focus, clear all keys so the player doesn't
      // keep walking when the user alt-tabs away.
      inputRef.current = { up: false, down: false, left: false, right: false };
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
