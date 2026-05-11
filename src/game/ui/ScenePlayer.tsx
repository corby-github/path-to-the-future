import { useCallback, useEffect, useRef, useState } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { interpolate } from '../content/interpolate';

const DEFAULT_SCENE_LINE_MS = 1600;

interface Props {
  scene: string[];
  vars?: Record<string, string | undefined>;
  onComplete: () => void;
  /**
   * Per-line dwell time before auto-advance, in milliseconds. Defaults to
   * 1600ms (decision-scene cadence). Atmospheric intros / longer reads should
   * pass a larger value (e.g., 3500ms).
   */
  lineMs?: number;
}

export function ScenePlayer({ scene, vars, onComplete, lineMs }: Props) {
  const effectiveLineMs = lineMs ?? DEFAULT_SCENE_LINE_MS;
  const { palette } = useCareerPack();
  const [index, setIndex] = useState(0);

  // `advance` and `skip` are called from event handlers and timers — never
  // from a state updater. Pulling the boundary check out of setIndex avoids
  // the "setState during render" warning that fires when onComplete (which
  // is the parent's setState) is invoked inside React's state-commit phase.
  const advance = useCallback(() => {
    if (index + 1 >= scene.length) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  }, [index, scene.length, onComplete]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Auto-advance every effectiveLineMs. Timer callbacks run async after the
  // render is committed, so setState/onComplete calls here are safe.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (index + 1 >= scene.length) {
        onComplete();
      } else {
        setIndex(index + 1);
      }
    }, effectiveLineMs);
    return () => window.clearTimeout(t);
  }, [index, scene.length, onComplete, effectiveLineMs]);

  // Stable keyboard handler that reads the latest advance/skip via refs, so
  // we don't tear down + re-register the window listener every time `index`
  // (and therefore advance) changes identity.
  const advanceRef = useRef(advance);
  const skipRef = useRef(skip);
  useEffect(() => {
    advanceRef.current = advance;
    skipRef.current = skip;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipRef.current();
      } else {
        e.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const line = scene[index];
  if (line === undefined) return null;

  const resolvedVars = vars ?? {};

  return (
    <div
      onClick={advance}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <p
        key={index}
        style={{
          fontSize: 22,
          lineHeight: 1.5,
          margin: 0,
          marginBottom: 24,
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: 560,
          animation: `scene-line-fade ${effectiveLineMs}ms ease forwards`,
        }}
      >
        {interpolate(line, resolvedVars)}
      </p>

      {/* "Alive" indicator — three dots, staggered opacity pulse, always
          present below the scene line so the moment never feels static. */}
      <div
        style={{
          display: 'flex',
          gap: 7,
          marginBottom: 32,
        }}
        aria-hidden="true"
      >
        {[0, 0.16, 0.32].map((delay) => (
          <span
            key={delay}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: palette.inkMuted,
              animation: `scene-dot-pulse 1.4s ${delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 11,
          color: palette.inkMuted,
          margin: 0,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Any key for next line · [Esc] to skip scene
      </p>
    </div>
  );
}
