# Sprint Log: Path to the Future — 2026-05-12, Sprint 1 (Day 3 morning)

**Date:** 2026-05-12
**Sprint:** 1 of the day (Day 3 of the build cadence)
**Sprint window:** ~04:00–06:02 EDT (08:00–10:02 UTC) — ~2 hours
**Participants:** 1 human + Claude Opus 4.7 (1M context)
**Output type:** Mixed — design-doc expansions (v1.1 → v1.2), three small focused code PRs, eight issue specs, and a memory-hygiene pass
**Wider context:** The project's overall build plan covers Days 1-15 per §17 of the design doc; Days 1-13b.3 were already merged before this sprint. Yesterday's post-lunch handoff (`docs/handoffs/handoff-2026-05-11.md`) named the XP-accumulation gap as the next task. Today is the first sprint after yesterday — the user described it as waking up early "because I cannot stop the ideas from flowing."

---

## 1. Starting point

The user came into the sprint with a clean `main`, a handoff doc that named the XP gap as the obvious next code task, and a backlog of unstructured ideas (title screen, analytics, scoreboard, repetition tracking, an arcade, a Pong minigame, a backward door for replay). The design doc was at v1.1 with no Inspirations section, no analytics spec, no scoreboard spec; the XP system was structurally present but dormant (`addXp` only fired once at init, so the Novice → Junior → Skilled progression in §14 never actually fired during play).

The sitting was framed as exploratory — *"I cannot stop the ideas from flowing"* — but it produced concrete artifacts in every hour. The shape of the work was: spec it, file it, then code the smallest one that unblocks the most.

## 2. Deliverables produced

### Merged PRs (5)

- **PR #24 — v1.2 spec pass.** Design doc bumped 1.1 → 1.2. New §16.0 Title Screen, §24 Analytics & Tracking (GoatCounter, no PII, virtual pageviews), §25 Future: Public Scoreboard (CF Workers + D1, graffiti board, deferred). New SWE decision `swe-2am-idea` (3-option scenario for the "wake at 2 AM thinking about work" beat). Days 14 + 15 added to build order. Yesterday's handoff doc committed.
- **PR #25 — XP economy.** Two commits: (1) baseline `addXp(50)` per decision + auto-tier-recompute in the reducer (single source of truth for tier transitions), (2) minigame XP (`win 250 / partial 100 / fail 25`) and an `xp` effect key in `DecisionRoom`'s effect loop. 12 decisions tagged with promotion/new-job (+300) or big-stretch (+150) XP bonuses.
- **PR #29 — DOM identifiability sweep.** `data-component` / `data-region` / `data-action` / `data-{thing}-id` / state attributes (`data-phase`, `data-result`, `data-mode`, etc.) across 20 UI files. Pure additive, no logic changes. Convention documented and saved to memory so future components carry the attributes from commit one.
- **PR #35 — Decision/event de-dup.** History-aware filter in `selectDecision` (5-month window) and `rollEvents` (3-month window). Two-tier: exclude recently-seen + prefer never-seen, with a fallback chain. No state-shape change. Bundled a doc edit adding §1 Inspirations.
- **PR #36 — Doc backfill (dedup spec + Zelda + Monopoly).** §8 / §9 gained a *Selection: history-aware de-dup* subsection (catching up on PR #35's missing doc edit). §1 Inspirations expanded with Zelda/Final Fantasy/Pokémon as the lead entry, Monopoly added, FF/Pokémon grouped with Zelda since §8b already cites them together.

### Open PR (1)

- **PR #37 — Interactable labels.** `InteractableDef.label?: string` optional schema field. All 15 SWE interactables labeled ("Plant", "Intern", "Boss's boss", etc.). Renderer adds a name caption **below** the sprite (the `[E] talk` hint stays above per v1.1). §23 in the design doc updated alongside the code. One rebase against `main` to resolve a v1.2 change-log row conflict with PR #36.

### Issues filed (8)

| # | Title | Size |
|---|---|---|
| #26 | Endgame: career timeline unreadable, needs redesign | M |
| #27 | Interactables: label the `[E]` target | S (closed via #37) |
| #28 | NPCModal: speaker header + speaker visual | M (depends on #27) |
| #30 | Room transition: fade-out-then-back-in vibe | S |
| #31 | Arcade interactable (XP throttled to 1/hr/game) | L |
| #32 | Minigame: Pong | M |
| #33 | Backward door (read-only previous-month replay) | L |
| #34 | De-duplicate decisions/events (closed via #35) | S |

### Memory hygiene

