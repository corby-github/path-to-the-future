import { useCallback, useEffect, useRef, useState } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { interpolate } from '../content/interpolate';

const SCENE_LINE_MS = 1600;

interface Props {
  scene: string[];
  vars?: Record<string, string | undefined>;
  onComplete: () => void;
}

export function ScenePlayer({ scene, vars, onComplete }: Props) {
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

  // Auto-advance every SCENE_LINE_MS. Timer callbacks run async after the
  // render is committed, so setState/onComplete calls here are safe.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (index + 1 >= scene.length) {
        onComplete();
      } else {
        setIndex(index + 1);
      }
    }, SCENE_LINE_MS);
    return () => window.clearTimeout(t);
  }, [index, scene.length, onComplete]);

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
          marginBottom: 48,
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: 560,
          animation: `scene-line-fade ${SCENE_LINE_MS}ms ease forwards`,
        }}
      >
        {interpolate(line, resolvedVars)}
      </p>
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
