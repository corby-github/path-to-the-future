import {
  IconLightbulbIdea,
  IconPandemicFurlough,
  IconStandupTooLong,
  IconStayLate,
  type ModalIconComponent,
} from './modalIcons';

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
  'univ-stay-late-vs-log-off': IconStayLate,
  'univ-standup-too-long': IconStandupTooLong,
  'swe-2am-idea': IconLightbulbIdea,
};

// --- Event icons ------------------------------------------------------------

export const EVENT_ICONS: Record<string, ModalIconComponent> = {
  'evt-era-pandemic-furlough-friend': IconPandemicFurlough,
};
