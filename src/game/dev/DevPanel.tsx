import { useDevControls } from './useDevControls';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { setCurrentMonth, setGameOver } from '../state/slices/progressSlice';
import { resetTutorial } from '../state/slices/metaSlice';
import { LAYOUT_TEMPLATES } from '../rooms/generator/layouts';

const FINALE_MONTH_ID = 120;

const SPEED_OPTIONS = [1, 2, 3, 4];

// Hand-picked month slots that host minigames (see months.json).
const MINIGAME_JUMPS = [
  { value: 32, label: 'Blackjack (m32 · Aug 2022)' },
  { value: 60, label: 'Code Review (m60 · Dec 2024)' },
  { value: 90, label: 'Stacker (m90 · Jun 2027)' },
];

const selectStyle = {
  background: '#222',
  color: '#ddd',
  border: '1px solid #444',
  padding: '2px 6px',
  fontFamily: 'inherit',
  fontSize: 11,
};

export function DevPanel() {
  const {
    speedMultiplier,
    setSpeedMultiplier,
    forcedLayout,
    setForcedLayout,
    eventMode,
    setEventMode,
  } = useDevControls();
  const { pack } = useCareerPack();
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 12px',
        border: '1px dashed #555',
        borderRadius: 4,
        fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
        fontSize: 11,
        color: '#aaa',
        letterSpacing: '0.04em',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: '#e88', fontWeight: 600 }}>DEV</span>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>speed</span>
        <select
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          style={selectStyle}
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>layout</span>
        <select
          value={forcedLayout ?? ''}
          onChange={(e) => setForcedLayout(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">seeded</option>
          {LAYOUT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>events</span>
        <select
          value={eventMode}
          onChange={(e) => setEventMode(e.target.value)}
          style={{ ...selectStyle, maxWidth: 180, width: 180 }}
        >
          <option value="auto">auto</option>
          <option value="never">never</option>
          {pack.events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              force: {ev.id}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>minigame</span>
        <select
          value=""
          onChange={(e) => {
            const m = Number(e.target.value);
            if (m) dispatch(setCurrentMonth(m));
            // Reset to placeholder so the same option can be re-picked.
            e.target.value = '';
          }}
          style={selectStyle}
        >
          <option value="">jump to…</option>
          {MINIGAME_JUMPS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>trigger</span>
        <select
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'endgame') {
              dispatch(setGameOver(true));
            } else if (v === 'tutorial') {
              dispatch(resetTutorial());
            } else if (v === 'finale-month') {
              dispatch(setCurrentMonth(FINALE_MONTH_ID));
            } else if (v === 'title') {
              // Title-screen `acknowledged` is per-mount React state in
              // App.tsx, so a hard reload is the cleanest way to bring
              // the title back (and it accurately reproduces what a real
              // player sees on every app launch). Persisted save survives;
              // only the title-gate flag resets.
              window.location.reload();
              return;
            }
            // Reset the select to its placeholder so the same trigger
            // can fire twice in a row.
            e.target.value = '';
          }}
          style={selectStyle}
        >
          <option value="">trigger…</option>
          <option value="title">title</option>
          <option value="tutorial">tutorial</option>
          <option value="finale-month">finale month</option>
          <option value="endgame">endgame</option>
        </select>
      </label>
    </div>
  );
}
