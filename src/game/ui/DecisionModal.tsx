import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppSelector } from '../state/hooks';
import { interpolate } from '../content/interpolate';
import { ScenePlayer } from './ScenePlayer';
import { EffectChips } from './EffectChips';
import { DecisionIcon } from './icons/modalIcons';
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
  // True on the finale month — the flavor phase drops the generic "YOU CHOSE"
  // header and decision-icon, centers the chosen line, and the button
  // reads "End" instead of "Continue". DecisionRoom toggles this on for
  // the hardcoded FINALE_DECISION.
  finale?: boolean;
}

export function DecisionModal({ decision, onChoose, onContinue, finale = false }: Props) {
  const { palette } = useCareerPack();
  const playerName = useAppSelector((s) => s.profile.name);
  const kidAName = useAppSelector((s) => s.profile.kidAName);
  const kidBName = useAppSelector((s) => s.profile.kidBName);

  const [phase, setPhase] = useState<Phase>('options');
  const [highlighted, setHighlighted] = useState(0);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);

  const vars: Record<string, string | undefined> = {
    playerName: playerName || 'you',
    kidA: kidAName,
    kidB: kidBName,
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
      data-component="DecisionModal"
      data-decision-id={decision.id}
      data-phase={phase}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 20, 20, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'inherit',
        // §4.1 — backdrop eases in over 220ms instead of snap-appearing
        // (was racing the 300ms door fade pre-#30).
        animation: 'decision-modal-pop 220ms ease-out',
      }}
    >
      <div
        data-region="dialog"
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
          position: 'relative',
          // §4.1 — dialog box rides in slightly after the backdrop with a
          // light scale-up. Total entrance reads as one deliberate beat.
          animation: 'decision-modal-dialog-pop 240ms ease-out',
        }}
      >
        {phase === 'options' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                data-region="modal-icon-slot"
                data-icon-id={decision.id}
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start',
                  marginBottom: 32,
                }}
              >
                <DecisionIcon decisionId={decision.id} palette={palette} />
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.7,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {interpolate(decision.prompt, vars)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {decision.options.map((opt, i) => {
                  const isActive = highlighted === i;
                  return (
                    <button
                      key={i}
                      data-option-index={i}
                      data-active={isActive || undefined}
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

        {phase === 'flavor' && chosen && !finale && (
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
              <div
                data-region="modal-icon-slot"
                data-icon-id={decision.id}
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <DecisionIcon decisionId={decision.id} palette={palette} />
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {interpolate(chosen.label, vars)}
                </p>
              </div>
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
                data-action="continue"
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

        {phase === 'flavor' && chosen && finale && (
          <>
            <div
              data-region="finale-result"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 18,
                padding: '12px 8px',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: palette.inkMuted,
                  margin: 0,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  opacity: 0.8,
                }}
              >
                Well, then.
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  margin: 0,
                  lineHeight: 1.4,
                  maxWidth: 540,
                }}
              >
                {interpolate(chosen.label, vars)}
              </p>
              {chosen.flavor && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: 480,
                    color: palette.inkMuted,
                    fontStyle: 'italic',
                  }}
                >
                  {interpolate(chosen.flavor, vars)}
                </p>
              )}
              <button
                data-action="continue"
                onClick={onContinue}
                style={{
                  marginTop: 8,
                  padding: '12px 36px',
                  background: 'transparent',
                  color: palette.ink,
                  border: `1px solid ${palette.ink}`,
                  fontSize: 13,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                End
              </button>
            </div>
            <p style={{ ...hintStyle, marginTop: 8, color: palette.ink, textAlign: 'center' }}>
              Press Enter to roll credits
            </p>
          </>
        )}
      </div>
    </div>
  );
}
