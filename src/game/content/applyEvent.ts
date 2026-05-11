import type { AppDispatch } from '../state/store';
import type { EventDef } from '../types/careerPack';
import type { FlagsState } from '../state/slices/flagsSlice';
import { parseEffect, type StatKey } from './applyEffects';
import { applyStatEffect } from '../state/slices/statsSlice';
import { setFlag } from '../state/slices/flagsSlice';

// Apply an event's stat and flag changes. Month advancement (advanceMonths) is
// handled by the caller via the room transition, not here — keeps this function
// pure-dispatch.
export function applyEvent(event: EventDef, dispatch: AppDispatch): void {
  for (const [stat, expr] of Object.entries(event.effects)) {
    const parsed = parseEffect(expr);
    if (!parsed) continue;
    dispatch(applyStatEffect({
      stat: stat as StatKey,
      op: parsed.op,
      magnitude: parsed.magnitude,
    }));
  }

  if (event.flags) {
    for (const [key, value] of Object.entries(event.flags)) {
      dispatch(setFlag({ key: key as keyof FlagsState, value }));
    }
  }
}
