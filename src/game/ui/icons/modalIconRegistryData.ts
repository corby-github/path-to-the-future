import {
  IconAirplaneClock,
  IconArchiveBox,
  IconBriefcaseSpark,
  IconBrowserTabX,
  IconBubbleSparkle,
  IconBurnoutFlame,
  IconBus,
  IconCar,
  IconCashFound,
  IconChatBubbleMoney,
  IconCloudLightning,
  IconCodeBrackets,
  IconCodeHeart,
  IconCoffeeCup,
  IconCouch,
  IconCreditCard,
  IconCycleArrow,
  IconDie,
  IconDocumentTrending,
  IconDollarQuestion,
  IconDollarUpArrow,
  IconDoorExit,
  IconDoorKey,
  IconDumbbell,
  IconEconomyDown,
  IconEnvelope,
  IconForkedPath,
  IconGearSparkle,
  IconHackathon,
  IconHeartCheck,
  IconHeartHands,
  IconHourglass,
  IconHouse,
  IconHouseUpArrow,
  IconInboxBlast,
  IconInternClock,
  IconLaptopSpark,
  IconLayoffsExit,
  IconLightbulbIdea,
  IconLostWallet,
  IconMentorJunior,
  IconMentorPointing,
  IconMicrophone,
  IconMortarboard,
  IconNetwork,
  IconOrgChart,
  IconPager,
  IconPalmTree,
  IconPandemicClose,
  IconPandemicFurlough,
  IconPawPrint,
  IconPhoneCross,
  IconPhoneHeart,
  IconRecruiterCall,
  IconReturnOffice,
  IconRings,
  IconRocket,
  IconRoommateFriction,
  IconScale,
  IconSpeakerSound,
  IconSparkle,
  IconStackoverflowAnswer,
  IconStandupTooLong,
  IconStayLate,
  IconSuitcase,
  IconSunset,
  IconThermometer,
  IconThresholdDoor,
  IconTrophy,
  IconTwoFiguresHeart,
  IconUpwardArrow,
  IconVideoCall,
  IconWalker,
  IconWhiteboardSystem,
  IconFlowWaves,
  // Homeschool pack — 5+5 voice-checkpoint batch
  IconHomeschoolBinder,
  IconCoopGroup,
  IconSnackProtest,
  IconSlowTablet,
  IconBackpack,
  IconBittenCrayon,
  IconParkBench,
  IconMeltedCandy,
  IconTabletFlip,
  IconWobbleBoard,
  // Homeschool pack — second 5+5 batch
  IconScreenTime,
  IconInLawSpeaks,
  IconThermometerSick,
  IconSwingset,
  IconOrganicEmail,
  IconBookStack,
  IconFridgeMagnetArt,
  IconSingleShoe,
  IconGrandmaCall,
  IconHeldDinner,
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

  // SWE pool — full coverage of every swe-* decision id.
  'swe-framework-rewrite-vs-patch': IconCodeBrackets,
  'swe-oncall-volunteer': IconPager,
  'swe-2am-idea': IconLightbulbIdea,
  'swe-conference-talk-cfp': IconMicrophone,
  'swe-friday-deploy': IconRocket,
  'swe-mentor-junior': IconMentorJunior,
  'swe-hackathon-weekend': IconHackathon,
  'swe-stackoverflow-mentor': IconStackoverflowAnswer,
  'swe-intern-late-review': IconInternClock,
  'swe-coder-vs-architect': IconForkedPath,
  'swe-people-manager-vs-tech-lead': IconOrgChart,
  'swe-masters-degree': IconMortarboard,
  'swe-startup-offer': IconBriefcaseSpark,
  'swe-architecture-review-defend': IconWhiteboardSystem,
  'swe-throw-colleague-under-bus': IconBus,
  'swe-opensource-maintainer': IconCodeHeart,

  // Finale (DecisionRoom hardcodes this id at month 120).
  'finale-month-120': IconThresholdDoor,

  // Homeschool pack — 5+5 voice-checkpoint batch (decisions).
  'hp-curriculum-boxed-vs-own': IconHomeschoolBinder,
  'hp-coop-invitation': IconCoopGroup,
  'hp-snack-rebellion': IconSnackProtest,
  'hp-tablet-speed-complaint': IconSlowTablet,
  'hp-eldest-wants-school': IconBackpack,

  // Homeschool pack — second 5+5 batch (decisions).
  'hp-pandemic-screens-rule': IconScreenTime,
  'hp-in-law-visit': IconInLawSpeaks,
  'hp-sick-day-on-test-day': IconThermometerSick,
  'hp-park-defense': IconSwingset,
  'hp-coop-snack-politics': IconOrganicEmail,
};

