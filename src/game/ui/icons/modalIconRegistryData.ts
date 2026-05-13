import {
  IconBurnoutFlame,
  IconCar,
  IconChatBubbleMoney,
  IconCodeBrackets,
  IconCouch,
  IconCreditCard,
  IconDie,
  IconDoorKey,
  IconDumbbell,
  IconHeartHands,
  IconHourglass,
  IconHouse,
  IconLaptopSpark,
  IconLightbulbIdea,
  IconMicrophone,
  IconNetwork,
  IconPager,
  IconPalmTree,
  IconPandemicFurlough,
  IconPawPrint,
  IconPhoneCross,
  IconPhoneHeart,
  IconRecruiterCall,
  IconRings,
  IconScale,
  IconSparkle,
  IconStandupTooLong,
  IconStayLate,
  IconSuitcase,
  IconThermometer,
  IconThresholdDoor,
  IconUpwardArrow,
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
//
// Minigame icons (IconCards / IconCheckmark / IconLightning / IconPaddles /
// IconFortyTwo) are exported from `modalIcons.tsx` but not registered here —
// they belong to a future MinigameIcon registry (e.g. consumed by
// `MinigameReplayCard`).

// --- Decision icons ---------------------------------------------------------

export const DECISION_ICONS: Record<string, ModalIconComponent> = {
  // Universal pool (19 ids).
  'univ-stay-late-vs-log-off': IconStayLate,
  'univ-recruiter-call': IconRecruiterCall,
  'univ-vegas-bonus-vs-rest': IconDie,
  'univ-bury-vs-balance': IconScale,
  'univ-standup-too-long': IconStandupTooLong,
  'univ-mlm-pitch': IconChatBubbleMoney,
  'univ-gym-membership': IconDumbbell,
  'univ-buy-house-or-rent': IconHouse,
  'univ-friends-wedding-far': IconRings,
  'univ-therapy-first-session': IconCouch,
  'univ-dog': IconPawPrint,
  'univ-cash-out-pto': IconPalmTree,
  'univ-charity-donation': IconHeartHands,
  'univ-parent-needs-help': IconPhoneCross,
  'univ-move-cities-for-job': IconSuitcase,
  'univ-buy-car': IconCar,
  'univ-side-project': IconLaptopSpark,
  'univ-roommate-buyout': IconDoorKey,
  'univ-date-app-match': IconPhoneHeart,

  // SWE pool specifics — highest-weight first, per pool-weight audit.
  'swe-framework-rewrite-vs-patch': IconCodeBrackets,
  'swe-oncall-volunteer': IconPager,
  'swe-2am-idea': IconLightbulbIdea,
  'swe-conference-talk-cfp': IconMicrophone,

  // Finale (DecisionRoom hardcodes this id at month 120).
  'finale-month-120': IconThresholdDoor,
};

// --- Event icons ------------------------------------------------------------

export const EVENT_ICONS: Record<string, ModalIconComponent> = {
  // Era anchors — one per era.
  'evt-era-pandemic-furlough-friend': IconPandemicFurlough,
  'evt-era-rebound-promo-wave': IconUpwardArrow,
  'evt-era-ai-shift-junior-anxiety': IconSparkle,
  'evt-era-uncertain-decade-mark': IconHourglass,

  // Stat-trigger class.
  'evt-stat-burnout-doctor': IconBurnoutFlame,
  'evt-stat-low-health-cold': IconThermometer,
  'evt-stat-high-network-intro': IconNetwork,
  'evt-stat-low-savings-card': IconCreditCard,
};