- New: `feedback_browser_smoke_minimal.md` — don't run verbose preview_eval chains; user runs UI checks themselves
- New: `feedback_data_attrs_from_the_start.md` — every new UI component ships with `data-*` from commit one
- New: `feedback_update_design_doc_with_prs.md` — PRs that change behavior must update matching § + change-log row in the same PR
- New: `project_spirit_and_motivation.md` — race-to-finish + learn/explore; pragmatic-silly over purist-ceremonial; rigor reserved for load-bearing things
- Updated: `user_corby_owner.md` — 22-yr SWE veteran, broad stack breadth, calibrate to senior-peer
- Refreshed: `project_build_plan_status.md` — was stale ("Day 10 next"), now reflects Days 1-13b.3 merged + Day 13c / 14 / 15 specced
- Updated: `MEMORY.md` index — 4 new entries, 1 description revision

## 3. Key decisions

### Analytics provider: GoatCounter (cloud, free, hosted)
- **Decision:** Use GoatCounter cloud for the planned §24 analytics. No GA4. No self-hosting.
- **Reasoning:** Privacy-friendly default (no cookies → no consent banner), ~3KB script, lightweight event support, won't get blocked by mainstream ad-blockers. The "self-hosted" path in the spec was a future-flexibility callout, not a current requirement — the user clarified that the project should stay zero-backend.
- **Driver:** Mutual. Assistant presented three options (GoatCounter / Plausible / Cloudflare Web Analytics) and recommended GoatCounter; user confirmed.
- **Alternatives considered:** Plausible (paid cloud, more polished), Cloudflare Web Analytics (requires DNS proxy through CF), GA4 (heavy script + cookie banner — explicitly rejected as anti-vibe), rolled-your-own with CF Workers + KV (too much engineering for the goal).

### Scoreboard trust model: graffiti board
- **Decision:** When the future public scoreboard ships (§25), accept that scores are client-computed and therefore trivially cheatable. No replay verification, no HMAC signing.
- **Reasoning:** User's framing: *"if you're going to cheat — fine — why? who knows why people do that. even the best controls blow this up and that's not what we are going for."* Matches the project's broader spirit ("not taking ourselves too seriously," saved to memory). The median submission is probably honest; cheaters are part of the texture.
- **Driver:** User-driven philosophical call after assistant laid out three trust models (graffiti / server replay / HMAC theater).
- **Alternatives considered:** Server-side replay (would require porting `computeScore` and the effect engine to a backend), HMAC theater (security-by-obscurity that any determined player would extract from the bundle).

