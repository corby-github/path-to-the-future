import type { EventDef } from '../types/careerPack';
import type { EventRecord } from '../state/slices/historySlice';
import { passesRequires, type RequiresContext } from './evaluateRequires';
import { seededRandom } from '../rooms/generator/seedRng';

// Two-tier de-dup window for events (issue #34). Events fire more often than
// decisions, so the window is tighter — a 5-month window for events would
// starve the pool fast at the current content volume.
const RECENT_WINDOW_MONTHS = 3;

export interface RollEventsInput {
  events: EventDef[];
  eventChance: number;        // 0..1 from manifest; overridden by dev mode
  era: string;                // current month's era key
  ctx: RequiresContext;
  monthId: number;
  // History records used for de-duplication. Optional — callers that want
  // pure weighted-random (e.g. tests, dev-mode force) can omit.
  history?: EventRecord[];
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

// Two-tier filter — same shape as selectDecision's filter, different window.
// Always returns a non-empty array as long as `eligible` is non-empty.
function applyHistoryFilter(
  eligible: EventDef[],
  history: EventRecord[],
  currentMonth: number,
): EventDef[] {
  const recentlySeenIds = new Set(
    history
      .filter((r) => currentMonth - r.monthId < RECENT_WINDOW_MONTHS)
      .map((r) => r.eventId),
  );
  const notRecent = eligible.filter((e) => !recentlySeenIds.has(e.id));
  if (notRecent.length === 0) return eligible;

  const everSeenIds = new Set(history.map((r) => r.eventId));
  const neverSeen = notRecent.filter((e) => !everSeenIds.has(e.id));
  return neverSeen.length > 0 ? neverSeen : notRecent;
}

export function rollEvents(input: RollEventsInput): EventDef | null {
  const { events, eventChance, era, ctx, monthId, history } = input;

  const rng = seededRandom(monthId * 31 + EVENT_SEED_SALT);

  // First gate: does ANY event fire this month?
  if (rng() >= eventChance) return null;

  const eligible = eligibleEvents(events, era, ctx);
  if (eligible.length === 0) return null;

  const pool = applyHistoryFilter(eligible, history ?? [], monthId);

  // Weighted random pick within the filtered pool.
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let r = rng() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

// Dev-only: find a specific event by id, regardless of eligibility.
export function findEventById(events: EventDef[], id: string): EventDef | null {
  return events.find((e) => e.id === id) ?? null;
}
