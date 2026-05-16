# Sprint Log: Path to the Future — 2026-05-15, day 6 evening

**Date:** 2026-05-15 (sprint crossed midnight UTC; ended 2026-05-16T01:51:41Z)
**Sprint:** day 6 evening sitting
**Sprint window:** 2026-05-15T23:24:01Z – 2026-05-16T01:51:41Z (2h 27m 40s)
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Content authoring (room-layout templates) + playtest-driven tier iteration + design-doc sync
**Wider context:** Sprint 2 of day 6. The day 6 morning sprint (1h 59m, 2026-05-15T10:02–12:02 UTC) was a separate sitting with different scope (NPC palette + analytics + easy tier + medium-tier physics PR #90) and is logged separately. A parallel session shared the working tree intermittently throughout — see *Tensions resolved*. This log covers the content-sprint thread only.

---

## 1. Starting point

The user picked up after a handoff break. The punch-log plan was to playtest PR [#90](https://github.com/corby-github/path-to-the-future/pull/90) (medium-tier moving-obstacle physics, shipped earlier in the day) and tune the five constants at `DecisionRoom.tsx:46-50` if the feel was off.

The sprint pivoted within minutes of starting. The engine work in #90 was solid; the gap that mattered was *content* — only 22 layout templates existed against ~60 playable-month room rolls per playthrough, so the same five templates were appearing ~9 times each. The pivot reframed the work from "tune the engine" to "saturate the template pool" and opened the 60-room sprint that became issue [#94](https://github.com/corby-github/path-to-the-future/issues/94).

## 2. Deliverables produced

- **Research artifact** [`docs/research/parallel-sessions-for-meta-work.md`](../../research/parallel-sessions-for-meta-work.md) — extends the existing `concurrent-session-ceiling` artifact with the orthogonal "which task shapes belong in a side session" axis. Names skill creation, research capture, usage logs, and issue filing as ideal side-session candidates because they're file-disjoint, state-disjoint, and bounded.
- **Issue [#92](https://github.com/corby-github/path-to-the-future/issues/92)** — Double-tap-to-sprint feature, fully spec'd with motion lines, tutorial integration, minigame exclusion, and acceptance criteria. Cross-linked to issue [#89](https://github.com/corby-github/path-to-the-future/issues/89) (keyboard tutorial widget) so both can ship in one combined PR.
- **Issue [#94](https://github.com/corby-github/path-to-the-future/issues/94)** — 60-room content sprint umbrella. Captures the gap table (~32 new templates needed, dominated by medium), the composition grammar (geometric base × motion overlay × parameter axis), and the recommended authoring order (medium → hard → easy → expert).
- **11 intern era events** in [`public/careers/software-engineering/events.json`](../../../public/careers/software-engineering/events.json) — era-gap humor lines gated to `month >= 44` (Feb 2026+), including a *Back to the Future* "use your hands" echo. (Later refactored by the parallel session into NPC dialogue; see *Tensions resolved*.)
- **PR [#95](https://github.com/corby-github/path-to-the-future/pull/95)** — Medium-tier expansion batch 1, **MERGED**. 6 new templates: `gate-paddle`, `s-curve-patrol`, `switchback-paddle`, `slow-orbit` (later renamed *Corralled orbit*), `twin-patrols`, `maze-gauntlet`. Includes a tuning pass that retiered every template's period from 4500–6000 ms (read as easy) down to 2400–3500 ms (medium tempo), and a playtest pass that reclassified `s-curve-patrol` → easy and replaced `maze-gauntlet`'s narrow paddle with a 540×40 wide-bar.
- **PR [#96](https://github.com/corby-github/path-to-the-future/pull/96)** — Hard-tier expansion, **OPEN**. Rebased onto updated `main` after PR #95 merge. Playtest reshuffled four templates (`paddle-pair-phase` → medium, `counter-patrols` + `channel-paddle` → simple, `tight-pickets` → expert), amped `triple-paddle` (220 → 230) and `tight-pickets` (180 → 210), redesigned `gauntlet` (310 px gaps → 200 px gaps, single weak central paddle → 3 phase-offset paddles), and amped `crossfire` from 3 motions to 8 (4 horizontal sweepers + 3 vertical pendulums + 1 door paddle, all non-aligned periods). `crossfire` then reclassified hard → expert after playtest confirmed feel.
- **PR [#97](https://github.com/corby-github/path-to-the-future/pull/97)** — Medium-tier expansion batch 2, **OPEN**. 6 new templates extending the composition grammar with patterns not yet covered: `triple-paddle-slow`, `east-corridor`, `asymmetric-block`, `triangle-sentinel`, `sync-patrols`, `mini-orbits`.
- **Design doc §4** walked through three version bumps (v2.0.23 → v2.0.24 → v2.0.25) with the *Layout templates* table, pool counts, per-pack pool-sizes, and prose paragraph updated in lockstep with each PR.

**Net pool at end of sprint:** 35 templates (13 simple + 4 easy + 8 medium + 6 hard + 4 expert), up from 22 (11/3/2/4/2) at sprint start.

## 3. Key decisions

### Compose existing patterns, don't invent new primitives
- **Decision:** Use the v2.0.18 – v2.0.22 motion primitives (sine paddle, horizontal patrol, deterministic path) and compose them with existing geometry (mazes, switchbacks, frame walls) to fill the 60-room gap. No engine work in this sprint.
- **Reasoning:** Schema already supports composition — `LayoutTemplate.obstacles[]` and `movingObstacles[]` can coexist; current expert templates just don't combine them. Inventing new motion primitives is engine work; composing existing ones is pure content. Issue [#94](https://github.com/corby-github/path-to-the-future/issues/94) captures the grammar so future batches inherit it.
- **Driver:** Mutual. User asked mid-playtest of expert templates: "we should be able to have something like maze with zigzag or 2 — see what i mean." That one line crystallized the whole approach.
- **Alternatives considered:** New motion primitives (rotating barriers, accelerating obstacles, projectiles) — deferred to follow-up engine work, not in scope.

### Medium tier first, hard in parallel session
- **Decision:** Sprint medium tier in this session (biggest gap: +16 needed, longest player exposure across 2023–2026), with hard expansion happening simultaneously in a parallel session.
- **Reasoning:** Medium had only 2 templates against ~18 month-rolls of demand — the worst repetition gap. The parallel session was already cued up to tackle hard. Splitting by tier let both threads progress without overlapping `layouts.ts` regions.
- **Driver:** Mutual.

### Forcing geometry as a recurring playtest fix
- **Decision:** Every medium/hard template that allows route-around at the top or bottom of the canvas must include either frame walls (compressing the player into a corridor) or wide bar-paddles (spanning the corridor width) so the motion can't be bypassed.
- **Reasoning:** Three rounds of playtest feedback in a row called out the same failure pattern: open geometry + motion plays easier than expected because the player routes above or below the motion's y-range. The fix that consistently worked: pin the player to a band with frame walls, or make the paddle wider than the bypass.
- **Driver:** User playtest feedback (multiple rounds across PR #95 batch 1, PR #96 hard tier, and PR #97 batch 2).
- **Alternatives considered:** Just amping periods or amplitudes — didn't work alone because the route-around bypass survived the speed-up.

### Crossfire 3 → 8 motions to test expert tier
- **Decision:** Amp `crossfire` from 3 motions to 8 (4 horizontal sweepers + 3 vertical pendulums + 1 door paddle, all non-aligned periods), playtest the result, then flip the tier if confirmed.
- **Reasoning:** User playtest of v1 said "good, hard, not expert unless you added more pickets." Adding the requested motions was cheap (~5 minutes of `layouts.ts` edits); playtest confirmed expert feel; tier flipped in a follow-up commit (`f9152dc`).
- **Driver:** User feedback ("3 more horizontal, 2 more vertical").

### Direct-commit fixes to main for small playtest patches
- **Decision:** The playtest fix for PR #95 (s-curve-patrol → easy + maze-gauntlet wide-bar) landed via a direct commit to `main` (`2b2c89f`) after PR #95 merged, rather than opening a follow-up PR.
- **Reasoning:** PR #95 merged before the playtest pass completed. The fix was small (two templates, geometry-only). Per the project's no-stacked-PRs rule and the user's prior direct-commit precedent for small fixes (the intern-events commit on day 5).
- **Driver:** User choice (selected from three branching options).

## 4. Tensions resolved

- **Initial medium templates played as easy/simple.** Shipped v1 of batch 1 with periods of 4500–6000 ms (1.5–2× too slow for medium). Playtest feedback ("gate-paddle is great — but likely too easy", "switchback-paddle is fine — too slow", "maze-gauntlet is weak — haha") triggered a tuning pass: periods retiered to 2400–3500 ms (matching `pendulum`/`shutters`), wider paddles where appropriate, forcing geometry added. Second-round playtest confirmed medium feel for the amped templates ("switchback-paddle is medium now — it's possible but I get stuck, I do get out, I make it through — it's fun"). The whole loop is filed in issue [#94](https://github.com/corby-github/path-to-the-future/issues/94)'s pattern-grammar section as a worked example.

- **Working-tree collisions with the parallel session.** Twice during the sprint, the parallel session's branch operations (checkout to a different feature branch while my session had uncommitted edits) wiped the in-flight work. Recovered once via `git stash pop` of a mislabeled stash ("other-session: medium-tier tuning in-flight on gate-paddle" — but the content was actually almost-complete amp-up work the parallel session had stashed when switching). The second collision came too late to recover from stash — retyped all six amp-ups from scratch in a single Edit call. Documented after-the-fact in `docs/research/parallel-sessions-shared-working-tree.md` (authored by the parallel session itself, untracked at end of sprint for the parallel session to claim).

- **Branching reconcile for PR #95 → PR #96 → PR #97.** No stacked PRs per project rule, all three off `main`. PR #95 merged first (with bug-fix follow-up direct-committed to main). PR #96 then rebased onto updated main; the design-doc conflict (change-log row, pool counts, template-table position) was mechanical; `layouts.ts` auto-merged because medium templates and hard templates inserted at different array positions. Force-pushed with `--force-with-lease`. PR #97 cut fresh off updated main; will need a small rebase when PR #96 lands.

- **Intern events: event-pool vs. NPC dialogue.** I authored the 11 era-gap intern lines as event-pool entries (random monthly events gated to `month >= 44`). The parallel session re-converted them into NPC dialogue (`161a60a fix(content): move 11 intern events into npc-intern dialog`) on the assumption they'd read better as an explicit "intern character" rather than as faceless monthly events. That commit ended up on PR #96's branch alongside my crossfire work (mixed-theme by accident) and was pushed up rather than untangled.

## 5. Time analysis

### Sprint duration (with product / process split)

- **Sprint duration (total):** 2h 27m 40s — wall clock from punch-in (2026-05-15T23:24:01Z) to punch-out (2026-05-16T01:51:41Z), per [`docs/logs/time-log.md`](../time-log.md).
- **Product wall time:** ~1h 57m. First ~1h 27m was 100% product (issue filing, PR #95 v1 ship, PR #95 tuning pass, PR #96 rebase + playtest reshuffle, PR #97 ship). Last ~1h was ~50/50 product / playtest review (round-tripping feedback on PR #95 templates then PR #96 crossfire amp). User-supplied split, annotated retroactively in the time-log row.
- **Process tooling wall time:** ~30m of playtest review interleaved with product edits in the last hour. No clean `boundary-open` / `boundary-close` window existed in the punch log because the work was genuinely concurrent — playtest feedback in one line, code edit in the next, back to playtest.

### Traditional-team equivalent

- **Assumed team:** 1 game designer (level design + tuning) + 1 engineer (implementation) + an intermittent playtester rotation.
- **Assumed working pattern:** Focused design sessions + standups + per-template review cycles + design-doc sync work.
- **Estimated duration:** 4–5 working days (~32–40 hours of team-effort).

**What this estimate INCLUDES:**
- Pattern design + parameter authoring for 12 new templates.
- Geometry tuning + iteration based on playtest feedback for 9 modified templates (the PR #96 reshuffle + amps + gauntlet redesign + crossfire amp).
- Tier classification debates and reshuffling (4 templates flipped down, 2 flipped up).
- Design doc updates: 6 new rows in the template table + 7 modified rows + 3 change-log row writes + 3 pool-count updates + 3 per-pack pool-size updates + 1 prose-paragraph rewrite.
- Two GitHub issues filed (`#92` double-tap sprint, `#94` 60-room umbrella).
- One research artifact authored.

**What this estimate EXCLUDES (and would still need to be done):**
- Stakeholder review / signoff on the difficulty progression curve.
- Multi-playtester validation (this sprint had one playtester: the user).
- Visual polish on the new templates (none needed — templates are rectangle geometry; the in-game render is automatic).
- Coordination overhead in a multi-person team (handoffs, design-meeting prep, etc.).

### Honest framing

Roughly 2 hours of product time covered 12 new templates + 9 modified templates + tier reshuffling + 2 issues + a research artifact + design-doc reconciliation across three version bumps. A small team doing equivalent work end-to-end would spend 4–5 days — call it **10–15× faster than traditional**.

The compression comes from three sources: (a) skipping coordination overhead between disciplines (no design-doc-to-engineer handoff because the designer and engineer are the same loop), (b) tight playtest-to-edit cycles (the user typed "too easy" and the edit landed in 30 seconds), and (c) the composition grammar's leverage (once the base × overlay × parameter framework was named in issue #94, each new template was a 5-minute compose-and-test).

The ratio collapses as the work expands toward art, voice, stakeholder coordination, or multi-playtester validation. None of those were in scope here. This sprint was a particularly favorable cell of the compression matrix: mechanical content authoring against an established schema with a single fast-loop playtester.

## 6. What's next

- **Playtest PR #97's 6 new medium templates** and apply tier reshuffles. Likely tier-risk candidates from the test table in the PR description: `east-corridor` and `triangle-sentinel` (slow period band), `triple-paddle-slow` (could play hard).
- **Merge PR #96** once playtested (or after PR #97 if PR #97 merges first — second to merge rebases).
- **Merge PR #97** once playtested.
- **Continue issue #94 batches.** Remaining gap (~5 medium, ~7 easy) is the next sprint. Pattern grammar is set; per-template authoring cost should be the same 3–5 minutes that PR #97 templates cost.
- **Issues #89 + #92** (keyboard tutorial widget + double-tap sprint) — both fully spec'd, neither started. Could pair as one combined PR per the cross-link.

## 7. Observations for publication

The single most valuable signal in the sprint was the user's terse playtest feedback. Lines like "weak haha", "WAY too easy", "switchback-paddle is fine — too slow", or "tight-pickets is good — probably the first expert one I have seen" carried more design information per word than a long design debate. The skill the AI brought wasn't pattern authoring — anyone with the schema can write rectangles — but **conversion speed**: 30 seconds from one-line playtest read to corrected code, with period, amplitude, and wall geometry all adjusted to the implied tier. We went around that loop ~15 times in the sprint. Each round would have been a 20–30-minute sit-down-and-think for a human designer; here it was an interleave with the next playtest call.

A close second observation: the AI consistently over-estimated its own templates' difficulty. Open geometry kept playing two tier bands easier than the AI's parameter choices predicted. Four hard-tier templates got reclassified down to medium or simple inside a single playtest round (PR #96), and the medium batch 1 v1 ship played as easy across the board until the tuning pass landed. We learned a rule together that's now baked into issue #94's pattern grammar: motion without forcing geometry doesn't hold its tier. Wide-bar paddles spanning the corridor, frame walls compressing the player into a band, center walls splitting the safe middle — these were the reliable amp-up moves.

The composition grammar (geometric base × motion overlay × parameter axis) made the per-template authoring cost collapse over the sprint. The first medium template took ~20 minutes of thinking through geometry + parameters + design-doc comment. The sixth in PR #97 took ~3 minutes — the grammar was internalized and the variation was on dimensions I'd already named. This is the leverage of writing the grammar down: each subsequent batch inherits the prior batch's vocabulary.

Working-tree collisions between concurrent Claude sessions were the worst friction of the sprint. Two cases of "where did my edits go" later, both involving `git stash` rescues, but neither was free — 5–10 minutes of re-typing each time. The mislabeled stash ("other-session: medium-tier batch-2 in-flight on layouts.ts" with crossfire-amp content inside) was particularly disorienting. The lesson — captured in the parallel session's `parallel-sessions-shared-working-tree.md` artifact — is that two sessions can edit the same file safely only if neither needs to `git checkout` while the other has uncommitted changes. Future multi-thread sprints should either commit much more frequently or split work across branches that don't share modified-file lists.

Finally — the design doc walked through three version bumps (v2.0.23 → v2.0.24 → v2.0.25) inside 2h 27m, and the running cost of keeping it synced *with* each PR (per the project's standing rule) was about 10% overhead per PR. Doing the same cleanup out-of-band at the end would have been a 30-minute sweep at best, with risk of drift. Doc-with-PR is more expensive per merge but dramatically cheaper at the end.

---

*Generated by the session-process-log skill.*
