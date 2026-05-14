#!/usr/bin/env node
// One-shot remap of `requires.month` / `trigger.month` gates from the
// pre-v2.0.8 120-monthId calendar to the v2.0.8 70-monthId slot scheme.
// PR #78 regenerated months.json but left content gates on the old scale,
// leaving Homeschool teen/late-game decisions unreachable and SWE arc
// pacing silently shifted. This script does the mechanical remap.
//
// Mapping: each old monthId X represents (year, monthNum) on the old
// 12-slot/year calendar. The new scheme has 7 slots/year at
// [Jan, Feb, Apr, Jun, Aug, Oct, Dec]. The new monthId is the smallest
// new slot whose calendar month is >= the old monthNum (so a gate of
// "available from June 2021" lands on the new Jun-2021 slot, not Aug).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12];

function oldToNewMonthId(old) {
  if (old < 1) return 1;
  const year = Math.floor((old - 1) / 12);
  const monthNum = ((old - 1) % 12) + 1;
  let slotIdx = SLOT_TO_MONTH_NUM.findIndex((m) => m >= monthNum);
  if (slotIdx === -1) slotIdx = SLOT_TO_MONTH_NUM.length - 1;
  return Math.min(70, year * 7 + slotIdx + 1);
}

const FILES = [
  'public/careers/software-engineering/decisions.json',
  'public/careers/software-engineering/events.json',
  'public/careers/homeschool-parent/decisions.json',
  'public/careers/homeschool-parent/events.json',
];

const pattern = /"month":\s*">=(\d+)"/g;
let totalChanged = 0;

for (const rel of FILES) {
  const path = resolve(process.cwd(), rel);
  const text = readFileSync(path, 'utf8');
  let fileChanged = 0;
  const next = text.replace(pattern, (match, n) => {
    const oldVal = Number(n);
    const newVal = oldToNewMonthId(oldVal);
    if (newVal === oldVal) return match;
    fileChanged += 1;
    return `"month": ">=${newVal}"`;
  });
  if (fileChanged > 0) {
    writeFileSync(path, next);
    totalChanged += fileChanged;
    console.log(`updated ${rel}: ${fileChanged} gate(s) remapped`);
  } else {
    console.log(`unchanged ${rel}`);
  }
}

console.log(`\nTotal gates remapped: ${totalChanged}`);
