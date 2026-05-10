import { createContext } from 'react';
import type { CareerPack, MonthEntry, Palette } from '../types/careerPack';

export interface CareerPackContextValue {
  pack: CareerPack;
  currentMonth: MonthEntry;
  palette: Palette;
}

export const CareerPackContext = createContext<CareerPackContextValue | null>(null);
