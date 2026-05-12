import type { CSSProperties, ReactElement } from 'react';
import type { Palette } from '../../types/careerPack';

// Modal icon components (v1.3+). A small palette-aware SVG square shown
// alongside a Decision or Event modal. The lookup tables that map a
// decision/event `id` → icon component live in `modalIconRegistryData.ts` —
// a sibling that holds only the registry data so this file can stay
// "components-only" (HMR / fast-refresh friendly). The public-facing
// `DecisionIcon` / `EventIcon` wrappers (also in this file) consult the
// registry and render either the registered component or the placeholder.
//
// Real SVG art is authored incrementally. Each new icon is a new component in
// this file, plus a one-line registry entry. The DecisionModal / EventModal
// never change when art swaps in.

import { DECISION_ICONS, EVENT_ICONS } from './modalIconRegistryData';

export interface ModalIconProps {
  palette: Palette;
  size?: number;
}

export type ModalIconComponent = (props: ModalIconProps) => ReactElement;

/**
 * Placeholder icon — a bounded square with a muted question mark inside.
 * Used as the default for every registered id today, and as the fallback for
 * any unregistered id. Real art swaps in by replacing the registry entry.
 */
export function PlaceholderIcon({ palette, size = 80 }: ModalIconProps): ReactElement {
  const wrapperStyle: CSSProperties = {
    display: 'block',
    flexShrink: 0,
  };
  return (
    <svg
      data-region="modal-icon"
      data-icon-variant="placeholder"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      style={wrapperStyle}
      role="img"
      aria-label="Modal icon placeholder"
    >
      <rect
        x={1}
        y={1}
        width={78}
        height={78}
        fill={palette.surface}
        stroke={palette.ink}
        strokeWidth={2}
      />
      <text
        x={40}
        y={52}
        textAnchor="middle"
        fontFamily="inherit"
        fontSize={36}
        fontWeight={500}
        fill={palette.inkMuted}
      >
        ?
      </text>
    </svg>
  );
}

interface DecisionIconProps {
  decisionId: string;
  palette: Palette;
}

interface EventIconProps {
  eventId: string;
  palette: Palette;
}

/**
 * Renders the icon registered for a given decision id, or the placeholder
 * if the id is unregistered. The lookup happens here so callers never see
 * the registry — `<DecisionIcon decisionId={...} palette={...} />` is the
 * full integration surface from the modal's perspective.
 */
export function DecisionIcon({ decisionId, palette }: DecisionIconProps): ReactElement {
  const render = DECISION_ICONS[decisionId] ?? PlaceholderIcon;
  return render({ palette });
}

/**
 * Renders the icon registered for a given event id, or the placeholder
 * if the id is unregistered.
 */
export function EventIcon({ eventId, palette }: EventIconProps): ReactElement {
  const render = EVENT_ICONS[eventId] ?? PlaceholderIcon;
  return render({ palette });
}
