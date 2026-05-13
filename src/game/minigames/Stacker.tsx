import { useCallback, useEffect, useRef, useState } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { applyStatEffect } from '../state/slices/statsSlice';
import {
  addXp,
  XP_MINIGAME_WIN,
  XP_MINIGAME_PARTIAL,
  XP_MINIGAME_FAIL,
} from '../state/slices/progressSlice';
import { recordMinigame } from '../state/slices/historySlice';

interface Props {
  monthId: number;
  onComplete: () => void;
  // 'scheduled' (default) = months-32/60/90 slot; rewards fire and the
  // play is recorded to history for replay (#33).
  // 'arcade' = arcade cabinet (#31); recording skipped, rewards gated
  // by `awardRewards` (the arcade host computes throttle eligibility).
  mode?: 'scheduled' | 'arcade';
  awardRewards?: boolean;
}

const TOTAL_BLOCKS = 5;
const WIN_THRESHOLD = 4;     // 4-5 stacks → win
const PARTIAL_THRESHOLD = 2; // 2-3 stacks → neutral

// Virtual 1000×600 coords.
const BLOCK_W = 140;
const BLOCK_H = 50;
const COLUMN_X = 450;        // target column left edge
const COLUMN_W = 100;        // target column width (block CENTER must land in here)
const TARGET_X = (ROOM_VIEWBOX.width - BLOCK_W) / 2; // pending/ideal x

const TRACK_LEFT = 60;
const TRACK_RIGHT = 940;
const BLOCK_MIN_X = TRACK_LEFT;
const BLOCK_MAX_X = TRACK_RIGHT - BLOCK_W;

// Bottom block sits at this Y; each block above is BLOCK_H higher.
const STACK_BOTTOM_Y = 320;

const BASE_SPEED = 480;        // virtual units / sec
const SPEED_INCREMENT = 40;    // added per block index (bottom = base, top = base + 4*inc)

const WIN_FLAVOR =
  'You held the focus for the full sprint. The stack lined up. You felt, for an afternoon, like a person who can do hard things on demand.';
const PARTIAL_FLAVOR =
  'You got it some of the time. You missed it some of the time. The deadline got hit anyway. Mostly.';
const FAIL_FLAVOR =
  'The rhythm never quite landed. The deadline slipped. The Slack message about it was longer than the original work.';

type BlockStatus = 'pending' | 'active' | 'hit' | 'miss';
interface Block {
  status: BlockStatus;
  x: number;
}

function makeInitialBlocks(): Block[] {
  return Array.from({ length: TOTAL_BLOCKS }, (_, i) =>
    i === 0
      ? { status: 'active' as const, x: BLOCK_MIN_X }
      : { status: 'pending' as const, x: TARGET_X },
  );
}

// Y of block at index i (i=0 is bottom).
function blockY(i: number): number {
  return STACK_BOTTOM_Y - i * BLOCK_H;
}

