// Day-6 single-profile save key. Day 9 (name entry) migrates to per-profile keys
// (pttf:profiles, pttf:active, pttf:save:{name}) per design doc §12.
export const SAVE_KEY = 'pttf:save:default';
// Bump on any breaking change to the persisted shape. Old saves are discarded.
// 1.1.0: Day 9 — profile gains `initComplete`; careerPack/entryClass no longer
//        default to hardcoded SWE values (they're driven by the init flow).
// 1.2.0: Day 12 — progress gains `gameOver`; drives EndgameScreen routing.
// 1.3.0: Issue #33 — progress gains `viewingMonth` (backward-door replay
//        target; null when viewing live current month); history gains
//        `minigames` (one record per minigame completion, used to render
//        frozen result screens in replay).
export const STATE_VERSION = '1.3.0';

export function loadPersistedState(): unknown {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { meta?: { version?: string } };
    if (parsed.meta?.version !== STATE_VERSION) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function persistState(state: unknown): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or disabled — silent fail; the game continues in-memory.
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
