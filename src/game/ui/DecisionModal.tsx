import { useCallback, useEffect, useState } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppSelector } from '../state/hooks';
import { interpolate } from '../content/interpolate';
import type { DecisionDef } from '../types/careerPack';

const SCENE_LINE_MS = 1600;

type Phase = 'options' | 'scene' | 'flavor';

interface Props {
  decision: DecisionDef;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

export function DecisionModal({ decision, onChoose, onContinue }: Props) {
  const { palette } = useCareerPack();
  const playerName = useAppSelector((s) => s.profile.name);

  const [phase, setPhase] = useState<Phase>('options');
  const [highlighted, setHighlighted] = useState(0);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);

  const vars: Record<string, string | undefined> = {
    playerName: playerName || 'you',
  };

  const chosen = chosenIndex !== null ? decision.options[chosenIndex] : null;
  const scene = chosen?.scene ?? [];

  const pick = useCallback(
    (index: number) => {
      onChoose(index);
      setChosenIndex(index);
      const next = decision.options[index];
      if (next.scene && next.scene.length > 0) {
        setSceneIndex(0);
        setPhase('scene');
      } else {
        setPhase('flavor');
      }
    },
    [decision.options, onChoose],
  );

  const advanceScene = useCallback(() => {
    setSceneIndex((current) => {
      if (current + 1 >= scene.length) {
        setPhase('flavor');
        return current;
      }
      return current + 1;
    });
  }, [scene.length]);

  const skipScene = useCallback(() => setPhase('flavor'), []);

  // Auto-advance the scene every SCENE_LINE_MS.
  useEffect(() => {
    if (phase !== 'scene') return;
    const t = window.setTimeout(() => {
      if (sceneIndex + 1 >= scene.length) {
        setPhase('flavor');
      } else {
        setSceneIndex(sceneIndex + 1);
      }
    }, SCENE_LINE_MS);
    return () => window.clearTimeout(t);
  }, [phase, sceneIndex, scene.length]);

  // Keyboard handling per phase.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'options') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlighted((i) => Math.min(i + 1, decision.options.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlighted((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick(highlighted);
        } else {
          const num = parseInt(e.key, 10);
          if (Number.isFinite(num) && num >= 1 && num <= decision.options.length) {
            e.preventDefault();
            pick(num - 1);
          }
        }
        return;
      }
      if (phase === 'scene') {
        if (e.key === 'Escape') {
          e.preventDefault();
          skipScene();
        } else {
          e.preventDefault();
          advanceScene();
        }
        return;
      }
      if (phase === 'flavor') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onContinue();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, decision.options.length, highlighted, pick, advanceScene, skipScene, onContinue]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 20, 20, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(720px, 90vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: palette.background,
          color: palette.ink,
          border: `2px solid ${palette.ink}`,
          padding: '40px 48px',
          boxSizing: 'border-box',
        }}
      >
        {phase === 'options' && (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, marginBottom: 32 }}>
              {interpolate(decision.prompt, vars)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {decision.options.map((opt, i) => {
                const isActive = highlighted === i;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      background: isActive ? palette.surface : 'transparent',
                      color: palette.ink,
                      border: `1px solid ${palette.ink}`,
                      fontSize: 14,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      fontFamily: 'system-ui, sans-serif',
                      transition: 'background 120ms',
                    }}
                  >
                    <span style={{ opacity: 0.6, marginRight: 12 }}>{i + 1}.</span>
                    {interpolate(opt.label, vars)}
                  </button>
                );
              })}
            </div>
            <p
              style={{
                fontSize: 11,
                color: palette.inkMuted,
                margin: 0,
                marginTop: 24,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              ↑↓ choose · Enter or 1–{decision.options.length} to confirm
            </p>
          </>
        )}

        {phase === 'scene' && scene[sceneIndex] !== undefined && (
          <div
            onClick={advanceScene}
            style={{
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <p
              key={sceneIndex}
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
              {interpolate(scene[sceneIndex], vars)}
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
        )}

        {phase === 'flavor' && chosen && (
          <>
            <p
              style={{
                fontSize: 13,
                color: palette.inkMuted,
                margin: 0,
                marginBottom: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              You chose
            </p>
            <p style={{ fontSize: 18, fontWeight: 500, margin: 0, marginBottom: 24 }}>
              {interpolate(chosen.label, vars)}
            </p>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 32,
                opacity: 0.9,
              }}
            >
              {interpolate(chosen.flavor ?? '', vars)}
            </p>
            <button
              onClick={onContinue}
              style={{
                padding: '12px 32px',
                background: 'transparent',
                color: palette.ink,
                border: `1px solid ${palette.ink}`,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Continue
            </button>
            <p
              style={{
                fontSize: 11,
                color: palette.inkMuted,
                margin: 0,
                marginTop: 16,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Press Enter or click Continue
            </p>
          </>
        )}
      </div>
    </div>
  );
}
