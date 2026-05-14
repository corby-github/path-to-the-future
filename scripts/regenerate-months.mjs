// Regenerates `months.json` for each pack under the half-length playthrough
// scheme: 1 cinematic January + 6 playable months (Feb / Apr / Jun / Aug /
// Oct / Dec) per year × 10 years = 70 entries per pack (ids 1..70).
//
// Run: `node scripts/regenerate-months.mjs`. Overwrites both packs' months.json
// files in place. Idempotent.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const START_YEAR = 2020;
const YEARS = 10;
const SLOTS_PER_YEAR = 7;

// Slot 0 → Jan (narrative cinematic), slots 1..6 → playable months.
const SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12];

function monthIdFor(yearOffset, slot) {
  return yearOffset * SLOTS_PER_YEAR + slot + 1;
}

function eraFor(year) {
  // Era boundaries match the existing pre-refactor packs (verified via
  // `jq '.months | group_by(.era) | ...'` on both packs). Both packs share
  // the same era timeline today.
  if (year <= 2022) return 'pandemic';
  if (year <= 2024) return 'rebound';
  if (year <= 2026) return 'ai-shift';
  return 'uncertain-future';
}

function themeFor(year, monthNum) {
  // Themes are pack-agnostic in current content. Lifted from the existing
  // SWE/homeschool months.json files (which agreed). Where multiple themes
  // applied within a year (only 2020), kept the original month-level
  // assignment.
  if (year === 2020) {
    if (monthNum <= 2) return 'uncertainty';
    if (monthNum <= 5) return 'rupture';
    return 'endurance';
  }
  if (year === 2021) return 'endurance';
  if (year === 2022) return 'rebuilding';
  if (year === 2023 || year === 2024) return 'momentum';
  if (year === 2025 || year === 2026 || year === 2027) return 'inflection';
  if (year === 2028) return 'consolidation';
  if (year === 2029) return 'reflection';
  return 'reflection';
}

// Narratives keyed by year — title/body lifted verbatim from the existing
// month-1-of-year narrative rows in each pack.
const SWE_NARRATIVES = {
  2020: {
    title: 'The world is about to change.',
    body: 'A pandemic has created uncertainty for you. For everyone. The next ten years are yours to shape — one month at a time.',
    continueLabel: 'Begin',
  },
  2021: { title: 'One year in.', body: 'The world has changed shape. So have you. The work continues.' },
  2022: { title: 'The world begins to turn again.', body: 'Offices reopen. Routines settle. Decisions compound.' },
  2023: { title: 'Something is shifting.', body: 'There is a new tempo to the work. You can feel it before you can name it.' },
  2024: { title: 'Mid-decade.', body: 'Four years done. Six to go. The shape of your career is becoming visible.' },
  2025: { title: 'Five years.', body: "Halfway. The story you'd tell about yourself five years ago is not quite the same story now." },
  2026: { title: 'The slow arc.', body: 'Months stack into years. Choices that felt small at the time have weight now.' },
  2027: { title: 'Choices have weight.', body: 'Three years left in this stretch. The trajectory is harder to bend than it once was.' },
  2028: { title: 'Eight years in.', body: 'You know yourself differently than you did at the start. Some of that you chose. Some of it chose you.' },
  2029: { title: 'The last full year.', body: 'The decade closes ahead. What\'s left to do?' },
};

const HOMESCHOOL_NARRATIVES = {
  2020: {
    title: 'The world is about to change.',
    body: 'Hazel is six. Bram is three. The kitchen table already has the math worksheet on it, same as every morning. The world outside is about to get strange. The next ten years are yours to shape — one month at a time.',
    continueLabel: 'Begin',
  },
  2021: { title: 'One year in.', body: 'Hazel reads chapter books now. Bram has opinions about lunch. The kitchen table has not been the kitchen table in a long time.' },
  2022: { title: 'Other parents are sending theirs back.', body: 'The neighborhood school reopens. Some of your park-bench friends are gone for the day now. You are not.' },
  2023: { title: 'Hazel is nine. Bram is six.', body: "Hazel reads anything you'll let her. Bram is doing actual arithmetic at the actual table. You are, somehow, still the teacher." },
  2024: { title: 'Mid-decade.', body: 'Four years done. Six to go. The kids are older than you keep expecting them to be.' },
  2025: { title: 'Five years.', body: "Halfway. The version of you that pulled the kids out for two weeks isn't quite who's sitting at this table anymore." },
  2026: { title: 'The slow arc.', body: 'Hazel is twelve. Bram is nine. The questions are different now. You are different now.' },
  2027: { title: 'Choices have weight.', body: 'Three years left in this stretch. Hazel will be in high school by the end of it. That used to be far away.' },
  2028: { title: 'Eight years in.', body: 'You know yourself differently than you did at the start. Some of that you chose. Some of it chose you.' },
  2029: { title: 'The last full year.', body: 'Hazel is fifteen. Bram is twelve. The decade closes ahead. What\'s left to teach?' },
};

