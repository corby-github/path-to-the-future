const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Half-length playthrough scheme (v2.0.8): each year has 7 slots — 1
// cinematic January + 6 playable months (Feb / Apr / Jun / Aug / Oct / Dec).
// monthId 1..70 maps to calendar (year, month) via the slot table below.
// Doubles the per-room calendar advance (most exits are +2 months) and cuts
// the playable run roughly in half. See months.json regen + design doc §4
// + §17 (level refinement).
export const FIRST_MONTH_ID = 1;
export const LAST_MONTH_ID = 70;
export const START_YEAR = 2020;
export const SLOTS_PER_YEAR = 7;

// Slot 0 → Jan (narrative cinematic), slots 1..6 → playable months.
export const SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12] as const;

export function monthLabel(monthId: number): string {
  const clamped = Math.max(FIRST_MONTH_ID, Math.min(LAST_MONTH_ID, monthId));
  const slot = (clamped - 1) % SLOTS_PER_YEAR;
  const year = START_YEAR + Math.floor((clamped - 1) / SLOTS_PER_YEAR);
  return `${MONTH_NAMES[SLOT_TO_MONTH_NUM[slot] - 1]} ${year}`;
}
