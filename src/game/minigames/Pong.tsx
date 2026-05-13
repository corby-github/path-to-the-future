import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
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
  // Same dual-mode shape as the other minigames (issue #31). Scheduled is
  // a months-{32,60,75,90}-style slot; arcade is the universal cabinet.
  mode?: 'scheduled' | 'arcade';
  awardRewards?: boolean;
}

// Court — full ROOM_VIEWBOX (1000×600).
const COURT_W = ROOM_VIEWBOX.width;
const COURT_H = ROOM_VIEWBOX.height;

// Paddle / ball geometry. Player paddle hugs the left wall; AI mirrors.
const PADDLE_W = 12;
const PADDLE_H = 80;
const PADDLE_INSET_X = 30;
const PADDLE_PLAYER_X = PADDLE_INSET_X;
const PADDLE_AI_X = COURT_W - PADDLE_INSET_X - PADDLE_W;
const PADDLE_MIN_Y = 20;
const PADDLE_MAX_Y = COURT_H - PADDLE_H - 20;
const PADDLE_PLAYER_SPEED = 480; // v.u./sec — player moves a touch faster than the AI

// AI tuning. Beatable on a good day, frustrating on a bad one — per the
// acceptance criteria in #32 (target: player wins ~50-60% of the time).
// AI tracks the ball's centre minus its own half-height, but never moves
// faster than AI_MAX_SPEED. AI_DEADZONE prevents the visible jitter that
// happens when a perfect tracker oscillates around a stationary target.
const AI_MAX_SPEED = 360;
const AI_DEADZONE = 6;

// Ball.
const BALL_SIZE = 12;
const BALL_START_SPEED = 420;          // initial magnitude
const BALL_SPEED_INCREMENT = 1.04;     // per paddle hit
const BALL_MAX_SPEED = 720;
const BALL_RESET_DELAY_MS = 700;       // beat after a goal before the next serve

const WIN_SCORE = 5;

// Status pool. Win/fail/partial fork into pools so the result screen feels
// fresh on repeat plays. Score is rendered separately above the flavor so
// it's always grounded.
const WIN_FLAVORS = [
  'The screen flickered. You did not.',
  'You won like you used to win things.',
  'The AI shrugged. The AI does not shrug.',
];
const PARTIAL_FLAVORS = [
  'The kind of game you remember for a week.',
  'Two more points and you would have called your dad.',
  'A respectable showing against a piece of code.',
];
const FAIL_FLAVORS = [
  'The AI was patient. You were tired.',
  'The paddle is right there. The ball is right there. So why.',
  'You lost to an arrangement of if statements.',
];