// Minigame slots — SWE only. Old schedule: 32 (Aug 2022 blackjack), 60 (Dec
// 2024 code-review), 75 (Mar 2026 pong → moved to Apr 2026 since March is
// no longer playable), 90 (Jun 2027 reaction-sprint). Keyed by (year, monthNum)
// in the new calendar so the lookup matches the regen loop.
const SWE_MINIGAMES = new Map([
  [`${2022}-${8}`, 'blackjack'],
  [`${2024}-${12}`, 'code-review'],
  [`${2026}-${4}`, 'pong'],
  [`${2027}-${6}`, 'reaction-sprint'],
]);

function buildMonths(packId) {
  const narratives = packId === 'software-engineering' ? SWE_NARRATIVES : HOMESCHOOL_NARRATIVES;
  const minigames = packId === 'software-engineering' ? SWE_MINIGAMES : new Map();
  const out = [];
  for (let yi = 0; yi < YEARS; yi++) {
    const year = START_YEAR + yi;
    for (let slot = 0; slot < SLOTS_PER_YEAR; slot++) {
      const monthNum = SLOT_TO_MONTH_NUM[slot];
      const id = monthIdFor(yi, slot);
      const era = eraFor(year);
      const theme = themeFor(year, monthNum);
      const entry = { id, year, monthNum, era, theme };
      if (slot === 0) {
        // Cinematic January.
        const n = narratives[year];
        entry.roomType = 'narrative';
        entry.title = n.title;
        entry.body = n.body;
        if (n.continueLabel) entry.continueLabel = n.continueLabel;
      } else {
        const mg = minigames.get(`${year}-${monthNum}`);
        if (mg) {
          entry.roomType = 'minigame';
          entry.variant = mg;
        }
      }
      out.push(entry);
    }
  }
  return out;
}

function formatEntry(e) {
  // Tight single-line JSON per entry, matching the existing file aesthetic.
  // Order keys deterministically.
  const ordered = ['id', 'year', 'monthNum', 'era', 'theme', 'roomType', 'title', 'body', 'continueLabel', 'variant'];
  const parts = [];
  for (const k of ordered) {
    if (e[k] !== undefined) parts.push(`"${k}":${JSON.stringify(e[k])}`);
  }
  // Pad id, monthNum so columns line up like the old file.
  return `    { ${parts.join(', ').replace(/"id":(\d+),/, (_, n) => `"id":${n.padStart(3, ' ')},`).replace(/"monthNum":(\d+)/, (_, n) => `"monthNum":${n.padStart(2, ' ')}`)} }`;
}

function formatFile(months) {
  const lines = ['{', '  "months": ['];
  for (let i = 0; i < months.length; i++) {
    const entry = formatEntry(months[i]);
    const isLast = i === months.length - 1;
    // Blank line between years for readability — matches the old file.
    const isYearEnd = ((i + 1) % SLOTS_PER_YEAR === 0) && !isLast;
    lines.push(`${entry}${isLast ? '' : ','}${isYearEnd ? '\n' : ''}`);
  }
  lines.push('  ]');
  lines.push('}');
  return lines.join('\n') + '\n';
}

for (const packId of ['software-engineering', 'homeschool-parent']) {
  const months = buildMonths(packId);
  const out = formatFile(months);
  const path = join(ROOT, 'public', 'careers', packId, 'months.json');
  writeFileSync(path, out, 'utf8');
  console.log(`wrote ${path} (${months.length} entries)`);
}
