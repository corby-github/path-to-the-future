import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useStore } from 'react-redux';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import {
  ARCADE_THROTTLE_MS,
  setLastArcadeXpAt,
  XP_MINIGAME_WIN,
} from '../state/slices/progressSlice';
import { MinigameByVariant } from '../minigames/MinigameByVariant';
import { InteractableSprite } from '../rooms/sprites/InteractableSprite';
import { labelFor } from '../content/interactableLabel';
import type { InteractableDef } from '../types/careerPack';
import type { MinigameVariant } from '../types/room';
import type { RootState } from '../state/store';

// Arcade interactable modal (issue #31). Two states:
//   'menu' — list of every minigame variant in the closed MinigameVariant
//            union with per-variant throttle status. Picking one drops the
//            player into 'playing'.
//   'playing' — MinigameByVariant renders the picked game; when it
//            completes, we stamp the throttle clock (if awards fired) and
//            return to 'menu' so the player can chain another game.
//
// Closed-union note: for v1 every pack supports the same three variants.
// When v2 multi-pack lands, ArcadeModal will read the variant list off
// the pack manifest. Closed union is right-sized for v1.

const ARCADE_VARIANTS: ReadonlyArray<{ id: MinigameVariant; label: string; blurb: string }> = [
  { id: 'blackjack',       label: 'Blackjack',       blurb: 'Hit, stand, walk out even.' },
  { id: 'code-review',     label: 'Code Review',     blurb: 'Spot the bug. Beat the panel.' },
  { id: 'reaction-sprint', label: 'Reaction Sprint', blurb: 'Lock the stack. Hit the column.' },
  { id: 'pong',            label: 'Pong',            blurb: 'Two paddles. One ball. First to five.' },
  { id: 'forty-two',       label: '42',              blurb: 'The ultimate question. Four options.' },
];

interface Props {
  interactable: InteractableDef;
  onClose: () => void;
}

function formatCooldownRemaining(ms: number): string {
  if (ms <= 0) return '';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes <= 0) return `${totalSeconds}s`;
  return `${minutes}m`;
}

