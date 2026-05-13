import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { StatIcon, type StatIconName } from './icons/StatIcon';
import type { Palette } from '../types/careerPack';

// A single HUD chip. Renders [icon] [displayValue] and emits a floating "+N"
// or "-N" element above the chip whenever `numericValue` changes.
//
// Why both numericValue AND displayValue: the chip's visible value may be
// compressed (e.g., savings 40,000 → "40K", reputation +10 with sign) but
// the delta-animation math needs the raw integer. Caller passes both so the
// chip stays format-agnostic.

interface Props {
  name: StatIconName;
  numericValue: number;
  displayValue: ReactNode;
  palette: Palette;
  // Optional aria-label override for the icon. Lets the caller route
  // through `pack.manifest.statLabels` (§26 v2.0) so AT users hear the
  // pack-relabeled name (e.g., "Teaching" instead of "Technical skill").
  // Falls through to StatIcon's default ARIA_LABELS when omitted.
  ariaLabel?: string;
}

interface FloatingDelta {
  id: number;
  text: string;
  positive: boolean;
}

// 900ms gives the player a clear, unhurried "beat" to register the change
// before any room transition (paced to match POST_EFFECT_PAUSE_MS in
// DecisionRoom).
const DELTA_DURATION_MS = 900;

export function StatChip({ name, numericValue, displayValue, palette, ariaLabel }: Props) {
  const prevRef = useRef<number>(numericValue);
  const idCounter = useRef(0);
  const [deltas, setDeltas] = useState<FloatingDelta[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = numericValue;
    if (prev === numericValue) return;

    const diff = numericValue - prev;
    if (diff === 0) return;

    const id = ++idCounter.current;
    const formatted = Math.abs(diff).toLocaleString('en-US');
    const text = diff > 0 ? `+${formatted}` : `−${formatted}`; // U+2212 minus
    setDeltas((d) => [...d, { id, text, positive: diff > 0 }]);

    const timeout = window.setTimeout(() => {
      setDeltas((d) => d.filter((delta) => delta.id !== id));
    }, DELTA_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [numericValue]);

  const chipStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    color: palette.ink,
    whiteSpace: 'nowrap',
  };

  return (
    <span data-stat={name} style={chipStyle}>
      <StatIcon name={name} size={20} label={ariaLabel} />
      {displayValue}
      {deltas.map((d) => (
        <span
          key={d.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: -6,
            transform: 'translate(-50%, 6px)',
            fontSize: 13,
            fontWeight: 700,
            color: d.positive ? palette.positive : palette.accent,
            pointerEvents: 'none',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.01em',
            animation: `stat-delta-float ${DELTA_DURATION_MS}ms ease-out forwards`,
            // Animation overrides the initial transform; this fallback keeps
            // the element correctly positioned for the pre-animation frame.
            willChange: 'transform, opacity',
          }}
        >
          {d.text}
        </span>
      ))}
    </span>
  );
}
