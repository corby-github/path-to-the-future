# 8 pull requests in 91 minutes of keyboard time. Here's what would have taken a small team a week.

Today I sat down twice at the keyboard — 20 minutes before breakfast, 76 minutes in the afternoon. In that one hour and thirty-one minutes of actual product work, I merged eight pull requests, opened a ninth, and walked the design doc forward six versions. Here's what shipped, what it would have cost a normal team, and where the headline doesn't tell the whole story.

## What we built

- **Half-length playthrough.** Each game year is now 7 monthIds — 1 cinematic January + 6 playable months — instead of 12. Total run length 120 → 70 entries. Engine refactor: `calendar.ts` slot table, `progressSlice` clamps, `STATE_VERSION` bump, minigame slot remap, finale-month rename, content regen script.
- **Room complexity tier framework.** New `ComplexityTier` type, per-year mix table, downward fallback chain. All 12 existing templates tagged `simple`. Future PRs add harder tier content on top of this seam.
- **72-gate content remap.** Caught a regression in the half-length PR: 9 homeschool decisions + 2 events had become unreachable because their `requires.month` gates were still on the old 120-month calendar. Wrote a one-shot remap script, swept the gates, fixed pacing for SWE too.
- **All 8 class tiers selectable.** SWE + Homeschool now offer Novice through Oracle starts with calibrated XP and stat curves. The picker no longer gates.
- **HUD format fix.** XP and savings now show full numbers (`15,000`, `4,000,000`) instead of abbreviating to `15K` / `4M` — small decisions were invisible at the new higher tiers.
- **Back-door spawn + rewind narrative-skip.** Walking through the rewind door spawns the player just outside the door of the previous room (was the far-left default — broke spatial continuity). And the back-door now skips cinematic Januaries instead of landing on them.
- **Finale trophy.** New `TrophyCrown` SVG component above the recap screen. Flat-color line art, palette-aware, no emoji.
- **Kid-name interpolation sprint (open PR).** In the Homeschool pack, the player can now name their two kids (defaults `Hazel` / `Bram`) at init and edit them mid-game. 74 hardcoded occurrences across 5 content files retemplated to `{kidA}` / `{kidB}`. New init-flow phase, interpolation wired into 5 render sites, `labelFor` extended for tokenized labels.

The design doc went from v2.0.7 to v2.0.13 with v2.0.14 in flight.

## The numbers

- **Time spent on product:** **1h 31m 19s** of actual at-keyboard product wall time across two sittings (20m 32s morning + 1h 10m 47s afternoon). 5m 19s of human-review boundary time is excluded from this number; the day spent ~7 hours away from the desk between sittings, also excluded.
- **Traditional-team equivalent:** **3–5 working days** for a small team (1 senior engineer, 1 designer, 1 PM/QA). Itemized in the analytical log — half-length engine refactor alone is ~1 team-day; kid-name interpolation ~1 team-day; the regression discovery and fix ~0.5 day; doc reconciliation ~0.5 day.
- **Compression ratio:** **Roughly 15–25× faster** than the team estimate, granting the team perfect focus and no stakeholder churn. The honest version: this works because the human is doing review-and-redirect at AI speed and the AI is doing draft-and-iterate at machine speed, and the project's domain has had its core decisions already made.

## What surprised me

The compression ratio holding across three different work modes. Engine refactors, mechanical content rewrites, and UI polish usually have very different velocity profiles for a human team — refactors are blocked on design sign-off, rewrites are paced by careful find-and-replace, polish is bounded by visual review. Today they all moved at the same speed because the bottleneck was the same: how fast I (the human) could read and approve each diff. I never got within 30 seconds of "wait, let me think about this." The thinking had happened earlier — in the design doc, in the issue specs, in yesterday's handoffs.

The two regressions I caught and the one I shipped. PR #78 silently broke 9 decisions and 2 events for the homeschool pack — I would have missed it entirely if Claude hadn't been auditing the design doc against actual content during PR #80. PR #81 silently broke the HUD: I had to actually start a Vanguard run and notice that "+50 XP" stayed showing `15K` instead of `15,050`. AI can verify exhaustively but cannot playtest. The human eye on the running game is the catch-net.

The smallest fix took longer than I budgeted. Two regressions today; the second one (HUD numbers) was a 9-line code change. But getting from "user pastes a screenshot of `15K` not moving" to "PR open, verify green, ready to merge" still took ~10 minutes of context-switch + branch hygiene. The mechanical work compresses well; the *coordination* work has a floor.

## The catch

This sprint did **not**:
- Playtest the full 70-month homeschool arc to confirm the gating math feels right end-to-end. I tested specific monthIds via DevPanel — not a full playthrough.
- Visually review the trophy SVG against the rest of the recap composition. Six users will see it differently; I'm one.
- Tune the new class-tier starting stats. Today's curves are calibrated by feel — Vanguard at 75 network, Oracle at 99 — but unplaytested. Any of them could feel wrong after a run or two.
- Get any external code review. Two of the day's PRs caught their own regressions because the same person who shipped them played the game thirty seconds later. A team with a more decoupled review process would have caught one, missed the other, and shipped both for days.
- Touch the analytics layer (`/month/{NN}` instrumentation, GoatCounter wrapper, Pages deploy). That's the v1 ship gate; still ⏳ in the build order.

The compression ratio belongs to the work *that actually happened*, not the work a normal team would do alongside it. Stakeholder alignment, user testing, art mocks, technical spikes that didn't go anywhere — none of that is in today's 91 minutes.

## What's next

Tomorrow (or after the break): playtest PR #85, merge it, then point at Day 15 — the analytics + Pages deploy — which is the last remaining ⏳ row before v1 ships. The path is clear; the engine is stable; the design doc is in sync. If the velocity holds, the v1 ship is a one-sitting job. If it doesn't, the analytical log will say why.

---

*A working sprint with Claude, 2026-05-14. The rigorous version of these numbers lives in `session-log-analytical-2026-05-14-day-consolidated-path-to-the-future.md` alongside this file.*
