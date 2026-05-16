# Sprint Log: Path to the Future — 2026-05-15, Sprint 1

**Date:** 2026-05-15
**Sprint:** 1 of the day (first sitting of day 6 — the day-5 evening session that was on the plan never happened; user diverted directly to calendar day 6 morning)
**Sprint window:** 2026-05-15T10:02:36Z → 12:02:05Z (**1h 59m 29s**, ~06:02 → 08:02 EDT)
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Engine + content + UI + design-doc — 4 PRs (3 merged + 1 open)
**Wider context:** Day 6 of an ongoing build. Day 5 (2026-05-14) shipped 8 PRs across two sittings; today is the first sitting of day 6 and ran while a second Claude session was working in parallel on homeschool icon coverage in another thread (that thread shipped `add99e6` independently — not part of this sprint's product output).

---

## 1. Starting point

The sprint opened on a clean main at commit `addf51b` (PR #88 of the prior icon-thread session). User came in with three explicit asks layered into the first turn:

1. **NPC palette overload** — every NPC body was painted with `palette.accent`, the same warm-brown the engine used for doors, the arcade cabinet, the bench, most furniture. People read as just-more-room. User pre-specified the new tokens (`npcAdult: #ffc91c` yellow + `npcAdultInk: #a2810f`; `npcChild: #1aff5e` green + `npcChildInk: #13a83f`) and asked me to wire them.
2. **GoatCounter analytics (Day 15 first half)** — wire the §24-specced wrapper + 11 pageview slugs + 4 events. **GitHub Pages deploy half explicitly out of scope** ("ignore github pages for now").
3. **Complexity-tier ladder follow-ups** — pick up PR #79's *Follow-ups (separate PRs)* list. PR3 (easy-tier templates) first, then PR4 (medium tier + moving-obstacle physics).

The PR #79 follow-up list was the load-bearing item: it sketched four future PRs (easy / medium / hard / expert) and the sprint covered the first two.

## 2. Deliverables produced

- **[PR #86](https://github.com/corby-github/path-to-the-future/pull/86) merged — NPC palette tokens v2.0.15.** `Palette` type widens with `npcAdult` / `npcAdultInk` / `npcChild` / `npcChildInk` (mirrors the existing `player` / `playerInk` precedent). Both pack manifests get the new tokens. `InteractableSprite.tsx` rewires 6 NPC body sites (NPCBase body+head, NPCKidBase body+head, NPCCoopParent's redrawn head, NPCNeighbor's hand). `CareerPackProvider` runs new tokens through `applyEraMood` so NPCs drain in the pandemic era like the rest of the palette. Follow-up commit on the same branch swapped 7 hair sites from `palette.ink` (read too harsh) to `palette.accent` (warm brown). Design doc §15 gains an *NPC palette tokens (v2.0.15)* subsection.
- **[PR #87](https://github.com/corby-github/path-to-the-future/pull/87) merged — GoatCounter analytics v2.0.16.** New `src/game/analytics/track.ts` (~95 LOC) with `initAnalytics()`, `trackPageview(path)`, `trackEvent(name, params?)`, and a `useTrackPageview(path)` React hook. Three guard layers (PROD-only, env enable flag, `navigator.doNotTrack`, `window.goatcounter` undefined). Wrapper dynamically injects the GoatCounter script tag from `VITE_GOATCOUNTER_ENDPOINT` so dev builds never load it. 11 pageview slugs wired across screens (`/title`, `/init/career`, `/init/name`, `/init/kid-names` *(added to §24 spec to match v2.0.14 init phase)*, `/init/class`, `/init/intro`, `/month/{01..70}`, `/minigame/{variant}`, `/endgame`, `/credits`, `/restart`). 4 custom events (`game_started` with career/class, `game_completed`, `restart_confirmed`, `minigame_completed` with id/result). Follow-up commit added `VITE_ANALYTICS_ALLOW_LOCAL` escape hatch — set in `.env.production.local` (gitignored) to bypass GoatCounter's default localhost protection for `npm run preview` verification.
- **[PR #88](https://github.com/corby-github/path-to-the-future/pull/88) merged — Easy-tier templates v2.0.17, PR3 of §4 ladder.** Pure template authoring on the v2.0.9 framework. `maze` re-tagged `simple` → `easy`. Two new universal easy templates: `s-curve` (two offset vertical walls forcing an S-shape detour) and `switchback` (2-wall maze-lite with 200 px gaps). Pool sizes: SWE 10 simple + 3 easy = 13; Homeschool 8 simple + 3 easy = 11.
- **[PR #90](https://github.com/corby-github/path-to-the-future/pull/90) opened — Medium-tier templates + moving-obstacle physics v2.0.18, PR4 of §4 ladder.** First non-trivial engine work on the tier framework. New `MovingObstacle` type in `types/geometry.ts` (sine-wave vertical oscillation). New `src/game/engine/useMovingObstacles.ts` hook + pure `currentRectFor` helper. `usePlayerMovement` widens its return shape to `{ state, setPosition }` so callers can imperatively reposition the player. `circleIntersectsRect` exported from `engine/collision`. `DecisionRoom` wires per-frame collision inside `handleTick` (cooldown-debounced 600 ms): knockback 50 px west via `setPosition`, `applyStatEffect(health -2)`, hit-counter, `applyStatEffect(burnout +5)` at hit #4. On forward-door commit with zero hits in a hazard room → `addXp(XP_TIER_BONUS_UNTOUCHED = 100)`. Two new universal medium templates: `pendulum` (single oscillating block at canvas center) and `shutters` (two phase-offset blocks). Awaiting playtest.
- **Design doc walked v2.0.14 → v2.0.18.** Four change-log rows, status line bumped, §4 *Layout templates* table widened with a Tier column + 4 new rows, §4 *Complexity tiers* fallback paragraph updated twice, §15 new *NPC palette tokens* subsection, §24 *Tracked slugs* gains `/init/kid-names` + implementation-honest annotations on existing rows, §17 *Build Order* Day 15 marked partial.

## 3. Key decisions

### NPC palette PR scope: NPCs only, don't split other `accent` uses
- **Decision:** This PR moves only the 6 NPC body sites off `palette.accent`. The other 33 `accent` references (16 object bodies + 3 doors + 8 UI accents + 5 minigame flourishes + the trophy) all stay.
- **Reasoning:** Audit before editing turned up 39 `accent` consumers across the codebase. Once NPCs go yellow/green, the visual collision the user flagged ("NPCs the same color as the door") is *gone* — no need to also split door color, UI selection, EffectChips negative, etc. Each of those is doing semantically different work and splitting them is its own design conversation.
- **Driver:** Claude proposed the scope after the audit; user accepted.
- **Alternatives considered:** Split `doorAccent` token too (defer to a follow-up if door collision needs it); split UI vs object accent (rejected — too much scope for one PR).

### Accessory strokes stay on `palette.ink`; hair moves to `palette.accent`
- **Decision:** Held items (cups, glasses, clipboards, ties, watches, backpacks) keep their original `palette.ink` outlines. The 7 hair sites (designer tuft, Bram tuft, mother-in-law crown + bun, spouse long-hair frame, co-op-parent ponytail, neighbor bob) move from `palette.ink` to `palette.accent` (warm brown).
- **Reasoning:** Two different jobs. Accessories sit *on top of* the body and need silhouette contrast — neutral ink preserves that. Hair *is* body color — `palette.ink` (near-black) reads too harsh against the new yellow/green NPC bodies and the muted Treatment-A backgrounds. `palette.accent` (`#8b6240`) is now semantically free from NPC-body duty and reads as universal "hair-color-ish."
- **Driver:** Mutual — user reported the dark hair after PR #86's first commit ("update hair color on NPCs - its too dark - use a brown instead"); Claude proposed the specific token choice + scope (all 7 sites).
- **Alternatives considered:** Match hair to each body's `*Ink` token (uniform NPC outline — rejected because accessories would blend more); add a dedicated `hair` palette token (over-engineered for v1).

### GoatCounter: dynamic script injection from `track.ts` rather than static `<script>` in `index.html`
- **Decision:** `initAnalytics()` runs once from `main.tsx` and dynamically appends the GoatCounter script tag. The `index.html` stays clean.
- **Reasoning:** Env-var-driven, dev builds never load it, no Vite `index.html` template hacks. Easier to test and easier to disable (the wrapper short-circuits before even injecting).
- **Driver:** Claude.
- **Alternatives considered:** Static script tag in `index.html` with Vite env-var substitution (more boilerplate, harder to gate on DNT / dev-vs-prod cleanly).

### Custom event params as query-string suffix on the event name
- **Decision:** `game_started?career=software-engineering&class=skilled` rather than a separate params dict.
- **Reasoning:** GoatCounter's `count({ path, event })` API doesn't natively support key-value params on events. Encoding as a query-string on the path string groups cleanly in the dashboard.
- **Driver:** Claude (forced by the GoatCounter API surface).
- **Alternatives considered:** Multiple event sends per data point (would inflate event count and lose the grouping).

### CreditsScreen mode='replay' fires `/restart` pageview, not `/credits`
- **Decision:** Two pageview branches in CreditsScreen — `'browse'` mode fires `/credits` (the credits roll), `'replay'` mode fires `/restart` (the begin-again confirm view). `restart_confirmed` event still fires separately on actual click.
- **Reasoning:** Cleaner funnel — you can see "X players reached the begin-again confirm screen" vs "Y players actually confirmed." If both fired `/credits` the analytics would conflate two semantically distinct screens.
- **Driver:** Claude (judgment call against the §24 spec's slightly-ambiguous wording).
- **Alternatives considered:** Fire `/restart` only on confirm click (loses funnel visibility into the confirm step).

### Easy-tier scope: re-tag `maze` + author 2 new templates
- **Decision:** `maze` leaves the simple pool (it was always the closest match for the spec's *unmovable wall patterns / mazes* easy-tier description). New universal templates `s-curve` and `switchback` join it.
- **Reasoning:** Three-template easy pool is enough variety for v1. Pure template authoring — no engine code change.
- **Driver:** Mutual — Claude proposed three options, user picked the bundled one.
- **Alternatives considered:** Re-tag maze alone (single-template easy pool, repetitive); leave maze as simple + author all-new easy templates (more authoring, no immediate payoff).

### Medium-tier collision: detect-only, NOT in the static blocker list
- **Decision:** Moving obstacles are detected separately from the player's static-collision system. The player CAN walk through them — but takes a hit + knockback when overlap is detected.
- **Reasoning:** Avoids the "stuck inside obstacle" bug that would occur if the static-collision system held the player in place when an obstacle moved INTO them. Also matches §4 spec wording exactly: *"Collision throws the player back, takes some health."* That's a hazard, not a wall.
- **Driver:** Claude.
- **Alternatives considered:** Add moving obstacles to the static blocker list + add a per-frame "if player inside obstacle, displace to edge" rule (more complex, two systems to keep in sync, classic moving-platform bug surface).

### Knockback direction: west (toward spawn), deterministic
- **Decision:** On collision, player position is shoved 50 px in the −X direction (toward canvas spawn). Clamped to canvas left bound.
- **Reasoning:** Reads as "the wall pushed me back the way I came." Deterministic regardless of which obstacle hit or which way it was moving. Spawn is always west.
- **Driver:** Claude.
- **Alternatives considered:** Push perpendicular to obstacle motion (more physically realistic, but felt arbitrary in the implementation reasoning — and obstacle motion is always vertical anyway, so perpendicular is just horizontal in either direction).

### `XP_TIER_BONUS_UNTOUCHED = 100`
- **Decision:** Clean traversal of a hazard room (zero collisions on door entry) awards +100 XP.
- **Reasoning:** Sized between `XP_MINIGAME_PARTIAL` (100) and `XP_MINIGAME_WIN` (250) — a meaningful but not overwhelming reward. Lives as a named constant in `progressSlice.ts` so it's tunable.
- **Driver:** Claude.
- **Alternatives considered:** No bonus (loses the "play it well" incentive); larger bonus (would distort the score formula).

## 4. Tensions resolved

**The `react-hooks/immutability` lint rule blocked the standard ref-mirror pattern in DecisionRoom.** Tried at least four variations of `useRef` + `useEffect` to mirror `movingObstacleRects` (custom-hook return) and `player.setPosition`: sentinel initial value + useEffect with no deps; sentinel + useEffect with deps; same-expression initial value + useEffect with deps; explicit `EMPTY_RECT_LIST` constant + useEffect with deps. **All four failed lint** with the same error: *"Modifying a value previously passed as an argument to a hook is not allowed."* Crucially, `Pong.tsx` uses the EXACT same pattern (`scoreRef = useRef(score); useEffect(() => { scoreRef.current = score; }, [score])`) and lints clean. The rule appears to treat values flowing from a custom-hook return differently from values flowing from a local `useState` — couldn't crack the subtle compiler-aware difference within the sprint window. Resolved with `eslint-disable-next-line react-hooks/immutability` on the two specific lines, with comments pointing at the Pong precedent. The pattern is functionally correct; the rule is over-eager on the custom-hook-return path. Worth revisiting if the rule drops the false-positive.

**`performance.now()` inside `useRef` triggered "impure function during render"** in `useMovingObstacles.ts`. Fixed by switching to `useState(() => performance.now())` — useState's lazy initializer is the sanctioned spot for impure calls.

**GoatCounter localhost protection masqueraded as broken wiring.** After `npm run build && npm run preview`, user saw `count.js:80 goatcounter: not counting because of: localhost` and reported "i dont see them accumulating." The diagnosis: the warning *is the proof* the wiring works — the script loaded, our `count()` reached it, GoatCounter politely refused because of localhost. The fix wasn't a bug fix; it was an env-flag addition (`VITE_ANALYTICS_ALLOW_LOCAL=true` in `.env.production.local`) that injects `data-goatcounter-settings='{"allow_local":true}'` on the script tag. Lesson worth pinning: production-only behaviors that *appear* broken in preview are a category. The console warning is often the diagnostic, not the bug.

**Two-thread workflow surfaced a state desync** at sprint open. The day-5-afternoon time-log entry appeared unclosed in my working tree — I almost backfilled the missing `end` row. User's response: "actually we just needed to pull -which i have done now - end session was checked in `4b422d5`." The end row had been committed in a prior session that I hadn't pulled. Lesson: in multi-thread workflows, `git pull` before assuming local state desyncs are real bugs.

**Punch commit landed on the feature branch instead of main.** The `/punch` skill assumes you're on main when it runs the commit step. I ran `git commit && git push origin main` from `feat/medium-tier-templates` — push-to-main pushed nothing (no commits there), commit landed on the feature branch. Fixed with `git cherry-pick` onto main; the duplicate commit on the feature branch will dedupe at PR merge time (same diff content). Lesson: punch skill should check `git branch --show-current` before committing.

**User-side concurrent product work.** During PR #86's review window, user manually edited the SWE and Homeschool manifests in their working tree, iterating on the `npcChild` hex value (green `#1aff5e` → blue-ish `#7aa5b8`) — separate visual taste call running in parallel with my implementation. Committed by user as `1e48ee9 tweak speed and child color` (also doubled `BASE_SPEED` to `(180*2)` at the same time). My commit only included the analytics-related files, leaving the manifest tweaks for the user. The boundary worked — concurrent product changes from two hands didn't collide.

## 5. Time analysis

### Sprint duration (with product / process split)

**Authoritative source:** `docs/logs/time-log.md` (written by `/punch`).

- `start`: 2026-05-15T10:02:36Z (06:02 EDT)
- `end`: 2026-05-15T12:02:05Z (08:02 EDT)
- **Sprint duration (total): 1h 59m 29s.**
- **No `boundary-open` / `boundary-close` pairs logged this sprint** — no process-tooling, no skill-edits, no research-artifact authoring inside the sprint window. **Full duration counted as product wall time.**
- **Product wall time: 1h 59m 29s. Process tooling: 0.**

(One small caveat: the `/anthropic-skills:memory-transfer` skill body was modified in the handoff turn — *after* the sprint's punch-out — to make the resume-prompt format mandatory. That edit lives in `~/Library/Application Support/Claude/...`, not in this project, and happened post-punch. Not counted as in-sprint process-tooling.)

### Traditional-team equivalent

**Assumed team:** 1 senior engineer (engine + content + tooling), with a designer reviewing visual choices async. Roles overlap heavily at this team size.

**Assumed working pattern:** Async-first with 1 standup/day + ad-hoc pairings. ~6 productive hours per developer-day after meetings + context-switching overhead.

**Estimated duration: 3–4 working days** for the product output alone. Breakdown:

| Workstream | Solo team-day estimate |
|---|---|
| Audit + author NPC palette tokens (Palette type widen, both manifests, 6 sprite rewires, era-mood plumbing, hair pass, design-doc §15) | ~0.5 day |
| GoatCounter analytics wrapper + env config + 11 pageview wiring + 4 event wiring + localhost escape hatch + design-doc §24 reconcile | ~1.0–1.5 days |
| Easy-tier templates (`maze` re-tag + 2 new templates + design-doc §4 update) | ~0.25–0.5 day |
| Medium-tier templates + moving-obstacle physics (new type + hook + collision system + knockback + 5 tuning constants + 2 templates + design-doc §4 update + verify gate iteration) | ~1.5–2 days |

**Total: ~3.25–4.5 days for a small team** to produce the same product output, granting them perfect focus and no stakeholder churn.

**What this estimate INCLUDES:**
- Design discussion on palette scope (which sites move, accessory treatment)
- Implementation + local verification of all four PRs
- Reading + reconciling the design doc against shipped code (4 design-doc revisions in one sprint)
- The lint-rule wrestling match on PR #90 (would likely surface in code review for any team)
- Writing change-log rows + new design-doc subsections

**What this estimate EXCLUDES (and would still need doing in a real team):**
- Playtest of PR #90 (currently awaiting human playtest)
- Visual review of NPC colors against the full era-mood palette (just code-tested)
- Stat-curve playtesting on the moving-obstacle damage constants (unplaytested values)
- Code review by another engineer (would catch issues like the lint-rule workaround earlier)
- QA pass on the medium-tier rooms (rooms haven't been played end-to-end)
- Visual design review of the moving-obstacle treatment (block-vs-character readability)

### Honest framing

For **4 PRs (3 merged + 1 open) including a non-trivial engine physics layer**, with product output that would take a small focused team 3–4 days, today's sprint consumed **1h 59m 29s of at-keyboard product wall time** — no process-tooling boundaries, so all of it is fair to compare directly. That's roughly **9–12× faster** than the team estimate.

Two important caveats:
1. The compression holds at this magnitude *because* the project's domain has already been worked through extensively (design doc at v2.0.18, established architectural patterns, 5 days of prior context). PR #90's medium-tier work specifically was scoped against the v2.0.9 framework PR #79 had already specced — the design discussion was done; the implementation was the work.
2. This sprint did NOT include playtest, code review by a second engineer, or content QA. A team would naturally absorb those before merge. Today, those are deferred to the user's next session.

A concurrent thread (not this sprint) was running parallel work on homeschool icon coverage and shipped its own commit (`add99e6`). The two-thread workflow contributed to neither side's measured throughput here — sprints are measured independently — but it's worth naming that the day-6 morning's *total* AI-paired output across both threads was larger than this single sprint's numbers reflect.

## 6. What's next

- **Playtest PR [#90](https://github.com/corby-github/path-to-the-future/pull/90)** — confirm knockback magnitude / direction feels right, cooldown prevents spam-damage, burnout fires at hit #4, untouched bonus +100 XP fires on clean traversal. Tuning constants are named at the top of `DecisionRoom.tsx`.
- **Tune medium-tier feel.** User flagged easy tier as "still too easy" before opening PR4 — expect medium may need similar tuning iteration. All knobs are constants (collision behavior in `DecisionRoom.tsx`, motion params inline on the templates in `layouts.ts`).
- **PR5 — hard tier templates.** §4 spec: faster-moving walls + pong-style paddle gate in front of the door. Builds on PR4's moving-obstacle infrastructure.
- **PR6 — expert tier templates.** §4 spec: deterministic sliding/zigzag block + tier-aware NPC placement zones (hard/expert rooms host NPCs in the left half, challenge in the right half). Will need an update to `placeInteractables.ts`.
- **Day 15 Pages deploy half** — `homepage` field in `package.json` + `.github/workflows/deploy.yml` for Pages on push-to-main. Closes Day 15 entirely.

## 7. Observations for publication

**Where Claude helped most.** PR #90 was the load-bearing one — real engine physics work, not template authoring. New type, new hook, widened return shape on `usePlayerMovement`, per-frame collision detection wired into `DecisionRoom.handleTick`, knockback via imperative position setter, hit accounting + side-effects + bonus-XP-on-clean-traversal, plus two new authored templates and a design-doc update. That all landed inside the 2-hour sprint, with a verify-gate-clean PR awaiting playtest. The compression ratio holds because the design conversation had already been done (PR #79 specced the framework; v2.0.9 was the seam); today was execution against a clear target.

**Where the human had to push back.** Twice this sprint, the user redirected mid-implementation. First, on PR #86 first-commit, hair was too dark — Claude shipped NPCs with `palette.ink` outlines that read fine in isolation but harsh against the new yellow/green bodies. User caught it visually, asked for "a brown instead," led to the 7-site hair sweep. Second, the user manually iterated on `npcChild` hex values (green → blue-ish) in parallel with my work — concurrent product changes from two hands, not collisions, just two different design instincts converging. Both are exactly the AI/human review asymmetry beat from the research artifact: AI ships fast, human review is *not compressible*, and the human runs the visual / feel checks the AI can't substitute for.

**What surprised the user.** The medium-tier PR landed inside the same 2-hour window as three smaller PRs. Engine physics work that would normally be a "tomorrow afternoon" task, packaged with knockback semantics + bonus-XP scoring + design-doc update, all behind a clean verify gate. The compression ratio for *content* work (palette tokens, analytics wiring, template authoring) is one thing; the compression ratio for *engine* work was the genuinely interesting beat.

**The workflow felt like.** Tight conversational loop with explicit handoffs: spec or fix → AI implements + verifies → user playtests or skips → merge. Two-thread workflow worked surprisingly well — the parallel icon thread merged its own PR (`add99e6`) without colliding with this sprint, and surfaced state desyncs only at sprint open (the "missing time-log end row" beat, fixed with `git pull`). One small accidental beat worth naming: the user spun up the GoatCounter account in 5 minutes during PR #86's implementation, totally absorbed into the AI-paired work, no pause to either side. That's the orthogonal-admin pattern — the kind of human-side work that doesn't show up in product time OR review time, just disappears into idle ranges.

---

*Generated by the session-process-log skill. Covers sprint 1 of day 6 (the first sitting after a day off the keyboard). Sprint window 1h 59m 29s; no process-tooling boundaries; product output as listed in §2.*
