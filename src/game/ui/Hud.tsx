import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppSelector } from '../state/hooks';
import { useCareerPack } from '../content/useCareerPack';
import { statLabelFor } from '../content/statLabels';
import { CLASSES } from '../content/classes';
import { calendarMonthDelta } from '../calendar';
import { StatChip } from './StatChip';
import { ProfileModal } from './ProfileModal';
import { useCurrentRoom } from './currentRoomContextValue';

// Month-change feedback. Pulse the label + emit a "+N mo" floater whenever
// monthId advances (or jumps via event.advanceMonths). The two signals
// together: pulse = "the month changed" (subtle), floater = "by how much"
// (loud for the multi-month-jump case the dev call surfaced). Delta is
// measured in **calendar months** via `calendarMonthDelta`, not slot units
// — a single forward door usually reads "+2 mo" (Apr → Jun) under the
// half-length playthrough scheme.
//
// Tiered prominence — bigger jumps deserve bigger signals because they
// represent more "time lost." Thresholds in calendar months:
//   1     → small (13px, 1200ms)  [Jan→Feb, Dec→Jan boundaries]
//   2-5   → medium (18px, 1900ms) [normal forward door, ±2 months]
//   6+    → large (24px, 2700ms), wording flips to "months pass"
const MONTH_DELTA_TIER_SMALL_MS = 1200;
const MONTH_DELTA_TIER_MEDIUM_MS = 1900;
// 6+ months tier — size matches the 2-5 tier; the wording difference
// ("+N months pass" vs "+N mo") carries the semantic weight on its own.
// Duration slightly longer so the longer string has time to read.
const MONTH_DELTA_TIER_LARGE_MS = 2300;

interface MonthDelta {
  id: number;
  text: string;
  positive: boolean;
  magnitude: number;
  durationMs: number;
}

function tierForMagnitude(abs: number): { fontSize: number; durationMs: number; topOffset: number } {
  if (abs >= 6) return { fontSize: 18, durationMs: MONTH_DELTA_TIER_LARGE_MS, topOffset: -8 };
  if (abs >= 2) return { fontSize: 18, durationMs: MONTH_DELTA_TIER_MEDIUM_MS, topOffset: -8 };
  return { fontSize: 13, durationMs: MONTH_DELTA_TIER_SMALL_MS, topOffset: -6 };
}

function formatMonthDelta(diff: number): string {
  const abs = Math.abs(diff);
  const sign = diff > 0 ? '+' : '−'; // U+2212
  // For 6+ months ("a lot of time lost"), use the longer wording so the
  // emit has weight beyond just a bigger number.
  if (abs >= 6) return `${sign}${abs} months pass`;
  return `${sign}${abs} mo`;
}

