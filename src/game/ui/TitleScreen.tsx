import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { statLabelFor } from '../content/statLabels';
import { useAppSelector } from '../state/hooks';
import { InteractableSprite } from '../rooms/sprites/InteractableSprite';
import { StatChip } from './StatChip';

// Title screen per §16.0 — the first thing the player sees on app mount.
// Wordmark (Pixelify Sans, SNES-marquee size), italic tagline, ambient
// random-walking NPCs in a floor band across the lower third, and a
// blinking "Press any key to start" prompt.
//
// First keydown or pointerdown anywhere acknowledges and unmounts — no
// menu, no version chip, no Continue button. Just a beat.
//
// Routing is owned by App.tsx (gameOver / initComplete / fresh-start),
// not here. TitleScreen only signals "the player tapped the floor."

interface Props {
  onAcknowledge: () => void;
}

// Pool of interactable sprite tokens (NPCs + objects) that exist in
// InteractableSprite. The title screen picks N of these deterministically
// per app-mount-day so reloads within the same day show the same crowd,
// but tomorrow brings a different cast. Objects (printer, water-cooler,
// plant, etc.) are stationary — they only get rendered, no wander logic.
type SpriteKind = 'npc' | 'object';
const NPC_ART_POOL: ReadonlyArray<{ art: string; kind: SpriteKind }> = [
  { art: 'person-intern', kind: 'npc' },
  { art: 'person-senior', kind: 'npc' },
  { art: 'person-pm', kind: 'npc' },
  { art: 'person-designer', kind: 'npc' },
  { art: 'person-peer', kind: 'npc' },
  { art: 'person-newhire', kind: 'npc' },
  { art: 'person-skip-level', kind: 'npc' },
];
const OBJECT_ART_POOL: ReadonlyArray<{ art: string; kind: SpriteKind }> = [
  { art: 'printer', kind: 'object' },
  { art: 'water-cooler', kind: 'object' },
  { art: 'plant', kind: 'object' },
  { art: 'coffee-machine', kind: 'object' },
];

const NPC_COUNT = 3;
const OBJECT_COUNT = 2;
// Five evenly-spaced x positions across the canvas, indented from the
// edges so even the leftmost / rightmost wanderer doesn't reach the
// border. Hand-tuned for ROOM_VIEWBOX.width = 1000.
const NPC_SPAWNS_X = [180, 340, 500, 660, 820];
// Vertical centre of the floor band. Sprites are anchored to (x, y);
// their visual extent goes ~40px each way.
const NPC_BAND_Y = ROOM_VIEWBOX.height - 110;
const NPC_BAND_HEIGHT = 200;

// Arcade cabinet decoration. Fixed position at the right edge of the
// floor band — always visible regardless of the per-day RNG roll above.
// Lives alongside the random-pool sprites but is rendered separately so
// it never gets crowded out and so its placement is intentional rather
// than statistical. Far enough right of NPC_SPAWNS_X[4] (820) + the 70-
// unit wander radius (so the rightmost wanderer reaches ~890 at worst)
// to avoid sprite overlap.
const TITLE_ARCADE_X = 950;
const TITLE_ARCADE_Y = NPC_BAND_Y;
const NPC_WANDER_RADIUS = 70;
const NPC_SPEED_MIN = 30;
const NPC_SPEED_MAX = 55;
const NPC_DIR_CHANGE_MIN_MS = 1600;
const NPC_DIR_CHANGE_MAX_MS = 3200;
const NPC_IDLE_PROBABILITY = 0.35;

