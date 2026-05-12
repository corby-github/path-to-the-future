import { useCallback, useEffect, useState } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { applyStatEffect } from '../state/slices/statsSlice';
import { addXp, XP_MINIGAME_WIN, XP_MINIGAME_FAIL } from '../state/slices/progressSlice';

interface Props {
  monthId: number;
  onComplete: () => void;
}

// One hand-authored snippet for v1. Procedural generation is a future polish.
const SNIPPET_LINES = [
  'function findUser(id) {',
  '  const users = getUsers();',
  '  for (let i = 0; i <= users.length; i++) {',
  '    if (users[i].id === id) {',
  '      return users[i];',
  '    }',
  '  }',
  '  return null;',
  '}',
];

const OPTIONS = [
  { key: '1', label: 'Line 2 — getUsers() could return undefined' },
  { key: '2', label: 'Line 3 — loop bound should be < not <=' },
  { key: '3', label: 'Line 4 — should use == not ===' },
  { key: '4', label: 'Line 5 — return is in the wrong place' },
];

const CORRECT_INDEX = 1;

const WIN_FLAVOR = 'You spotted it in under a minute. The off-by-one. The hiring panel made eye contact. Someone wrote something down.';
const LOSE_FLAVOR = 'You picked confidently. The panel nodded politely. You realized two minutes after the meeting which one it actually was.';

export function CodeReview({ monthId, onComplete }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');

  // Mouse-click submits directly (DecisionModal pattern); keyboard Enter/Space
  // submits whatever's highlighted. Hover only changes the highlight without
  // committing.
  const submitWith = useCallback(
    (index: number) => {
      if (phase !== 'playing') return;
      setSelected(index);
      setPhase('result');
    },
    [phase],
  );

  const handleContinue = useCallback(() => {
    const won = selected === CORRECT_INDEX;
    if (won) {
      dispatch(applyStatEffect({ stat: 'technicalSkill', op: '+', magnitude: 5 }));
      dispatch(applyStatEffect({ stat: 'reputation', op: '+', magnitude: 3 }));
      dispatch(addXp(XP_MINIGAME_WIN));
    } else {
      dispatch(applyStatEffect({ stat: 'reputation', op: '-', magnitude: 2 }));
      dispatch(addXp(XP_MINIGAME_FAIL));
    }
    onComplete();
  }, [selected, dispatch, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'playing') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelected((s) => (s === null ? 0 : Math.min(s + 1, OPTIONS.length - 1)));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelected((s) => (s === null ? 0 : Math.max(s - 1, 0)));
        } else if (e.key >= '1' && e.key <= '4') {
          e.preventDefault();
          setSelected(parseInt(e.key, 10) - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (selected !== null) {
            e.preventDefault();
            submitWith(selected);
          }
        }
      } else if (phase === 'result') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, selected, submitWith, handleContinue]);

  const won = selected === CORRECT_INDEX;

  return (
    <div
      data-component="CodeReview"
      data-phase={phase}
      data-result={phase === 'result' ? (won ? 'win' : 'fail') : undefined}
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
        {monthLabel(monthId)} · Code Review
      </p>

      {phase === 'playing' ? (
        <>
          <p style={{ fontSize: 14, color: palette.inkMuted, margin: 0, marginBottom: 16 }}>
            Find the bug. ↑↓ or <strong>1–4</strong> to choose · <strong>Enter</strong> to submit.
          </p>

          <pre
            style={{
              fontFamily: "'SF Mono', Menlo, monospace",
              fontSize: 13,
              lineHeight: 1.5,
              background: palette.surface,
              color: palette.ink,
              padding: '16px 20px',
              borderRadius: 4,
              margin: 0,
              marginBottom: 20,
              overflow: 'hidden',
            }}
          >
            {SNIPPET_LINES.map((line, i) => (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ color: palette.inkMuted, width: 28, userSelect: 'none', flexShrink: 0 }}>{i + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </pre>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {OPTIONS.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <button
                  key={opt.key}
                  onClick={() => submitWith(i)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: isSelected ? palette.surface : 'transparent',
                    color: palette.ink,
                    border: `1px solid ${palette.ink}`,
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                >
                  <span style={{ fontWeight: 600, opacity: 0.7, width: 16 }}>{opt.key}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: 12, letterSpacing: '0.1em', color: palette.inkMuted, margin: 0, marginBottom: 16, textTransform: 'uppercase' }}>
            {won ? 'Correct' : 'Not quite'}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: 0, marginBottom: 40, opacity: 0.85 }}>
            {won ? WIN_FLAVOR : LOSE_FLAVOR}
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
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
