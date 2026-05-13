import type {
  CareerPack,
  Manifest,
  MonthEntry,
  DecisionDef,
  EventDef,
  InteractableDef,
} from '../types/careerPack';

interface MonthsFile { months: MonthEntry[] }
interface DecisionsFile { decisions: DecisionDef[] }
interface EventsFile { events: EventDef[] }
interface InteractablesFile { interactables: InteractableDef[] }

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// Tolerant variant for content that may be absent on older packs.
async function fetchJsonOptional<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadCareerPack(packId: string): Promise<CareerPack> {
  const base = `${import.meta.env.BASE_URL}careers/${packId}`;
  const universalBase = `${import.meta.env.BASE_URL}universal`;
  const [
    manifest,
    monthsFile,
    decisionsFile,
    eventsFile,
    interactablesFile,
    universalInteractablesFile,
  ] = await Promise.all([
    fetchJson<Manifest>(`${base}/manifest.json`),
    fetchJson<MonthsFile>(`${base}/months.json`),
    fetchJson<DecisionsFile>(`${base}/decisions.json`),
    fetchJson<EventsFile>(`${base}/events.json`),
    fetchJsonOptional<InteractablesFile>(`${base}/interactables.json`),
    fetchJsonOptional<InteractablesFile>(`${universalBase}/interactables.json`),
  ]);
  // Universal interactables (e.g. the arcade cabinet) are merged with the
  // pack-specific list and treated identically by the placer. Pack-specific
  // wins on id collision so a pack can override a universal definition if
  // needed.
  const packInteractables = interactablesFile?.interactables ?? [];
  const universalInteractables = universalInteractablesFile?.interactables ?? [];
  const packIds = new Set(packInteractables.map((i) => i.id));
  const mergedInteractables = [
    ...packInteractables,
    ...universalInteractables.filter((i) => !packIds.has(i.id)),
  ];
  return {
    manifest,
    months: monthsFile.months,
    decisions: decisionsFile.decisions,
    events: eventsFile.events,
    interactables: mergedInteractables,
  };
}