// --- Event icons ------------------------------------------------------------

export const EVENT_ICONS: Record<string, ModalIconComponent> = {
  // Universal pool.
  'evt-univ-sunset': IconSunset,
  'evt-univ-bank-error': IconDollarQuestion,
  'evt-univ-pandemic-close': IconPandemicClose,
  'evt-univ-skip-breakfast': IconCoffeeCup,
  'evt-univ-old-friend': IconTwoFiguresHeart,
  'evt-univ-return-office': IconReturnOffice,
  'evt-univ-ai-tooling': IconGearSparkle,
  'evt-univ-talk-invite': IconEnvelope,
  'evt-univ-found-twenty': IconCashFound,
  'evt-univ-deleted-tab': IconBrowserTabX,
  'evt-univ-rent-hike': IconHouseUpArrow,
  'evt-univ-flight-delay': IconAirplaneClock,
  'evt-univ-lost-wallet': IconLostWallet,
  'evt-univ-good-physical': IconHeartCheck,
  'evt-univ-storm': IconCloudLightning,
  'evt-univ-voice-reminder-mishap': IconSpeakerSound,

  // SWE-specific events.
  'evt-swe-blog-traction': IconDocumentTrending,
  'evt-swe-recruiter-blast': IconInboxBlast,
  'evt-swe-stackoverflow-rep': IconTrophy,
  'evt-swe-flow-state': IconFlowWaves,

  // Era anchors — pandemic / rebound / ai-shift / uncertain-future.
  'evt-era-pandemic-furlough-friend': IconPandemicFurlough,
  'evt-era-pandemic-zoom-fatigue': IconVideoCall,
  'evt-era-pandemic-roommate-friction': IconRoommateFriction,
  'evt-era-pandemic-walk-routine': IconWalker,
  'evt-era-rebound-promo-wave': IconUpwardArrow,
  'evt-era-rebound-comp-jump': IconDollarUpArrow,
  'evt-era-rebound-leaving-wave': IconDoorExit,
  'evt-era-ai-shift-junior-anxiety': IconSparkle,
  'evt-era-ai-shift-adjacent-layoffs': IconLayoffsExit,
  'evt-era-ai-shift-tooling-evangelism': IconBubbleSparkle,
  'evt-era-uncertain-decade-mark': IconHourglass,
  'evt-era-uncertain-old-codebase': IconArchiveBox,
  'evt-era-uncertain-becoming-mentor': IconMentorPointing,
  'evt-era-uncertain-cycle-reborn': IconCycleArrow,
  'evt-era-uncertain-economy': IconEconomyDown,

  // Stat-trigger class.
  'evt-stat-burnout-doctor': IconBurnoutFlame,
  'evt-stat-low-health-cold': IconThermometer,
  'evt-stat-high-network-intro': IconNetwork,
  'evt-stat-low-savings-card': IconCreditCard,

  // Homeschool pack — 5+5 voice-checkpoint batch (events).
  'evt-hp-toddler-crayon': IconBittenCrayon,
  'evt-hp-park-grade-question': IconParkBench,
  'evt-hp-mr-nobody-mm': IconMeltedCandy,
  'evt-hp-tablet-screen-flips': IconTabletFlip,
  'evt-hp-handwriting-wobble': IconWobbleBoard,

  // Homeschool pack — second 5+5 batch (events).
  'evt-hp-library-haul': IconBookStack,
  'evt-hp-fridge-art': IconFridgeMagnetArt,
  'evt-hp-lost-shoe': IconSingleShoe,
  'evt-hp-grandparent-phone': IconGrandmaCall,
  'evt-hp-spouse-late': IconHeldDinner,
};
