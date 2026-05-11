import { useMemo, useState, type ReactNode } from 'react';
import { DevControlsContext, type DevControls } from './DevControlsContext';

interface Props {
  children: ReactNode;
}

// Dev default is 4× so testing iterations don't burn time on traversal.
// Production stays at 1× because the DEV gate evaluates to false at build time.
const DEFAULT_SPEED = import.meta.env.DEV ? 4 : 1;

export function DevControlsProvider({ children }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED);

  const value = useMemo<DevControls>(
    () => ({ speedMultiplier, setSpeedMultiplier }),
    [speedMultiplier],
  );

  return <DevControlsContext.Provider value={value}>{children}</DevControlsContext.Provider>;
}
