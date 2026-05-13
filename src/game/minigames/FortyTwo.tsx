import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { addXp, XP_MINIGAME_WIN, XP_MINIGAME_FAIL } from '../state/slices/progressSlice';
import { recordMinigame } from '../state/slices/historySlice';

// "42" — the Hitchhiker's Guide callback minigame (issue #41). The smallest
// minigame in the codebase: no rAF loop, no physics — just a question, four
// options, and a result. Pure flavor + a small XP grant. Lives in the
// arcade cabinet; no scheduled slot (per the issue's recommendation —
// the reference lands harder when stumbled upon).

interface Props {
  monthId: number;
  onComplete: () => void;
  mode?: 'scheduled' | 'arcade';
  awardRewards?: boolean;
}

const QUESTION = 'What is the answer to the ultimate question of life, the universe, and everything?';

// The four options. 42 is correct; the other three are plausible-but-wrong
// numbers with their own quiet references (7 the lucky default, 1138 the
// THX/Lucas easter egg, ∞ the cop-out non-answer). Order is randomized per
// mount via the shuffled-indices below.
interface Option {
  label: string;
  // `value` is the canonical id used for replay recording + correctness
  // checks. Stable regardless of the displayed order.
  value: string;
}
const OPTIONS: ReadonlyArray<Option> = [
  { label: '7',    value: '7' },
  { label: '42',   value: '42' },
  { label: '1138', value: '1138' },
  { label: '∞',    value: 'infinity' },
];
const CORRECT_VALUE = '42';

const WIN_FLAVORS = [
  'Deep Thought nods. You feel briefly that everything makes sense.',
  'A small mouse, somewhere, looks up from its work and approves.',
  'Forty-two. The universe shrugs in agreement.',
];
const FAIL_FLAVORS = [
  'That is, regrettably, not the answer. Deep Thought sighs.',
  'Close, perhaps, but the universe is unimpressed.',
  'Wrong, but in an interesting way. Carry a towel next time.',
];

function pickFlavor(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// Fisher-Yates over a tiny array, returns a new index permutation.
function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function FortyTwo({ monthId, onComplete, mode = 'scheduled', awardRewards = true }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  // Option order is fixed at mount so the player can't cheese by remounting.
  // Stored as a permutation of OPTIONS indices.
  const [order] = useState<number[]>(() => shuffledIndices(OPTIONS.length));
  const displayed = useMemo(() => order.map((i) => OPTIONS[i]), [order]);

  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'question' | 'result'>('question');

  const submitWith = useCallback((idx: number) => {
    if (phase !== 'question') return;
    setSelected(idx);
    setPhase('result');
  }, [phase]);

  const won = selected !== null && displayed[selected].value === CORRECT_VALUE;
  // Stable flavor across re-renders inside the result phase — useMemo
  // recomputes only when `won` flips (i.e. once, at phase transition).
  const flavor = useMemo(() => {
    return won ? pickFlavor(WIN_FLAVORS) : pickFlavor(FAIL_FLAVORS);
  }, [won]);

  const handleContinue = useCallback(() => {
    if (awardRewards) {
      dispatch(addXp(won ? XP_MINIGAME_WIN : XP_MINIGAME_FAIL));
    }
    if (mode === 'scheduled') {
      dispatch(recordMinigame({
        monthId,
        variant: 'forty-two',
        result: won ? 'win' : 'fail',
        detail: selected !== null ? `Answered ${displayed[selected].label}` : undefined,
        timestamp: Date.now(),
      }));
    }
    onComplete();
  }, [won, selected, displayed, mode, awardRewards, monthId, dispatch, onComplete]);

  // handleContinue closes over `won` / `selected` — keep a ref so the
  // stable keydown listener invokes the freshest callback (same pattern
  // as Pong / Stacker).
  const handleContinueRef = useRef(handleContinue);
  useEffect(() => {
    handleContinueRef.current = handleContinue;
  }, [handleContinue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'question') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          setSelected((s) => (s === null ? 0 : Math.min(s + 1, displayed.length - 1)));
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelected((s) => (s === null ? 0 : Math.max(s - 1, 0)));
        } else if (e.key >= '1' && e.key <= '4') {
          e.preventDefault();
          submitWith(parseInt(e.key, 10) - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (selected !== null) {
            e.preventDefault();
            submitWith(selected);
          }
        } else if (e.key === 'Escape') {
          // Escape forfeits — counts as fail (no answer = not 42). Routes
          // through handleContinue so the standard XP / record path fires.
          e.preventDefault();
          handleContinueRef.current();
        }
      } else if (phase === 'result') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          handleContinueRef.current();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, selected, submitWith, displayed.length]);

  return (
    <div
      data-component="FortyTwo"
      data-phase={phase}
      data-result={phase === 'result' ? (won ? 'win' : 'fail') : undefined}
      data-mode={mode}
      style={{
        width: 'var(--canvas-display-width)',
        aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
        background: palette.background,
        color: palette.ink,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 48px',
        fontFamily: 'inherit',
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: '0.1em', color: palette.inkMuted, margin: 0, marginBottom: 12, textTransform: 'uppercase' }}>
        {monthLabel(monthId)} · The Ultimate Question
      </p>

      {phase === 'question' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 36 }}>
          <p
            data-region="question"
            style={{
              fontSize: 19,
              lineHeight: 1.5,
              maxWidth: 640,
              margin: 0,
              fontStyle: 'italic',
              color: palette.ink,
            }}
          >
            {QUESTION}
          </p>

          <div data-region="options" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {displayed.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <button
                  key={opt.value}
                  data-action="select-option"
                  data-id={opt.value}
                  data-selected={isSelected || undefined}
                  onClick={() => submitWith(i)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    minWidth: 96,
                    padding: '14px 22px',
                    background: isSelected ? palette.surface : 'transparent',
                    color: palette.ink,
                    border: `1px solid ${palette.ink}`,
                    borderRadius: 4,
                    fontSize: 22,
                    fontWeight: 600,
                    fontFamily: "'SF Mono', Menlo, monospace",
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 10, opacity: 0.55, fontFamily: 'inherit', fontWeight: 500, letterSpacing: '0.1em' }}>
                    {i + 1}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: palette.inkMuted,
              margin: 0,
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
          >
            ←→ choose · 1-4 direct · Enter to answer · Esc to walk away
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: 12, letterSpacing: '0.1em', color: palette.inkMuted, margin: 0, marginBottom: 16, textTransform: 'uppercase' }}>
            {won ? 'Correct' : 'Not quite'}
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 540, margin: 0, marginBottom: 40, opacity: 0.85 }}>
            {flavor}
          </p>
          <button
            onClick={handleContinue}
            style={{
              padding: '10px 28px',
              background: 'transparent',
              color: palette.ink,
              border: `1px solid ${palette.ink}`,
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
