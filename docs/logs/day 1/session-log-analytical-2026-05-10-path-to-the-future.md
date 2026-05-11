# Session Log: Path to the Future

**Date:** 2026-05-10
**Session duration:** ~3.5 hours (estimate — see §5)
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Working code + merged PRs + design alignment

---

## 1. Starting point

The project began with an approved design document (`docs/path-to-the-future-design-doc-v1.md`, v1.0, dated 2026-05-10) for a narrative life-simulation game: 120 months of a software-engineering career from 2020-2030, walked one room at a time, decisions compounding into a unique life trajectory. The doc was thorough — 20 sections covering premise, architecture, room types, state model, stats, decision and event schemas, build order, project structure, and out-of-scope.

Day 1 of a 13-day build plan was already complete: the player movement engine. A blue circle moved around in a 640×400 SVG room driven by Arrow keys + WASD, with a Vite + TS + React 19 + Redux Toolkit project scaffold installed but Redux not yet wired up. A dev server was already running at `http://localhost:5173/`.

The user's framing for the session: *"we have alot of work to do so we need to check and recheck before we get sidetracked."* That stance shaped the whole session.

## 2. Deliverables produced

**Seven merged PRs**, in order:
- [#1](https://github.com/corby-github/path-to-the-future/pull/1) — Day 1 design-doc alignment (corrected 640×400 → 1000×600 virtual coordinate system per §11; moved global stylesheet to project-structure path per §19)
- [#2](https://github.com/corby-github/path-to-the-future/pull/2) — Day 2: Redux Toolkit scaffold (5 slices, typed hooks, Provider wrap, calendar utility) + store-aware Room shell
- [#3](https://github.com/corby-github/path-to-the-future/pull/3) — Day 3: collision system (pure axis-sliding circle-vs-rect resolver) + virtual coordinate module
- [#4](https://github.com/corby-github/path-to-the-future/pull/4) — Mid-stream fix: two `react-hooks/refs` rule violations in Day-1 code, plus `npm run verify` script as the new pre-commit gate
- [#5](https://github.com/corby-github/path-to-the-future/pull/5) — Day 4: four room types (Decision/Narrative/Minigame/Consequence) + RoomRenderer + transition hook *(merged into wrong branch — see §4)*
- [#6](https://github.com/corby-github/path-to-the-future/pull/6) — Re-PR of Day 4 targeting `main` after the stacked-PR mishap
- [#7](https://github.com/corby-github/path-to-the-future/pull/7) — Day 5: career-pack loader, era-resolved palette context, content-driven room routing, 120-month JSON + 2 placeholder decisions + 1 placeholder event

**One memory file** saved to persistent project memory: `feedback_no_stacked_prs.md` — recording the lesson that PR base must always be `main` on this project.

**Total code shipped:** ~35 new or substantially modified source files plus 4 JSON content files. Day 5 alone was +630 / −68 across 19 files.

**Working game state at end of session:** Player walks through 120 procedurally-routed months (10 of them narrative panels, the rest decision rooms with a door to walk through). The career-pack JSON drives palette and routing. Era mood (5 distinct moods across the decade) tints the palette at the provider level. Days 1-5 of the build plan are complete in `main`.

## 3. Key decisions

### Pure collision function, not a `useCollision` hook
- **Decision:** Implement collision as a pure `resolveMovement(current, desired, radius, obstacles, bounds)` function rather than the `useCollision.ts` hook the design doc sketched in §19.
- **Reasoning:** Collision is stateless math; a hook adds React lifecycle overhead for zero benefit. A pure function is easier to test, easier to call, and equally swappable.
- **Driver:** Claude proposed; user approved.
- **Alternatives considered:** Hook variant (matches doc), hook wrapping the pure function (composable but unnecessary for v1).

### Add files not in §19 — `calendar.ts` and `coordinates.ts`
- **Decision:** Place game-wide utilities (`src/game/calendar.ts` for month-id → label, `src/game/coordinates.ts` for the virtual-coordinate constants and player radius) at the top of `src/game/`, not in `engine/` or `types/`.
- **Reasoning:** These are neither engine logic nor pure types — they're game-wide conventions. The design doc's §19 structure is aspirational, not contractual.
- **Driver:** Claude proposed; user accepted during mid-stream audit.

### Flat palette tokens with era saturation/value adjustments, not per-era palette tokens
- **Decision:** `manifest.json` has one flat palette (7 tokens: background, ink, inkMuted, surface, accent, player, playerInk) and a separate `eras` map providing HSL adjustments. The current month's mood is applied to all palette tokens at the provider level.
- **Reasoning:** §15 calls for "per-era palette tokens" but a literal reading would require redefining the entire palette per year. A single base palette plus HSL adjustment is more compact, more authorable, and achieves the same goal of era-driven mood.
- **Driver:** Claude proposed two options; user picked flat + adjustments.

### Flat JSON files, not subdirectories
- **Decision:** `decisions.json` and `events.json` are single files with a `pool: "universal" | "swe"` field, instead of `decisions/universal/*.json` + `decisions/swe/*.json` as §3 sketches.
- **Reasoning:** Browsers can't list directories, so the alternative (subdirectories) would require a file manifest inside `manifest.json` or `import.meta.glob` (which only works for `src/`, not `public/`). Single files are simpler, the `pool` field is unambiguous, and the schema can iterate without filesystem restructuring.
- **Driver:** Claude proposed; user agreed.

### Career-pack content in React context, not Redux
- **Decision:** The loaded career pack (manifest, months, decisions, events) lives in a `CareerPackProvider` context, not a Redux slice.
- **Reasoning:** §6's rule — *"If it changes 60 times a second, it's not in Redux. If it's something the save file needs, it is in Redux."* Career-pack content is static-ish and doesn't belong in the save file (only `profile.careerPack` ID does). Context is the correct home.
- **Driver:** Mutual — the §6 rule made it obvious once stated.

### `key={monthId}` on every inner room in RoomRenderer
- **Decision:** Force React to unmount/remount the inner room on every month transition rather than letting it reuse the component instance across same-type transitions.
- **Reasoning:** The DecisionRoom's `triggered` ref leaked across consecutive decision rooms — exposed when Day 5's content-driven routing produced long decision→decision chains. Fix is one line; semantic is correct (each month is a distinct room).
- **Driver:** User caught the bug in browser testing ("I'm stuck in March 2020"); Claude diagnosed and fixed.

### `npm run verify` as the pre-commit gate
- **Decision:** Add an npm script combining `typecheck + lint + build` and run it before every commit.
- **Reasoning:** A mid-session audit found that `npm run lint` had never been run on the project. Two real React 19 hooks violations (Day-1 era code) had silently shipped. From Day 4 onward, `verify` is the gate.
- **Driver:** Claude proposed during audit; user agreed.

## 4. Tensions resolved

**Mid-stream design-doc audit (after Day 3).** The user asked for a careful audit before starting Day 4: *"i want to make sure we are still on track... worth taking the time to do this."* The audit cross-referenced every file against §6, §7, §11, §17, §19. Findings: code aligned with the doc on every substantive point, three intentional deviations (calendar.ts, coordinates.ts, collision.ts vs useCollision.ts) all justified. **What it also found, unprompted:** running `npm run lint` for the first time surfaced two real `react-hooks/refs` rule violations in Day-1 code. These had silently shipped because the project's verification was typecheck + build only. The fix landed as PR #4 before Day 4 proceeded.

**Stacked-PR mishap.** PR #5 (Day 4) was opened with `base: fix/lint-and-verify-cadence` (the cleanup branch) to give the reviewer a clean Day-4-only diff. When the user clicked Merge, GitHub merged it into that feature branch — not into `main`. The user pointed out the branch state and asked to verify before continuing. Investigation showed Day 4 was orphaned in a feature branch that had itself been merged. Recovery: re-PR (#6) against `main`. A feedback memory was saved so the pattern doesn't repeat. Cost: one extra PR, one extra merge click.

**Pushback on premature theming.** When the user asked about the SVG/theming architecture mid-session, the natural instinct would have been to start tokenizing colors immediately. The decision was to *defer* tokenization until Day 5's career-pack loader landed — at which point there'd be a real `manifest.json` contract to model against. Avoided ~30 minutes of work that would have been rewritten.

**Latent reconciliation bug.** After Day 5 was implemented and verified passing, browser testing exposed a player getting stuck after the second decision-room transition. The cause was React's component reconciliation reusing the DecisionRoom instance across same-type month transitions, leaking the `triggered` ref. Day 4 had silently shipped this because its demo wiring alternated room types (narrative → decision → minigame → consequence → decision), never producing the decision → decision sequence that exposes the bug. Day 5's content-driven routing finally exercised it. Fix took one line.

**Design check-in before Day 5.** Rather than coding directly, the user asked for proposed schemas first: *"we can pause here and iterate — i dont need to produce more code if we just have to roll back later — so this is fine."* Claude drafted the manifest, months, decisions, and events schemas; the user answered five specific questions; then code was written against settled decisions. Net effect: zero rework on Day 5.

## 5. Time analysis

### Session duration
**Estimate: ~3.5 hours of continuous, focused work.**

No precise timestamps were available for individual messages. Estimate derived from: 5 full build-days completed end-to-end (each ~30-45 min of code + verify + browser test + PR), plus ~30 min of mid-stream design-doc audit, plus ~20 min of design discussion before Day 5, plus ~15 min of recovery from the stacked-PR mishap, plus ~10 min of bug diagnosis on the Day 5 reconciliation issue.

### Traditional-team equivalent
**Assumed team:** 1 tech lead (architecture + reviews), 1 senior engineer (implementation), with normal async cadence and 1-2 sync touchpoints per day.
**Assumed working pattern:** Code + PR review + iterating on review comments. No pair programming. Standard backlog grooming.
**Estimated duration:** **4-7 working days.**

**What this estimate INCLUDES:**
- Writing all the same code (the engine, the slices, the loader, the room types, the JSON content)
- Code review cycles (5-7 PRs × ~1-2 days each in a typical org with review queues)
- The mid-stream audit that caught the React 19 bugs
- The design discussion that produced the manifest schema before coding
- Recovery from the stacked-PR mishap (likely ~30 min of git ops with a senior eng familiar with stacked PRs)
- Diagnosing and fixing the latent reconciliation bug (might take a typical team 1-2 hours of head-scratching since the symptom is non-obvious)

**What this estimate EXCLUDES (and would still need to happen in a real product):**
- Stakeholder alignment / kickoff meetings
- User research or playtesting
- Visual design (the muted aesthetic is currently developer-default; Day 13 polish in the build plan)
- Real content writing (decisions, events, narrative bodies — the JSON files currently contain placeholder stubs; Day 10 in the build plan)
- QA testing on browsers/devices beyond local Chrome
- Performance profiling beyond Vite's reported gzip sizes
- Accessibility audit
- Authentication / persistence beyond localStorage (out of v1 scope)

### Honest framing
Compression: roughly **10-15× faster** end-to-end for this scope, accounting for what was actually done. The headline number isn't only "speed"; it's "speed with quality maintained" — strict TypeScript, ESLint-clean, six PRs that any reviewer could productively review, real bugs caught and fixed mid-stream, design-doc adherence verified at multiple points. A solo senior engineer moving fast and skipping process could also do this in less than a week, but they wouldn't have the design audit, the lint-rule discipline, or the explicit deviation-tracking against the design doc.

## 6. What's next

- **Day 6** — Decision modal + schema interpretation + effect application + auto-save. The user flagged this for a design check-in similar to Day 5's (in particular: the `"+5"` / `"-3"` effect strings need a small parser/applier with §7's range clamping rules).
- **Day 7** — Room generator: deterministic seeded layouts replace the three hardcoded placeholder obstacles in `DecisionRoom`.
- **Day 8** — Event roller: the `events.json` schema gets exercised; era pools, stat-triggered events, ConsequenceRoom triggering.
- **Day 9** — HUD, name entry, career picker, class picker, intro narrative wiring.
- **Day 10** — Content pass: the real decisions (probably ~80 minutes of game content), real events, real narrative bodies.
- **Day 11** — Three mini-games (Blackjack, Code Review, Reaction Sprint).
- **Day 12** — Endgame / score / career recap.
- **Day 13** — Polish: art tokens, sound, accessibility, era-mood deltas tuning. (User noted during Day 5 testing that the era moods are perceptible but subtle — explicit candidate for Day-13 tuning, no code change required.)

**Immediate next step:** Day 6 design conversation, then implementation.

## 7. Observations for publication

**The design doc was the load-bearing artifact.** Every architectural decision in this session anchored to a section number — §6 for state placement, §11 for movement, §15 for visual register, §17 for build-day scope, §19 for project structure. When a deviation from the doc was warranted, it was justified explicitly (pure collision function vs. hook; flat JSON vs. subdirectories; 7 palette tokens vs. 5). Without a doc to anchor to, scope creep would have been hard to resist — and several proposals to "while we're here, let's also..." were turned down precisely because the build day's scope didn't include them. The doc isn't fiction; it's enforcement.

**Lint as a gate caught real bugs that typecheck + build did not.** Two `react-hooks/refs` rule violations in Day-1 code (mutating refs during render; reading refs in useState initializers) had silently shipped. They didn't fail typecheck, they didn't fail the build, they didn't produce visible UI bugs. They were real (stale-closure and strict-mode hazards) but undetectable except by the right linter rule. Adding `npm run verify` (typecheck + lint + build) as the new pre-commit gate made the rest of the session safer. This is a generalizable lesson: a clean build is not a clean codebase.

**Stacked PRs are a footgun for sequential build days.** The merge UI on GitHub will happily merge a stacked PR into its feature-branch base, leaving the change orphaned outside `main`. The merged-state badge doesn't warn you. The lesson — *always base PRs on `main`, even if the diff is temporarily noisy* — was saved to project memory so the same mistake doesn't recur in Days 6-13.

**React's reconciliation behavior surfaces non-obvious bugs.** The Day 5 reconciliation bug (DecisionRoom reused across decision→decision transitions, leaking the `triggered` ref) is the kind of issue that's invisible until specific routing patterns exercise it. Day 4's demo wiring alternated room types and silently hid the bug; Day 5's content-driven routing finally produced consecutive same-type rooms and exposed it. The fix was one line (`key={monthId}`), but the diagnosis required understanding React's component reconciliation rules. Worth noting: the bug had been latent in Day 4 *before* Day 5 was even built. We just hadn't hit the path that triggered it.

**The rhythm that worked best: design-conversation first, code second.** The Day 5 session began with the user asking to *discuss* schemas before writing code, with explicit permission to "pause here and iterate." Claude drafted the manifest, months, decisions, and events schemas with rationale and five clarifying questions; the user answered each; only then did code get written. Net effect: zero rework. Compare to the stacked-PR mishap, which would have been avoided by the same pattern — a 30-second conversation about PR base before clicking Merge.

---

*Generated by the session-process-log skill.*
