import { useMemo, useState, type ReactNode } from 'react';
import { DevControlsContext, type DevControls } from './DevControlsContext';

// Dev defaults: 4× speed for fast traversal during testing.
// Production stays at 1× because the DEV gate evaluates to false at build time.
const DEFAULT_SPEED = import.meta.env.DEV ? 4 : 1;

interface Props {
  children: ReactNode;
}

export function DevControlsProvider({ children }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED);
  const [forcedLayout, setForcedLayout] = useState<string | null>(null);

  const value = useMemo<DevControls>(
    () => ({ speedMultiplier, setSpeedMultiplier, forcedLayout, setForcedLayout }),
    [speedMultiplier, forcedLayout],
  );

  return <DevControlsContext.Provider value={value}>{children}</DevControlsContext.Provider>;
}
