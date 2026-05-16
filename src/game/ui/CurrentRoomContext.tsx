import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CurrentRoomContext, type CurrentRoomInfo } from './currentRoomContextValue';

// Ephemeral metadata about the currently-mounted room. Set by the room
// component on mount (DecisionRoom publishes its template id + complexity
// tier) and read by the HUD so it can show "Aug 2020 · open-office · SIMPLE"
// in the location column.
//
// Not persisted — purely an in-memory display channel between mounted
// rooms and the chrome above them. Cleanup on unmount keeps the HUD from
// showing stale info after a non-decision room loads.

export function CurrentRoomProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CurrentRoomInfo>({ template: null, tier: null });
  const setRoomInfo = useCallback((next: CurrentRoomInfo) => {
    setInfo(next);
  }, []);
  const value = useMemo(
    () => ({ template: info.template, tier: info.tier, setRoomInfo }),
    [info.template, info.tier, setRoomInfo],
  );
  return (
    <CurrentRoomContext.Provider value={value}>
      {children}
    </CurrentRoomContext.Provider>
  );
}
