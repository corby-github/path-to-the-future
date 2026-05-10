import { useContext } from 'react';
import { CareerPackContext, type CareerPackContextValue } from './careerPackContext';

export function useCareerPack(): CareerPackContextValue {
  const ctx = useContext(CareerPackContext);
  if (!ctx) {
    throw new Error('useCareerPack must be used inside <CareerPackProvider>');
  }
  return ctx;
}
