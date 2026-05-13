import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useStore } from 'react-redux';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { computeScore, type ScoreBreakdown } from '../content/computeScore';
import { classTierForXp } from '../content/classes';
import { resetProfile } from '../state/slices/profileSlice';
import { resetProgress } from '../state/slices/progressSlice';
import { resetStats } from '../state/slices/statsSlice';
import { resetFlags } from '../state/slices/flagsSlice';
import { resetHistory } from '../state/slices/historySlice';
import { resetMeta } from '../state/slices/metaSlice';
import { clearPersistedState } from '../state/persistence';
import { CreditsScreen } from './CreditsScreen';
import { StatIcon, type StatIconName } from './icons/StatIcon';
import { DecisionIcon } from './icons/modalIcons';
import type { Palette } from '../types/careerPack';
import { statLabelFor } from '../content/statLabels';
import type { Manifest, Palette } from '../types/careerPack';
import type { StatsState } from '../state/slices/statsSlice';
import type { DecisionRecord } from '../state/slices/historySlice';
import type { RootState } from '../state/store';

// Recap actions cycled by ← → on the keyboard. Order matches the visual
// order (left → right) so arrow nav reads naturally. Three buttons (#26):
// Career Timeline opens a dedicated full-canvas view; Credits / Begin again
// route through CreditsScreen as before.
const ACTIONS = ['timeline', 'credits', 'replay'] as const;
type ActionId = (typeof ACTIONS)[number];

interface StatRowProps {
  label: string;
  value: number | null;
  unit?: string;
  palette: Palette;
  icon: StatIconName;
}

function StatRow({ label, value, unit, palette, icon }: StatRowProps) {
  const display = value === null ? '—' : unit === '$' ? `$${value.toLocaleString()}` : `${value}`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          letterSpacing: '0.08em',
          color: palette.inkMuted,
          textTransform: 'uppercase',
        }}
      >
        <StatIcon name={icon} size={18} />
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 500 }}>{display}</span>
    </div>
  );
}

interface ScoreRowProps {
  label: string;
  value: number;
  palette: Palette;
  emphasis?: boolean;
}

function ScoreRow({ label, value, palette, emphasis }: ScoreRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: emphasis ? 16 : 13,
        fontWeight: emphasis ? 600 : 400,
        paddingTop: emphasis ? 8 : 0,
        // The score-total separator. Use ink for the underline so it reads
        // on the lighter (palette.background) panel.
        borderTop: emphasis ? `1px solid ${palette.ink}` : 'none',
        marginTop: emphasis ? 6 : 0,
      }}
    >
      <span style={{ color: emphasis ? palette.ink : palette.inkMuted }}>{label}</span>
      <span style={{ color: value < 0 ? palette.inkMuted : palette.ink }}>
        {value < 0 ? `−${Math.abs(value).toLocaleString()}` : value.toLocaleString()}
      </span>
    </div>
  );
}

function StatsPanel({
  stats,
  palette,
  manifest,
}: {
  stats: StatsState;
  palette: Palette;
  manifest: Manifest;
}) {
  // Labels resolved through `manifest.statLabels` (§26 v2.0). SWE pack omits
  // the override and falls through to the defaults, preserving the existing
  // wording. Other packs (e.g. homeschool-parent) relabel a subset.
  return (
    <div
      data-region="stats-panel"
      style={{
        flex: 1,
        background: palette.background,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 6,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: palette.inkMuted,
          textTransform: 'uppercase',
        }}
      >
        Final stats
      </p>
      <StatRow icon="burnout" label={statLabelFor(manifest, 'burnout')} value={stats.burnout} palette={palette} />
      <StatRow icon="health" label={statLabelFor(manifest, 'health')} value={stats.health} palette={palette} />
      <StatRow icon="network" label={statLabelFor(manifest, 'network')} value={stats.network} palette={palette} />
      <StatRow icon="reputation" label={statLabelFor(manifest, 'reputation')} value={stats.reputation} palette={palette} />
      <StatRow icon="technicalSkill" label={statLabelFor(manifest, 'technicalSkill')} value={stats.technicalSkill} palette={palette} />
      {/* Relationship row hidden until any decision / event actually
          modifies the stat. v1 ships with the slot wired (state, score
          breakdown, icon, requires-clause on `univ-date-app-match`) but
          no effect ever sets it, so showing "—" was noise. Same
          conditional pattern as the HUD's StatChip — relationship UI
          appears only once the stat has been set. Per §20. */}
      {stats.relationship !== null && (
        <StatRow icon="relationship" label={statLabelFor(manifest, 'relationship')} value={stats.relationship} palette={palette} />
      )}
      <StatRow icon="savings" label={statLabelFor(manifest, 'savings')} value={stats.savings} unit="$" palette={palette} />
    </div>
  );
}

