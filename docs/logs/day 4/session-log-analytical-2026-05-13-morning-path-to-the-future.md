# Sprint Log: Path to the Future — 2026-05-13, Day 4 Morning

**Date:** 2026-05-13
**Sprint:** Day 4, morning session (matches `/punch` Day=4, Session=morning)
**Sprint window:** 2026-05-13T08:58:14Z – 2026-05-13T11:08:32Z (2h 10m 18s total)
**Participants:** 1 human (Corby) + Claude (Opus 4.7, 1M context)
**Output type:** Product (icon sprint + SSR review generator + two PRs) + Process tooling (universal `/research` skill; boundary scheme formalized across `/punch` + `session-process-log`; two research artifacts)
**Wider context:** Day 4 of a multi-day build that started 2026-05-10. Day 3 closed at 01:16:48Z with five PRs landed (#50–#54: arcade subsystem, pong, ultimate-question, title decor, rename). Day 4 morning continued the Tier B graphics push that started Day 3, then pivoted into process-tooling for the first time on this project.

---

## 1. Starting point

Corby came into Day 4 morning with a clear next-up list inherited from prior sprints: complete SWE pack icon coverage (Treatment A, line-art SVG, 80×80) and start the homeschool-parent pack ramp. The handoff from 2026-05-12-4 named the SWE icon completion as the next deliverable and flagged that review-page generators were the gating dependency before scaling to a second pack. The conversation also resumed after a `/compact`, which shaped two later moments in the sprint (one product wins, one false estimate).

Pre-sprint state: 33 SWE icons already authored over Day 3, plus three follow-ups (`IconMentorJunior`, `IconHackathon`, `IconPandemicClose`, `IconRocket`, `IconVideoCall`). 38 SWE decision/event ids still missing icons. Homeschool pack content was already in place from PRs #56 and #60. The `/usage` skill had just been path-corrected (`docs/log/` → `docs/logs/`).

## 2. Deliverables produced

**Product (~1h 52m wall time):**

- **PR #61 merged** — *Complete SWE pack icon coverage.* 38 new icons authored in `src/game/ui/icons/modalIcons.tsx` (now ~1344 lines, 80+ icon components) and registered in `src/game/ui/icons/modalIconRegistryData.ts`. SWE pack at 100% coverage: 35 decisions + 39 events + finale = 75 registered icons.
- **PR #62 merged** — *SSR review-page generator + SWE previews + research artifact.* Concrete files:
  - `scripts/generate-previews.tsx` (~600 LOC) — Node TS generator using `tsx` + `react-dom/server`. Reads `public/careers/<id>/`, emits two HTMLs per pack.
  - `scripts/icon-descriptions.ts` (~140 lines, ~80 captions) — generator-only, doubles as alt text.
  - `scripts/tsconfig.json` — local `jsx: "react-jsx"` config for tsx.
  - `docs/text-previews/swe.html` (1857 lines) — every SWE word in earliest-month order, banded by era.
  - `docs/icons-previews/swe.html` (758 lines, 81 SVGs) — every registered icon at 80×80, all-covered gauge green.
  - `docs/research/ai-human-review-asymmetry.md` (128 lines) — durable principle artifact.
  - `npm run gen:previews` script wired; `tsx` added as devDependency.

**Process tooling (~18m wall time, two boundary blocks):**

- **`~/.claude/skills/research/SKILL.md`** — new *universal* skill (229 lines). Companion to `/punch` and `/usage`. Creates one file per invocation at `docs/research/<slug>.md` in cwd.
- **`docs/research/context-estimation-bias-after-compact.md`** (132 lines) — second research artifact. Worked example: post-compact context % heuristic over-estimated ~4× (est 65% / 540k vs. actual 14% / 143.3k).
- **`/usage` skill body patch** — "Post-compaction correction" subsection added with the worked example and the rule (default to 5–15% band post-compact; anchor against most recent `(user)` row).
- **`/punch` skill body extension** — `boundary-open` / `boundary-close` as first-class event types: args, process sections 2c/2d, edge cases, and the downstream-reader algorithm explaining how to compute the product-vs-process split.
- **`anthropic-skills:session-process-log` skill body extension** — Step 3 rewritten to split product vs. process wall time; analytical §5 + marketing "The numbers" templates updated.
- **Two project memory entries** under `~/.claude/projects/-Users-corby-path-to-the-future/memory/`: `research_ai_human_review_asymmetry.md`, `research_context_estimation_bias.md`. Both indexed in `MEMORY.md`.
- **Time-log boundary scheme** in `docs/logs/time-log.md` — two paired open/close rows bracketing process-tooling blocks (10:45→11:00 = 15m 32s; 11:03→11:06 = 2m 51s).
- **`docs/handoffs/handoff-2026-05-13.md`** — the bridge to the next sprint.

## 3. Key decisions

### Bundle by pack — finish SWE 100% before pivoting to homeschool
- **Decision:** Complete all SWE icon coverage in one PR (#61), then build the review pipeline, then ship SWE previews — only after that pivot to homeschool icons.
- **Reasoning:** Voice cohesion is the project's pitch. Mixing packs mid-stream invites drift across the universal-pool decisions shared between them. Reviewing one pack at a time keeps the review pass tractable.
- **Driver:** User (locked at the start of the sprint).
- **Alternatives considered:** Interleaved authoring (some SWE + some homeschool concurrently). Rejected to preserve voice/style consistency per pack.

### SSR via `tsx` + `react-dom/server`, not parallel SVG strings
- **Decision:** The review generator reuses existing React icon components and renders them through `react-dom/server.renderToStaticMarkup`.
- **Reasoning:** Icons already take `palette` as a prop (no `useCareerPack()` context dependency), so SSR works cleanly. A parallel "rendered string" map would drift the moment an icon changed in source.
- **Driver:** Claude (proposed); user (approved).
- **Alternatives considered:** Hand-stringifying SVGs into a separate file (high drift risk); Playwright screenshotting (high friction, no scriptable diff).

### `docs/research/` as a new artifact category
- **Decision:** Add a new top-level project-docs subfolder for durable principles / findings / observations.
- **Reasoning:** Existing categories are scoped — `logs/` is sprint records, `handoffs/` is session bridges, `text-previews/` and `icons-previews/` are review surfaces. Cross-cutting principles ("AI/human review asymmetry," "context bias after compact") don't fit any of those and need their own connected web of cross-references.
- **Driver:** Claude (proposed); user (approved by accepting the artifact placement).
- **Alternatives considered:** Bury principles in the canonical design doc. Rejected — design doc is about the product; these are about the process.

### `/research` as a *universal* skill, not project-local
- **Decision:** Skill lives at `~/.claude/skills/research/SKILL.md` and writes to `docs/research/` relative to cwd.
- **Reasoning:** Matches the `/punch` and `/usage` pattern; works in any future project; one body to maintain.
- **Driver:** User (explicit: "lets make it a universal skill").
- **Alternatives considered:** Project-local under `.claude/skills/`. Rejected — fragmentation.

### Boundary scheme: paired open/close, not single marker
- **Decision:** Time-log boundaries are `boundary-open` + `boundary-close` event rows that bracket a sub-range; `/punch` skill body formalizes them; `session-process-log` reads them to compute `product_duration = sprint_duration - process_total`.
- **Reasoning:** A single-row marker captures *when* the boundary fell but not *how long* the marked block lasted. User flagged this directly: "looking at it by itself its unclear how MUCH time was used."
- **Driver:** User (caught the limitation in my first attempt).
- **Alternatives considered:** Adding a duration column to a single boundary row. Rejected — breaks the time-log's "one event per row" schema.

### Time-savings comparison anchors on `product_duration`, not `sprint_duration`
- **Decision:** `session-process-log` compares the traditional-team estimate against product wall time only, not sprint total.
- **Reasoning:** Crediting AI velocity with hours spent editing Claude-side skills, writing research artifacts, or formalizing time-tracking schemas is a category error. The headline number is about product throughput; meta-loop work belongs in its own bucket.
- **Driver:** User (raised the calibration concern: "the last few min of our conversation is more tooling than sw engineering").
- **Alternatives considered:** Footnote the split. Rejected — footnotes get skipped; the discipline has to live in the template.

## 4. Tensions resolved

### Treatment A surface fill — user rejected the cream tile background
After PR #55 (the first 4 anchor icons), the user flagged that the modal icon shouldn't have the `palette.surface` fill behind the line art. I had inherited that fill from a prior IconFrame pattern. Removed in PR #58 (`fill={palette.surface}` → `fill="none"` on the rect inside `IconFrame` and on `PlaceholderIcon`). Clean read; the icon no longer competes visually with surrounding cards.

### "Not quite a cell phone" — icon iteration
The `univ-recruiter-call` icon's first attempt was an ambiguous phone-handset shape. User flagged it. Reworked to a classic barbell handset with `palette.background` fill on the bulbs as a mask trick so the outline reads cleanly without re-introducing the surface tile. The masking trick became reusable — I noted it in passing during the sprint.

### Single boundary marker → paired open/close
The first time I marked the product → process transition in the time-log, I used a single row. User immediately surfaced the limitation: durations weren't computable. Within a single round-trip I converted to paired markers, then in the following round-trip formalized the pattern in both the `/punch` skill body and `session-process-log` so this won't happen again.

### Context % estimation 4× off
At the first `/usage` snapshot of the sprint (immediately post-`/compact` resume), I estimated `~65% / ~540k`. User pasted the UI screenshot: actual was `14% / 143.3k`. Off by 4×. We diagnosed the mechanism (heuristic pattern-matches felt narrative, not visible token count) on the spot, captured it as a research artifact, patched the `/usage` skill body, and added a project memory entry. Three layers of durability for one bug.

### "Generation is fast, review is not" — the asymmetry surfaced
User raised the observation that AI generates content (icons, dialog) in minutes, but reviewing it for voice/tone/feel/art cannot be compressed. This wasn't a tension within the sprint — it was a tension *with how the schedule had been framed*. We captured it as `docs/research/ai-human-review-asymmetry.md`, made it the explicit rationale for PR #62's generators, and indexed it in project memory. The principle now biases every future "should we just generate and ship?" moment.

## 5. Time analysis

### Sprint duration (with product / process split)

Authoritative timestamps from `docs/logs/time-log.md` (written by `/punch`):

- **Sprint duration (total):** 2h 10m 18s — 2026-05-13T08:58:14Z → 2026-05-13T11:08:32Z (UTC).
- **Product wall time:** **1h 51m 55s.** This is the number to compare against the traditional-team estimate.
- **Process tooling wall time:** 18m 23s across two boundary blocks:
  - 10:45:00Z → 11:00:32Z (15m 32s): `/research` skill creation + `context-estimation-bias-after-compact` research artifact + `/usage` skill patch + project memory entries.
  - 11:03:34Z → 11:06:25Z (2m 51s): `/punch` skill `boundary-open`/`boundary-close` formalization + `session-process-log` skill product/process split.

### Traditional-team equivalent

**Assumed team:** 1 PM (light involvement), 1 designer, 1 engineer.
**Assumed working pattern:** async with one ~30-min sync to align on the icon style + one ~30-min sync to review the generator output.
**Estimated duration:** **3–4 working days** of focused product output (compared against the 1h 52m product wall time).

**What this estimate INCLUDES:**
- Designer authoring 38 Treatment A line-art icons (80×80 SVG, palette-aware) at ~25–30 min/icon with revision passes → ~16–19 hours.
- Engineer building an SSR review pipeline: figuring out the `tsx` + `react-dom/server` plumbing, designing the HTML output, writing the inline CSS, wiring an npm script → ~4–6 hours.
- Engineer or technical-writer authoring the icon-description captions (~80 lines, doubling as alt text) → ~1–2 hours.
- One PM/team reflection block to articulate the AI/human review asymmetry principle as a durable artifact → ~1–2 hours.
- PR review + merge cycles for both PRs → ~1–2 hours.

**What this estimate EXCLUDES (and would still need to be done):**
- The voice/icon review of the SWE previews themselves (per the asymmetry artifact, this is the load-bearing step and can't be compressed by either AI or team).
- Stakeholder review / approval rounds.
- Visual-design polish passes beyond Treatment A consistency.
- Production deploy / hosting concerns.
- The process-tooling work (boundary scheme, research skill, memory entries) — a typical team wouldn't have produced any of that; closest team-equivalent would be a half-day of meta-process design that most teams skip.

### Honest framing

Product output of this sprint — two merged PRs containing 38 production-quality icons, a working SSR review-page generator, two self-contained preview HTMLs, and a load-bearing research artifact — represents roughly 3–4 focused team-days of work. Delivered in 1h 52m of product wall time. That's an honest **~10–15× compression** on this specific kind of work (iconography + SSR plumbing + design-philosophy articulation), with the explicit caveat that the *review* of the generated content remains an uncompressible human step the team would still need to do.

Critically: the 18m 23s of process-tooling wall time was excluded from this comparison because crediting AI with time spent editing Claude-side skills, writing meta-research artifacts, and formalizing time-tracking schemas would be a category error. That work has its own value, but it doesn't ship the game.

## 6. What's next

- **Homeschool icon coverage** — 67 hp-* / evt-hp-* ids needing Treatment A art. Start with the 5+5 voice-checkpoint protocol per the prior pack convention. Author in `src/game/ui/icons/modalIcons.tsx`, register in `modalIconRegistryData.ts`, caption in `scripts/icon-descriptions.ts`.
- **Homeschool previews** — `npm run gen:previews -- --pack=homeschool-parent` (generator is ready).
- **Linear voice + icon review of homeschool previews** — the load-bearing step per the asymmetry artifact. No spot-checking.
- **Backlog:** career picker tiles (SWE + Homeschool); MinigameIcon registry + `MinigameReplayCard` wiring; compound `requires` range expressions in the engine.

## 7. Observations for publication

**Where the AI helped most.** Two places, clearly distinguishable. First: 38 icons of consistent style produced in a single PR window. The marginal cost of icon 35 was the same as icon 5 — no fatigue, no quality drift across the batch. Second: building the SSR generator was a roughly 30-minute exercise from "let's add review pages" to "two HTMLs written, npm script wired, verify clean." A team would have spent that first 30 minutes scoping the task.

**Where the human had to push back — and where it mattered.** The user pushed back four times that I noticed: on the surface fill of the icon frame (visual judgment), on the cell-phone icon (legibility judgment), on the single-marker time-log boundary (schema judgment), and on the categorization of meta-tooling time as product velocity (epistemic honesty judgment). None of those pushbacks were things I would have caught on my own. The pattern is consistent: AI generates plausibly-good output fast; the human's job is to catch the places where "plausibly good" silently drifts from "actually right."

**What surprised the user.** The depth of recursion in the process-tooling work. The sprint started intending to ship product (icons + previews) and ended having authored a universal `/research` skill, a research artifact about Claude self-calibration bias, a patched `/usage` skill body, and a paired-boundary scheme formalized across two skills. None of that was on the schedule. All of it was generated in response to surfacing real problems in real time. The asymmetry artifact then explicitly named *why* this kind of meta-tooling has its own value and shouldn't be confused with product velocity.

**What the workflow felt like.** Two threads running in parallel was the operational pattern. Foreground: I built icons and previews while the user reviewed earlier output. Background: research artifacts and skill bodies got authored when surfacing observations rather than queued for later. The risk of recursion (building tools to track time spent building tools to track research about building tools) was real and acknowledged by the user mid-sprint ("the last few min of our conversation is more tooling than sw engineering"). The boundary scheme exists to make that risk visible in the data instead of letting it inflate the headline.

---

*Generated by the session-process-log skill.*