### XP economy: baseline + minigame + decision-encoded bonuses
- **Decision:** +50 XP per decision baseline. Minigame XP: 250 win / 100 partial / 25 fail. New `xp` effect key for option-level bonuses; 12 decisions tagged with +300 (promotions/new jobs — both options of `coder-vs-architect`, both of `manager-vs-tech-lead`, `startup-offer-join`, `move-cities-take-it`, `masters-enroll`) and +150 (big stretches — `pitch-rewrite`, `submit-cfp`, `take-pager`, `pour-yourself-in`, `mentor-commit`, `stay-late-stable`, `defend-architecture`).
- **Reasoning:** Player asked for "more opportunities to jump higher" — felt that 50 was realistic but slow. The math: a "play it safe" 120-decision run lands ~6000 XP (mid-Skilled), "go for it" run lands ~9-10k, "nail everything" run approaches 14k (just under Vanguard at 15k). Vanguard stays out of reach for v1, matches §14 having tiers 4+ as "Coming Soon."
- **Driver:** User feedback after initial baseline-only PR. Assistant proposed the expansion shape; user approved.
- **Alternatives considered:** Per-month base in `completeMonth` (deferred — time-skip months lose XP, but that's an OK loss for v1). Tag-based bonuses (rejected — finer authoring control with explicit `xp` effect key).

### Identifiability via `data-*`, NOT CSS classes
- **Decision:** Add `data-component` / `data-region` / `data-action` / `data-{thing}-id` / state attributes across the UI. Do NOT refactor inline styles to CSS classes.
- **Reasoning:** The palette/era-mood model is JS-driven (palette resolves per-render from React context). Moving to CSS classes would mean hardcoding colors (loses career-pack flexibility) or building a parallel CSS-variable system mirroring the React context (no real gain). data-attrs identify; inline styles still paint.
- **Driver:** User raised the identifiability problem during a bug-filing exchange ("I can't tell you 'look at the div with id X' because nothing is identified"). Assistant proposed `data-*` over `className` and laid out the trade.
- **Alternatives considered:** Switch to CSS classes with palette via CSS variables (rejected — parallel system), use IDs (rejected — components render multiple times, IDs must be unique), do nothing (rejected — already biting the user).

### Decision/event dedup: history-aware filter, no state change
- **Decision:** Filter the eligible pool in `selectDecision` + `rollEvents` via existing `history` records. 5-month window for decisions, 3-month for events. Two-tier (recent + unseen-preferred), fallback chain through neverSeen → notRecent → eligible.
- **Reasoning:** Player frustration with repeats (user: *"how often does a cousin reach out with a business idea?"*). No state shape change needed — `history.decisions` and `history.events` already persist with every commit. Pure selector logic, ~30 min of work, no STATE_VERSION bump.
- **Driver:** User-stated feature; assistant designed and implemented.
- **Alternatives considered:** A `tags: ["repeatable"]` exception for events that should fire multiple times (e.g. "skipped breakfast again" under high burnout) — deferred until a real authored event needs it.

### Interactable labels: under the sprite, full contrast
- **Decision:** Show the interactable's name *below* the sprite (caption position), `[E] talk` hint stays *above*. Full-contrast `palette.ink` at 12px weight 600.
- **Reasoning:** User pushed back twice on initial render (first attempt: label under the `[E]` hint at low contrast). The split-top/bottom layout keeps the call-to-action prominent while giving the player a name anchor for the sprite.
- **Driver:** User-driven iteration on initial implementation.
- **Alternatives considered:** Both top, both bottom, single combined string ("[E] talk to Intern"). All rejected by the iteration.

## 4. Tensions resolved

### "50 XP per decision feels slow"
After the initial XP PR (just baseline +50) was opened, user pushed back: *"50 XP seems slow — maybe its realistic"* + *"we def. want Minigame XP on win"* + *"taking a promotion or new job — those would jump too, right?"* Assistant proposed an expanded shape (minigame win/partial/fail XP + decision-encoded `xp` effect key for promotions/stretches), user approved with "bundle it" so it went into the same in-flight PR rather than a follow-up. The result was the layered economy described above. Lesson: the assistant's initial scope was too narrow; user's domain instinct for "big career moments should feel big" was right.

### Browser smoke testing slowing the loop
Mid-sprint, the assistant was using `preview_eval` chains to walk through the init flow + verify XP increments via simulated input. User: *"i love the new Claude_Preview: preview eval step - but its slowing me way down, i can run those checks, yours seem too verbose."* This became a saved feedback memory: default is to skip browser smokes; trust verify gate + reasoning; ask before doing real walkthroughs. The hook injected by the Claude_Preview MCP server (which keeps reminding the assistant to `preview_start`) was acknowledged as background noise the memory overrides.

### Data-attrs as rework
After PR #29 (the 20-file data-attrs sweep) merged, user: *"this feels a little like rework — ideally, we should have been doing this all along… it's in the 'waste' category — it's good hygiene so it's worth the time to fix now, but we should have caught it earlier."* This became a feedback memory: every new UI component ships with `data-*` from commit one. Forward-going rule, not a backward fix.

### Design doc drift after PR #35
PR #35 (dedup) shipped without doc updates to §8/§9, even though the assistant's PR description had all the necessary detail. User: *"lets make a memory note that we should update the appropriate sections of the design document when working on PRs — details are likely in the PR so honor those."* New feedback memory: doc edits ride with the PR that ships the behavior. Applied immediately — the user merged #35 anyway, then asked for a doc-only PR to backfill, which became PR #36.

### Label color too light, wrong position
Initial PR #37 render placed the label under the `[E]` hint at `palette.inkMuted` (subdued). User intercepted before commit: *"color is too light for the label — also suggest putting the label UNDER the object not under the [E] interact."* Iteration: label moved below the sprite, bumped to `palette.ink` weight 600. User confirmed visually, then said "commit." This is a recurring pattern this sprint — fast iterations where the user's design-eye corrected the assistant's first-pass instincts.

## 5. Time analysis

### Sprint duration

**Method:** User-stated wall-clock, validated against `gh issue create` timestamps (first issue created at 08:53:15 UTC, well after the sprint started). User said ~04:00 EDT start and confirmed at 06:02 EDT (10:02 UTC) end. No breaks reported.

**Duration: ~2 hours 0 minutes** focused work.

### Traditional-team equivalent

**Assumed team:** 1 senior engineer (IC), 1 product manager (part-time), 1 designer (part-time, for visual review only). No QA. Solo-developer-equivalent quality bar (this is a portfolio/showcase project, not enterprise software).

**Assumed working pattern:** Mostly async with 1-2 sync touchpoints per day, normal Slack/PR cadence, code reviews land in ~1 business day.

**Estimated duration: 3-5 working days.**

**What this estimate INCLUDES:**
- Design doc spec writing (§16.0, §24, §25, Inspirations, §8/§9 dedup, §23 label) — ~1 day for one engineer to draft, 0.5 day for one PM to review and sign off
- Issue triage and writing (8 issues, all with implementation guidance + design calls) — ~0.5-1 day
- Five code PRs (XP economy, data-attrs sweep, dedup, labels, doc backfill) including code review cycles — ~2 days of engineer time across the work
- Architecture / philosophy decisions (analytics provider, scoreboard trust model, identifiability via data-attrs not classes) — would take 2-3 sync meetings, ~1 day of calendar time elapsed
- Memory / process hygiene captured as durable artifacts — typically not captured at all in team workflows, so this is "extra" work that has no team-equivalent

**What this estimate EXCLUDES (and would still need to be done):**
- Actual feature implementation for issues #26, #28, #30, #31, #32, #33 — these are specced, not coded
- Visual/illustration polish on placeholder sprites
- Accessibility audit (Day 13c, still pending)
- Cross-viewport testing
- Code review by another human (none of these PRs had outside reviewers)
- Playtesting / user research
- Multi-pack architecture for when v2 lands (flagged as a future call in #31's arcade design)

### Honest framing

This sprint produced what a 3-person team running normal-cadence agile work would deliver in **3-5 working days**, conservatively. The compression comes mostly from three things: (1) zero coordination overhead since the team is one person, (2) the assistant handles the "write the spec / draft the issue / produce the boilerplate" work that usually eats 30-50% of an engineer's day, and (3) iterative tight loops on small decisions instead of waiting for async PR review cycles.

The compression ratio is **roughly 12-20×** if you count working hours and **roughly 1.5-2.5×** if you count *calendar* days a team would burn — most of the team's elapsed time isn't engineering; it's waiting for the next standup, the next review, the next signoff. That's the honest framing.

**What this sprint did NOT achieve that a team would have:** outside code review, design alignment with stakeholders, user research validation, visual polish, accessibility verification. The work is *spec-complete and engine-correct*, not *production-ready*.

## 6. What's next

When the user picks back up:

- **PR #37 (interactable labels)** is open with conflicts resolved — merge whenever
- **Issue #28 (NPCModal speaker header)** is the natural next pickup — #37 unblocks it; the modal header reuses the `label` field
- **Issue #30 (transition vibe fix)** is small and high-impact — assistant recommended 15-line cheap fix (sync month emit to fade-start + trim `POST_EFFECT_PAUSE_MS`)
- **Issue #26 (endgame timeline redesign)** — recommended approach is option 2 (drop canvas aspect ratio on the endgame screen), small change, big UX unlock
- **Day 13c polish bundle** (a11y audit + era mood tuning + cross-viewport) — original Day 13 scope, still pending
- **Day 14 title screen** + **Day 15 analytics + GitHub Pages deploy** — specced in PR #24, not built
- Larger feature backlog from this sprint: arcade (#31), pong (#32), backward door (#33) — all specced, none coded

## 7. Observations for publication

**The memory system became a real productivity multiplier this sprint.** Four new feedback memories were saved during the work (browser smoke minimization, data-attrs from the start, doc-with-PRs, project spirit) — none of them required the user to re-explain a preference twice. The "saved memory" pattern is doing the work that a team's culture-and-conventions document or onboarding wiki would do, but it's actually being read every time it's relevant (because it's loaded into context), not aspirationally referenced. The cost of writing memories is low (1-2 min each); the cost of NOT writing them is the user having to repeat themselves, which is the actual friction.

**"Spec the feature, then code the smallest unblocker" was the implicit shape of the sprint.** The user filed 4 forward-looking feature requests (arcade / pong / backward door / dedup) and the assistant turned them into detailed GitHub issues. Then only the smallest one (dedup) was actually coded. This is a healthy pattern — the unfilled issues are now durable artifacts that don't depend on the sprint's context to make sense. A future session can pick any of them up cold.

**The "design doc with PRs" rule landed mid-sprint and was applied retroactively in the same sitting.** PR #35 shipped without doc updates. User flagged it as a process gap. Assistant saved a memory rule and then immediately opened PR #36 to catch up. The rule existed for ~30 minutes before producing its first useful side-effect. This is unusually fast for a process improvement; it works because the human + AI loop is tight enough that "noticing a gap → naming it → fixing the next instance" can happen in the same sitting.

**Iteration tightness was the killer feature.** The interactable-labels fix went: assistant ships → user looks at it → user says "color too light, wrong position" → assistant fixes → user says "looks good now commit" → assistant commits. Round-trip: maybe 4 minutes. In a normal team workflow, that's a PR comment → next-day fix → another review cycle. The compression comes from the loop being seconds, not days.

---

*Generated by the session-process-log skill.*
