import { useDevControls } from './useDevControls';
import { useCareerPack } from '../content/useCareerPack';
import { LAYOUT_TEMPLATES } from '../rooms/generator/layouts';

const SPEED_OPTIONS = [1, 2, 3, 4];

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
          style={selectStyle}
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
    </div>
  );
}
