import { useEffect } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { exitReplay } from '../state/slices/progressSlice';
import { MinigameIcon } from '../ui/icons/modalIcons';
import type { MinigameVariant } from '../types/room';

interface Props {
  monthId: number;
  variant: MinigameVariant;
}

const VARIANT_LABELS: Record<MinigameVariant, string> = {
  blackjack: 'Blackjack',
  'code-review': 'Code Review',
  'reaction-sprint': 'Reaction Sprint',
  pong: 'Pong',
  'forty-two': 'The Ultimate Question',
};

// Backward-replay (#33) view for minigame months. Reads `history.minigames`
// for the recorded result and renders a frozen summary. If no record
// exists (player walked back to a minigame month they never played, or
// the record predates this feature), shows a "couldn't recall" placeholder
// so the screen always has SOMETHING and the Return path still works.
export function MinigameReplayCard({ monthId, variant }: Props) {
  const { palette, liveMonth } = useCareerPack();
  const dispatch = useAppDispatch();
  const record = useAppSelector((s) =>
    s.history.minigames.find((r) => r.monthId === monthId && r.variant === variant) ?? null,
  );

  const handleReturn = () => dispatch(exitReplay());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleReturn();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div
      data-component="MinigameReplayCard"
      data-month-id={monthId}
      data-variant={variant}
      data-has-record={record !== null || undefined}
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        fontFamily: 'inherit',
      }}
    >
      <div data-region="variant-icon" style={{ marginBottom: 16 }} aria-hidden="true">
        <MinigameIcon variant={variant} palette={palette} size={64} />
      </div>
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          color: palette.inkMuted,
          margin: 0,
          marginBottom: 12,
          textTransform: 'uppercase',
          opacity: 0.8,
        }}
      >
        {monthLabel(monthId)} · {VARIANT_LABELS[variant]} · looking back
      </p>

      {record ? (
        <>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 500,
              margin: 0,
              marginBottom: 16,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {record.result}
          </h2>
          {record.detail && (
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 32,
                opacity: 0.85,
                fontStyle: 'italic',
              }}
            >
              {record.detail}
            </p>
          )}
          <p
            style={{
              fontSize: 13,
              color: palette.inkMuted,
              margin: 0,
              marginBottom: 48,
              maxWidth: 420,
              textAlign: 'center',
            }}
          >
            That was the round. No re-rolls in replay — the result stands.
          </p>
        </>
      ) : (
        <>
          <p
            style={{
              fontSize: 18,
              fontStyle: 'italic',
              margin: 0,
              marginBottom: 32,
              opacity: 0.85,
              maxWidth: 480,
              textAlign: 'center',
            }}
          >
            You played a round here, but the details are blurry now.
          </p>
        </>
      )}

      <button
        data-action="return"
        onClick={handleReturn}
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
        }}
      >
        {`↩ Return to ${monthLabel(liveMonth.id)}`}
      </button>
    </div>
  );
}
