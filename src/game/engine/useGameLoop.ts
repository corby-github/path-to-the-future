import { useEffect, useRef } from 'react';

type LoopCallback = (deltaSeconds: number) => void;

export function useGameLoop(callback: LoopCallback, active = true) {
  const callbackRef = useRef(callback);

  // Keep the ref pointed at the latest callback. Doing this in an effect
  // (rather than during render) avoids mutating refs at render time, which
  // React 19's react-hooks/refs rule rightly disallows.
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!active) return;

    let frameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      // Cap delta so a tab-switch doesn't teleport the player across the room
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      callbackRef.current(delta);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);
}
