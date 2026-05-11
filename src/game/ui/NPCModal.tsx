import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { applyStatEffect } from '../state/slices/statsSlice';
import { parseEffect, type StatKey } from '../content/applyEffects';
import { TypewriterText } from './TypewriterText';
import type { InteractableDef, InteractableDialogue } from '../types/careerPack';

// §8b modal for NPC/object interactions. Distinct from §8 door decision
// modal — that one snaps in (systemic), this one reveals at a human cadence
// (embodied). SNES-dialog feel via Pixelify Sans font.

interface Props {
  interactable: InteractableDef;
  dialogue: InteractableDialogue;
  onClose: () => void;
}

const SNES_FONT = '"Pixelify Sans", "SF Mono", Menlo, monospace';

type Phase = 'prompt' | 'options' | 'flavor';

export function NPCModal({ interactable, dialogue, onClose }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  const tier = dialogue.tier;
  const options = dialogue.options ?? [];

  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [promptComplete, setPromptComplete] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const chosen = chosenIdx !== null ? options[chosenIdx] : null;

  // Derived phase. Computed from {chosenIdx, tier, promptComplete} so we
  // don't need a setState-in-effect to advance from 'prompt' to 'options'.
  // - chosen: 'flavor' (player picked an option)
  // - Tier 2 with the prompt fully revealed: 'options'
  // - otherwise: 'prompt'
  const phase: Phase =
    chosenIdx !== null
      ? 'flavor'
      : tier === 2 && promptComplete
        ? 'options'
        : 'prompt';

  const handlePromptComplete = useCallback(() => setPromptComplete(true), []);

  const handlePick = useCallback((idx: number) => {
    setChosenIdx(idx);
  }, []);

  // Defer effects to close-time (mirrors DecisionRoom pattern — HUD floating
  // delta should land after the modal closes, not silently behind it).
  const handleClose = useCallback(() => {
    if (chosen) {
      for (const [stat, expr] of Object.entries(chosen.effects)) {
        const parsed = parseEffect(expr);
        if (!parsed) continue;
        dispatch(applyStatEffect({
          stat: stat as StatKey,
          op: parsed.op,
          magnitude: parsed.magnitude,
        }));
      }
    }
    onClose();
  }, [chosen, dispatch, onClose]);

  const handleAdvance = useCallback(() => {
    // Tier 1 prompt: advance closes the modal.
    if (phase === 'prompt' && tier === 1) {
      handleClose();
      return;
    }
    // Tier 2 flavor: advance closes.
    if (phase === 'flavor') {
      handleClose();
    }
  }, [phase, tier, handleClose]);

  // Option-picking keyboard. Only active during 'options' phase; the prompt
  // and flavor phases delegate their key handling to TypewriterText.
  useEffect(() => {
    if (phase !== 'options') return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, options.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePick(highlighted);
      } else {
        const num = parseInt(e.key, 10);
        if (Number.isFinite(num) && num >= 1 && num <= options.length) {
          e.preventDefault();
          handlePick(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, options.length, highlighted, handlePick]);

  // Escape always closes, in every phase. Bound at the modal level so it
  // wins over any phase-specific guard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // If we're closing from options-phase (no choice made), no effects fire.
        // If we're in flavor with a choice, effects DO fire (player committed).
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20, 20, 20, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  };

  const dialogBoxStyle: CSSProperties = {
    width: 'min(640px, 88vw)',
    minHeight: 200,
    background: palette.background,
    color: palette.ink,
    // Chunky border evoking the SNES dialog box, lined twice for a tiny
    // bezel effect without overcommitting on retro.
    border: `2px solid ${palette.ink}`,
    boxShadow: `inset 0 0 0 2px ${palette.background}, inset 0 0 0 3px ${palette.ink}`,
    padding: '20px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontFamily: SNES_FONT,
    fontSize: 16,
    lineHeight: 1.55,
    // Subtle fade-in scale per §8b.
    animation: 'npc-modal-pop 200ms ease-out',
  };

  const hintStyle: CSSProperties = {
    fontSize: 11,
    margin: 0,
    marginTop: 4,
    opacity: 0.65,
    color: palette.ink,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: SNES_FONT,
  };

  return (
    <div style={backdropStyle}>
      <div style={dialogBoxStyle} role="dialog" aria-label={`${interactable.kind} interaction`}>
        {phase === 'prompt' && (
          <>
            <TypewriterText
              key={`prompt-${interactable.id}`}
              text={dialogue.prompt}
              onComplete={handlePromptComplete}
              onAdvance={handleAdvance}
            />
            {/* "Ready" indicator once reveal is complete (Tier 1 only —
                Tier 2 auto-transitions to options instead). */}
            {tier === 1 && promptComplete && (
              <span style={{ alignSelf: 'flex-end', fontSize: 16 }}>▼</span>
            )}
            {tier === 1 && (
              <p style={hintStyle}>
                {promptComplete ? 'Any key to close' : 'Any key to skip'}
              </p>
            )}
          </>
        )}

        {phase === 'options' && (
          <>
            <p style={{ margin: 0 }}>{dialogue.prompt}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {options.map((opt, i) => {
                const active = highlighted === i;
                return (
                  <button
                    key={i}
                    onClick={() => handlePick(i)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: active ? palette.surface : 'transparent',
                      color: palette.ink,
                      border: `1px solid ${palette.ink}`,
                      fontSize: 15,
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      fontFamily: SNES_FONT,
                      transition: 'background 120ms',
                    }}
                  >
                    <span style={{ opacity: 0.6, marginRight: 10 }}>{i + 1}.</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p style={hintStyle}>↑↓ choose · Enter / Space to confirm · Esc to leave</p>
          </>
        )}

        {phase === 'flavor' && chosen && (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                opacity: 0.7,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              You chose
            </p>
            <p style={{ margin: 0, fontWeight: 500 }}>{chosen.label}</p>
            <TypewriterText
              key={`flavor-${chosenIdx}`}
              text={chosen.flavor ?? ''}
              onAdvance={handleAdvance}
            />
            <p style={hintStyle}>Press to close</p>
          </>
        )}
      </div>
    </div>
  );
}