function pickFlavor(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// Per #32 acceptance: player 5-3-or-better = win; 4-5 / 5-4 = partial;
// 5-0 / 5-1 / 5-2 = fail. Captured in one place so the result panel and
// the reward dispatcher agree.
function classifyOutcome(player: number, ai: number): 'win' | 'partial' | 'fail' {
  if (player === WIN_SCORE && ai === WIN_SCORE - 1) return 'partial';
  if (ai === WIN_SCORE && player === WIN_SCORE - 1) return 'partial';
  if (player >= WIN_SCORE) return 'win';
  return 'fail';
}

function randomServeVelocity(): { vx: number; vy: number } {
  // Serve toward whoever just scored (or randomly on the first serve).
  // Angle is clamped well away from purely vertical so neither paddle
  // gets stuck waiting forever, and the absolute X speed is always
  // BALL_START_SPEED-shaped so each rally has a consistent opening tempo.
  const dir = Math.random() < 0.5 ? -1 : 1;
  // Angle between -45° and +45° off horizontal.
  const angle = (Math.random() - 0.5) * (Math.PI / 2);
  const vx = Math.cos(angle) * BALL_START_SPEED * dir;
  const vy = Math.sin(angle) * BALL_START_SPEED;
  return { vx, vy };
}

export function Pong({ monthId, onComplete, mode = 'scheduled', awardRewards = true }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  // Render-driving state. Mutated each frame inside the rAF loop via
  // setState — same pattern as Stacker. 60Hz repaints of a tiny SVG are
  // fine; no need to chase ref-driven SVG transform.
  const [playerY, setPlayerY] = useState(COURT_H / 2 - PADDLE_H / 2);
  const [aiY, setAiY] = useState(COURT_H / 2 - PADDLE_H / 2);
  const [ballX, setBallX] = useState(COURT_W / 2 - BALL_SIZE / 2);
  const [ballY, setBallY] = useState(COURT_H / 2 - BALL_SIZE / 2);
  const [score, setScore] = useState<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');

  // Held-input refs. Two keys can be down at once but they cancel cleanly
  // because we just sum the directional intent each frame.
  const inputRef = useRef({ up: false, down: false });

  // Ball velocity in refs so the rAF closure mutates without setState
  // churn between frames.
  const ballVRef = useRef<{ vx: number; vy: number }>(randomServeVelocity());
  const ballSpeedRef = useRef(BALL_START_SPEED);

  // Brief lockout after a goal so the next serve doesn't immediately
  // start before the player resets their head. Set by handleGoal,
  // cleared by the rAF loop after the timeout.
  const ballFrozenUntilRef = useRef(0);

  // Score-end check needs the live value inside the rAF closure without
  // re-binding the effect every frame. Mirror via ref.
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Latest paddle positions, kept in refs so the rAF body computes
  // collisions against fresh values without re-binding the effect when
  // the paddle moves.
  const playerYRef = useRef(playerY);
  const aiYRef = useRef(aiY);
  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);
  useEffect(() => {
    aiYRef.current = aiY;
  }, [aiY]);

  // Latest ball position, also mirrored so we can probe it for AI
  // tracking without round-tripping through React state every frame.
  const ballXRef = useRef(ballX);
  const ballYRef = useRef(ballY);
  useEffect(() => {
    ballXRef.current = ballX;
  }, [ballX]);
  useEffect(() => {
    ballYRef.current = ballY;
  }, [ballY]);

  const resetBall = useCallback(() => {
    setBallX(COURT_W / 2 - BALL_SIZE / 2);
    setBallY(COURT_H / 2 - BALL_SIZE / 2);
    ballSpeedRef.current = BALL_START_SPEED;
    ballVRef.current = randomServeVelocity();
    ballFrozenUntilRef.current = performance.now() + BALL_RESET_DELAY_MS;
  }, []);

  // Animation + physics loop. Single effect that runs while phase is
  // 'playing'. Tear-down on phase change happens via the dependency
  // re-run + cleanup. We DO NOT re-bind on every paddle/ball state tick
  // — paddle/ball/ai/score reads come from refs.
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf: number | null = null;
    let last = performance.now();

    const handleGoal = (scorer: 'player' | 'ai') => {
      const next = {
        player: scoreRef.current.player + (scorer === 'player' ? 1 : 0),
        ai: scoreRef.current.ai + (scorer === 'ai' ? 1 : 0),
      };
      scoreRef.current = next;
      setScore(next);
      if (next.player >= WIN_SCORE || next.ai >= WIN_SCORE) {
        // Brief pause so the final point can read before the result
        // panel paints. Mirrors Stacker's end-of-game beat.
        window.setTimeout(() => setPhase('result'), 400);
        return;
      }
      resetBall();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // clamp dt to survive tab-switch hiccups
      last = now;

      // Player paddle — sum of held inputs (up = -1, down = +1).
      const inDir = (inputRef.current.down ? 1 : 0) - (inputRef.current.up ? 1 : 0);
      if (inDir !== 0) {
        setPlayerY((y) => {
          const ny = y + inDir * PADDLE_PLAYER_SPEED * dt;
          return Math.max(PADDLE_MIN_Y, Math.min(PADDLE_MAX_Y, ny));
        });
      }

      // AI paddle — tracks the ball's centre with a capped speed.
      // Uses the LIVE ball position, not the buffered one; difficulty is
      // already in the speed cap + deadzone, and a real "reaction lag"
      // implementation read sluggish for a 1000×600 court (the ball
      // crosses the court in <2s at top speed). Effective and simple.
      const ballCy = ballYRef.current + BALL_SIZE / 2;
      const aiCy = aiYRef.current + PADDLE_H / 2;
      const delta = ballCy - aiCy;
      if (Math.abs(delta) > AI_DEADZONE) {
        const step = Math.sign(delta) * Math.min(Math.abs(delta), AI_MAX_SPEED * dt);
        setAiY((y) => Math.max(PADDLE_MIN_Y, Math.min(PADDLE_MAX_Y, y + step)));
      }

      // Serve lockout — keep the ball at centre until it expires.
      if (now < ballFrozenUntilRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Ball physics. Step the ball, then resolve collisions in order:
      // top/bottom walls (reflect), paddles (reflect + spin), goal lines.
      const v = ballVRef.current;
      let nx = ballXRef.current + v.vx * dt;
      let ny = ballYRef.current + v.vy * dt;

      // Top wall.
      if (ny <= 0) {
        ny = 0;
        v.vy = Math.abs(v.vy);
      }
      // Bottom wall.
      if (ny + BALL_SIZE >= COURT_H) {
        ny = COURT_H - BALL_SIZE;
        v.vy = -Math.abs(v.vy);
      }

      // Player paddle collision — only when moving toward it.
      if (
        v.vx < 0 &&
        nx <= PADDLE_PLAYER_X + PADDLE_W &&
        nx + BALL_SIZE >= PADDLE_PLAYER_X &&
        ny + BALL_SIZE >= playerYRef.current &&
        ny <= playerYRef.current + PADDLE_H
      ) {
        nx = PADDLE_PLAYER_X + PADDLE_W;
        // Add "spin" based on hit position relative to paddle centre —
        // hits near the top kick the ball upward, hits near the bottom
        // kick it down. Normalised to [-1, 1] so geometry stays bounded.
        const rel = (ny + BALL_SIZE / 2 - (playerYRef.current + PADDLE_H / 2)) / (PADDLE_H / 2);
        const speed = Math.min(BALL_MAX_SPEED, ballSpeedRef.current * BALL_SPEED_INCREMENT);
        ballSpeedRef.current = speed;
        const angle = rel * (Math.PI / 3); // up to ±60°
        v.vx = Math.cos(angle) * speed;
        v.vy = Math.sin(angle) * speed;
      }

      // AI paddle collision — symmetric.
      if (
        v.vx > 0 &&
        nx + BALL_SIZE >= PADDLE_AI_X &&
        nx <= PADDLE_AI_X + PADDLE_W &&
        ny + BALL_SIZE >= aiYRef.current &&
        ny <= aiYRef.current + PADDLE_H
      ) {
        nx = PADDLE_AI_X - BALL_SIZE;
        const rel = (ny + BALL_SIZE / 2 - (aiYRef.current + PADDLE_H / 2)) / (PADDLE_H / 2);
        const speed = Math.min(BALL_MAX_SPEED, ballSpeedRef.current * BALL_SPEED_INCREMENT);
        ballSpeedRef.current = speed;
        const angle = rel * (Math.PI / 3);
        v.vx = -Math.cos(angle) * speed;
        v.vy = Math.sin(angle) * speed;
      }

      // Goal lines — ball escaped past a paddle.
      if (nx + BALL_SIZE < 0) {
        handleGoal('ai');
        return; // resetBall already scheduled a new serve
      }
      if (nx > COURT_W) {
        handleGoal('player');
        return;
      }

      setBallX(nx);
      setBallY(ny);
      ballVRef.current = v;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase, resetBall]);

  // handleContinue closes over score / outcome / mode — values that
  // change as the game progresses. Mirror via ref so the stable keydown
  // listener always invokes the freshest callback.
  const handleContinueRef = useRef<() => void>(() => {});

  // Keyboard. Arrow keys + WASD per §11. Two-key down state tracked via
  // refs so simultaneous up + down cleanly cancel. Result-screen Continue
  // shares the spacebar / Enter binding the other minigames use.
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (phaseRef.current === 'playing') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          inputRef.current.up = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          inputRef.current.down = true;
        }
      } else if (phaseRef.current === 'result') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinueRef.current();
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = false;
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const outcome = classifyOutcome(score.player, score.ai);
  // Stable flavor across re-renders inside the result phase. useMemo
  // recomputes only when outcome changes — so the random pool draw
  // happens once per outcome transition (i.e. once, at game-end).
  const flavor = useMemo(() => {
    if (outcome === 'win') return pickFlavor(WIN_FLAVORS);
    if (outcome === 'partial') return pickFlavor(PARTIAL_FLAVORS);
    return pickFlavor(FAIL_FLAVORS);
  }, [outcome]);

  const handleContinue = useCallback(() => {
    if (awardRewards) {
      if (outcome === 'win') {
        dispatch(addXp(XP_MINIGAME_WIN));
      } else if (outcome === 'partial') {
        dispatch(addXp(XP_MINIGAME_PARTIAL));
      } else {
        dispatch(addXp(XP_MINIGAME_FAIL));
      }
    }
    if (mode === 'scheduled') {
      dispatch(recordMinigame({
        monthId,
        variant: 'pong',
        result: outcome,
        detail: `${score.player}-${score.ai}`,
        timestamp: Date.now(),
      }));
    }
    onComplete();
  }, [outcome, mode, awardRewards, score.player, score.ai, monthId, dispatch, onComplete]);

  useEffect(() => {
    handleContinueRef.current = handleContinue;
  }, [handleContinue]);

  return (
    <div
      data-component="Pong"
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
        {monthLabel(monthId)} · Pong · first to {WIN_SCORE}
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
            data-region="score"
            style={{
              fontSize: 12,
              letterSpacing: '0.1em',
              color: palette.inkMuted,
              margin: 0,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            {`${score.player}-${score.ai} · ${outcome === 'win' ? 'You won' : outcome === 'partial' ? 'Close one' : 'You lost'}`}
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
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <div
            data-region="score"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 48,
              fontFamily: "'SF Mono', Menlo, monospace",
              fontSize: 24,
              fontWeight: 700,
              color: palette.ink,
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            <span data-region="score-player">{score.player}</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span data-region="score-ai">{score.ai}</span>
          </div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: palette.inkMuted,
              textAlign: 'center',
              margin: 0,
              marginBottom: 6,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            ↑↓ or W / S to move
          </p>
          <svg
            data-region="court"
            viewBox={`0 0 ${COURT_W} ${COURT_H}`}
            style={{ width: '100%', flex: 1, display: 'block' }}
          >
            {/* Net — dashed vertical centre line. */}
            <line
              x1={COURT_W / 2}
              y1={0}
              x2={COURT_W / 2}
              y2={COURT_H}
              stroke={palette.surface}
              strokeWidth={3}
              strokeDasharray="14 12"
            />
            {/* Player paddle. */}
            <rect
              data-region="paddle-player"
              x={PADDLE_PLAYER_X}
              y={playerY}
              width={PADDLE_W}
              height={PADDLE_H}
              fill={palette.player}
              stroke={palette.ink}
              strokeWidth={2}
              rx={2}
            />
            {/* AI paddle. */}
            <rect
              data-region="paddle-ai"
              x={PADDLE_AI_X}
              y={aiY}
              width={PADDLE_W}
              height={PADDLE_H}
              fill={palette.accent}
              stroke={palette.ink}
              strokeWidth={2}
              rx={2}
            />
            {/* Ball. */}
            <rect
              data-region="ball"
              x={ballX}
              y={ballY}
              width={BALL_SIZE}
              height={BALL_SIZE}
              fill={palette.ink}
              rx={1}
            />
          </svg>
        </>
      )}
    </div>
  );
}