// Deterministic per-day picker. Hash YYYY-MM-DD into a 32-bit seed,
// then use a mulberry32 PRNG to sample without replacement from the
// pool. Same date → same crowd; midnight → fresh roll.
function todaySeed(): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFromPool<T>(pool: ReadonlyArray<T>, count: number, rng: () => number): T[] {
  const copy = [...pool];
  // Fisher-Yates partial shuffle: pick `count` distinct entries.
  for (let i = 0; i < Math.min(count, copy.length); i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

interface PickedSprite {
  art: string;
  kind: SpriteKind;
}

function pickSprites(seed: number): PickedSprite[] {
  const rng = mulberry32(seed);
  const npcs = pickFromPool(NPC_ART_POOL, NPC_COUNT, rng);
  const objects = pickFromPool(OBJECT_ART_POOL, OBJECT_COUNT, rng);
  // Interleave so the band doesn't look like "NPCs on one side, props on
  // the other" — alternate npc/object/npc/object/npc when possible. The
  // x-coordinate assignment in `npcs` config below pairs each pick with
  // a slot left → right, so interleaving keeps the visual mix readable.
  const out: PickedSprite[] = [];
  let n = 0;
  let o = 0;
  for (let i = 0; i < NPC_COUNT + OBJECT_COUNT; i++) {
    // NPC every 2nd index when possible; objects fill the rest.
    if (i % 2 === 0 && n < npcs.length) {
      out.push(npcs[n++]);
    } else if (o < objects.length) {
      out.push(objects[o++]);
    } else if (n < npcs.length) {
      out.push(npcs[n++]);
    }
  }
  return out;
}

interface NpcConfig {
  spawnX: number;
  spawnY: number;
  art: string;
  kind: SpriteKind;
}

export function TitleScreen({ onAcknowledge }: Props) {
  const { palette, pack } = useCareerPack();
  // Resumable-save read: when the player has a finished init AND the
  // run isn't over, the title acts as a "welcome back" beat — name +
  // reassurance + HUD preview + a different prompt verb ("continue" vs
  // "start"). On Begin Again the EndgameScreen reloads the page, so
  // this view never shows a stale name after a reset.
  const profileName = useAppSelector((s) => s.profile.name);
  const initComplete = useAppSelector((s) => s.profile.initComplete);
  const gameOver = useAppSelector((s) => s.progress.gameOver);
  const progress = useAppSelector((s) => s.progress);
  const stats = useAppSelector((s) => s.stats);
  const resumable = initComplete && !gameOver && profileName.length > 0;

  // Immutable per-mount config — sprite mix + spawn coordinates. Locked
  // for the lifetime of THIS title-screen visit (reloading the page
  // re-rolls the daily seed). Computed once via useMemo so the JSX can
  // read it during render without tripping the react-hooks/refs rule.
  const npcs = useMemo<NpcConfig[]>(() => {
    const sprites = pickSprites(todaySeed());
    return sprites.map((s, i) => ({
      spawnX: NPC_SPAWNS_X[i] ?? 500,
      spawnY: NPC_BAND_Y,
      art: s.art,
      kind: s.kind,
    }));
  }, []);

  const [positions, setPositions] = useState<{ x: number; y: number }[]>(
    () => npcs.map((n) => ({ x: n.spawnX, y: n.spawnY })),
  );

  // Ambient wander RAF. Mirrors DecisionRoom's NPC loop in shape but
  // simplified — no global / per-NPC pause logic (no player to be
  // adjacent to, no modals to freeze for). Motion deltas live in a
  // closure inside the effect, not on a ref read during render.
  useEffect(() => {
    interface MotionFrame {
      dx: number;
      dy: number;
      nextChangeAt: number;
    }
    const motion: MotionFrame[] = npcs.map(() => ({
      dx: 0,
      dy: 0,
      nextChangeAt: 0,
    }));

    let raf: number | null = null;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPositions((cur) =>
        cur.map((pos, i) => {
          const m = motion[i];
          const n = npcs[i];
          // Objects stay put (printers don't wander). Skip motion update.
          if (n.kind !== 'npc') return pos;
          if (now >= m.nextChangeAt) {
            if (Math.random() < NPC_IDLE_PROBABILITY) {
              m.dx = 0;
              m.dy = 0;
            } else {
              const angle = Math.random() * 2 * Math.PI;
              const speed =
                NPC_SPEED_MIN + Math.random() * (NPC_SPEED_MAX - NPC_SPEED_MIN);
              m.dx = Math.cos(angle) * speed;
              m.dy = Math.sin(angle) * speed;
            }
            m.nextChangeAt =
              now +
              NPC_DIR_CHANGE_MIN_MS +
              Math.random() * (NPC_DIR_CHANGE_MAX_MS - NPC_DIR_CHANGE_MIN_MS);
          }
          let nx = pos.x + m.dx * dt;
          let ny = pos.y + m.dy * dt;
          const minX = n.spawnX - NPC_WANDER_RADIUS;
          const maxX = n.spawnX + NPC_WANDER_RADIUS;
          const minY = n.spawnY - NPC_WANDER_RADIUS / 2;
          const maxY = n.spawnY + NPC_WANDER_RADIUS / 2;
          if (nx < minX) {
            nx = minX;
            m.dx = 0;
          }
          if (nx > maxX) {
            nx = maxX;
            m.dx = 0;
          }
          if (ny < minY) {
            ny = minY;
            m.dy = 0;
          }
          if (ny > maxY) {
            ny = maxY;
            m.dy = 0;
          }
          return { x: nx, y: ny };
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [npcs]);

  // Acknowledgement: any keydown OR pointerdown anywhere on the page.
  // Guarded by a ref so repeat events during the unmount frame don't
  // double-fire onAcknowledge.
  const ackRef = useRef(false);
  useEffect(() => {
    const ack = (e: Event) => {
      if (ackRef.current) return;
      // Ignore modifier-only keypresses so Cmd+R / Ctrl+F5 reloads
      // don't unintentionally dismiss the title.
      if (e.type === 'keydown') {
        const ke = e as KeyboardEvent;
        if (ke.metaKey || ke.ctrlKey || ke.altKey) return;
      }
      ackRef.current = true;
      onAcknowledge();
    };
    window.addEventListener('keydown', ack);
    window.addEventListener('pointerdown', ack);
    return () => {
      window.removeEventListener('keydown', ack);
      window.removeEventListener('pointerdown', ack);
    };
  }, [onAcknowledge]);

  const screenStyle: CSSProperties = {
    width: 'var(--canvas-display-width)',
    aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
    position: 'relative',
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.surface}`,
    borderRadius: 6,
    overflow: 'hidden',
    fontFamily: 'inherit',
  };

  const wordmarkStyle: CSSProperties = {
    position: 'absolute',
    top: '16%',
    left: 0,
    right: 0,
    textAlign: 'center',
    // Inherits JetBrains Mono via the cascade (--font-game). The earlier
    // Pixelify Sans pass read as goofy at marquee size; the heavy mono
    // gives a cleaner block-letter "PATH TO THE FUTURE" that fits the
    // game's terminal typographic identity.
    fontFamily: 'inherit',
    fontWeight: 700,
    // Smaller cap than the pixel version — mono chars are ~0.6em wide,
    // and the 18-char wordmark butts against the canvas at >68px.
    fontSize: 'clamp(36px, 5.6vw, 64px)',
    letterSpacing: '0.02em',
    color: palette.ink,
    lineHeight: 1,
    margin: 0,
    userSelect: 'none',
    // Letterpress-poster drop: sharp duplicate offset down-right in the
    // accent color, no blur. Reads as a print artifact rather than a UI
    // drop-shadow. KRZ-coded — confident, slightly off-register, not
    // glossy.
    textShadow: `4px 4px 0 ${palette.accent}`,
  };

  // HUD preview row (resumable runs only). A condensed echo of the
  // real HUD's stat chips — icons + values, no identity / location
  // columns, no border, no replay opacity, no delta animation noise.
  // Sits below the welcome lines as a "here's where you left things"
  // glance. Reuses StatChip directly so palette + icon parity comes
  // for free.
  // HUD preview slot now lives directly under the welcome line — the
  // subline was redundant once the stat row could speak for itself.
  const hudPreviewStyle: CSSProperties = {
    position: 'absolute',
    top: '54%',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
    padding: '0 32px',
    color: palette.ink,
    userSelect: 'none',
  };

  // Welcome-back single line (resumable runs only). Sits in the white
  // space between the tagline and the floor band.
  const welcomeStyle: CSSProperties = {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    textAlign: 'center',
    margin: 0,
    color: palette.ink,
    fontSize: 'clamp(14px, 1.5vw, 18px)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    lineHeight: 1.5,
    userSelect: 'none',
  };

  const taglineStyle: CSSProperties = {
    position: 'absolute',
    // Bumped down well below the wordmark and given a real color so the
    // line actually reads on the cream background. Was inkMuted at 34%
    // — gray-on-cream is ~3:1 contrast, and the wordmark line-spacing
    // was crowding it.
    top: '36%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 'clamp(15px, 1.7vw, 20px)',
    color: palette.ink,
    opacity: 0.78,
    margin: 0,
    letterSpacing: '0.06em',
    userSelect: 'none',
  };

  // Plain-text "INSERT COIN(S)" prompt at canvas-bottom. No pill — the
  // pill read as too UI-modern next to the letterpress wordmark; the
  // retro arcade twitch fits the game's playful-contemplative blend.
  // Bold ink for legibility against the floor band behind it; 1Hz blink
  // via the existing typewriter-caret-blink keyframe.
  const promptStyle: CSSProperties = {
    position: 'absolute',
    bottom: '5%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: palette.ink,
    fontSize: 'clamp(13px, 1.2vw, 16px)',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    margin: 0,
    userSelect: 'none',
    animation: 'typewriter-caret-blink 1000ms steps(2, end) infinite',
  };

  return (
    <div data-component="TitleScreen" style={screenStyle}>
      {/* Floor band + NPCs — single SVG matching the room coordinate
          system so InteractableSprite renders at its native scale. */}
      <svg
        viewBox={`0 0 ${ROOM_VIEWBOX.width} ${ROOM_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        aria-hidden="true"
      >
        <rect
          data-region="floor-band"
          x={0}
          y={NPC_BAND_Y - NPC_BAND_HEIGHT / 2 + 40}
          width={ROOM_VIEWBOX.width}
          height={NPC_BAND_HEIGHT - 40}
          fill={palette.surface}
          opacity={0.6}
        />
        {positions.map((pos, i) => (
          <InteractableSprite
            key={i}
            art={npcs[i].art}
            kind={npcs[i].kind}
            x={pos.x}
            y={pos.y}
            palette={palette}
          />
        ))}
        {/* Arcade cabinet — fixed decoration at the right edge of the
            floor band. Rendered after the wandering sprites so it
            consistently sits on top if anyone drifts close. */}
        <InteractableSprite
          art="arcade-game"
          kind="object"
          x={TITLE_ARCADE_X}
          y={TITLE_ARCADE_Y}
          palette={palette}
        />
      </svg>

      <h1 data-region="wordmark" style={wordmarkStyle}>
        PATH TO THE FUTURE
      </h1>
      <p data-region="tagline" style={taglineStyle}>
        A life, one month at a time.
      </p>
      {resumable && (
        <div data-region="welcome" style={welcomeStyle}>
          <p style={{ margin: 0 }}>Welcome back, {profileName}!</p>
        </div>
      )}
      {resumable && (
        <div data-region="hud-preview" style={hudPreviewStyle}>
          <StatChip
            name="xp"
            numericValue={progress.xp}
            displayValue={formatXp(progress.xp)}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'xp')}
          />
          <StatChip
            name="burnout"
            numericValue={stats.burnout}
            displayValue={stats.burnout}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'burnout')}
          />
          <StatChip
            name="savings"
            numericValue={stats.savings}
            displayValue={formatMoney(stats.savings)}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'savings')}
          />
          <StatChip
            name="health"
            numericValue={stats.health}
            displayValue={stats.health}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'health')}
          />
          <StatChip
            name="network"
            numericValue={stats.network}
            displayValue={stats.network}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'network')}
          />
          {stats.relationship !== null && (
            <StatChip
              name="relationship"
              numericValue={stats.relationship}
              displayValue={stats.relationship}
              palette={palette}
              ariaLabel={statLabelFor(pack.manifest, 'relationship')}
            />
          )}
          <StatChip
            name="technicalSkill"
            numericValue={stats.technicalSkill}
            displayValue={stats.technicalSkill}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'technicalSkill')}
          />
          <StatChip
            name="reputation"
            numericValue={stats.reputation}
            displayValue={formatReputation(stats.reputation)}
            palette={palette}
            ariaLabel={statLabelFor(pack.manifest, 'reputation')}
          />
        </div>
      )}
      <p data-region="prompt" style={promptStyle}>
        {resumable ? 'Press any key to continue' : 'Press any key to start'}
      </p>
    </div>
  );
}

// HUD-parity formatters. Mirror the same scale-down logic the Hud uses
// for its own chips so the title preview reads identically (e.g. 12,345
// XP shows as "12K" in both places). Kept in sync by convention; the
// Hud doesn't export these so we duplicate them — small enough that a
// future shared `formatters.ts` extraction can land if a third caller
// shows up.
function formatXp(xp: number): string {
  if (xp < 10_000) return xp.toLocaleString('en-US');
  if (xp < 1_000_000) return `${Math.floor(xp / 1000)}K`;
  return `${(xp / 1_000_000).toFixed(1)}M`;
}

function formatMoney(amount: number): string {
  if (amount < 10_000) return amount.toLocaleString('en-US');
  if (amount < 1_000_000) return `${Math.floor(amount / 1000)}K`;
  return `${(amount / 1_000_000).toFixed(1)}M`;
}

function formatReputation(rep: number): string {
  if (rep > 0) return `+${rep}`;
  return `${rep}`;
}
