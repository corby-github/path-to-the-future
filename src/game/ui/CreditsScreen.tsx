import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useTrackPageview } from '../analytics/track';

interface Credit {
  role: string;
  names: string[];
}

interface CreditLink {
  label: string;
  url: string;
}

interface CreditsData {
  project: {
    title: string;
    tagline: string;
    version: string;
    copyright: string;
    timeSpent: string;
    builtWith: string;
  };
  links: CreditLink[];
  credits: Credit[];
  specialThanks: string[];
  timeStatement: string;
  closing: string;
  legalNotice: string;
}

interface Props {
  mode: 'browse' | 'replay';
  onClose: () => void;
  onConfirmReplay: () => void;
}

// Roughly constant scroll speed regardless of credits length.
const SCROLL_SPEED_PX_PER_SEC = 55;
const BAND_HEIGHT = 240;
// Hold-at-top before the scroll starts (first iteration only). Subsequent
// loops continue immediately — that's typical credits-roll behavior.
const HOLD_BEFORE_SCROLL_SEC = 2;
// Push the start position down a touch so the first line clears the top
// fade-mask on the scroll band. Without this, the top role label renders
// in the transparent edge of the mask gradient and looks washed out.
const SCROLL_TOP_OFFSET_PX = 20;

// Random "are you sure you want to start over?" lines shown above the
// Yes / No buttons in replay-confirm mode. One is picked per view (stable
// for the duration of the confirmation; re-rolled each time the player
// opens Begin Again). Same comedic register as `endgame-taglines.json`
// per §1 Inspirations — dry, slightly absurd, willing to undercut its
// own seriousness. Note typographic apostrophes + non-breaking hyphens
// in some lines — kept intentionally for visual polish.
const REPLAY_CONFIRM_MESSAGES: readonly string[] = [
  "Sure, let’s reset. I’ll pretend I didn’t watch you agonize over every decision last time.",
  "If you do this, your entire save file evaporates like a low‑level slime in sunlight. Poof. Gone. Hope you weren’t attached.",
  "Okay, but just so we’re clear: pressing this means your progress packs its bags and leaves forever. No refunds. No take‑backs. And yes, I’m judging you a little.",
  "Starting over, huh. Bold choice. I’ll just… sweep your old progress into this little bin here. No, don’t look. It’s embarrassing.",
];

