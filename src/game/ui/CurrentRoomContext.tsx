import {
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CurrentRoomContext } from './currentRoomContextValue';

// Ephemeral metadata about the currently-mounted room. Set by the room
// component on mount (e.g., DecisionRoom dispatches its template id) and
// read by the HUD so it can show "Aug 2020 · open-office" in the identity
// column.
//
// Not persisted — purely an in-memory display channel between mounted
// rooms and the chrome above them. Cleanup on unmount keeps the HUD from
// showing a stale template after a non-decision room loads.

export function CurrentRoomProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState<string | null>(null);
  const value = useMemo(() => ({ template, setTemplate }), [template]);
  return (
    <CurrentRoomContext.Provider value={value}>
      {children}
    </CurrentRoomContext.Provider>
  );
}
