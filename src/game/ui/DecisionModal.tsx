import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppSelector } from '../state/hooks';
import { interpolate } from '../content/interpolate';
import { ScenePlayer } from './ScenePlayer';
import { EffectChips } from './EffectChips';
import type { DecisionDef } from '../types/careerPack';

type Phase = 'options' | 'scene' | 'flavor';

// Shared "footer hint" style for modal phases. Pulled out so all hints
// (options, flavor, event-body, scene-player) match: slightly darker than
// inkMuted and slightly larger than the previous 11px so the anchor reads
// clearly at the bottom of the modal.
const hintStyle: CSSProperties = {
  fontSize: 13,
  margin: 0,
  opacity: 0.7,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

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
        setPhase('scene');
      } else {
        setPhase('flavor');
      }
    },
    [decision.options, onChoose],
  );

  // Keyboard handling per phase (scene phase keyboard lives inside ScenePlayer).
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
      if (phase === 'flavor') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onContinue();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, decision.options.length, highlighted, pick, onContinue]);

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
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: 'min(720px, 90vw)',
          minHeight: 360,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: palette.background,
          color: palette.ink,
          border: `2px solid ${palette.ink}`,
          padding: '40px 48px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {phase === 'options' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                        fontFamily: 'inherit',
                        transition: 'background 120ms',
                      }}
                    >
                      <span style={{ opacity: 0.6, marginRight: 12 }}>{i + 1}.</span>
                      {interpolate(opt.label, vars)}
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ ...hintStyle, marginTop: 24, color: palette.ink }}>
              ↑↓ choose · Enter or 1–{decision.options.length} to confirm
            </p>
          </>
        )}

        {phase === 'scene' && scene.length > 0 && (
          <ScenePlayer
            scene={scene}
            vars={vars}
            onComplete={() => setPhase('flavor')}
          />
        )}

        {phase === 'flavor' && chosen && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                  marginBottom: 24,
                  opacity: 0.9,
                }}
              >
                {interpolate(chosen.flavor ?? '', vars)}
              </p>
              <EffectChips effects={chosen.effects} />
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
                  fontFamily: 'inherit',
                  alignSelf: 'flex-start',
                }}
              >
                Continue
              </button>
            </div>
            <p style={{ ...hintStyle, marginTop: 16, color: palette.ink }}>
              Press Enter or click Continue
            </p>
          </>
        )}
      </div>
    </div>
  );
}
