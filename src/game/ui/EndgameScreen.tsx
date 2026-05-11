import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
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
import type { Palette } from '../types/careerPack';
import type { StatsState } from '../state/slices/statsSlice';
import type { DecisionRecord } from '../state/slices/historySlice';
import type { RootState } from '../state/store';

interface StatRowProps {
  label: string;
  value: number | null;
  unit?: string;
  palette: Palette;
}

function StatRow({ label, value, unit, palette }: StatRowProps) {
  const display = value === null ? '—' : unit === '$' ? `$${value.toLocaleString()}` : `${value}`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, letterSpacing: '0.08em', color: palette.inkMuted, textTransform: 'uppercase' }}>
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

function StatsPanel({ stats, palette }: { stats: StatsState; palette: Palette }) {
  return (
    <div
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
      <StatRow label="Burnout" value={stats.burnout} palette={palette} />
      <StatRow label="Health" value={stats.health} palette={palette} />
      <StatRow label="Network" value={stats.network} palette={palette} />
      <StatRow label="Reputation" value={stats.reputation} palette={palette} />
      <StatRow label="Technical Skill" value={stats.technicalSkill} palette={palette} />
      <StatRow label="Relationship" value={stats.relationship} palette={palette} />
      <StatRow label="Savings" value={stats.savings} unit="$" palette={palette} />
    </div>
  );
}

function ScorePanel({
  breakdown,
  classLabel,
  xp,
  palette,
}: {
  breakdown: ScoreBreakdown;
  classLabel: string;
  xp: number;
  palette: Palette;
}) {
  return (
    <div
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
      <ScoreRow label="Experience" value={breakdown.experience} palette={palette} />
      <ScoreRow label="Savings" value={breakdown.savings} palette={palette} />
      <ScoreRow label="Wellbeing" value={breakdown.wellbeing} palette={palette} />
      <ScoreRow label="Burnout penalty" value={breakdown.burnoutPenalty} palette={palette} />
      <ScoreRow label="Relationship" value={breakdown.relationshipBonus} palette={palette} />
      <ScoreRow label="Decisions" value={breakdown.decisions} palette={palette} />
      <ScoreRow label="Total" value={breakdown.total} palette={palette} emphasis />
    </div>
  );
}

interface DecisionByYear {
  year: number;
  rows: { monthId: number; optionTaken: string }[];
}

function DecisionTimeline({
  byYear,
  palette,
}: {
  byYear: DecisionByYear[];
  palette: Palette;
}) {
  return (
    <div
      style={{
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
      <p
        style={{
          margin: 0,
          marginBottom: 4,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: palette.inkMuted,
          textTransform: 'uppercase',
          position: 'sticky',
          top: -14,
          background: palette.background,
          paddingTop: 14,
          marginTop: -14,
          paddingBottom: 4,
        }}
      >
        Career timeline · {byYear.reduce((s, y) => s + y.rows.length, 0)} decisions
      </p>
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
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '3px 0',
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  color: palette.inkMuted,
                  width: 80,
                  flexShrink: 0,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                }}
              >
                {monthLabel(r.monthId)}
              </span>
              <span style={{ color: palette.ink, opacity: 0.9 }}>{r.optionTaken}</span>
            </div>
          ))}
        </div>
      ))}
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
  // Which action button is currently focused for keyboard nav.
  const [focusedAction, setFocusedAction] = useState<'credits' | 'replay'>('credits');

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
    // Skip keybindings while the credits screen is open — CreditsScreen owns
    // its own listener and routes Escape correctly.
    if (creditsMode !== null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedAction((cur) => (cur === 'credits' ? 'replay' : 'credits'));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setCreditsMode(focusedAction === 'credits' ? 'browse' : 'replay');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [creditsMode, focusedAction]);

  const score = useMemo(() => computeScore(stats, progress, history), [stats, progress, history]);
  const tier = useMemo(() => classTierForXp(progress.xp), [progress.xp]);

  const byYear = useMemo<DecisionByYear[]>(() => {
    const map = new Map<number, DecisionRecord[]>();
    const monthsById = new Map(pack.months.map((m) => [m.id, m]));
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
          .map((d) => ({ monthId: d.monthId, optionTaken: d.optionTaken })),
      }));
  }, [history.decisions, pack.months]);

  const handleReplay = useCallback(() => {
    // Reset all slices then clear localStorage. After this, App.tsx sees
    // initComplete=false and renders InitFlow. The HUD and DevPanel are
    // still mounted in the wrapper but will re-render with reset state.
    // store.getState() not needed — Redux handles the reset reducers.
    dispatch(resetProfile());
    dispatch(resetProgress());
    dispatch(resetStats());
    dispatch(resetFlags());
    dispatch(resetHistory());
    dispatch(resetMeta());
    clearPersistedState();
    // Persist the freshly reset state so a refresh doesn't bring back
    // the old run. (clearPersistedState removes the save; we leave it
    // removed — App will write a fresh save once the new init completes.)
    void store; // ref kept for potential debug; not used.
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
      <div style={{ textAlign: 'center' }}>
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

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <StatsPanel stats={stats} palette={palette} />
        <ScorePanel breakdown={score} classLabel={tier.label} xp={progress.xp} palette={palette} />
      </div>

      <DecisionTimeline byYear={byYear} palette={palette} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
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