function ScorePanel({
  breakdown,
  classLabel,
  xp,
  palette,
  manifest,
}: {
  breakdown: ScoreBreakdown;
  classLabel: string;
  xp: number;
  palette: Palette;
  manifest: Manifest;
}) {
  return (
    <div
      data-region="score-panel"
      style={{
        flex: 1,
        background: palette.background,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 2,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: palette.inkMuted,
          textTransform: 'uppercase',
        }}
      >
        Class
      </p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{classLabel}</p>
      <p style={{ margin: '0 0 8px 0', fontSize: 12, color: palette.inkMuted }}>
        {xp.toLocaleString()} XP
      </p>

      <p
        style={{
          margin: 0,
          marginBottom: 4,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: palette.inkMuted,
          textTransform: 'uppercase',
        }}
      >
        Score
      </p>
      {/* Score-breakdown labels: pure-stat rows route through statLabelFor
          (§26) so a pack relabeling e.g. `burnout` → "Stress" sees "Stress
          penalty" here too. Composite rows ("Wellbeing" = health + network +
          technicalSkill + reputation; "Decisions" = decision-tag bonus)
          stay as-is — they don't name a single stat. */}
      <ScoreRow label="Experience" value={breakdown.experience} palette={palette} />
      <ScoreRow label={statLabelFor(manifest, 'savings')} value={breakdown.savings} palette={palette} />
      <ScoreRow label="Wellbeing" value={breakdown.wellbeing} palette={palette} />
      <ScoreRow
        label={`${statLabelFor(manifest, 'burnout')} penalty`}
        value={breakdown.burnoutPenalty}
        palette={palette}
      />
      {/* Relationship score line hidden when the bonus is 0 — matches
          the StatsPanel rule (the stat starts null and no decision /
          event modifies it yet, so a 0-row is just noise). Re-shows
          automatically once any pack content actually moves the
          relationship stat. */}
      {breakdown.relationshipBonus !== 0 && (
        <ScoreRow label={statLabelFor(manifest, 'relationship')} value={breakdown.relationshipBonus} palette={palette} />
      )}
      <ScoreRow label="Decisions" value={breakdown.decisions} palette={palette} />
      <ScoreRow label="Total" value={breakdown.total} palette={palette} emphasis />
    </div>
  );
}

interface DecisionByYear {
  year: number;
  rows: { monthId: number; decisionId: string; prompt: string | undefined; optionTaken: string }[];
}

const DecisionTimeline = forwardRef<
  HTMLDivElement,
  { byYear: DecisionByYear[]; palette: Palette }
