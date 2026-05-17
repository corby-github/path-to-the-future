import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { applyStatEffect } from '../state/slices/statsSlice';
import { parseEffect, type StatKey } from '../content/applyEffects';
import { labelFor, speakerHeaderFor } from '../content/interactableLabel';
import { interpolate } from '../content/interpolate';
import { TypewriterText } from './TypewriterText';
import { InteractableSprite } from '../rooms/sprites/InteractableSprite';
import type { InteractableDef, InteractableDialogue } from '../types/careerPack';

// §8b modal for NPC/object interactions. Distinct from §8 door decision
// modal — that one snaps in (systemic), this one reveals at a human cadence
// (embodied). SNES-dialog feel via Pixelify Sans font.

interface Props {
  interactable: InteractableDef;
  dialogue: InteractableDialogue;
  onClose: () => void;
}

// NPC dialog uses the same game font as the rest of the UI now (post-13b.2).
// Kept as a named constant so dialog-specific typography overrides can land
// in one place if we ever want them.
const NPC_DIALOG_FONT = 'inherit';

type Phase = 'prompt' | 'options' | 'flavor';

export function NPCModal({ interactable, dialogue, onClose }: Props) {
  const { palette, isReplay } = useCareerPack();
  const dispatch = useAppDispatch();
  // Issue #76 — pack content may reference player-supplied names via
  // `{playerName}` / `{kidA}` / `{kidB}`. Resolved against profile state
  // at render time so a mid-game ProfileModal edit propagates immediately.
  // Memoized so the React Compiler can preserve `useCallback`s below that
  // don't depend on these — re-creating the object every render would
  // invalidate downstream memoization unnecessarily.
  const playerName = useAppSelector((s) => s.profile.name);
  const kidAName = useAppSelector((s) => s.profile.kidAName);
  const kidBName = useAppSelector((s) => s.profile.kidBName);
  const vars = useMemo<Record<string, string | undefined>>(
    () => ({
      playerName: playerName || 'you',
      kidA: kidAName,
      kidB: kidBName,
    }),
    [playerName, kidAName, kidBName],
  );

  const tier = dialogue.tier;
  const options = dialogue.options ?? [];

  const dialogRef = useRef<HTMLDivElement>(null);

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
  // In replay mode (#33) the dialogue still plays but all effects are
  // suppressed — looking back at the past shouldn't change the present.
  const handleClose = useCallback(() => {
    if (isReplay) {
      onClose();
      return;
    }
    // Baseline social-interaction reward: talking to an NPC at all earns +1
    // network. Tier 2 picks layer their own effects on top — including
    // possible network costs (e.g. "Maybe later" → -1 network) — and those
    // are additive with this baseline. Objects don't grant the baseline.
    if (interactable.kind === 'npc') {
      dispatch(applyStatEffect({ stat: 'network', op: '+', magnitude: 1 }));
    }
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
  }, [interactable, chosen, dispatch, onClose, isReplay]);

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

  // a11y: focus trap + restore for keyboard users (Day 13c). On mount, save
  // the previously focused element and move focus into the dialog. On
  // unmount, restore. Tab key cycles focus within the dialog's focusable
  // children (option buttons in tier-2 options phase) instead of escaping
  // to background UI.
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog) dialog.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) {
        // No interactive children (prompt/flavor phases) — keep focus parked
        // on the dialog itself so Tab doesn't escape to background.
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      // Restore previously-focused element if it's still in the document
      // and focusable. Defensive — if the trigger was unmounted (rare here
      // since the interactable persists across the modal lifecycle), we
      // just no-op rather than throw.
      if (prevFocus && document.contains(prevFocus) && typeof prevFocus.focus === 'function') {
        prevFocus.focus();
      }
    };
    // Mount/unmount only — never re-trap mid-lifecycle.
  }, []);

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
    // Icon-left layout (#28): sprite as left column, content as right
    // column. See §23 NPCModal in the design doc.
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
    fontFamily: NPC_DIALOG_FONT,
    fontSize: 16,
    lineHeight: 1.55,
    // Subtle fade-in scale per §8b.
    animation: 'npc-modal-pop 200ms ease-out',
  };

  // Speaker header — "{Label} says…" for NPCs, "{Label}." for objects.
  // Sits above the prompt during `prompt` and `options` phases; skipped in
  // `flavor` because that phase is post-choice outcome, not the speaker.
  const speakerHeaderStyle: CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    fontFamily: NPC_DIALOG_FONT,
  };

  // Icon-left sprite — fixed-width column on the left of the dialog. Full
  // opacity (it's the speaker portrait, not background decoration).
  const speakerIconSvgStyle: CSSProperties = {
    width: 100,
    height: 'auto',
    flexShrink: 0,
    alignSelf: 'center',
  };

  // Right-column wrapper that holds header + prompt + options/flavor.
  // Replaces the top-level column flow that the watermark variant used.
  const contentColumnStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  };

  const hintStyle: CSSProperties = {
    fontSize: 11,
    margin: 0,
    marginTop: 4,
    opacity: 0.65,
    color: palette.ink,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: NPC_DIALOG_FONT,
  };

  return (
    <div
      data-component="NPCModal"
      data-interactable-id={interactable.id}
      data-interactable-kind={interactable.kind}
      data-tier={tier}
      data-phase={phase}
      style={backdropStyle}
      onPointerDown={(e) => {
        // Backdrop dismiss. Listen on pointerdown rather than click
        // because the tap that opens this modal can fire `click` on
        // the freshly-mounted backdrop (the modal mounts between the
        // opening pointerdown on the canvas and the matching
        // pointerup/click), which would immediately close it. Only
        // fire when the gesture started on the backdrop itself, not
        // on the dialog (where we want internal interactions).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        data-region="dialog"
        style={dialogBoxStyle}
        role="dialog"
        aria-modal="true"
        aria-label={labelFor(interactable, vars)}
        tabIndex={-1}
      >
        {/* Icon-left sprite — same art as the interactable the player
            just walked up to, full opacity, fixed-width left column. */}
        <svg
          data-region="speaker-visual"
          viewBox="0 0 80 110"
          style={speakerIconSvgStyle}
          aria-hidden="true"
        >
          <InteractableSprite
            art={interactable.art}
            kind={interactable.kind}
            x={40}
            y={55}
            palette={palette}
          />
        </svg>

        <div data-region="content" style={contentColumnStyle}>
        {phase === 'prompt' && (
          <>
            <p data-region="speaker-header" style={speakerHeaderStyle}>
              {speakerHeaderFor(interactable, vars)}
            </p>
            <TypewriterText
              key={`prompt-${interactable.id}`}
              text={interpolate(dialogue.prompt, vars)}
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
                {promptComplete ? 'Tap or press any key to close' : 'Tap or press any key to skip'}
              </p>
            )}
          </>
        )}

        {phase === 'options' && (
          <>
            <p data-region="speaker-header" style={speakerHeaderStyle}>
              {speakerHeaderFor(interactable, vars)}
            </p>
            <p style={{ margin: 0 }}>{interpolate(dialogue.prompt, vars)}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {options.map((opt, i) => {
                const active = highlighted === i;
                return (
                  <button
                    key={i}
                    data-option-index={i}
                    data-active={active || undefined}
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
                      fontFamily: NPC_DIALOG_FONT,
                      transition: 'background 120ms',
                    }}
                  >
                    <span style={{ opacity: 0.6, marginRight: 10 }}>{i + 1}.</span>
                    {interpolate(opt.label, vars)}
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
            <p style={{ margin: 0, fontWeight: 500 }}>{interpolate(chosen.label, vars)}</p>
            <TypewriterText
              key={`flavor-${chosenIdx}`}
              text={interpolate(chosen.flavor ?? '', vars)}
              onAdvance={handleAdvance}
            />
            <p style={hintStyle}>Tap or press to close</p>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