export function CreditsScreen({ mode, onClose, onConfirmReplay }: Props) {
  // §24: 'browse' mounts fire `/credits`; 'replay' mounts fire `/restart`
  // (the begin-again confirm screen). The `restart_confirmed` event is
  // dispatched separately when the user actually clicks "Yes, begin again".
  useTrackPageview(mode === 'browse' ? '/credits' : '/restart');
  const { palette } = useCareerPack();
  const [data, setData] = useState<CreditsData | null>(null);
  const [duration, setDuration] = useState(45);
  // Replay-mode keyboard focus. Defaults to 'cancel' (less-destructive) so a
  // careless Enter doesn't blow away a save.
  const [focusedReplay, setFocusedReplay] = useState<'cancel' | 'confirm'>('cancel');
  // Pick one of the silly confirmation lines on mount. Stable for the
  // duration of THIS confirmation view; re-rolls if the player closes and
  // re-opens (CreditsScreen unmounts/remounts when creditsMode toggles).
  const [confirmMessage] = useState<string>(
    () => REPLAY_CONFIRM_MESSAGES[Math.floor(Math.random() * REPLAY_CONFIRM_MESSAGES.length)],
  );
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prefix with `import.meta.env.BASE_URL` so the path resolves correctly
    // under the Vite `base` (`/path-to-the-future/` for GitHub Pages prod,
    // `/` for default dev). A bare `/credits.json` 404s whenever a non-root
    // base is set, including the dev server when running with `--base`.
    // Same pattern as `loader.ts` + the taglines fetch in EndgameScreen.
    fetch(`${import.meta.env.BASE_URL}credits.json`)
      .then((r) => r.json())
      .then((d: CreditsData) => setData(d))
      .catch(() => setData(null));
  }, []);

  // Compute duration from content height so the scroll speed is uniform
  // whether the JSON has 5 roles or 50. Content starts at translateY(0) and
  // ends at translateY(-100%), so scroll distance = content height.
  useEffect(() => {
    if (!data || !innerRef.current) return;
    const h = innerRef.current.scrollHeight;
    setDuration(h / SCROLL_SPEED_PX_PER_SEC);
  }, [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (mode === 'browse') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
        return;
      }
      // replay mode: ←→ toggle, Enter/Space commits the focused choice
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedReplay((cur) => (cur === 'cancel' ? 'confirm' : 'cancel'));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedReplay === 'cancel') onClose();
        else onConfirmReplay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, focusedReplay, onClose, onConfirmReplay]);

  if (!data) return null;

  const buttonStyle: CSSProperties = {
    padding: '10px 24px',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 120ms',
  };

  return (
    <div
      data-component="CreditsScreen"
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
        padding: '24px 48px',
        fontFamily: 'inherit',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {mode === 'replay' && (
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            color: palette.inkMuted,
            margin: 0,
            marginBottom: 8,
            textAlign: 'center',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          Before you do this again…
        </p>
      )}

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, letterSpacing: '0.02em' }}>
          {data.project.title}
        </h1>
        <p style={{ fontSize: 13, fontStyle: 'italic', color: palette.inkMuted, margin: '4px 0 0 0' }}>
          {data.project.tagline}
        </p>
      </div>

      {/* Auto-scroll band. Overflow hidden so the inner content rises into,
          through, and out of view. translateY start is one band-height (so
          first content lines come in from below) and ends at -100% of inner
          (so the last line scrolls past the top). */}
      <div
        style={{
          height: BAND_HEIGHT,
          overflow: 'hidden',
          position: 'relative',
          margin: '4px 0',
          // Soft top/bottom fade so credits ease in and out instead of
          // popping at the band edges.
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        }}
      >
        <div
          ref={innerRef}
          style={{
            // Top line is already in view at the top of the band. Hold for
            // HOLD_BEFORE_SCROLL_SEC (first iteration only — animation-delay
            // behavior), then roll up until content is fully past the top.
            // fill-mode 'backwards' ensures the from-state shows during the
            // initial hold (no flash). Loops continuously after that.
            animationName: 'credits-scroll',
            animationDuration: `${duration}s`,
            animationDelay: `${HOLD_BEFORE_SCROLL_SEC}s`,
            animationFillMode: 'backwards',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            ['--scroll-start' as string]: `${SCROLL_TOP_OFFSET_PX}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {data.credits.map((c, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  color: palette.inkMuted,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {c.role}
              </p>
              <p style={{ margin: '2px 0 0 0', color: palette.ink, fontSize: 14 }}>
                {c.names.join(' · ')}
              </p>
            </div>
          ))}

          {data.specialThanks.length > 0 && (
            <>
              <div style={{ height: 16 }} />
              <p
                style={{
                  margin: 0,
                  color: palette.inkMuted,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Special thanks
              </p>
              {data.specialThanks.map((t, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    color: palette.ink,
                    fontSize: 13,
                    fontStyle: 'italic',
                    opacity: 0.85,
                    maxWidth: 480,
                    textAlign: 'center',
                  }}
                >
                  {t}
                </p>
              ))}
            </>
          )}
          {/* Trailing breathing room so the last "special thanks" line clears
              the band before the closing message takes over the static area. */}
          <div style={{ height: 24 }} />
        </div>
      </div>

      {/* Static area below the scroll: time statement, closing line, links,
          project meta. The time-statement is the load-bearing sentence —
          rendered bold on its own line so it's the first thing the eye
          catches when the scroll has moved on. */}
      <p
        style={{
          margin: '8px 0 0 0',
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'center',
          alignSelf: 'center',
          letterSpacing: '0.02em',
        }}
      >
        {data.timeStatement} (<a style={{color:'#3e4d87',fontWeight: 100}} target="_blank" href="https://github.com/corby-github/path-to-the-future/blob/main/docs/logs/time-log.md">time-log.md</a>)
      </p>
      <p
        style={{
          margin: '6px 0 0 0',
          fontSize: 13,
          fontStyle: 'italic',
          maxWidth: 540,
          textAlign: 'center',
          opacity: 0.9,
          alignSelf: 'center',
        }}
      >
        {data.closing}
      </p>
      <div
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontSize: 12,
          color: palette.inkMuted,
          lineHeight: 1.6,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          {data.links.map((l, i) => (
            <span key={i}>
              {i > 0 && <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>}
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: palette.ink, textDecoration: 'underline' }}
              >
                {l.label}
              </a>
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>
          {data.project.copyright} · {data.project.version} · {data.project.timeSpent} · {data.project.builtWith}
        </div>
        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          {data.legalNotice}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {mode === 'browse' ? (
          <>
            <button
              data-action="close"
              onClick={onClose}
              style={{ ...buttonStyle, background: palette.surface }}
            >
              Close
            </button>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: palette.inkMuted,
                textTransform: 'uppercase',
                opacity: 0.6,
              }}
            >
              Enter / Space / Esc to close
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                margin: '4px 0',
                fontSize: 15,
                fontStyle: 'italic',
                fontWeight: 600,
                textAlign: 'center',
                maxWidth: 580,
                // Warm rust red — clearly different from the cream/brown
                // SWE palette so the "destructive action" beat lands. Not
                // alarm-red (out of tone with the contemplative register);
                // a confident "are you absolutely sure" red.
                color: '#b54a3a',
                opacity: 1,
                letterSpacing: '0.01em',
                lineHeight: 1,
              }}
            >
              {confirmMessage}
            </p>
            <div data-region="actions" style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                data-action="cancel-replay"
                data-active={focusedReplay === 'cancel' || undefined}
                onClick={onClose}
                onMouseEnter={() => setFocusedReplay('cancel')}
                style={{
                  ...buttonStyle,
                  background: focusedReplay === 'cancel' ? palette.surface : 'transparent',
                }}
              >
                No, take me back
              </button>
              <button
                data-action="confirm-replay"
                data-active={focusedReplay === 'confirm' || undefined}
                onClick={onConfirmReplay}
                onMouseEnter={() => setFocusedReplay('confirm')}
                style={{
                  ...buttonStyle,
                  background: focusedReplay === 'confirm' ? palette.surface : 'transparent',
                }}
              >
                Yes, begin again
              </button>
            </div>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: palette.inkMuted,
                textTransform: 'uppercase',
                opacity: 0.6,
              }}
            >
              ← → to choose · Enter / Space to confirm
            </p>
          </>
        )}
      </div>
    </div>
  );
}
