import { useMemo, useState, type ReactNode } from 'react';
import { DevControlsContext, type DevControls } from './DevControlsContext';

interface Props {
  children: ReactNode;
}

export function DevControlsProvider({ children }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const value = useMemo<DevControls>(
    () => ({ speedMultiplier, setSpeedMultiplier }),
    [speedMultiplier],
  );

  return <DevControlsContext.Provider value={value}>{children}</DevControlsContext.Provider>;
}
