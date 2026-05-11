import { createContext } from 'react';

export interface DevControls {
  speedMultiplier: number;
  setSpeedMultiplier: (value: number) => void;
}

const DEFAULT: DevControls = {
  speedMultiplier: 1,
  setSpeedMultiplier: () => {},
};

export const DevControlsContext = createContext<DevControls>(DEFAULT);
