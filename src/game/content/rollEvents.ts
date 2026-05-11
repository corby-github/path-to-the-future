import type { EventDef } from '../types/careerPack';
import { passesRequires, type RequiresContext } from './evaluateRequires';
import { seededRandom } from '../rooms/generator/seedRng';

export interface RollEventsInput {
  events: EventDef[];
  eventChance: number;        // 0..1 from manifest; overridden by dev mode
  era: string;                // current month's era key
  ctx: RequiresContext;
  monthId: number;
}

const EVENT_SEED_SALT = 7919;  // prime; differentiates from selectDecision's monthId stream

function eraMatches(eventEra: string[], currentEra: string): boolean {
  return eventEra.includes('any') || eventEra.includes(currentEra);
}

function eligibleEvents(events: EventDef[], era: string, ctx: RequiresContext): EventDef[] {
  return events.filter((e) =>
    eraMatches(e.era, era) && passesRequires(e.trigger, ctx),
  );
}

export function rollEvents(input: RollEventsInput): EventDef | null {
  const { events, eventChance, era, ctx, monthId } = input;

  const rng = seededRandom(monthId * 31 + EVENT_SEED_SALT);

  // First gate: does ANY event fire this month?
  if (rng() >= eventChance) return null;

  const eligible = eligibleEvents(events, era, ctx);
  if (eligible.length === 0) return null;

  // Weighted random pick.
  const total = eligible.reduce((sum, e) => sum + e.weight, 0);
  let r = rng() * total;
  for (const e of eligible) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

// Dev-only: find a specific event by id, regardless of eligibility.
export function findEventById(events: EventDef[], id: string): EventDef | null {
  return events.find((e) => e.id === id) ?? null;
}