// Top-anchored player HUD. Identity column on the left (name · class · month
// + current room), eight stat chips on the right (XP + the seven §7 stats).
// Reads from Redux (`profile`, `progress`, `stats`), the career pack for
// palette + class label lookup, and CurrentRoomContext for the room
// template the player is currently in. Per §7, the relationship chip is
// hidden when the value is null (player is single).
export function Hud() {
  const { pack, palette, currentMonth, isReplay } = useCareerPack();
  const profile = useAppSelector((s) => s.profile);
  const progress = useAppSelector((s) => s.progress);
  const stats = useAppSelector((s) => s.stats);
  const cueNonce = useAppSelector((s) => s.progress.monthAdvanceCueNonce);
  const { template } = useCurrentRoom();

  // Profile card (v2.0.7). Opened by clicking the identity chip; closed
  // via the modal's own Close button, backdrop click, or Esc.
  const [profileOpen, setProfileOpen] = useState(false);

  const classLabel =
    pack.manifest.classLabels?.[progress.classTier]?.label ??
    CLASSES.find((c) => c.id === progress.classTier)?.label ??
    pack.manifest.entryClasses[progress.classTier]?.label ??
    progress.classTier;
  const monthLabel = formatMonth(currentMonth.year, currentMonth.monthNum);

  // Month-change emit. Track prev monthId via ref; on change, push a floater
  // and let it auto-clear after the animation duration.
  const prevMonthIdRef = useRef<number>(currentMonth.id);
  const deltaIdCounter = useRef(0);
  const [monthDeltas, setMonthDeltas] = useState<MonthDelta[]>([]);

  // Issue #30 — fade-start cue handshake. `useRoomTransition.exitRoom`
  // bumps `monthAdvanceCueNonce` at the instant the canvas begins to fade
  // (before the 220ms wait → `completeMonth` dispatch). The Hud emits the
  // calendar-delta floater on that cue and arms `suppressNextCompleteEmitRef`
  // so the subsequent natural `currentMonth.id +1` advance doesn't emit a
  // duplicate. Multi-slot `skipMonths` jumps don't go through the cue
  // path — they emit naturally via the currentMonth.id effect. Dedup
  // condition still compares slot units (`completeMonth` always advances
  // exactly 1 slot), even though the emitted value is in calendar months.
  const prevCueNonceRef = useRef<number>(cueNonce);
  const suppressNextCompleteEmitRef = useRef<boolean>(false);

  const pushMonthDelta = useCallback((diff: number) => {
    const abs = Math.abs(diff);
    const { durationMs } = tierForMagnitude(abs);
    const id = ++deltaIdCounter.current;
    const text = formatMonthDelta(diff);
    setMonthDeltas((d) => [...d, {
      id,
      text,
      positive: diff > 0,
      magnitude: abs,
      durationMs,
    }]);
    window.setTimeout(() => {
      setMonthDeltas((d) => d.filter((m) => m.id !== id));
    }, durationMs);
  }, []);

  useEffect(() => {
    const prev = prevCueNonceRef.current;
    prevCueNonceRef.current = cueNonce;
    if (prev === cueNonce) return;
    // Cue precedes completeMonth (fires at fade-start, before the 220ms
    // wait). completeMonth advances slot id by exactly 1, so the upcoming
    // transition is `currentMonth.id → currentMonth.id + 1`. Emit the
    // calendar-month delta for that slot pair (usually +2; +1 across the
    // cinematic-January boundary).
    const calendarDiff = calendarMonthDelta(currentMonth.id, currentMonth.id + 1);
    if (calendarDiff !== 0) pushMonthDelta(calendarDiff);
    suppressNextCompleteEmitRef.current = true;
  }, [cueNonce, currentMonth.id, pushMonthDelta]);

  useEffect(() => {
    const prev = prevMonthIdRef.current;
    prevMonthIdRef.current = currentMonth.id;
    if (prev === currentMonth.id) return;

    const slotDiff = currentMonth.id - prev;
    if (slotDiff === 0) return;
    // Dedup against the fade-start cue. The cue emits at fade-start; the
    // subsequent completeMonth advances currentMonth.id by 1 slot, which
    // would otherwise re-emit. Compare in slot units (not calendar months)
    // since completeMonth always advances exactly 1 slot.
    if (slotDiff === 1 && suppressNextCompleteEmitRef.current) {
      suppressNextCompleteEmitRef.current = false;
      return;
    }
    const calendarDiff = calendarMonthDelta(prev, currentMonth.id);
    if (calendarDiff !== 0) pushMonthDelta(calendarDiff);
  }, [currentMonth.id, pushMonthDelta]);

  const containerStyle: CSSProperties = {
    // Match the canvas's responsive width so the HUD and canvas stay
    // visually aligned on viewport-constrained screens.
    width: 'var(--canvas-display-width)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '10px 16px',
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.surface}`,
    borderRadius: 6,
    fontFamily: "inherit",
    flexWrap: 'wrap',
    // In replay (#33), dim everything to telegraph "you're looking back."
    // Cheap visual cue; the prepended `←` on the month label is the
    // textual signal.
    opacity: isReplay ? 0.7 : 1,
    transition: 'opacity 200ms ease',
  };

  const identityStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    paddingRight: 14,
    borderRight: `1px solid ${palette.surface}`,
    minWidth: 140,
  };

  // Name reads as a clickable target — keeps the original font weight and
  // size but adds a subtle underline-on-hover affordance + pointer cursor.
  // Implemented as a `<button>` for semantics + free keyboard activation;
  // styled to look like the original `<span>` so the HUD chrome doesn't
  // gain visual noise. See v2.0.7 / ProfileModal.
  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: palette.ink,
    lineHeight: 1.2,
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  };

  const metaStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    letterSpacing: '0.04em',
    marginTop: 2,
  };

  const statsWrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    flex: 1,
  };

  // Location column on the far right, mirroring the identity column's
  // two-row structure: primary (month/year) above secondary (room template).
  // Right-aligned with a left-side divider to mirror identity's right divider.
  const locationStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingLeft: 14,
    borderLeft: `1px solid ${palette.surface}`,
    minWidth: 120,
  };

  const locationPrimaryStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: palette.ink,
    lineHeight: 1.2,
    textAlign: 'right',
  };

  const locationMetaStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    letterSpacing: '0.04em',
    marginTop: 2,
    textAlign: 'right',
  };

  return (
    <div
      data-component="Hud"
      data-replay={isReplay || undefined}
      style={containerStyle}
      role="status"
      aria-label="Player status"
    >
      <div data-region="identity" style={identityStyle}>
        <button
          type="button"
          data-action="open-profile"
          aria-label={`Profile: ${profile.name || 'unset'} — click to edit`}
          style={nameStyle}
          onClick={() => setProfileOpen(true)}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {profile.name || '…'}
        </button>
        <span style={metaStyle}>{classLabel}</span>
      </div>

      <div data-region="stats" style={statsWrapStyle}>
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

      <div data-region="location" style={{ ...locationStyle, position: 'relative' }}>
        {/* Re-keyed on monthId so the pulse animation restarts cleanly per
            change. The transformOrigin sticks to the right edge so the
            scale-up doesn't push the chip into the stats column. */}
        <span
          key={`month-${currentMonth.id}`}
          style={{
            ...locationPrimaryStyle,
            display: 'inline-block',
            transformOrigin: 'right center',
            animation: 'month-pulse 600ms ease-out',
          }}
        >
          {isReplay ? `← ${monthLabel}` : monthLabel}
        </span>
        {template && <span style={locationMetaStyle}>{template}</span>}
        {monthDeltas.map((d) => {
          const tier = tierForMagnitude(d.magnitude);
          return (
            <span
              key={d.id}
              style={{
                position: 'absolute',
                right: 0,
                top: tier.topOffset,
                // Pre-animation frame — match the keyframe's resting transform
                // (no horizontal translate, so the element's right edge stays
                // anchored at `right: 0`).
                transform: 'translate(0, 4px)',
                fontSize: tier.fontSize,
                fontWeight: 700,
                color: d.positive ? palette.positive : palette.accent,
                pointerEvents: 'none',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                animation: `month-delta-float ${d.durationMs}ms ease-out forwards`,
                willChange: 'transform, opacity',
              }}
            >
              {d.text}
            </span>
          );
        })}
      </div>
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

// ---- formatters ----

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatMonth(year: number, monthNum: number): string {
  const idx = Math.max(1, Math.min(12, monthNum)) - 1;
  return `${MONTH_NAMES[idx]} ${year}`;
}

// 5,000 → "5,000". 12,345 → "12K". 1,234,567 → "1.2M". Matches the HUD chip
// width budget (~3-4 chars). Locale 'en-US' for the comma separator.
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

// Reputation per §7: -100 to +100. Always show the sign.
function formatReputation(rep: number): string {
  if (rep > 0) return `+${rep}`;
  return `${rep}`;
}
