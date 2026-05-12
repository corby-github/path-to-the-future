import { PlaceholderIcon, type ModalIconComponent } from './modalIcons';

// Registry data for modal icons. Sibling of `modalIcons.tsx` so the .tsx file
// can stay "components-only" (HMR / fast-refresh friendly). Each entry maps
// a decision/event `id` → icon component. `DecisionIcon` / `EventIcon` in
// `modalIcons.tsx` consult these maps and fall back to `PlaceholderIcon` for
// unregistered ids.
//
// Adding a real icon = (1) author the SVG component in `modalIcons.tsx`,
// (2) swap the value at the relevant id below. No content / modal changes
// needed.

// --- Decision icons ---------------------------------------------------------

export const DECISION_ICONS: Record<string, ModalIconComponent> = {
  // future: rocket / launch night
  'univ-stay-late-vs-log-off': PlaceholderIcon,
  // future: meeting
  'univ-standup-too-long': PlaceholderIcon,
};

// --- Event icons ------------------------------------------------------------

export const EVENT_ICONS: Record<string, ModalIconComponent> = {
  // future: phone
  'evt-era-pandemic-furlough-friend': PlaceholderIcon,
};