>(function DecisionTimeline({ byYear, palette }, ref) {
  return (
    <div
      ref={ref}
      data-region="career-timeline"
      style={{
        // Lives inside CareerTimelineScreen as the flex:1 region. Internal
        // scroll handles the full 120-decision list. (The dedicated screen
        // provides the title + decision count above, so this panel renders
        // just the year-grouped rows.)
        flex: 1,
        minHeight: 0,
        background: palette.background,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        padding: '14px 18px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {byYear.map((y) => (
        <div key={y.year} style={{ marginTop: 8 }}>
          <p
            style={{
              margin: 0,
              marginBottom: 4,
              fontSize: 12,
              fontWeight: 600,
              color: palette.ink,
              letterSpacing: '0.04em',
            }}
          >
            {y.year}
          </p>
          {y.rows.map((r, i) => (
            <div
              key={i}
              data-decision-id={r.decisionId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '6px 0',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {/* Decision icon — leftmost visual anchor per row. Renders the
                  placeholder "?" for unregistered ids; real art swaps in as
                  the registry fills. Sized at 32 for the timeline density. */}
              <DecisionIcon decisionId={r.decisionId} palette={palette} size={32} />
              <span
                style={{
                  color: palette.inkMuted,
                  // Width covers "September 2025" at 11px without wrap.
                  width: 124,
                  flexShrink: 0,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  paddingTop: 1,
                }}
              >
                {monthLabel(r.monthId)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {r.prompt && (
                  <p
                    style={{
                      margin: 0,
                      marginBottom: 2,
                      color: palette.inkMuted,
                      fontSize: 12,
                      fontStyle: 'italic',
                      lineHeight: 1.45,
                    }}
                  >
                    {r.prompt}
                  </p>
                )}
                <p
                  style={{
                    margin: 0,
                    color: palette.ink,
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.45,
                  }}
                >
                  → {r.optionTaken}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

// Dedicated full-canvas view for the career timeline. Reached from the
// "Career Timeline" button on the recap (#26). Mirrors the CreditsScreen
// pattern — same canvas frame, owns its own Escape listener, returns the
// player to the recap on close.
function CareerTimelineScreen({
  byYear,
  palette,
  onClose,
}: {
  byYear: DecisionByYear[];
  palette: Palette;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Esc / Backspace / Enter / Space all close — the screen has one
      // action (Close) so any "confirm" key resolves it.
      if (
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        onClose();
        return;
      }
      // Arrow / Page / Home / End scroll the timeline list. Mouse-wheel
      // also works (browser default) — the keyboard handlers exist so the
      // recap stays "keyboard-first" consistent with the rest of the game.
      const el = scrollRef.current;
      if (!el) return;
      const ROW_STEP = 60; // ~3 timeline rows per arrow press
      const PAGE_STEP = el.clientHeight - 40;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        el.scrollBy({ top: ROW_STEP, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        el.scrollBy({ top: -ROW_STEP, behavior: 'smooth' });
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        el.scrollBy({ top: PAGE_STEP, behavior: 'smooth' });
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        el.scrollBy({ top: -PAGE_STEP, behavior: 'smooth' });
      } else if (e.key === 'Home') {
        e.preventDefault();
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const total = byYear.reduce((s, y) => s + y.rows.length, 0);

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
      data-component="CareerTimelineScreen"
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
        padding: '20px 32px',
        fontFamily: 'inherit',
        gap: 12,
        minHeight: 0,
      }}
    >
      <div data-region="header" style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.2em',
            color: palette.inkMuted,
            textTransform: 'uppercase',
          }}
        >
          Career Timeline
        </p>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: 13,
            color: palette.inkMuted,
            opacity: 0.9,
          }}
        >
          {total} decisions across ten years
        </p>
      </div>

      <DecisionTimeline ref={scrollRef} byYear={byYear} palette={palette} />

      <div
        data-region="actions"
        style={{ display: 'flex', justifyContent: 'center', gap: 12 }}
      >
        <button
          data-action="close"
          onClick={onClose}
          style={{ ...buttonStyle, background: palette.surface }}
        >
          Close
        </button>
      </div>
      <p
        data-region="hint"
        style={{
          margin: '4px 0 0 0',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: palette.inkMuted,
          textAlign: 'center',
          textTransform: 'uppercase',
          opacity: 0.6,
        }}
      >
        ↑ ↓ to scroll · Enter / Space / Esc to close
      </p>
    </div>
  );
}

export function EndgameScreen() {
  const { palette, pack } = useCareerPack();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const stats = useAppSelector((s) => s.stats);
  const progress = useAppSelector((s) => s.progress);
  const history = useAppSelector((s) => s.history);
  const profileName = useAppSelector((s) => s.profile.name);

  const [creditsMode, setCreditsMode] = useState<'browse' | 'replay' | null>(null);
  // Random tagline shown below the title. Fetched once on mount; the picked
  // line stays stable for the duration of this endgame view so it doesn't
  // re-roll on every re-render. Editable in public/endgame-taglines.json.
  const [tagline, setTagline] = useState<string>('');
  // Which action button is currently focused for keyboard nav. Three
  // buttons now (#26): Career Timeline (leftmost, default), Credits,
  // Begin again. ← → cycles with wrap-around.
  const [focusedAction, setFocusedAction] = useState<ActionId>('timeline');
  // Career timeline view toggle (#26). When true, the recap is replaced
  // with the dedicated CareerTimelineScreen (full-canvas, list claims the
  // whole height, Esc returns). Mirrors the existing creditsMode pattern.
  const [viewingTimeline, setViewingTimeline] = useState(false);

  useEffect(() => {
    fetch('/endgame-taglines.json')
      .then((r) => r.json())
      .then((d: { taglines: string[] }) => {
        if (Array.isArray(d.taglines) && d.taglines.length > 0) {
          setTagline(d.taglines[Math.floor(Math.random() * d.taglines.length)]);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // Skip keybindings while a sub-view (credits / timeline) is open —
    // those own their own Escape listeners.
    if (creditsMode !== null || viewingTimeline) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedAction((cur) => {
          const idx = ACTIONS.indexOf(cur);
          const delta = e.key === 'ArrowRight' ? 1 : -1;
          return ACTIONS[(idx + delta + ACTIONS.length) % ACTIONS.length];
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedAction === 'timeline') setViewingTimeline(true);
        else if (focusedAction === 'credits') setCreditsMode('browse');
        else setCreditsMode('replay');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [creditsMode, viewingTimeline, focusedAction]);

  const score = useMemo(() => computeScore(stats, progress, history), [stats, progress, history]);
  const tier = useMemo(() => classTierForXp(progress.xp), [progress.xp]);

  const byYear = useMemo<DecisionByYear[]>(() => {
    const map = new Map<number, DecisionRecord[]>();
    const monthsById = new Map(pack.months.map((m) => [m.id, m]));
    // Lookup table for prompts. The history record stores `decisionId` but
    // not the prompt text, so we resolve it here against the live pack. If
    // a decision was renamed / removed from the pack after a save was
    // taken, the prompt becomes undefined and the row falls back to
    // option-only (old behavior).
    const decisionById = new Map(pack.decisions.map((d) => [d.id, d]));
    for (const d of history.decisions) {
      const month = monthsById.get(d.monthId);
      if (!month) continue;
      const list = map.get(month.year) ?? [];
      list.push(d);
      map.set(month.year, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, ds]) => ({
        year,
        rows: ds
          .sort((a, b) => a.monthId - b.monthId)
          .map((d) => ({
            monthId: d.monthId,
            decisionId: d.decisionId,
            prompt: decisionById.get(d.decisionId)?.prompt,
            optionTaken: d.optionTaken,
          })),
      }));
  }, [history.decisions, pack.months, pack.decisions]);

  const handleReplay = useCallback(() => {
    // Reset all slices then clear localStorage and reload. The reload
    // bounces back to the TitleScreen (the title-gate `acknowledged`
    // flag is per-mount React state in App.tsx, so a full reload is
    // the cleanest way to land there). Without the reload, the post-
    // reset rerender drops the player straight into InitFlow — they'd
    // never see the title again on Begin Again, and the welcome-back
    // block would never have a chance to NOT appear in the right
    // moment. The in-memory dispatches still fire defensively so the
    // window between dispatch and reload doesn't flash stale state.
    dispatch(resetProfile());
    dispatch(resetProgress());
    dispatch(resetStats());
    dispatch(resetFlags());
    dispatch(resetHistory());
    dispatch(resetMeta());
    clearPersistedState();
    void store; // ref kept for potential debug; not used.
    window.location.reload();
  }, [dispatch, store]);

  if (creditsMode) {
    return (
      <CreditsScreen
        mode={creditsMode}
        onClose={() => setCreditsMode(null)}
        onConfirmReplay={() => {
          setCreditsMode(null);
          handleReplay();
        }}
      />
    );
  }

  if (viewingTimeline) {
    return (
      <CareerTimelineScreen
        byYear={byYear}
        palette={palette}
        onClose={() => setViewingTimeline(false)}
      />
    );
  }

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
      data-component="EndgameScreen"
      style={{
        // Recap matches the canvas frame (1000×600 aspect ratio at
        // current canvas-display-width). Stats + score panels sit inline,
        // sized to content. The career timeline is reached via the
        // leftmost action button — opens CareerTimelineScreen, a dedicated
        // full-canvas view that gives the timeline room to breathe.
        width: 'var(--canvas-display-width)',
        aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
        background: palette.background,
        color: palette.ink,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 32px',
        fontFamily: 'inherit',
        gap: 12,
        minHeight: 0,
      }}
    >
      <div data-region="header" style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.2em',
            color: palette.inkMuted,
            textTransform: 'uppercase',
          }}
        >
          Ten years done.
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0 0', letterSpacing: '0.02em' }}>
          {profileName ? `${profileName}'s Career` : 'Your Career'}
        </h1>
        {tagline && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 13,
              fontStyle: 'italic',
              color: palette.inkMuted,
              opacity: 0.9,
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      <div
        data-region="panels"
        style={{ display: 'flex', gap: 12, alignItems: 'stretch', flex: 1, minHeight: 0 }}
      >
        <StatsPanel stats={stats} palette={palette} manifest={pack.manifest} />
        <ScorePanel
          breakdown={score}
          classLabel={tier.label}
          xp={progress.xp}
          palette={palette}
          manifest={pack.manifest}
        />
      </div>

      <div data-region="actions" style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          data-action="career-timeline"
          data-active={focusedAction === 'timeline' || undefined}
          onClick={() => setViewingTimeline(true)}
          onMouseEnter={() => setFocusedAction('timeline')}
          style={{
            ...buttonStyle,
            background: focusedAction === 'timeline' ? palette.surface : 'transparent',
          }}
        >
          Career Timeline
        </button>
        <button
          data-action="credits"
          data-active={focusedAction === 'credits' || undefined}
          onClick={() => setCreditsMode('browse')}
          onMouseEnter={() => setFocusedAction('credits')}
          style={{
            ...buttonStyle,
            background: focusedAction === 'credits' ? palette.surface : 'transparent',
          }}
        >
          Credits
        </button>
        <button
          data-action="begin-again"
          data-active={focusedAction === 'replay' || undefined}
          onClick={() => setCreditsMode('replay')}
          onMouseEnter={() => setFocusedAction('replay')}
          style={{
            ...buttonStyle,
            background: focusedAction === 'replay' ? palette.surface : 'transparent',
          }}
        >
          Begin again
        </button>
      </div>
      <p
        style={{
          margin: '4px 0 0 0',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: palette.inkMuted,
          textAlign: 'center',
          textTransform: 'uppercase',
          opacity: 0.6,
        }}
      >
        ← → to choose · Enter / Space to confirm
      </p>
    </div>
  );
}