export function Stacker({ monthId, onComplete, mode = 'scheduled', awardRewards = true }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  const [blocks, setBlocks] = useState<Block[]>(makeInitialBlocks);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');

  const dirRef = useRef<1 | -1>(1);
  const speedRef = useRef(BASE_SPEED);
  // Mirror state for the keydown closure so it always sees latest values
  // without re-binding the listener on every animation tick.
  const activeIndexRef = useRef(0);
  const blocksRef = useRef<Block[]>(blocks);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Animation loop. Re-binds when activeIndex changes; the moving block is
  // whichever index is currently 'active'. Direction and speed in refs so
  // the loop sees the latest without triggering re-binds each frame.
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf: number | null = null;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setBlocks((prev) => {
        const cur = prev[activeIndex];
        if (cur.status !== 'active') return prev;
        let nx = cur.x + dirRef.current * speedRef.current * dt;
        if (nx >= BLOCK_MAX_X) {
          nx = BLOCK_MAX_X;
          dirRef.current = -1;
        } else if (nx <= BLOCK_MIN_X) {
          nx = BLOCK_MIN_X;
          dirRef.current = 1;
        }
        const arr = [...prev];
        arr[activeIndex] = { ...cur, x: nx };
        return arr;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase, activeIndex]);

  const handleLock = useCallback(() => {
    if (phase !== 'playing') return;
    const idx = activeIndexRef.current;
    const cur = blocksRef.current[idx];
    if (!cur || cur.status !== 'active') return;

    const blockCenter = cur.x + BLOCK_W / 2;
    const hit = blockCenter >= COLUMN_X && blockCenter <= COLUMN_X + COLUMN_W;

    setBlocks((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], status: hit ? 'hit' : 'miss' };
      if (idx + 1 < TOTAL_BLOCKS) {
        arr[idx + 1] = { status: 'active', x: BLOCK_MIN_X };
      }
      return arr;
    });

    if (idx + 1 >= TOTAL_BLOCKS) {
      // Brief beat so the final lock paints before the result screen.
      window.setTimeout(() => setPhase('result'), 300);
    } else {
      setActiveIndex(idx + 1);
      dirRef.current = 1;
      speedRef.current = BASE_SPEED + (idx + 1) * SPEED_INCREMENT;
    }
  }, [phase]);

  const stacks = blocks.filter((b) => b.status === 'hit').length;

  const handleContinue = useCallback(() => {
    const result: 'win' | 'partial' | 'fail' =
      stacks >= WIN_THRESHOLD ? 'win' : stacks >= PARTIAL_THRESHOLD ? 'partial' : 'fail';
    if (awardRewards) {
      if (result === 'win') {
        dispatch(applyStatEffect({ stat: 'technicalSkill', op: '+', magnitude: 5 }));
        dispatch(applyStatEffect({ stat: 'reputation', op: '+', magnitude: 5 }));
        dispatch(applyStatEffect({ stat: 'burnout', op: '-', magnitude: 2 }));
        dispatch(addXp(XP_MINIGAME_WIN));
      } else if (result === 'partial') {
        dispatch(addXp(XP_MINIGAME_PARTIAL));
      } else {
        dispatch(applyStatEffect({ stat: 'reputation', op: '-', magnitude: 3 }));
        dispatch(applyStatEffect({ stat: 'burnout', op: '+', magnitude: 5 }));
        dispatch(addXp(XP_MINIGAME_FAIL));
      }
    }
    // Record for backward-replay (#33). Arcade plays (#31) skip recording.
    if (mode === 'scheduled') {
      dispatch(recordMinigame({
        monthId,
        variant: 'reaction-sprint',
        result,
        detail: `${stacks} of ${TOTAL_BLOCKS}`,
        timestamp: Date.now(),
      }));
    }
    onComplete();
  }, [stacks, monthId, mode, awardRewards, dispatch, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'playing' && e.key === ' ') {
        e.preventDefault();
        handleLock();
      } else if (phase === 'result' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleLock, handleContinue]);

  const outcome =
    stacks >= WIN_THRESHOLD ? 'win' : stacks >= PARTIAL_THRESHOLD ? 'partial' : 'fail';
  const flavor =
    outcome === 'win' ? WIN_FLAVOR : outcome === 'partial' ? PARTIAL_FLAVOR : FAIL_FLAVOR;

  const blockLabel =
    phase === 'result' ? 'complete' : `block ${Math.min(activeIndex + 1, TOTAL_BLOCKS)}/${TOTAL_BLOCKS}`;

  return (
    <div
      data-component="Stacker"
      data-phase={phase}
      data-result={phase === 'result' ? outcome : undefined}
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
        padding: '24px 32px',
        fontFamily: 'inherit',
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: '0.1em',
          color: palette.inkMuted,
          margin: 0,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {monthLabel(monthId)} · Reaction Sprint · {blockLabel} · stacked {stacks}/{TOTAL_BLOCKS}
      </p>

      {phase === 'result' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.1em',
              color: palette.inkMuted,
              margin: 0,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            {outcome === 'win'
              ? `${stacks} of ${TOTAL_BLOCKS}. You held it.`
              : outcome === 'partial'
                ? `${stacks} of ${TOTAL_BLOCKS}. Not bad.`
                : `${stacks} of ${TOTAL_BLOCKS}. Not your day.`}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: 0, marginBottom: 40, opacity: 0.85 }}>
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
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <p
            style={{
              fontSize: 13,
              color: palette.inkMuted,
              margin: 0,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Press <strong>SPACE</strong> when the block is inside the column.
          </p>
          <svg
            viewBox={`0 0 ${ROOM_VIEWBOX.width} 380`}
            style={{ width: '100%', flex: 1, display: 'block' }}
          >
            {/* Target column highlight, full height behind the stack. */}
            <rect
              x={COLUMN_X}
              y={20}
              width={COLUMN_W}
              height={340}
              fill={palette.accent}
              opacity={0.18}
            />
            <line
              x1={COLUMN_X}
              y1={20}
              x2={COLUMN_X}
              y2={360}
              stroke={palette.accent}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <line
              x1={COLUMN_X + COLUMN_W}
              y1={20}
              x2={COLUMN_X + COLUMN_W}
              y2={360}
              stroke={palette.accent}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* The 5 blocks. Render bottom (i=0) up. Pending = dashed ghost
                at target x. Active = solid moving block. Hit/miss = solid
                at the locked x with status-tinted fill. */}
            {blocks.map((b, i) => {
              const y = blockY(i);
              if (b.status === 'pending') {
                return (
                  <rect
                    key={i}
                    x={TARGET_X}
                    y={y}
                    width={BLOCK_W}
                    height={BLOCK_H}
                    fill="none"
                    stroke={palette.surface}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    rx={3}
                  />
                );
              }
              let fill: string;
              if (b.status === 'hit') fill = palette.positive;
              else if (b.status === 'miss') fill = palette.inkMuted;
              else fill = palette.player;
              return (
                <rect
                  key={i}
                  x={b.x}
                  y={y}
                  width={BLOCK_W}
                  height={BLOCK_H}
                  fill={fill}
                  stroke={palette.ink}
                  strokeWidth={2}
                  rx={3}
                />
              );
            })}
          </svg>
        </>
      )}
    </div>
  );
}
