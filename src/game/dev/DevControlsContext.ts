import { createContext } from 'react';

export interface DevControls {
  speedMultiplier: number;
  setSpeedMultiplier: (value: number) => void;
  forcedLayout: string | null;
  setForcedLayout: (value: string | null) => void;
}

const DEFAULT: DevControls = {
  speedMultiplier: 1,
  setSpeedMultiplier: () => {},
  forcedLayout: null,
  setForcedLayout: () => {},
};

export const DevControlsContext = createContext<DevControls>(DEFAULT);
