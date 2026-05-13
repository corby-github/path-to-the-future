// Generator-only metadata. Each entry maps an icon component name (the
// function name exported from src/game/ui/icons/modalIcons.tsx) to a one-line
// description used as:
//   1. The caption shown next to the icon in the icons review HTML.
//   2. The alt text on the <img> / aria-label on the inline <svg> for
//      accessibility scanning.
//
// Not bundled into the app — consumed only by scripts/generate-previews.tsx.
// Keep descriptions terse (single clause, lower-case after the dash) so they
// scan well in the review grid. Update this table whenever a new icon lands
// in modalIcons.tsx.

export const ICON_DESCRIPTIONS: Record<string, string> = {
  // --- Universal decision pool ---------------------------------------------
  IconStayLate: 'clock with crescent moon — late hours, staying past close',
  IconRecruiterCall: 'simple handset silhouette — a cold recruiter call',
  IconDie: 'six-pip die — bet-it-all bonus weekend',
  IconScale: 'balance scale — weighing two paths',
  IconStandupTooLong: 'clock with speech-bubble dots — meeting that drags',
  IconChatBubbleMoney: 'speech bubble with dollar sign — MLM pitch from a friend',
  IconDumbbell: 'single dumbbell — gym membership decision',
  IconHouse: 'simple house outline — buy vs. keep renting',
  IconRings: 'two interlocked wedding bands — friend\'s wedding far away',
  IconCouch: 'three-seat sofa, front view — first therapy session',
  IconPawPrint: 'paw print — adopting a dog',
  IconPalmTree: 'curved palm tree rising from an island — cashing out PTO',
  IconHeartHands: 'heart with a dollar sign inside — charity donation',
  IconPhoneCross: 'phone with a small cross — parent needs help',
  IconSuitcase: 'standing suitcase — moving cities for the job',
  IconCar: 'three-quarter sedan — buying a car',
  IconLaptopSpark: 'laptop with a spark glyph — side project spin-up',
  IconDoorKey: 'door beside a large key — roommate buyout',
  IconPhoneHeart: 'phone with a heart — a match on the app',

  // --- SWE decision pool ----------------------------------------------------
  IconCodeBrackets: 'angle brackets — framework rewrite vs. patch',
  IconPager: 'phone with an alert badge and buzz waves — volunteering for on-call',
  IconLightbulbIdea: 'lightbulb with rays — a 2am idea worth keeping',
  IconMicrophone: 'microphone on stand — conference CFP',
  IconRocket: 'rocket lifting off — Friday deploy',
  IconMentorJunior: 'tall and short figure side by side — mentor pairing',
  IconHackathon: 'laptop with energy lines — weekend hackathon',
  IconStackoverflowAnswer: 'speech bubble with rising arrow — answering on the public Q&A',
  IconInternClock: 'small figure with a clock — late-night intern review',
  IconForkedPath: 'branching path — coder vs. architect track',
  IconOrgChart: 'three-node hierarchy — people manager vs. tech lead',
  IconMortarboard: 'graduation cap — master\'s degree program',
  IconBriefcaseSpark: 'briefcase with a spark — startup offer',
  IconWhiteboardSystem: 'whiteboard with a system diagram — architecture review',
  IconBus: 'school bus from the side — throwing a colleague under',
  IconCodeHeart: 'heart formed from code brackets — open-source maintainer',

  // --- Finale --------------------------------------------------------------
  IconThresholdDoor: 'door ajar with an exit arrow — month-120 threshold',

  // --- Universal events ----------------------------------------------------
  IconSunset: 'sun half below a horizon — a five-minute sunset pause',
  IconDollarQuestion: 'dollar sign with a question mark — bank error in your favor',
  IconPandemicClose: 'wall calendar with a big X — the office closes',
  IconCoffeeCup: 'coffee cup with steam — skipping breakfast again',
  IconTwoFiguresHeart: 'two figures with a small heart — old friend in town',
  IconReturnOffice: 'building with an arrow — return-to-office mandate',
  IconGearSparkle: 'gear with a spark — new AI tooling on the team',
  IconEnvelope: 'sealed envelope — invite to give a talk',
  IconCashFound: 'bill on the ground — found twenty dollars',
  IconBrowserTabX: 'browser window with two tabs — deleted the wrong tab',
  IconHouseUpArrow: 'house with an upward arrow — rent hike',
  IconAirplaneClock: 'airplane with a clock — flight delay',
  IconLostWallet: 'bi-fold wallet with motion lines — lost wallet',
  IconHeartCheck: 'heart with a checkmark — good physical results',
  IconCloudLightning: 'storm cloud with a bolt — sudden storm',
  IconSpeakerSound: 'speaker with sound waves — voice reminder mishap',

  // --- SWE-specific events --------------------------------------------------
  IconDocumentTrending: 'document with an upward trend line — a blog post finds traction',
  IconInboxBlast: 'inbox tray with incoming down-arrows — recruiter cold-blast',
  IconTrophy: 'small trophy — Stack Overflow reputation milestone',
  IconFlowWaves: 'horizontal flowing waves — a long flow-state afternoon',

  // --- Era-anchored events --------------------------------------------------
  IconPandemicFurlough: 'empty office chair — colleague furloughed',
  IconVideoCall: '2×2 grid of video tiles — zoom-fatigue',
  IconRoommateFriction: 'two figures with friction marks — roommate tension',
  IconWalker: 'walking figure in profile mid-stride — daily walk routine',
  IconUpwardArrow: 'ascending staircase with an up-arrow — promo wave',
  IconDollarUpArrow: 'dollar sign with an upward arrow — comp jump',
  IconDoorExit: 'door frame with an outgoing arrow — friends leaving the company',
  IconSparkle: 'four-point sparkle — AI-shift junior anxiety',
  IconLayoffsExit: 'figure walking through a door — adjacent-team layoffs',
  IconBubbleSparkle: 'speech bubble with a sparkle — AI-tooling evangelism',
  IconHourglass: 'hourglass — decade-mark milestone',
  IconArchiveBox: 'archive carton — opening an old codebase',
  IconMentorPointing: 'figure pointing at a smaller figure — becoming the mentor',
  IconCycleArrow: 'sun rising over a horizon — cycle reborn / starting over',
  IconEconomyDown: 'chart line trending down — soft economy',

  // --- Stat-trigger events --------------------------------------------------
  IconBurnoutFlame: 'flame — burnout doctor visit',
  IconThermometer: 'thermometer in mouth — low-health cold',
  IconNetwork: 'connected dots — high-network intro',
  IconCreditCard: 'credit card at an angle — low-savings card swipe',

  // --- Minigame icons (exported but not yet registered) ---------------------
  IconCards: 'two fanned cards (heart + spade) — blackjack minigame',
  IconCheckmark: 'large checkmark — code-review minigame',
  IconLightning: 'lightning bolt — reaction-sprint minigame',
  IconPaddles: 'two paddles with a ball — pong minigame',
  IconFortyTwo: 'glyph reading 42 — the-answer minigame',

  // --- Placeholder ---------------------------------------------------------
  PlaceholderIcon: 'question mark in a frame — unregistered id fallback',
};

// Categories used for grouping in the icons review HTML. The generator
// looks up each registered id\'s component name in here to bucket icons.
// Pure presentation — order here = display order on the page.
export const ICON_CATEGORIES: Array<{
  key: string;
  label: string;
  match: (id: string) => boolean;
}> = [
  { key: 'decisions-universal', label: 'Decisions — universal pool',  match: (id) => id.startsWith('univ-') },
  { key: 'decisions-pack',      label: 'Decisions — pack-specific',   match: (id) => !id.startsWith('univ-') && !id.startsWith('evt-') && !id.startsWith('finale-') },
  { key: 'events-universal',    label: 'Events — universal pool',     match: (id) => id.startsWith('evt-univ-') },
  { key: 'events-pack',         label: 'Events — pack-specific',      match: (id) => /^evt-(?!univ-|era-|stat-)[a-z]+-/.test(id) },
  { key: 'events-era',          label: 'Events — era-anchored',       match: (id) => id.startsWith('evt-era-') },
  { key: 'events-stat',         label: 'Events — stat-triggered',     match: (id) => id.startsWith('evt-stat-') },
  { key: 'finale',              label: 'Finale',                       match: (id) => id.startsWith('finale-') },
];
