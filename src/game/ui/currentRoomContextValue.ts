import { createContext, useContext } from 'react';

// Pulled out of CurrentRoomContext.tsx so fast-refresh can keep the
// provider component's hot-reload boundary clean (the react-refresh rule
// requires component-only files for .tsx exports).

interface CurrentRoomValue {
  template: string | null;
  setTemplate: (t: string | null) => void;
}

export const CurrentRoomContext = createContext<CurrentRoomValue>({
  template: null,
  setTemplate: () => undefined,
});

export function useCurrentRoom(): CurrentRoomValue {
  return useContext(CurrentRoomContext);
}