export function ArcadeModal({ interactable, onClose }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const lastArcadeXpAt = useAppSelector((s) => s.progress.lastArcadeXpAt);
  const currentMonth = useAppSelector((s) => s.progress.currentMonth);

  const dialogRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'menu' | 'playing'>('menu');
  const [playingVariant, setPlayingVariant] = useState<MinigameVariant | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  // Snapshot of "now" computed once on mount and stable across re-renders.
  // The cooldown labels are computed against this; live counting is
  // overkill for an arcade menu (resolved call #7).
  const [now] = useState(() => Date.now());

  // Per-variant throttle state. Frozen at mount per `now`, so labels stay
  // stable as the player navigates the menu.
  const variantStatus = useMemo(() => {
    return ARCADE_VARIANTS.map((v) => {
      const last = lastArcadeXpAt?.[v.id] ?? 0;
      const elapsed = now - last;
      const ready = elapsed >= ARCADE_THROTTLE_MS;
      const remaining = ready ? 0 : ARCADE_THROTTLE_MS - elapsed;
      return { ...v, ready, remaining };
    });
  }, [lastArcadeXpAt, now]);

  const handlePick = useCallback((idx: number) => {
    const target = variantStatus[idx];
    if (!target) return;
    setPlayingVariant(target.id);
    setPhase('playing');
  }, [variantStatus]);

  // Minigame finished. If the variant was throttle-ready when the player
  // launched the round, awards fired and we stamp the clock so the next
  // play of this variant cools down for an hour. Throttled rounds award
  // nothing and don't update the clock — the round just played for fun.
  const handleMinigameComplete = useCallback(() => {
    if (playingVariant) {
      const live = store.getState();
      const last = live.progress.lastArcadeXpAt?.[playingVariant] ?? 0;
      const wasEligible = Date.now() - last >= ARCADE_THROTTLE_MS;
      if (wasEligible) {
        dispatch(setLastArcadeXpAt({ variant: playingVariant, at: Date.now() }));
      }
    }
    setPlayingVariant(null);
    setPhase('menu');
  }, [playingVariant, store, dispatch]);

  // Keyboard. Only the menu phase steers via arrows / numbers / Enter; the
  // playing phase delegates to the minigame's own key handlers. Esc always
  // closes the entire modal regardless of phase — pressing Esc mid-game
  // exits the arcade without awarding (intentional: you walked away).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (phase !== 'menu') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, ARCADE_VARIANTS.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePick(highlighted);
      } else {
        const num = parseInt(e.key, 10);
        if (Number.isFinite(num) && num >= 1 && num <= ARCADE_VARIANTS.length) {
          e.preventDefault();
          handlePick(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, highlighted, handlePick, onClose]);

  // a11y: focus trap + restore (mirrors NPCModal pattern).
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
      if (prevFocus && document.contains(prevFocus) && typeof prevFocus.focus === 'function') {
        prevFocus.focus();
      }
    };
  }, []);

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20, 20, 20, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  };

  const menuDialogStyle: CSSProperties = {
    width: 'min(640px, 88vw)',
    background: palette.background,
    color: palette.ink,
    border: `2px solid ${palette.ink}`,
    boxShadow: `inset 0 0 0 2px ${palette.background}, inset 0 0 0 3px ${palette.ink}`,
    padding: '24px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    fontFamily: 'inherit',
    animation: 'npc-modal-pop 200ms ease-out',
  };

  const headerLabelStyle: CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    marginTop: 2,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.04em',
  };

  const hintStyle: CSSProperties = {
    fontSize: 11,
    margin: 0,
    marginTop: 8,
    opacity: 0.7,
    color: palette.ink,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  return (
    <div
      data-component="ArcadeModal"
      data-interactable-id={interactable.id}
      data-phase={phase}
      style={backdropStyle}
    >
      {phase === 'menu' ? (
        <div
          ref={dialogRef}
          data-region="dialog"
          style={menuDialogStyle}
          role="dialog"
          aria-modal="true"
          aria-label={labelFor(interactable)}
          tabIndex={-1}
        >
          <svg
            data-region="speaker-visual"
            viewBox="0 0 80 110"
            style={{ width: 100, height: 'auto', flexShrink: 0, alignSelf: 'center' }}
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

          <div data-region="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div>
              <p style={headerLabelStyle}>Arcade cabinet</p>
              <p style={titleStyle}>Insert imaginary coin.</p>
            </div>
            <div data-region="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variantStatus.map((v, i) => {
                const active = highlighted === i;
                return (
                  <button
                    key={v.id}
                    data-variant={v.id}
                    data-ready={v.ready || undefined}
                    data-active={active || undefined}
                    onClick={() => handlePick(i)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: active ? palette.surface : 'transparent',
                      color: palette.ink,
                      border: `1px solid ${palette.ink}`,
                      fontSize: 14,
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'background 120ms',
                    }}
                  >
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span>
                        <span style={{ opacity: 0.6, marginRight: 10 }}>{i + 1}.</span>
                        <span style={{ fontWeight: 600 }}>{v.label}</span>
                      </span>
                      <span
                        data-region="status"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: v.ready ? palette.positive : palette.inkMuted,
                          fontWeight: 600,
                        }}
                      >
                        {v.ready
                          ? `Ready · +${XP_MINIGAME_WIN} XP`
                          : `Cooling down · ${formatCooldownRemaining(v.remaining)}`}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{v.blurb}</span>
                  </button>
                );
              })}
            </div>
            <p style={hintStyle}>↑↓ choose · Enter / Space to play · Esc to walk away</p>
          </div>
        </div>
      ) : (
        playingVariant && (
          <div data-region="playing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <MinigameByVariant
              variant={playingVariant}
              monthId={currentMonth}
              mode="arcade"
              awardRewards={(now - (lastArcadeXpAt?.[playingVariant] ?? 0)) >= ARCADE_THROTTLE_MS}
              onComplete={handleMinigameComplete}
            />
            <p
              data-region="arcade-exit-hint"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                position: 'relative',
                top:-5,
                color: palette.background,
                margin: 0,
              }}
            >
              Esc to walk away from the cabinet
            </p>
          </div>
        )
      )}
    </div>
  );
}
