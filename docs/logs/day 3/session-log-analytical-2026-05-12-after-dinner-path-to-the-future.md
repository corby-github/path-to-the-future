# Sprint Log: Path to the Future — 2026-05-12, after-dinner sprint

**Date:** 2026-05-12 (UTC end crosses to 2026-05-13)
**Sprint:** after-dinner, 4th sprint of Day 3
**Sprint window:** 2026-05-12T23:35:26Z – 2026-05-13T01:16:48Z (1h 41m wall-clock, per `docs/logs/time-log.md`)
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Feature implementation — 5 merged PRs adding the arcade subsystem, three new minigames, and a polish pass
**Wider context:** Sprint 4 of Day 3 of an ongoing build; earlier sprints today covered the init-flow canvas frame (Day 3 morning), the init-flow button theme (mid-morning), and PRs #42–#48 around transitions, endgame recap, finale month, and title screen (after-lunch). The night sprint picked up the queued enhancement issues that had been deferred from the after-lunch work.

---

## 1. Starting point

User opened the sprint on branch `fix/init-flow-button-theme` (PR #49) with an open `/punch start day-3 after-dinner` at 23:35:26Z. The handoff document `docs/handoffs/handoff-2026-05-12-3.md` listed three open enhancement issues (#31 arcade, #32 Pong, #41 the "42" Hitchhiker's Guide callback) as discretionary follow-ups, with **Day 15 (analytics + GH Pages deploy)** flagged as the critical-path ship gate. The handoff also noted two untracked session-log files from the after-lunch sprint that needed committing, and asked an open question: Day 15 vs. v2.0 architecture, which first?

The user merged PR #49 manually, committed the session logs, and told the assistant "lets do issue #31 next" — explicitly choosing the discretionary path over the critical-path one. The implicit framing was *the system architecture is rich enough that adding feature content is now the satisfying work, and Day 15 deserves a fresh window*.

## 2. Deliverables produced

- **PR #50** — Arcade interactable subsystem (closes #31). Universal `feature: 'arcade'` flag on `InteractableDef`, new `ArcadeModal` with menu + playing states, hourly real-time XP throttle in `progress.lastArcadeXpAt`, `MinigameByVariant` shared component extracted from `MinigameRoom`, joystick-and-buttons cabinet sprite in `InteractableSprite.tsx`, new universal interactables layer at `public/universal/interactables.json`, STATE_VERSION 1.3.0 → 1.4.0. Design doc gained new §10.1 *Arcade access* + §23 *Feature-flagged interactables* + §23 *Universal interactables layer* subsections + v1.4 change-log row.
- **PR #51** — Pong minigame (closes #32). New `src/game/minigames/Pong.tsx` modeled on Stacker's rAF + state pattern, AI tracking with capped speed and anti-jitter deadzone, off-centre paddle hits add spin, ball speed creeps × 1.04 per hit, first to 5. Scheduled at month 75 (Mar 2026, ai-shift era) in SWE pack, plus arcade entry. `MinigameVariant` widens to include `'pong'`, STATE_VERSION → 1.5.0. Two follow-up commits during review: rAF chain dying after goals (early `return` skipped the `requestAnimationFrame` scheduling), Esc-to-forfeit added since playing phase had no exit key. Also a separate `fix(dev)` commit restoring `forceArcade: boolean` to the `DevControls` interface — PR #50's cleanup trimmed it but left consumers that still referenced the field, breaking typecheck on main.
- **PR #52** — "The Ultimate Question" minigame (closes #41). Pure multiple-choice with Fisher-Yates option shuffle, binary win/fail outcome (no partial), Esc forfeits, arcade-only. Smallest minigame in the codebase. STATE_VERSION → 1.6.0.
- **PR #53** — Title-screen arcade decor. Fixed-position arcade cabinet sprite at the right edge of the floor band on `TitleScreen.tsx`, rendered after the wandering NPCs so it sits on top in crossover. Decoration only, no interaction.
- **PR #54** — Player-facing rename: "42" → "The Ultimate Question" in the arcade menu and replay card. Internal variant id `'forty-two'` retained (no schema churn). Hides the punchline from the menu row so the reveal lands during play. Design doc v1.6.1 change-log row.
- **In-flight mid-sprint fix** — ArcadeModal "Esc to walk away from the cabinet" hint switched from `palette.surface` to `palette.background` after the user spotted it was invisible against the dimmed backdrop.

## 3. Key decisions

### Arcade modal as a two-state overlay, not a temporary "room"
- **Decision:** `ArcadeModal` is a single component with `phase: 'menu' | 'playing'`. `'playing'` mounts `MinigameByVariant` inline; on completion it returns to `'menu'` so plays chain. Esc walks away from the whole cabinet at any time.
- **Reasoning:** Mounting the minigame as a fake `MinigameRoom` config would require routing surgery + room-transition choreography for a transient experience that's not a "month room." Modal-with-states keeps DecisionRoom as the source of truth for the player's position in the world.
- **Driver:** Assistant proposed; user accepted without pushback.
- **Alternatives considered:** Temporary `roomType: 'minigame'` route (rejected — too much plumbing for a non-month beat); inline minigame replacing modal content with no menu return (rejected — loses the chain-play feel).

### Universal interactables layer (`public/universal/interactables.json`)
- **Decision:** Added a parallel content path next to `public/careers/{packId}/` for entries every pack inherits. Loader fetches both files optionally in parallel and merges into `pack.interactables`; pack-specific id wins on collision.
- **Reasoning:** The arcade was framed as universal in the issue. Putting it inside `software-engineering/interactables.json` would have either (a) duplicated it across every future pack or (b) required pack-aware loading logic. A shared layer is the actual concept.
- **Driver:** User. The assistant initially proposed putting it in the SWE pack; the user said *"no it should be universal — so lets put it where it belongs."*
- **Alternatives considered:** Per-pack copies (rejected — duplication); a top-level `public/interactables-universal.json` flat file (assistant proposed, the directory-named version was cleaner for future expansion).

### Closed `MinigameVariant` union for v1
- **Decision:** Keep `MinigameVariant` as a closed string-literal union. Add `'pong'` and `'forty-two'` as the new variants land. Don't introduce a registry pattern.
- **Reasoning:** The closed union forces every variant to surface in 4 specific call-sites (`MinigameByVariant` switch, `MinigameRoom` switch, `progressSlice.lastArcadeXpAt` initial record, `MinigameReplayCard.VARIANT_LABELS`). For 5 variants in one pack, this is a feature, not a tax — the compiler tells you exactly what you forgot. The registry pattern is correctly scoped to the v2 multi-pack work (§26) where variant lists become pack-specific.
- **Driver:** Mutual. Assistant proposed; user agreed.
- **Alternatives considered:** Registry pattern with per-pack variant maps (rejected as premature; deferred to v2).

### Arcade plays don't record to `history.minigames`
- **Decision:** Minigames take `mode: 'scheduled' | 'arcade'` + `awardRewards`. `recordMinigame` only fires when `mode === 'scheduled'`. Rewards dispatch only when `awardRewards === true`.
- **Reasoning:** The replay timeline (§11.1, issue #33) is the player's retrospective record of *what happened in the scheduled moments*. Arcade plays are recreational; flooding the replay with arcade results would obscure the load-bearing decisions. Keeping the recording boundary at "scheduled-only" preserves the timeline's narrative weight.
- **Driver:** Assistant proposed in the planning phase; user blessed.
- **Alternatives considered:** Record everything, filter at replay-render time (rejected — same data hygiene problem, just deferred); record arcade plays under a synthetic monthId (rejected — implementation complexity for no payoff).

### Real-time throttle, all rewards gated
- **Decision:** `ARCADE_THROTTLE_MS = 60 * 60 * 1000` (one real-time hour). Per-variant. When eligible: XP + stat effects + (where applicable) savings deltas all fire. When throttled: the minigame runs end-to-end for fun but dispatches nothing. Eligibility is computed at modal mount; the throttle clock is stamped only on rewarded plays.
- **Reasoning:** Real-time is grind-proof — the player can't fast-forward by clicking through months. Gating all rewards (not just XP) prevents grinding savings via Blackjack or technicalSkill via Code Review.
- **Driver:** Issue spec; assistant proposed both calls per the issue's flagged "Open calls," user blessed.
- **Alternatives considered:** In-game time (rejected — grindable); XP-only gating with stat effects flowing (rejected — opens the savings/skill grind door).

### "The Ultimate Question" rename hides the punchline
- **Decision:** Player-facing label "42" → "The Ultimate Question" in the arcade menu row and replay card. Internal variant id stays `'forty-two'`; the answer option inside the game stays `'42'`.
- **Reasoning:** Showing "42" in the menu row pre-spoils the answer. Renaming the entry point to "The Ultimate Question" lets the reveal land during play. The internal id has no payoff to rename and would churn the schema (`lastArcadeXpAt` key, replay records).
- **Driver:** User noticed and requested.
- **Alternatives considered:** Rename the variant id too (rejected — schema churn for cosmetic gain).

### Pong AI: capped speed + deadzone, no reaction-lag buffer
- **Decision:** AI paddle tracks the ball's current centre with `AI_MAX_SPEED = 360 v.u./sec` and `AI_DEADZONE = 6 px` to prevent jitter. No buffered "AI sees the ball 100ms ago" implementation.
- **Reasoning:** The 1000×600 court is small enough that the ball crosses in <2 seconds at top speed. A real reaction-lag implementation read sluggish (the AI would consistently miss because the ball was already past the buffered position). The speed cap and deadzone deliver the "beatable on a good day, frustrating on a bad one" feel from the issue's acceptance without the extra plumbing.
- **Driver:** Assistant proposed, validated against the issue's "Tunable constants for `AI_REACTION_MS` and `AI_SPEED`" — the spec was flexible.
- **Alternatives considered:** Position-buffer with reaction-lag (rejected — felt wrong in practice).

## 4. Tensions resolved

- **DevPanel UX redesign mid-PR-50.** Assistant initially shipped the `spawn arcade` affordance as a dedicated checkbox in `DevPanel.tsx`. User refactored it to a one-shot option in the existing `trigger` dropdown to keep the dev row from bloating, and partially trimmed the `DevControls` interface in the process. The cleanup left `DecisionRoom` reading a field that wasn't in the type — typecheck would have broken on main. Caught when starting the Pong PR; landed a separate `fix(dev)` commit restoring the interface field. Lesson: user's cleanup-as-they-merge style means small follow-up fixes are part of the pattern, not an anomaly.

- **Goal handling was broken in Pong's first ship.** User playtested, saw the ball reset to centre then freeze: *"computer gets 1 point, the ball resets to the center, and then nothing — it should pause briefly and keep going until someone gets 5."* The rAF early `return` after `handleGoal` skipped scheduling the next frame. One-line fix per branch, both goal paths. Caught during play, not during build — the type system can't help with control-flow bugs in animation loops.

- **No way to bail out of Pong.** Same playtest reveal: *"also — need a way to exit like space or enter -or esc."* Added Esc-to-forfeit during the playing phase (routes through `handleContinue`, classifies as fail under the score-based outcome rule). Surfaced the hint in the in-game help text: `↑↓ or W / S to move · Esc to forfeit`.

- **Invisible arcade-exit hint.** User noticed the "Esc to walk away from the cabinet" hint on the arcade modal was hard to read: *"hard to see and not visible."* Root cause: hint used `palette.surface` (a mid-tone meant for cards/obstacles) but rendered against the modal's dimmed `rgba(20,20,20,0.55)` backdrop, not against a palette.background panel. Switched to `palette.background` (the brightest token), bumped weight to 600, dropped the 0.85 opacity. Real fix not a paper one — explains *why* the color was wrong, not just *that* it was.

- **"42" pre-spoiled the joke.** User caught this only after both PR #52 and the arcade decor PR #53 had merged: *"the game should not be called 42 — it should be called 'The Ultimate Question'."* Triggered the rename PR #54. The point the user landed on, in design-doc language: the title should telegraph the *question*, not the *answer*, so the punchline lives in play. The fact that the user noticed this after-the-fact is itself useful — it surfaces the importance of player-eyes review for content tone, distinct from playtest review for mechanics.

## 5. Time analysis

### Sprint duration
**1 hour 41 minutes** wall-clock, measured from `/punch start day-3 after-dinner` at 2026-05-12T23:35:26Z to `/punch end` at 2026-05-13T01:16:48Z (per `docs/logs/time-log.md`). The punch skill writes UTC ISO timestamps; this is measured, not estimated.

### Traditional-team equivalent
**Assumed team:** 1 senior engineer (full-stack TS/React, comfortable with Redux + SVG) and ad-hoc product input from a PM or solo author for content/copy decisions.
**Assumed working pattern:** Async work with occasional sync for design questions; no design review meetings, no formal stakeholder gates, no separate QA. Mirrors a one-person indie game project.
**Estimated duration:** **4–6 working days** (32–48 hours of focused engineering).

**What this estimate INCLUDES:**
- Arcade subsystem architecture (interactable feature flag, universal content layer, modal with two states, throttle state + persistence migration, sprite design)
- Pong from scratch (physics, AI tuning, win/partial/fail mapping, voice copy, two bugfix iterations)
- "The Ultimate Question" minigame (multiple-choice + flavor pools, shuffle, scheduled-vs-arcade mode)
- Title-screen arcade decor
- "42" → "The Ultimate Question" rename pass
- Design doc updates across §6, §10, §10.1, §23, change log (4 entries)
- npm run verify (typecheck + lint + build) after every change

**What this estimate EXCLUDES (and would still need to be done):**
- Real playtesting beyond the user's own 5-minute pass (multiple players, balance tuning data)
- Visual design polish on the arcade-game sprite (the joystick-and-buttons design is functional, not finalist)
- Stakeholder review or content review beyond the user's own eyes
- Marketing/store copy describing the new minigames
- Any kind of CI/CD or release-channel work (PRs auto-merge to main with no review gate other than the user)
- Tutorial coachmark updates for the new interactable (the existing 3-step tutorial doesn't mention the arcade)

### Honest framing
This sprint compressed roughly **20–30× against the team estimate** (101 minutes vs. 32–48 hours), but the multiplier is heavily lifted by three structural factors that won't replicate on every sprint: (1) the codebase already had a strong type-driven minigame pattern from prior sprints, so each new variant slotted into 4 known call sites with the compiler telling you what was missing; (2) the user had pre-resolved most of the open design calls in the issue text, so planning was minimal; (3) all five PRs land on a project where merge-to-main is the user's own decision with no review-cycle friction. Take any one of those away and the sprint runs longer or the team comparison shrinks. The honest takeaway is that **good architecture compounds** — the arcade pattern set up Pong and 42 to be additive content rather than new architecture, and that's where most of the savings live.

## 6. What's next

- **Day 15 ship gate.** Analytics (GoatCounter per §24) + GitHub Pages deploy (§17). Specced, just needs implementation. This is the v1 ship.
- **v2.0 architecture decision** is still open from the handoff: multi-pack engine + Student pack. Day 15 ships v1; v2.0 changes get more expensive after deploy. Resolving the order is a separate sprint.
- **Tutorial coachmark coverage** for the arcade cabinet — the current 3-step coachmark doesn't mention it. Not blocking, but a polish item if v1 is going to land soon.
- **Playtest balance** on Pong's AI difficulty and the arcade throttle window. 1-hour real-time throttle is a guess; could land at 30 minutes or 2 hours after seeing play data.

## 7. Observations for publication

**The minigame pattern paid off five variants in.** When the codebase had one or two minigames each held together its own way, adding Stacker had felt expensive. Once `MinigameByVariant` was extracted in PR #50 and the closed union forced every variant to declare itself in four specific places, adding Pong, then The Ultimate Question, then renaming The Ultimate Question, became routine. The closed union is the unsung hero of this sprint — it's the thing that meant *"add a variant"* compiled into a TODO list instead of an architecture sketch.

**Playtest beats type-check for control-flow bugs.** The Pong rAF-died-after-goal bug was invisible to typecheck, lint, and build. The user played a round, watched the ball freeze, and reported it in plain English. The fix was one line per branch. The lesson isn't *write better tests* — the lesson is that **the user's own 5-minute play is doing real QA work**, and the loop of *ship → user plays → user reports → fix → ship again* is fast enough that it's effectively part of the build flow.

**The "42" rename was an act of editing, not engineering.** PR #54 touched three player-facing strings and a couple of design-doc lines. It cost no engineering complexity. But it was the kind of decision that only surfaces after the player has lived with the artifact for a few minutes — the menu row label was sitting in plain view through PR #52's reviews and the night sprint had been going for 90 minutes before it clicked that the punchline was being broadcast in the menu. The takeaway: **player-eyes review is a different pass from playtest review**, and both belong in the loop.

**Aggressive PRs work when the trees are clean.** Five PRs in 1h 41m only works because each one is genuinely scoped to one thing, verify is green before commit, and the user is the only reviewer. None of those generalize automatically to a multi-person team, but they're worth naming as preconditions for this kind of compression. The same architecture, the same Claude, on a project with a 24-hour PR review SLA wouldn't see this multiplier.

---

*Generated by the session-process-log skill.*
