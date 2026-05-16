# Sprint Log: Path to the Future — 2026-05-15, Day 6 Evening (room-ladder session)

**Date:** 2026-05-15
**Sprint:** Day 6 evening — *room-ladder thread* (concurrent with a second session running the medium-content thread; this log captures the room-ladder session only)
**Sprint window:** 23:24:01 UTC – 01:51:41 UTC (2h 27m 40s)
**Participants:** 1 human + Claude Opus 4.7 (1M context)
**Output type:** Engine + content (room-ladder completion through expert tier + hard-tier content expansion + bug-fix routing)
**Wider context:** Day 6 of the build. Two concurrent sessions ran during this evening sitting — this one finished the §4 complexity-tier ladder (medium feel pass → expert tier → hard expansion) and also caught a content-routing fix for intern dialogue. The other concurrent session ran the parallel medium-tier content sprint (PR #95 / #97). Both sessions shared the same local working tree, which produced two notable working-tree collisions documented in this log and in a captured research artifact.

---

## 1. Starting point

Sprint opened with PR [#90](https://github.com/corby-github/path-to-the-future/pull/90) (medium-tier moving-obstacle physics, v2.0.18) merged earlier in the day from the morning sprint. The handoff doc at [`docs/handoffs/handoff-2026-05-15.md`](../../handoffs/handoff-2026-05-15.md) named the next move as *"playtest PR #90 and tune the 5 constants at `DecisionRoom.tsx:46-50` if the feel is off."* No work-in-progress on the branch beyond a small uncommitted `DEFAULT_SPEED` 4×→2× tweak in `DevControlsProvider.tsx` that the user had made between sessions.

The §4 *Complexity tiers* ladder stood at: simple ✅ (11 templates), easy ✅ (3 templates, PR3), medium ✅ (2 templates, PR4 with full collision pipeline), hard ❌ (no templates), expert ❌ (no templates). Engine pipeline already supported the `MovingObstacle` type, `useMovingObstacles` hook, sine oscillation with optional horizontal axis (added later in PR5), and DecisionRoom's collision callback with two-phase slide+stun coming online in this sprint.

## 2. Deliverables produced

- **PR [#90](https://github.com/corby-github/path-to-the-future/pull/90) follow-up commits (v2.0.19, merged):** five tuning bumps + smooth two-phase slide replacing the v1 imperative knockback snap; per-obstacle dedupe so cascading hits from a *different* obstacle in the slide path can fire even within the global cooldown; in-canvas damage floater (3× HUD-sized, mirrors HUD chip negative-delta); 3 twinkling stun-stars above the player for the full 1-sec lock window; must-release input gate in `usePlayerMovement` (held direction keys stay ignored after lock until physically released).
- **PR [#93](https://github.com/corby-github/path-to-the-future/pull/93) (v2.0.22, merged):** expert-tier engine work + 2 templates. `MovingObstacle.path?: readonly Vector2[]` for deterministic linear-interp path motion (cycles through waypoints with `period` as total cycle time, loops `path[N-1]→path[0]`). `placeInteractables` gains optional `complexity?: ComplexityTier` and narrows the placement area to the left half (x=150..480) for hard/expert tiers — implements the §4 NPC zoning rule that had been TBD since v2.0.9. Two new universal expert templates: `zigzag-sentinel` (single 40×40 deterministic block tracing a bowtie loop through the 4 corners of the right half, period 8 s) and `patrol-and-paddle` (deterministic patrol + sine paddle, non-integer-ratio periods).
- **PR [#96](https://github.com/corby-github/path-to-the-future/pull/96) (v2.0.24, merged):** hard-tier expansion, 7 composed templates closing the hard pool 4 → 11. All amped per the user's PR #95 "amp it up" feedback: `paddle-pair-phase`, `counter-patrols` (walls force player into corridor), `channel-paddle` (no-go-around channel), `tight-pickets` (5 fast narrow oscillators in right half), `triple-paddle` (3 phase-staggered paddles), `crossfire` (3 motions on 3 axes with non-aligned periods), `gauntlet` (3-wall snake maze + paddle in middle gap). Pure content authoring — no engine change.
- **`fix/intern-events-to-npc-dialog`** (commit `161a60a`, landed via PR #96 due to working-tree collision): moved 11 `evt-era-ai-shift-intern-*` events out of `events.json` and onto `npc-intern.dialogues` as tier-1 entries with `requires.month >= 44` preserving the era gate. Removed 11 stale `IconSparkle` icon registrations. Effects (mostly burnout +1) dropped per the tier-1 schema — matches the user's intent of "things the intern would say."
- **Research artifact:** [`docs/research/parallel-sessions-shared-working-tree.md`](../../research/parallel-sessions-shared-working-tree.md) — captured the working-tree collision pattern that occurred twice in this sprint. Sharpens [`concurrent-session-ceiling.md`](../../research/concurrent-session-ceiling.md) (attention ceiling) and [`parallel-sessions-for-meta-work.md`](../../research/parallel-sessions-for-meta-work.md) (file-disjoint rule) with a *third, mechanical* ceiling: shared working-tree state.
- **Design doc walked v2.0.18 → v2.0.24** across PRs #90, #93, #96, with the change-log brevity rule getting trimmed and reinforced after the v2.0.19 row exceeded the 2-sentence cap.
- **Memory entry hardened:** [`feedback_changelog_brevity.md`](../../../.claude/projects/-Users-corby-path-to-the-future/memory/feedback_changelog_brevity.md) (user-global memory) gained a hard length checkpoint + a bad-vs-good contrast example after the v2.0.19 verbose-row miss.

## 3. Key decisions

### Smooth two-phase knockback (200 ms slide + 800 ms stun) instead of the v1 imperative snap
- **Decision:** Replace `setPlayerPositionRef.current({...})` instant snap with a westward velocity driven into `usePlayerMovement` via a new `externalVelocityRef` option, held for `MOVING_OBSTACLE_SLIDE_MS=200`, then zeroed (still input-locked) until `MOVING_OBSTACLE_TOTAL_LOCK_MS=1000` total elapses.
- **Reasoning:** User playtest of v2.0.18: knockback distance felt right but the snap read as "jumpy/snappy." Velocity through `resolveMovement` keeps bounds + static-collision resolution intact during the slide, so chain-shoves clamp at the left wall naturally without extra logic.
- **Driver:** User playtest feedback ("smoother and there should be a setting for cooloff").
- **Alternatives considered:** Pre-computed slide animation (rejected — wouldn't compose with bounds clamp); separate rAF loop outside the hook (rejected — duplicated motion logic); single COOLOFF_MS constant covering both phases (rejected after second user feedback round — split into SLIDE_MS + TOTAL_LOCK_MS so slide speed and stun length tune independently).

### Per-obstacle dedupe (replace global cooldown semantics)
- **Decision:** Track `lastHitObstacleIndexRef`; same obstacle can't re-fire within `MOVING_OBSTACLE_COOLDOWN_MS=600`, but a *different* obstacle in the slide path can.
- **Reasoning:** User wanted cascading hits during the slide (per their description: "if knockback hits another MOVING_OBSTACLE, it would continue to go back until the safe zone"). Global cooldown would have suppressed the second hit; per-obstacle dedupe lets the cascade work while still preventing spam from a single sustained overlap.
- **Driver:** User design intent.
- **Alternatives considered:** Lower the global cooldown (rejected — would allow same-obstacle spam from a single contact); enter-only edge detection (rejected — would change the v2.0.18 contract more than necessary).

### Must-release input gate as a separate concept from knockback velocity
- **Decision:** When `externalVelocityRef` transitions from non-null to null (stun ends), `usePlayerMovement` snapshots currently-held direction keys as "blocked"; each blocked key clears independently when the player physically releases it.
- **Reasoning:** User playtest of single-knob model: holding "right" through the lock window then auto-resuming on unlock felt wrong — *"I would have to lift the key and wait at least 1 sec before right would start working again."* Per-key edge detection serves both the stun-end and any future-use of `externalVelocityRef` cleanly.
- **Driver:** User playtest feedback.
- **Alternatives considered:** Just zero velocity longer (rejected — unrelated direction keys would also be blocked); move logic into DecisionRoom (rejected — concerns belong at the input boundary).

### Damage floater emits "−4" matching HUD, not "−50" cosmetic punch
- **Decision:** In-canvas SVG `<text>` floater renders the actual `MOVING_OBSTACLE_HEALTH_HIT` value (currently 4), not a decoupled cosmetic number.
- **Reasoning:** User asked clarifying question via `AskUserQuestion`; chose "mirror HUD exactly" to keep the visual in sync if HEALTH_HIT changes during tuning.
- **Driver:** User explicit choice via picker.
- **Alternatives considered:** Cosmetic "−50" decoupled from stat impact (rejected — would drift from HUD); bumping HEALTH_HIT to −50 outright (rejected — over-strong on a 0–100 health scale).

### Paddle-as-knockback-obstacle (not hard blocker) for §4 hard tier
- **Decision:** The §4 *"pong-style timed gate"* paddle is implemented as another `MovingObstacle` (oscillating tall-thin rect in front of door) with the same knockback-on-collision behavior PR4 introduced — not as a physical blocker.
- **Reasoning:** §4 spec says "Same stat impact as medium, faster timing windows," which is the knockback semantics. The "gate" feel emerges from the paddle's vertical sweep covering the door's y-range at center and clearing it at extremes — mistiming reads as collision → slide + stun → retry. Reuses 100% of PR4's machinery; zero new engine plumbing.
- **Driver:** Design call by the assistant, flagged in PR #93 description for user override.
- **Alternatives considered:** Hard blocker (rejected for v1 — would require new collision plumbing for a feature whose stat impact spec already matches the knockback model).

### Path motion = linear interp with even time per segment
- **Decision:** When `MovingObstacle.path` is set, `currentRectFor` divides `period` evenly across N segments, lerps positions linearly between adjacent waypoints, loops `path[N-1]→path[0]`.
- **Reasoning:** Simplest correct model. Each segment gets `period/N` ms regardless of segment length, so visual speed varies by segment distance — fine for the bowtie + back-and-forth shapes shipped in PR #93. Constant px/sec along perimeter would require precomputing segment lengths; YAGNI.
- **Driver:** Assistant call, flagged in PR description.
- **Alternatives considered:** Constant px/sec (deferred); cubic interpolation / easing (over-spec for v1).

### NPC zoning threshold at x=480, not x=500
- **Decision:** When `complexity ∈ {hard, expert}`, `placeInteractables` constrains x ∈ [150, 480] (vs. the default [150, 850]).
- **Reasoning:** Centered NPC has half-width ~40 — placing at x=480 means right edge lands at ~520, still in left half visually but leaves ~330 px of x-range for placement variety. A clean x=500 cap would have collapsed the spawnable area too much.
- **Driver:** Assistant call, flagged in PR #93.
- **Alternatives considered:** x=500 strict half (rejected — too tight); per-template explicit zone rect (rejected — complexity-driven default is enough for v1).

### "Amp it up" for hard-tier expansion: walls-force-through, stacked motions, dense fast packing
- **Decision:** All 7 PR #96 hard templates use one of three intensification levers: (a) static walls forcing the player INTO the motion zone (no go-around — `channel-paddle`, `counter-patrols`, `gauntlet`), (b) 2+ stacked motions with non-aligned periods (`crossfire`, `paddle-pair-phase`, `triple-paddle`), or (c) dense fast oscillator packing (`tight-pickets`).
- **Reasoning:** User's playtest feedback to the *other* session on PR #95 medium templates: "open geometry alone reads too easy, walls forcing player INTO motion zones is the lever, multiple converging motions = hard." Even though that was directed at the other session, the principle generalized — applying it pre-emptively to PR #96 saved a tuning round.
- **Driver:** User feedback (cross-session).
- **Alternatives considered:** Author each hard template with a single motion (rejected — would have required playtest tuning round identical to PR #95's).

### Intern dialogue belongs on the NPC, not as random events
- **Decision:** Move 11 `evt-era-ai-shift-intern-*` events from `events.json` onto `npc-intern.dialogues` as tier-1 entries with `requires.month >= 44`. Drop the burnout effects (tier-1 schema doesn't carry them).
- **Reasoning:** User explicit feedback: *"these new dialogs ended up as events… ideally these were things the intern would say when you interacted with them."* Tier-1 NPC dialogue is the right schema for one-line flavor reactions.
- **Driver:** User direct feedback.
- **Alternatives considered:** Tier-2 dialogs preserving the burnout effects (rejected — over-engineering one-liners); leave as events but rename (rejected — addresses location, not the framing the user wanted).

## 4. Tensions resolved

- **Damage floater number ambiguity ("−50").** User said the floater should show "−50" but the actual stat value is −4. Used `AskUserQuestion` to surface the three possible interpretations (mirror HUD / cosmetic decoupled / bump the stat itself) instead of guessing. User picked mirror-HUD. Cleared a potential drift between HUD and floater that would have been a follow-up bug.
- **Single-knob cooloff felt wrong on second playtest.** Initial implementation used one `MOVING_OBSTACLE_COOLOFF_MS=350` for both slide duration AND input lock. User feedback after playtest: slide should be faster *and* the input lock should be longer. Split into `SLIDE_MS=200` + `TOTAL_LOCK_MS=1000` so the two concerns tune independently. Also added the must-release-key gate as a third orthogonal concern at the input boundary, not the velocity layer.
- **Change-log brevity violation on v2.0.19.** First version of the v2.0.19 row was ~3 paragraphs of implementation detail — direct violation of `feedback_changelog_brevity.md`. User called it out: *"you are stiil being way too verbos in the change log - summarize briefly what we do -the changes are in the doc and the diff, so that will tell the whole story - no need tell it twice."* Trimmed to one verb-phrase + a `See §4` pointer. Hardened the memory with a hard length checkpoint and a bad-vs-good contrast example so the rule has a concrete checkpoint before saving next time.
- **Working-tree collision #1 (knockback edits vs. PR #95 medium tuning).** When this session needed `git checkout main` to start the hard-tier branch, the other session had uncommitted edits to `layouts.ts` (tuning `gate-paddle`). Stashed with a clearly-named message, switched, did the hard-tier work. Filed [`docs/research/parallel-sessions-shared-working-tree.md`](../../research/parallel-sessions-shared-working-tree.md) to capture the pattern.
- **Working-tree collision #2 (intern fix routing).** While creating `fix/intern-events-to-npc-dialog`, the working tree somehow reverted to `feat/hard-tier-expansion` between checkout and commit (other session had been pushing iteration commits). Result: the intern fix commit `161a60a` landed on PR #96's branch instead of its own. Stopped, surfaced the contamination to the user with three cleanup options (cherry-pick + force-push, leave + retitle, cherry-pick + double-merge). User merged PR #96 as-is, accepting the bundle.
- **Sprint-internal sequencing pivot — easy expansion deferred.** After PR #96 merged, the natural next batch was easy expansion (largest remaining gap in issue #94). The intern fix took priority instead because it was a content correctness issue surfaced by user direct feedback. Easy expansion left for the next sprint.

## 5. Time analysis

### Sprint duration (with product / process split)
Per `docs/logs/time-log.md` (the `/punch` skill is the authoritative source per `feedback_session_log_time_estimates.md`):

- **Sprint duration (total):** **2h 27m 40s** — wall clock 23:24:01 UTC → 01:51:41 UTC.
- **Product wall time:** **~1h 57m** — sprint total minus the user-supplied playtest review block.
- **Process tooling / review wall time:** **~30m** — last hour of the sprint was ~50/50 product-edits / playtesting per the punch-end note (interleaved playtest of PR #96 templates with concurrent product edits across both sessions).

No `boundary-open` / `boundary-close` rows were recorded for this sprint — the playtest interleaved too tightly with product edits to bracket cleanly. The user-supplied split in the punch-end note is the source of truth for the rollup. First ~1h 27m of the sprint was 100% product (PR #90 follow-up commits, PR #93 implementation, PR #96 first draft); the trailing ~1h ran ~30m product + ~30m playtest review.

### Traditional-team equivalent
**Assumed team:** 1 senior software engineer + 1 game designer + 1 product owner doing playtest review.
**Assumed working pattern:** async with periodic syncs; PRs reviewed by at least one other developer; design decisions documented before implementation.
**Estimated duration:** **2.5 – 4 working days** for the product output of this sprint.

**What this estimate INCLUDES:**
- Engine work: smooth two-phase slide refactor of `usePlayerMovement` (external velocity override + must-release input gate); `MovingObstacle.path` deterministic motion mode; `placeInteractables` tier-aware zoning.
- Visual systems: damage floater + stun-stars SVG components + matching CSS keyframes.
- Content authoring: 9 new templates (2 expert + 7 hard) + intern dialogue migration (11 entries).
- Bug-fix routing: intern events → NPC dialog refactor across 3 files.
- Design doc updates: walked v2.0.18 → v2.0.24 across §4 with table widening, pool-size refresh, cleanup of stale prose.
- 1 research artifact (synthesis of the working-tree collision pattern).

**What this estimate EXCLUDES (and would still need to be done):**
- Stakeholder reviews (the user *is* the stakeholder here).
- User testing beyond the single playtester (the user).
- Visual polish iteration on the damage floater / stun stars (shipped first-cut acceptable; team would likely round-trip with a designer).
- Performance profiling (single playthroughs felt fine; team would likely instrument).
- Cross-browser testing (only Chromium tested in the playtest loop).
- Accessibility review of the new collision visuals.
- The two parallel-session collision events themselves — a team wouldn't have caused these (single working tree per dev), so the cleanup tax is unique to the AI-multi-session workflow.

### Honest framing
Sprint product work was ~1h 57m. A small product team with the same scope would have spent **roughly 2.5 – 4 working days**, depending on review-cycle latency and how many design rounds the damage-floater + stun-stars combination would have triggered. That's roughly a **10–15× compression on product wall time** for this sprint, in the same band the project has been running. The honest caveats: this sprint was iterating on a known engine surface (PR4's collision pipeline), not greenfield architecture — the leverage is content + composition + small engine extensions, not large new subsystems. And the multi-session workflow returned ~10–15 minutes of the saved time as cleanup tax (two working-tree collisions), which is real friction the single-developer-team baseline wouldn't have incurred.

## 6. What's next

- **Easy-tier expansion** — largest remaining gap from issue [#94](https://github.com/corby-github/path-to-the-future/issues/94) gap table (+8 templates). Authoring style is light (maze-geometry variants, no motion); should pair well with another session running concurrently since easy templates touch a different region of `layouts.ts` than medium/hard.
- **Tuning iteration** — multiple hard templates (especially `crossfire`, `triple-paddle`, `gauntlet`) are first-cut; user playtest may surface "amp up further" or "back off" calls on individual templates. The other session already iterated on PR #95 medium tier this evening — same pattern likely on PR #96 hard.
- **Stale local branch cleanup post-`feat/swe-icon-revisions`** — that branch shows as unmerged but is likely squash-merged already; user can decide whether to force-delete or leave.
- **The two locked agent worktrees under `.claude/worktrees/`** — old Claude agent sessions never reaped; cleanup is a separate small task (`git worktree unlock` + `git worktree remove`).
- **Doc-sync hygiene** — design doc is at v2.0.25 (the other session's PR #97 bumped it past my v2.0.24); next batch should land its row contiguous with whatever ships next.

## 7. Observations for publication

**The "amp it up" lesson generalized cleanly across sessions.** User playtest feedback to the *other* concurrent session on PR #95 medium templates ("walls forcing player INTO motion zones is the lever, multiple converging motions = hard, open geometry alone reads too easy") was load-bearing for this session's hard-tier authoring even though it was directed elsewhere. Cross-session feedback transfer worked because both sessions could see the user's framing in the conversation history, even when they couldn't see each other's code. Saved an entire round-trip of "ship → user-says-too-easy → re-author."

**Working-tree collisions were the unexpected tax.** Two sessions sharing one local checkout collided twice this sprint at git's working-tree boundary — once on the layouts.ts file when both sessions were authoring templates, once on the intern-fix routing when checkout state silently shifted between sessions. Each collision cost a few minutes of cleanup but more importantly produced *uncertainty* about whose work was whose at the moment of recovery. Filed a research artifact ([`parallel-sessions-shared-working-tree.md`](../../research/parallel-sessions-shared-working-tree.md)) naming this as a *third, mechanical* ceiling on parallelism distinct from the attention ceiling already documented. The mitigation that would have prevented both: `git worktree` per session (or commit-before-context-switch discipline). The sprint's net velocity was still net-positive from parallelism, but with measurable friction that wouldn't have occurred in single-session work.

**The change-log brevity rule was self-reinforcing.** User caught the v2.0.19 row being ~3 paragraphs (vs. the 2-sentence cap from `feedback_changelog_brevity.md`) within minutes of the doc-sync push. Trimmed in place + added a hard length checkpoint to the memory with a bad-vs-good contrast pulled from this exact violation. The memory entry is now more concrete than it was before the violation — the rule learned from being broken. Worth noting: this is the fourth memory I've sharpened this week through *being corrected* rather than getting it right first try. The pattern feels durable.

**Concrete-decision-flagging in PR descriptions paid off.** PR #93 listed three explicit design calls ("paddle-as-knockback-obstacle, not hard blocker"; "linear interp path motion"; "NPC zoning at x=480, not x=500") with override invitations. None were overridden, but the framing meant the merge happened with full visibility into what was decided unilaterally vs. what was driven by spec or user input. The same pattern in PR #96 ("amp it up via walls / stacked motions / dense packing") let the user merge confidently without re-litigating each template. Concrete-flagging beats generic disclaimers — naming the alternative kept the door open without slowing the close.

---

*Generated by the session-process-log skill. Concurrent sister-session log (medium-content thread) to be filed separately under the same `day 6/` folder.*
