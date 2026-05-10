const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const FIRST_MONTH_ID = 1;
export const LAST_MONTH_ID = 120;
export const START_YEAR = 2020;

export function monthLabel(monthId: number): string {
  const clamped = Math.max(FIRST_MONTH_ID, Math.min(LAST_MONTH_ID, monthId));
  const idx = (clamped - 1) % 12;
  const year = START_YEAR + Math.floor((clamped - 1) / 12);
  return `${MONTH_NAMES[idx]} ${year}`;
}
