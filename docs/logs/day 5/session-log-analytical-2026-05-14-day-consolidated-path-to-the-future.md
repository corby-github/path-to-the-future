# Sprint Log: Path to the Future — 2026-05-14, Day-5 Consolidated

**Date:** 2026-05-14
**Sprint:** Day-5 consolidated — covers both sittings of the day (morning + afternoon) in one artifact at user's request
**Sprint windows:**
- Morning: 2026-05-14T11:39:46Z → 12:00:18Z (**20m 32s**)
- Afternoon: 2026-05-14T19:04:51Z → 20:20:57Z (**1h 16m 06s**)
- Day total wall clock at keyboard: **1h 36m 38s** (plus a ~7h gap away from the desk between sittings, not counted)
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Engine refactor + content rewrite + UI fixes + design-doc sync — 8 PRs merged, 1 open
**Wider context:** Day 5 of an 8-PR-merged-today push that builds directly on Day 4's pack-aware architecture work (Days 4 morning + afternoon + evening + night-shift each got their own log). Today's work walks the design doc from v2.0.7 → v2.0.13 with v2.0.14 in flight.

---

## 1. Starting point

The morning sitting opened with a fresh design intent: **cut the playthrough roughly in half** (every other month playable, January as cinematic year-transition) and **introduce a room-complexity tier curve** that scales difficulty by calendar year. Both ideas were specced in conversation before the morning punch-in; the morning sprint was the implementation pass.

The afternoon opened with both morning PRs awaiting merge, plus a list of follow-ups: a calendar-emit bug to fix, design-doc sync, issues #76 (kid-name interpolation) and #77 (back-door spawn position), a finale-trophy polish item, and an analytics-slug audit for §24. The handoff handed off cleanly — no in-progress work, both branches mergeable.

## 2. Deliverables produced

