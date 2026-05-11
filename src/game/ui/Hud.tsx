import type { CSSProperties } from 'react';
import { useAppSelector } from '../state/hooks';
import { useCareerPack } from '../content/useCareerPack';
import { StatChip } from './StatChip';

// Top-anchored player HUD. Renders identity (name · class tier · current month)
// on the left and 8 stat chips (XP + the seven §7 stats) on the right.
// Reads from Redux (`profile`, `progress`, `stats`) and the career pack for
// palette + class label lookup. Per §7, the relationship chip is hidden when
// the value is null (player is single).
export function Hud() {
  const { pack, palette, currentMonth } = useCareerPack();
  const profile = useAppSelector((s) => s.profile);
  const progress = useAppSelector((s) => s.progress);
  const stats = useAppSelector((s) => s.stats);

  const classLabel =
    pack.manifest.entryClasses[progress.classTier]?.label ?? progress.classTier;
  const monthLabel = formatMonth(currentMonth.year, currentMonth.monthNum);

  const containerStyle: CSSProperties = {
    width: '100%',
    maxWidth: 1000,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '10px 16px',
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.surface}`,
    borderRadius: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
    flexWrap: 'wrap',
  };

  const identityStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    paddingRight: 14,
    borderRight: `1px solid ${palette.surface}`,
    minWidth: 140,
  };

  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: palette.ink,
    lineHeight: 1.2,
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

  return (
    <div style={containerStyle} role="status" aria-label="Player status">
      <div style={identityStyle}>
        <span style={nameStyle}>{profile.name || '…'}</span>
        <span style={metaStyle}>
          {classLabel} · {monthLabel}
        </span>
      </div>

      <div style={statsWrapStyle}>
        <StatChip
          name="xp"
          numericValue={progress.xp}
          displayValue={formatXp(progress.xp)}
          palette={palette}
        />
        <StatChip
          name="burnout"
          numericValue={stats.burnout}
          displayValue={stats.burnout}
          palette={palette}
        />
        <StatChip
          name="savings"
          numericValue={stats.savings}
          displayValue={formatMoney(stats.savings)}
          palette={palette}
        />
        <StatChip
          name="health"
          numericValue={stats.health}
          displayValue={stats.health}
          palette={palette}
        />
        <StatChip
          name="network"
          numericValue={stats.network}
          displayValue={stats.network}
          palette={palette}
        />
        {stats.relationship !== null && (
          <StatChip
            name="relationship"
            numericValue={stats.relationship}
            displayValue={stats.relationship}
            palette={palette}
          />
        )}
        <StatChip
          name="technicalSkill"
          numericValue={stats.technicalSkill}
          displayValue={stats.technicalSkill}
          palette={palette}
        />
        <StatChip
          name="reputation"
          numericValue={stats.reputation}
          displayValue={formatReputation(stats.reputation)}
          palette={palette}
        />
      </div>
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
