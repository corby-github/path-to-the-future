import { createContext } from 'react';
import type { CareerPack, MonthEntry, Palette } from '../types/careerPack';

export interface CareerPackContextValue {
  pack: CareerPack;
  // The month the player is currently SEEING. In normal play this equals
  // progress.currentMonth. In backward-replay mode (issue #33), this is
  // progress.viewingMonth (a past month) — the player's actual progress
  // hasn't changed, they're just looking at an old room.
  currentMonth: MonthEntry;
  palette: Palette;
  // True iff `currentMonth.id !== progress.currentMonth`. Components use
  // this to suppress live behaviors (no decisions fire, no events roll,
  // NPC dialogue effects drop, forward door becomes "return"). See §11.x.
  isReplay: boolean;
  // The player's actual progress month (live current month), kept available
  // separately from `currentMonth` for things like "← Return to {liveMonth}"
  // labels and the rewind-bound check (can't rewind from month 1).
  liveMonth: MonthEntry;
}

export const CareerPackContext = createContext<CareerPackContextValue | null>(null);
