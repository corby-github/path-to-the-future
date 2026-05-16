import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// Issue #89 — reactive misclick prompt. A player who instinctively
// clicks the canvas (the game is keyboard-only) gets no feedback today,
// so this hook surfaces the keys-widget illustration whenever they
// click the bound element. Auto-dismisses after MISCLICK_AUTO_DISMISS_MS
// OR on the next movement-key press, whichever comes first. Re-fires
// on every misclick (no session lock — the prompt is a gentle teach,
// not a punishment).
//
// Caller binds `containerRef` to the canvas wrapper and passes
// `suppressed` to disable the listener during modal-open / tutorial /
// other surfaces where a click on the canvas doesn't read as "the
// player thinks the game is broken." `version` increments each time
// the prompt fires so the consumer can use it as a React `key` to
// reset the pop-in animation on rapid re-fires.

const MISCLICK_AUTO_DISMISS_MS = 3000;

const MOVEMENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
]);

export interface MisclickPromptState {
  visible: boolean;
  version: number;
}

interface Options {
  // Element to listen on. The canvas wrapper inside DecisionRoom is the
  // intended target — listening on `document` would fire on modal
  // backdrop clicks too.
  containerRef: RefObject<HTMLElement | null>;
  // When true, the listener is detached and any currently-visible
  // prompt is hidden. Bind to `tutorialActive || modal-open || on-
  // keys-widget-tutorial-step` from the consuming room.
  suppressed: boolean;
}

export function useMisclickPrompt({ containerRef, suppressed }: Options): MisclickPromptState {
  // `internalVisible` reflects "the prompt was triggered and the
  // 3-second timer hasn't elapsed AND no movement key has fired."
  // The hook RETURNS `visible = internalVisible && !suppressed` so
  // suppression is a render-time gate, not a state side-effect —
  // avoids the react-hooks/set-state-in-effect rule.
  const [internalVisible, setInternalVisible] = useState(false);
  const [version, setVersion] = useState(0);
  const dismissTimerRef = useRef<number | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearDismissTimer();
    setInternalVisible(false);
  }, [clearDismissTimer]);

  // Pointer listener — attached only when not suppressed. The
  // suppressed branch returns immediately so no listener is bound and
  // no state-write happens during the suppressed window.
  useEffect(() => {
    if (suppressed) return;
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      setInternalVisible(true);
      setVersion((v) => v + 1);
      clearDismissTimer();
      dismissTimerRef.current = window.setTimeout(() => {
        setInternalVisible(false);
        dismissTimerRef.current = null;
      }, MISCLICK_AUTO_DISMISS_MS);
    };
    el.addEventListener('pointerdown', handler);
    return () => {
      el.removeEventListener('pointerdown', handler);
    };
  }, [containerRef, suppressed, clearDismissTimer]);

  // Movement-key listener — dismisses early when the player finally
  // figures out the keyboard. Window-scoped (not container-scoped)
  // because the keyboard listener for movement is also window-scoped
  // in useKeyboardInput.
  useEffect(() => {
    if (!internalVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (MOVEMENT_KEYS.has(e.key)) hide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [internalVisible, hide]);

  // Cleanup on unmount — leftover timeouts could fire after the room
  // has unmounted otherwise.
  useEffect(() => {
    return () => clearDismissTimer();
  }, [clearDismissTimer]);

  return { visible: internalVisible && !suppressed, version };
}
