import { createContext, useContext } from 'react';

// Pulled out of CurrentRoomContext.tsx so fast-refresh can keep the
// provider component's hot-reload boundary clean (the react-refresh rule
// requires component-only files for .tsx exports).

export interface CurrentRoomInfo {
  template: string | null;
  // Complexity tier the generator picked for this room. Sourced from
  // `RoomLayout.complexity` (mirror of `LayoutTemplate.complexity`).
  // Surfaced in the HUD location column for at-a-glance playtest
  // identification. Null for non-decision rooms (NarrativeRoom /
  // MinigameRoom don't have a tier).
  tier: string | null;
}

interface CurrentRoomValue extends CurrentRoomInfo {
  setRoomInfo: (info: CurrentRoomInfo) => void;
}

export const CurrentRoomContext = createContext<CurrentRoomValue>({
  template: null,
  tier: null,
  setRoomInfo: () => undefined,
});

export function useCurrentRoom(): CurrentRoomValue {
  return useContext(CurrentRoomContext);
}
