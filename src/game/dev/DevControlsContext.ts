import { createContext } from 'react';

// 'auto'   — use manifest eventChance
// 'never'  — block all event rolls
// '<id>'   — force this specific event next time (dev testing)
export type EventMode = 'auto' | 'never' | string;

export interface DevControls {
  speedMultiplier: number;
  setSpeedMultiplier: (value: number) => void;
  forcedLayout: string | null;
  setForcedLayout: (value: string | null) => void;
  eventMode: EventMode;
  setEventMode: (value: EventMode) => void;
  // When true, the room placer guarantees an arcade interactable in every
  // subsequent room mount (issue #31). Affects future room mounts only —
  // current room's placements are frozen at mount. Toggle off to return
  // to natural weighted placement.
  setForceArcade: (value: boolean) => void;
}

const DEFAULT: DevControls = {
  speedMultiplier: 1,
  setSpeedMultiplier: () => {},
  forcedLayout: null,
  setForcedLayout: () => {},
  eventMode: 'auto',
  setEventMode: () => {},
  setForceArcade: () => {},
};

export const DevControlsContext = createContext<DevControls>(DEFAULT);