**Morning sitting (20m 32s — 2 PRs opened):**
- **[PR #78](https://github.com/corby-github/path-to-the-future/pull/78)** opened — half-length playthrough. `src/game/calendar.ts` gains `SLOTS_PER_YEAR = 7` + `SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12]`; `monthLabel(id)` reads from the slot table. `months.json` regenerated 120 → 70 across both packs via new `scripts/regenerate-months.mjs`. `progressSlice` clamps moved 120 → 70. `FINALE_MONTH_ID` moves 120 → 70; synthetic finale-decision id renamed `finale-month-120` → `finale-month`. `STATE_VERSION` 1.6.0 → 1.7.0. Minigame slots remapped (Blackjack m19, Code Review m35, Pong m45, Reaction Sprint m53). Design doc v2.0.8 added.
- **[PR #79](https://github.com/corby-github/path-to-the-future/pull/79)** opened — room complexity tier framework. New `ComplexityTier = 'simple' | 'easy' | 'medium' | 'hard' | 'expert'` type. `LayoutTemplate` gains required `complexity` field; all 12 existing templates tagged `'simple'`. `YEAR_TO_COMPLEXITY_MIX` table per year. `pickComplexityTier(year, rng)` sampler. `eligibleTemplates(packId, complexity?)` extends the pack filter with a tier filter + downward fallback chain. `generateRoom(seed, packId, year, forced?)` signature widened. `RoomLayout.complexity` exposes the picked tier. Design doc v2.0.9 added. Play unchanged from v2.0.8 — pure additive seam.

**Afternoon sitting (1h 16m 06s — 6 PRs merged, 1 opened):**
- **`fix(hud): emit calendar-month delta, not slot delta`** — added to PR #78 before merge. New `calendarMonthDelta(fromId, toId)` helper in `calendar.ts`. The HUD month-emit floater now shows `+2 mo` for normal forward-door transitions (was `+1 mo`, which was the slot delta — invisible to playtesters as a regression because the slot id advanced by 1 even though calendar months jumped by 2). Same fix for rewind (`−2 mo`). Dedup against the fade-start cue stays in slot units.
- **[PR #78](https://github.com/corby-github/path-to-the-future/pull/78)** merged.
- **[PR #79](https://github.com/corby-github/path-to-the-future/pull/79)** rebased against new main (PR #78's design-doc change-log row conflicted), force-pushed with `--force-with-lease`, merged.
- **[PR #80](https://github.com/corby-github/path-to-the-future/pull/80)** — doc-sync v2.0.10 + **72-gate content remap**. Discovered mid-design-doc-audit that PR #78 regenerated `months.json` (120 → 70) but left `requires.month` / `trigger.month` gates in `decisions.json` / `events.json` on the **old 12-slot/year calendar**, leaving **9 homeschool decisions + 2 events unreachable** (gates above the new 70 cap) and silently shifting SWE arc pacing ~4 months earlier than authored. New one-shot `scripts/remap-old-month-gates.mjs`. **72 gates remapped** across 4 JSON files. Design doc §24 analytics slugs refreshed (`/month/{001..120}` → `/month/{01..70}`; minigame slug list expanded to all 5 variants); inline 120→70 sweep across §2/§3/§5/§6/§8/§11.2/§21/§25/§26.
- **[PR #81](https://github.com/corby-github/path-to-the-future/pull/81)** — all 8 class tiers selectable. SWE + Homeschool manifests gain `entryClasses` for `junior` / `vanguard` / `commander` / `legendary` / `mythic` / `oracle` with calibrated `startingXp` + `startingStats` per tier. §18 *Out of Scope* "Class entry points beyond Novice and Skilled" retired. Design doc v2.0.11.
- **[PR #84](https://github.com/corby-github/path-to-the-future/pull/84)** — HUD full-number formatting (regression discovered via PR #81 playtest). `formatXp` / `formatMoney` previously abbreviated values ≥ 10,000 to `12K` / `1.2M`. With Vanguard's 15,000 starting XP and Oracle's 4,000,000 savings now selectable, the abbreviation hid small deltas (`+50` to a 15,000 value still displayed as `15K`). Both formatters now defer unconditionally to `value.toLocaleString('en-US')`.
- **[PR #82](https://github.com/corby-github/path-to-the-future/pull/82)** — back-door spawn position + rewind narrative-skip (closes [#77](https://github.com/corby-github/path-to-the-future/issues/77)). Entering a previous month via the rewind door now spawns the player just LEFT of the forward door (was the layout's far-left spawn — broke spatial continuity). New `replaySpawnFor(door)` helper. Plus a follow-up fix in the same PR: `previousReplayableMonth()` now skips both `consequence` AND `narrative` rooms (was only consequence), so walking back from Feb 2021 lands on Dec 2020 instead of the Jan 2021 cinematic. Design doc v2.0.12.
- **[PR #83](https://github.com/corby-github/path-to-the-future/pull/83)** — finale trophy on the EndgameScreen recap. New inline `TrophyCrown` SVG component (Treatment-A flat-color line art, 88px tall, `palette.accent` fill + `palette.ink` strokes). Also fixes two stale narrative comments left over from the v2.0.8 half-length playthrough. Rebased against post-#82 main; doc bumped to v2.0.13.
- **[PR #85](https://github.com/corby-github/path-to-the-future/pull/85)** opened (still awaiting playtest at end of afternoon) — kid-name interpolation sprint (closes [#76](https://github.com/corby-github/path-to-the-future/issues/76)). `profileSlice` gains `kidAName` / `kidBName` (defaults `Hazel` / `Bram`) + `kidNamesSet` flag. New `KidNamesEntry` init-flow phase between Name and Class, mounted only when `manifest.requiresKidNames` is set. `interpolate.ts` context expanded with `kidA` / `kidB`; wired into `DecisionModal` / `EventModal` / `IntroScene` / `NPCModal` / `NarrativeRoom` (the last two previously bypassed interpolation entirely). `labelFor(def, vars?)` / `speakerHeaderFor(def, vars?)` take optional `vars`. **74 `Hazel` / `Bram` occurrences** across 5 homeschool JSON files retemplated via one-shot perl pass. ProfileModal Children rows inline-editable. Design doc v2.0.14 ready.
- **`tweaking endings - we didnt learn anything - we just clicked`** — user committed FINALE_DECISION dialog rewrites directly to main (`622f982`) concurrent with the PR-testing review boundary. Outside the AI-paired PR scope; logged here for completeness.

**Issues:**
- [#77](https://github.com/corby-github/path-to-the-future/issues/77) closed by PR #82.
- [#76](https://github.com/corby-github/path-to-the-future/issues/76) closed by PR #85 once it merges.

**Design doc:** walked v2.0.7 → v2.0.13 (with v2.0.14 in flight).

## 3. Key decisions

### Bundle content-gates fix into the doc-sync PR
- **Decision:** PR #80 ships both the design-doc sync to v2.0.10 *and* the 72-gate content remap in one merge.
- **Reasoning:** Both changes are caused by the same upstream (PR #78). Shipping the gates fix as a follow-up PR would split the regression into "broke in #78, doc says it's fixed in v2.0.10 but the gates are still wrong until #81." User explicitly chose bundling for the day's race-to-finish framing.
- **Driver:** User (offered 4 scoping options; picked the bundle).
- **Alternatives considered:** Separate PR for gates (cleaner PR hygiene), file as GH issue + defer (would leave homeschool late-game unreachable), Homeschool-only-gates-now-SWE-later (asymmetric urgency).

### Half-length playthrough preserves the cinematic January
- **Decision:** Each year is 7 slots = 1 cinematic January + 6 playable months (Feb / Apr / Jun / Aug / Oct / Dec). Not 6 playable + 0 narrative.
- **Reasoning:** The Jan-narrative-room beat anchors each year emotionally; cutting it would lose the "one year in / the slow arc / the last full year" structural touches the homeschool pack leans on heavily. Slot-table approach (`SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12]`) keeps the design open without committing to a uniform interval.
- **Driver:** User design spec going into the morning.
- **Alternatives considered:** Drop Januaries entirely (would have made `months.json` 60 entries instead of 70 but lost the cinematic beat); uniform every-2-months from February (lost the year-transition cinematic register).

### Trophy as SVG, not emoji
- **Decision:** New inline `TrophyCrown` SVG component (88px, Treatment-A flat-color line art) rather than the `🏆` emoji the user mentioned in the plan.
- **Reasoning:** Emojis render very differently across Apple / Windows / Android / web font stacks — an Apple-on-iOS user sees a glossy gold 3D trophy; a Linux/Twemoji user sees an outline; the same recap screen would feel inconsistent. SVG with palette-accent fill stays on the game's existing visual register.
- **Driver:** Claude proposal; user accepted ("merge it now").
- **Alternatives considered:** Emoji (lighter), full PNG sprite (heavier authoring), no trophy (defer).

### KidNamesEntry phase position: between Name and Class
- **Decision:** Init-flow order is career → name → **kid-names** → class → intro. Issue #76 spec said "after CareerPicker" (which would have put it before the player's own name).
- **Reasoning:** "Who am I in this game" → "who are the kids in this game" → "what tier do I start at" reads as a natural family-then-self-then-skill progression. The literal "after CareerPicker" placement would have asked for kid names before the player named themselves, which feels backwards.
- **Driver:** Claude judgment call against the issue's literal wording; flagged in the PR body for easy reversal if user prefers.
- **Alternatives considered:** Literal "after CareerPicker" placement; "after Class" placement (would feel like a footnote to the build-out).

### `labelFor(def, vars?)` extended in place vs duplicated helper
- **Decision:** Extend the existing `labelFor` / `speakerHeaderFor` with an optional `vars` arg. Default `vars=undefined` keeps the old behavior (render label literal).
- **Reasoning:** Back-compat for any caller that doesn't have vars in scope (e.g., ArcadeModal's aria-label for the arcade cabinet — no kid tokens there). Single source of truth for label resolution. Avoids `labelForWithVars` parallel-API drift.
- **Driver:** Claude.
- **Alternatives considered:** New `labelForWithVars` helper; require all callers to pass vars (would force ArcadeModal to wire up profile selectors for no benefit).

### Force-with-lease for PR #79 rebase
- **Decision:** After PR #78 merged, rebase PR #79's branch against the new main and `git push --force-with-lease` the rewritten branch.
- **Reasoning:** PR #79's design-doc change-log row conflicted with PR #78's after PR #78 merged. Solo branch, single commit on top of main. Force-with-lease refuses if anyone else pushed in the meantime — safer than plain force.
- **Driver:** Claude proposed; user explicitly approved before push.
- **Alternatives considered:** Merge `origin/main` into the branch (no rewrite, adds a merge commit); close + reopen the PR (loses the PR thread).

## 4. Tensions resolved

**The big one: I missed the content-gates regression during PR #78 review.** I shipped PR #78 (half-length playthrough) thinking it was complete — `months.json` regenerated, `progressSlice` clamps moved, finale renamed, save-version bumped. Two PRs later, while doing the §26 design-doc sync audit, I noticed homeschool decisions had `requires.month": ">=72"` entries. `LAST_MONTH_ID` is now 70. Nine decisions + two events were unreachable. SWE arc pacing was silently shifted ~4 months earlier than authored. Caught only because the design-doc sweep forced me to read content gates that I hadn't reviewed during PR #78. PR #80 was originally a "doc sync" PR; bundling the gates fix turned it into a meaningful follow-up. The user flagged this as exactly the kind of thing they want me to flag, and chose to bundle the fix rather than defer.

**HUD K/M abbreviation regression from PR #81.** Right after merging the all-classes PR, the user playtested Vanguard tier (start XP 15,000) and noticed `+50` decisions didn't move the HUD — it still read `15K`. Pure regression: the old `formatXp` / `formatMoney` helpers abbreviated values ≥ 10,000 as a width hedge for the days when the chip budget was 3-4 chars. With six new tiers up to Oracle's 300,000 XP / 4,000,000 savings, the abbreviation hid small deltas entirely. Fix landed within ~15 minutes of the report (PR #84).

**Issue #77 was actually two bugs, not one.** The issue spec asked for the back-door spawn position to move from far-left to "outside the door on the right of the previous year." Shipped the spawn fix. User playtested → flagged the *real* problem: walking back from Feb 2021 took them to the Jan 2021 narrative cinematic, not Dec 2020. The narrative cinematic was forward-only — the back-door target should skip it. `previousReplayableMonth()` only skipped `consequence` rooms; needed to also skip `narrative`. Bundled the second fix into the same PR with an extended change-log row. The "fix one bug, find another" cycle is the AI/human review asymmetry beat in microcosm.

**Doc-version conflict race between PR #82 and PR #83.** Both PRs bumped the doc to v2.0.12 (one row each). Whichever merged second would conflict. PR #82 merged first; PR #83's rebase bumped to v2.0.13 with a 30-second mechanical resolution. The pattern (warn explicitly in the PR body, resolve on the second merge) generalizes for any future parallel-PR day.

## 5. Time analysis

### Sprint duration (with product / process split)

**Authoritative source:** `docs/logs/time-log.md` (written by `/punch`).

**Morning sitting:**
- `start`: 2026-05-14T11:39:46Z
- `end`: 2026-05-14T12:00:18Z
- **Duration: 20m 32s.** No boundary blocks logged. Full duration counted as product.

**Afternoon sitting:**
- `start`: 2026-05-14T19:04:51Z
- `end`: 2026-05-14T20:20:57Z
- **Duration: 1h 16m 06s.**
- **One boundary block** — `human-review` (19:51:45Z → 19:57:04Z, 5m 19s). User playtested PR #82 / #83 / #84 in the browser.
- **Product wall time: 1h 10m 47s.** Process tooling: 0. Review: 5m 19s.

**Day-5 consolidated:**
- **Total at-keyboard wall time: 1h 36m 38s.** (Plus a ~7h gap between sittings where the user was away from the desk — not counted as either product or review.)
- **Product wall time: 1h 31m 19s** (20m 32s morning + 1h 10m 47s afternoon).
- **Review wall time: 5m 19s** (the one afternoon boundary).
- **Process tooling: 0** — no skill / memory / research authoring inside either sprint today.

### Traditional-team equivalent

**Assumed team:** 1 senior engineer (engine + feature work + content tooling), 1 designer (trophy SVG + UX calls + class-tier stat curves), 1 PM/QA (issue triage, regression spotting, doc reconciliation). Roles overlap heavily in this size of team.

**Assumed working pattern:** Async-first with 1 standup/day + ad-hoc pairings. ~6 productive hours per developer-day after meetings + context-switching overhead.

**Estimated duration: 3–5 working days for the product output alone.** Breakdown:

| Workstream | Solo team-day estimate |
|---|---|
| Half-length playthrough engine refactor (slot table, regen script, save-version bump, minigame slot remap, finale rename) | ~1 day |
| Room-complexity tier framework (type + sampler + downward-fallback + populate signature change) | ~0.5 day |
| 72-gate content remap + the discovery itself (the bug-find is the load-bearing part — easy to miss in a code review without an exhaustive content audit) | ~0.5 day |
| All 8 class tiers (manifest entries + stat-curve calibration in both packs) | ~0.5 day |
| Back-door spawn + narrative-skip (issue triage + two-fix bundle) | ~0.5 day |
| Finale trophy SVG | ~0.25 day |
| HUD format regression fix | ~0.1 day |
| Kid-name interpolation sprint (state + types + init phase + interpolation site updates + 74-occurrence rewrite + ProfileModal inline edit + verify + design doc) | ~1 day |
| Design-doc sync (v2.0.7 → v2.0.13 across multiple sections) | ~0.5 day |

**Total: ~4.85 days.** Rounded for honesty: **3–5 working days** for a small team to ship the same product output, granting them perfect focus and no stakeholder churn.

**What this estimate INCLUDES:**
- Design discussion + sign-off on the slot scheme + complexity-tier model + class-tier stat curves
- Implementation + local verification of all the above
- Reading + reconciling the design doc with what shipped
- Catching the content-gates regression (this would likely surface in QA after merge or in a careful code review — both add latency)
- Writing the change-log rows + design-doc subsections
- Rebasing parallel branches and resolving doc-version conflicts on merge

**What this estimate EXCLUDES (and would still need doing in a real team):**
- Visual design review of the trophy SVG against the broader recap composition
- Playtesting the entire 70-month homeschool arc to confirm gating math feels right
- Code review by another engineer (would catch issues like the gates regression earlier in a healthy team)
- QA pass on the half-length playthrough — multiple full runs to spot regressions
- Stat-curve playtesting on the six new class-tier starts (today's values are unplaytested)
- Stakeholder alignment on cutting the play length in half (a real product team would have weeks of discussion)

### Honest framing

For **8 PRs of production code + design-doc work + content rewrites**, with the same product output that took a small focused team 3–5 days, **today consumed 1h 31m 19s of at-keyboard product wall time**. That's roughly **15–25× faster** than the team estimate — but the honest version of that number is: this works because the human is doing review-and-redirect at AI speed, the AI is doing draft-and-iterate at machine speed, and the project's domain is one where most decisions have already been made in earlier sprints. The compression ratio collapses fast on greenfield design or stakeholder-bound work. A different sprint with the same team-day estimate would not produce the same number.

The two regressions I shipped and then fixed (gates + HUD numbers) are also part of the story. They cost 0 hours of team review-and-fix-cycle time today because the user was paired live; a team where regressions land in QA and bounce back days later would not see the same throughput.

## 6. What's next

- **Playtest PR #85** (kid-name interpolation) — new init phase, ProfileModal inline edit, 74-occurrence content rewrite. Specifically worth eyeballing: any sentence where the original "Hazel"/"Bram" depended on a gendered pronoun preceding/following (the player may pick any name → narrator still says "She" / "He"). Today: accepted as out-of-scope; could become a pronouns-too sprint if it reads off.
- **Merge PR #85** once playtest passes.
- **Possibly:** retire the standing concern from the §26 deferred-followups list about Student-pack monthIds (currently pinned at "v2.0.8 needs re-derivation"). Student pack is deferred so not blocking.
- **Day 15** (analytics + GitHub Pages deploy) remains the only ⏳ row in §17 Build Order — the v1 ship gate. Per §24 spec: GoatCounter wrapper + virtual-pageview slug instrumentation + the Pages deploy. ~3–5h. The §24 slugs were refreshed today so the build target matches current state.

## 7. Observations for publication

**Where Claude helped most.** The day's heaviest mechanical lift — the 72-gate content remap and the 74-`Hazel`/`Bram` content rewrite — combined to ~146 substitutions across 9 JSON files. Both were dispatched in well under a minute via one-shot scripts (a node mapping helper and a perl pass). For a human team, this is the kind of work that takes an afternoon of careful find-and-replace plus verification because the risk of a missed gate or a botched possessive can leak into a save and break content silently. AI here is good at *exhaustive* mechanical correctness — the same shape that makes me bad at design judgment makes me good at not skipping rows.

**Where the human had to push back.** The big one was the user catching the HUD K/M regression by playtesting Vanguard for 30 seconds after the all-classes PR merged. I had verified the manifest entries, run typecheck/lint/build, and shipped. The user opened the game and saw `15K` not move. That visual loop — start the game, make one decision, watch the chip — is something I can't substitute for. The pattern shows up again with the back-door spawn (issue #77): the spec named one bug; playtest surfaced a deeper one. AI ships the literal spec quickly; human playtest exposes the real bug.

**What surprised the user.** Reportedly, the 8-PR throughput was the heaviest single-day product velocity on the project — the prior record was Day-4 night-shift's 6 PRs in 75 minutes. Today added 8 PRs in 1h 31m of product time. The compression ratio held even though the work spanned engine refactors, content rewrites, and UI fixes — three different work modes that usually have very different velocity profiles. The unifying factor: every PR was small enough to ship in one sitting, and the design-doc-first discipline meant decisions had already been made before code was written.

**What the workflow felt like.** Tight conversational loop. Each PR moved through (1) user spec or bug report → (2) AI implements + verifies → (3) user playtests or skips → (4) merge. The boundary system (`/punch boundary-open human-review`) carved out the 5m 19s window the user spent in the browser; everything else was "AI typing while human reads diff." The parallel-PR-conflict pattern (two PRs both targeting v2.0.12) appeared and got resolved on the second merge with a 30-second rebase — boring engineering, made explicit in the PR body so future readers don't think the doc got two simultaneous edits.

---

*Generated by the session-process-log skill. Covers the consolidated day-5 sittings (morning + afternoon) as one analytical artifact at user request.*
