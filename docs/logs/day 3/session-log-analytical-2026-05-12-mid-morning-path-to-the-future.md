# Sprint Log: Path to the Future — 2026-05-12, mid-morning (Sprint 2 of day 3)

**Date:** 2026-05-12
**Sprint:** 2 of the day (mid-morning)
**Sprint window:** 2026-05-12T13:24:00Z → 2026-05-12T15:10:12Z (**1h 46m**, from `docs/logs/time-log.md`)
**Participants:** 1 human + Claude Opus 4.7 (1M context)
**Output type:** Three merged PRs (#38 NPC modal speaker, #39 modal icons, #40 backward replay) + the `/punch` skill promoted to user-global + iterative visual polish
**Wider context:** Sprint 2 of day 3 (early-morning sprint at 08:00–10:02 UTC covered the v1.2 spec + XP economy + decision/event dedup + interactable labels). Today is the third sprint day of the build (Days 1–13b.3 already merged before this morning; design doc v1.3 covers the new specs).

---

## 1. Starting point

The mid-morning sprint opened with two issues queued: #28 (NPC modal speaker header + visual) and #33 (backward door for read-only replay). Issue #27 had just closed via #37 (interactable labels) in the early-morning sprint, leaving the `label` field on `InteractableDef` ready to be reused. The handoff doc had named #28 as the natural next pickup since #37 unblocked it.

Two unusual mechanics this sprint: (1) the user invoked the new `/punch` time-tracking skill we built this morning to bound the sprint at the wall-clock level (no "estimate from conversation depth"), and (2) a parallel background agent was spawned mid-sprint to do PR #39 (modal icons) while the foreground stayed on #33. Both behaviors landed cleanly.

## 2. Deliverables produced

### Merged PRs (3)

- **PR #38 — NPCModal speaker header + icon-left sprite (closes #28).** Kind-aware header above the typewriter prompt (`"Intern says…"` for NPCs, `"Plant."` for objects). Full-opacity sprite icon in a fixed-width left column of the dialog box, persists across all phases. Shared `labelFor()` / `speakerHeaderFor()` helpers extracted to `src/game/content/interactableLabel.ts` so DecisionRoom (sprite caption) and NPCModal (modal header) read from one source. Watermark variant sandboxed and rejected on legibility — the placeholder sprites are too small for the watermark aesthetic to read clearly. Bonus commit folded in: `npc-peer-eng` pocket-protector fix (the "watch" rectangle at `y+20` was reading as a misplaced dot below the waist — swapped for an upper-torso pocket protector with pen tip).

- **PR #39 — Modal icons placeholder registry (background agent).** New `src/game/ui/icons/modalIcons.tsx` + `modalIconRegistryData.ts` — registry pattern mapping decision/event `id` → palette-aware SVG component, with a `PlaceholderIcon` fallback. DecisionModal renders the icon inline (next to the prompt in options phase, next to the chosen-option label in flavor phase — multiple layout iterations before this landed). EventModal renders it top-centered above the title. Three IDs registered as placeholders for testing: `univ-stay-late-vs-log-off`, `univ-standup-too-long`, `evt-era-pandemic-furlough-friend`. Real art swaps in per-id without touching modal code.

- **PR #40 — Backward replay (closes #33).** Full feature: `progress.viewingMonth: number | null` state + `enterReplay` / `exitReplay` reducers; `history.minigames` records + `recordMinigame` dispatched by each minigame's `handleContinue`; STATE_VERSION bumped 1.2.0 → 1.3.0. CareerPackProvider resolves effective month from `viewingMonth ?? currentMonth` and exposes `isReplay` + `liveMonth`. DecisionRoom gets a rewind door (bottom-left, palette.accent post-color-fix), forward door becomes `↩ return to {liveMonth}` exit in replay, decisions/events suppressed. NarrativeRoom replays read-only with a Return button. MinigameRoom routes to a new `MinigameReplayCard` that shows the frozen result. NPCModal effects suppressed in replay (dialogues still play). HUD dims to 0.7 opacity + month label prefixes with `←`. Status bar picks one of 16 random replay flavor lines per room mount. Month 1 (2020 NarrativeRoom intro) and ConsequenceRoom months are explicitly excluded from rewind reach. Bonus fixes bundled in: the `month-delta-float` keyframe's `-50%` horizontal translate (was making longer strings drift further left because -50% scales with element width), `.claude/worktrees/` added to ESLint `globalIgnores`.

### Skill changes

- **`/punch` skill promoted to user-global** (`~/.claude/skills/punch/SKILL.md`). Project-level `.claude/skills/` turned out not to be an auto-discovery path; the skill wasn't appearing in the slash-command picker. Moved source-of-truth to user-global so it's discoverable across all projects, removed the repo copy + the `.gitignore` exception. Added a new "Step 0" to the skill that asks before creating `docs/logs/time-log.md` in a project that doesn't have one yet.

### Documentation

- Design doc bumped 1.2 → 1.3. New §11.1 *Backward replay* + STATE_VERSION table updated + v1.3 change-log row covering both #40 and #39 (merged into a single row after a rebase conflict). §23 NPCModal subsection updated for speaker header + icon-left. §8 / §9 *Modal icons (v1.3+)* subsection added by the background agent.

### Issues filed / closed

- **Closed:** #27 (earlier), #28 (via #38), #33 (via #40), #34 (earlier).
- **Open and pending:** #26 (endgame timeline), #30 (transition vibe), #31 (arcade), #32 (Pong), plus the 42-minigame issue the user queued during the sprint (I owe a follow-up issue file; not done yet).

## 3. Key decisions

### Icon-left over watermark for NPCModal speaker visual
- **Decision:** Full-opacity sprite in a left column, not low-opacity right-aligned watermark.
- **Reasoning:** Both were sandboxed by checkpointing the watermark version as a WIP commit, then swapping to icon-left. User compared and chose icon-left on legibility — the placeholder sprites are too small for the watermark aesthetic to read clearly; watermark felt softer but harder to parse.
- **Driver:** User-driven; assistant prototyped both.
- **Alternatives considered:** Watermark variant (right-aligned, ~18% opacity, text flowing over). Doc notes the rejected option so it isn't lost — if real illustration art lands later, the call could be revisited.

### Inline icon layout in DecisionModal
- **Decision:** Icon rendered inline alongside the prompt (options phase) and chosen-option label (flavor phase), NOT absolute-positioned over the modal.
- **Reasoning:** First two iterations placed the icon at `position: absolute, top: 40, right/left: 48`. Both hid the "YOU CHOSE" header in flavor phase because the absolute icon overlapped that line. User intervention: "seems like it needs to go inside (to the left of what you chose - using a grid or flex)" — sketched the exact desired layout. Final answer: flex-row `[ICON] [text]` rows that share content space.
- **Driver:** User-driven after seeing the visual problem.
- **Alternatives considered:** Top-right absolute (initial), top-left absolute (first fix), inline (final). The two absolute attempts taught the team that "decoration overlays" hide load-bearing labels.

### Rewind door = forward door color
- **Decision:** Rewind door fill `palette.surface` → `palette.accent`. Stroke `palette.inkMuted` → `palette.ink`. Width 1.5 → 2. Opacity 0.85 → 1. Now visually identical to the forward door.
- **Reasoning:** User on a dev-server test: *"the color of the backdoor is too lite - almost matches the desks and other objects - its okay being nearly the same color as the forward door - its positioned in a place that makes total sense."* Position alone differentiates the two doors — making the rewind subdued was creating confusion with room furniture, not clarity.
- **Driver:** User playtest feedback, captured as PR review comment, applied during rebase.
- **Alternatives considered:** Keep subdued but reduce stroke; ink-only (no fill); keep at palette.surface but darken it. User's instinct (position differentiates, color shouldn't) won.

### Month 1 unreachable in backward replay
- **Decision:** `previousReplayableMonth()` floors at 2; `enterReplay` reducer refuses target < 2 defensively. The 2020 NarrativeRoom intro is never reachable via the rewind door.
- **Reasoning:** User: *"don't let the user go back to the 2020 'NarrativeRoom' thats not necessary"* — the opening framing beat is a one-time read. Walking back to it would break the spell.
- **Driver:** User-stated.
- **Alternatives considered:** Skip narrative rooms generally (rejected — year-transition narratives are nice to revisit); leave it reachable (rejected per user).

### `/punch` skill goes user-global
- **Decision:** Source of truth moves from `.claude/skills/punch/SKILL.md` (project, gitignored except for skills/) to `~/.claude/skills/punch/SKILL.md` (user). Repo copy + gitignore exception removed.
- **Reasoning:** Project-level `.claude/skills/` is not an auto-discovery path in current Claude Code; the skill wasn't appearing in the slash-command picker even after commit. Moving to user-global makes it discoverable AND lets the user invoke `/punch` in any project. Trade-off: it stops being project-scoped — the user has to opt in to `docs/logs/time-log.md` per project. Solved by adding a Step 0 to the skill that asks before creating the log in a fresh project.
- **Driver:** User-driven once we identified the visibility problem.
- **Alternatives considered:** Use `update-config` to register the project path (didn't pursue — unclear if Claude Code supports it); use `anthropic-skills:skill-creator` (didn't need — direct file move worked); keep as documentation-only and append rows manually (rejected — defeats the whole point).

### Month-delta-float animation: drop the `-50%` translate
- **Decision:** Remove horizontal translate from the `month-delta-float` keyframes; emits now anchor right-edge-consistent via `right: 0` parent corner.
- **Reasoning:** Root-cause investigation after the user reported "still too big" despite reducing the 6+ tier's font size. The `-50%` shift scales with element width — wider strings (`+6 months pass`) slid further left, making bigger emits both LOOK bigger AND drift further into the stats column. Removing the shift makes width affect only width, not position.
- **Driver:** User reported the symptom; assistant diagnosed the keyframe-level cause.
- **Alternatives considered:** Smaller font size for 6+ (already tried twice, didn't fully fix); shorter wording (`+N mo` vs `+N months pass`) — rejected; tier-specific positioning logic — over-engineering.

## 4. Tensions resolved

**Background agent permissions wall.** The parallel agent doing PR #39 (modal icons) hit a `git commit` permission block in its sandbox after completing all code and verify. Foreground session took over the commit/push/PR cycle from the worktree — clean handoff once we knew the cause. Lesson: parallel-agent worktrees produce the artifacts but the main session may need to finish the git plumbing.

**Iterative visual review across three modal-icon positions.** The DecisionModal icon went through three positions (top-right → top-left → inline) before the layout worked. Each iteration was fast (~minute round-trip) because the user was running the dev server in parallel and could see each change on hot-reload. The third position came from the user sketching the desired layout in text, not from the assistant guessing. Pattern: when the assistant gets a position wrong twice in a row, ask for a sketch.

**"Still too big" emit, take three.** After two font-size reductions failed to satisfy, the user explicitly noted "the code looks right, but it's still huge — is this happening elsewhere?" That was the prompt to look outside the obvious spot. The animation keyframe's `-50%` translate was off-screen from the tier-size code, but it was the actual cause. Lesson: when a fix at the obvious site doesn't land, the actual source is one layer up (or down).

**Door label position vs door position.** When the user said the return door was "fixed to the left vs a 10px padding on the right," the initial reading was about the label. After applying that fix, the user clarified: it's the DOOR's position, not the label's. The label was already right — the door rectangle itself needed to move 10px right to match. Sequential disambiguation worked; if the user had felt unheard the first time they'd have said so more loudly.

**`/punch` invisible.** The whole point of the skill was discoverability. After moving to user-global, the user typed `/p...` in the picker and still didn't see it — same problem as before. The fix turned out to be "restart Claude Code so the session reloads the skill list" — the file was in the right place all along, just needs a session boundary to register. Validated by the user's actual `/punch out mid-morning day 3` invocation working at end of sprint.

## 5. Time analysis

### Sprint duration

**1h 46m** wall-clock, from `docs/logs/time-log.md` row `Day 3 mid-morning start 2026-05-12T13:24:00Z` → `end 2026-05-12T15:10:12Z`. **Authoritative** — not an estimate from conversation depth. This is the first sprint where time was punched at the boundaries rather than inferred after the fact.

### Traditional-team equivalent

**Assumed team:** 1 senior engineer (IC), 1 designer (UX/visual review), 1 PM (light-touch coordination). No QA. Indie-velocity, normal async cadence with PR reviews landing same-day.

**Assumed working pattern:** Async pull-requests with 1 sync review per PR, normal back-and-forth on visual decisions.

**Estimated duration: 5-8 working days.**

**What this estimate INCLUDES:**
- Backward replay (PR #40): full feature with state-shape change, three room types updated, frozen minigame replay, doc updates, era-mood-follows-viewed-month context refactor, animation bug fix. Equivalent: ~3-5 days for a senior eng with code review.
- NPC modal speaker (PR #38): kind-aware header + icon-left layout + shared helpers extraction. ~1 day eng + 0.5 day design iteration (icon-left vs watermark).
- Modal icons placeholder registry (PR #39): split component file + registry data, two modal layouts updated, design-doc subsections. ~0.5-1 day eng + parallel design.
- Pocket protector visual fix on `npc-peer-eng`: ~0.25 day (visual diagnosis + minimal SVG tweak).
- `/punch` skill migration to user-global: ~0.5 day (debug discoverability, file moves, skill edits, doc updates).
- Multiple visual iterations on DecisionModal icon position, rewind door color, door label anchoring: ~0.5-1 day of design-review cycles in a normal flow.

**What this estimate EXCLUDES (and would still need to be done):**
- Real illustration art on the modal icons (currently placeholders)
- Cross-viewport / responsive testing
- Accessibility audit on the new modal layouts and replay flow
- QA pass on all the new state transitions (replay entry/exit from different room types, save/load consistency post-STATE_VERSION bump)
- Real-art evaluation of whether watermark vs icon-left should be revisited
- Issue #26 (timeline redesign), #30 (transition vibe), #31 (arcade), #32 (Pong) — specced but unbuilt; not part of this sprint's deliverables

### Honest framing

This sprint produced what a 3-person team running normal-cadence agile would deliver in **5-8 working days**. The compression comes from (1) one person making decisions without coordination overhead, (2) the assistant handling the "draft code + doc + PR description" boilerplate that usually eats 30–50% of an engineer's day, and (3) the parallel-agent pattern producing PR #39 in the background while PR #40 was the foreground focus. The compression ratio is **roughly 25-40× on working hours**, **roughly 2-3× on calendar days** a team would burn (most of the team's wall-clock isn't engineering — it's waiting for the next standup, the next review).

What the sprint did NOT achieve that a team would have: outside code review, design alignment on the modal layouts before code (each icon position was tried then thrown away — a designer would have pre-routed to "inline" without the two absolute-positioned attempts), and any QA pass on the state-shape change.

## 6. What's next

- **42-minigame issue** to be filed (user asked for it earlier; I owe the issue creation now that PR #38 has merged)
- **Issue #30 (transition vibe)** is still the smallest open issue with the biggest moment-to-moment feel impact — recommended next code pickup
- **Issue #28's siblings:** #26 (endgame timeline redesign), #31 (arcade), #32 (Pong) all queued
- **Day 13c polish bundle** (a11y + era mood + viewport) still pending
- **Day 14 (title screen) and Day 15 (analytics + GH Pages deploy)** still queued

## 7. Observations for publication

**Background-agent parallelism worked.** This was the first sprint where I spawned a real `general-purpose` agent in an isolated worktree (`run_in_background=true, isolation=worktree`) to handle a discrete piece of work (PR #39) while staying in the foreground for the bigger piece (PR #40). The agent completed its implementation cleanly and got blocked only at the git plumbing — the main session finished commit/push/PR in a minute. The pattern is real and repeatable: pick a self-contained PR, brief the agent thoroughly (including memory rules), let it cook. The cost is the brief; the savings are wall-clock parallelism.

**Wall-clock time-tracking changes the conversation.** The `/punch` skill landed in the early-morning sprint and was used for the FIRST time at the end of this sprint. Before, the assistant had to ask or infer — and the session-log skill had its own memory rule about NOT estimating from conversation depth. Now the time is just there, in a file, authoritative. The `session-process-log` skill's §5 went from "estimate ranges with caveats" to "wall-clock from `docs/logs/time-log.md`." Small structural shift, big honesty improvement.

**Iterative visual review at hot-reload speed is the killer feature.** The DecisionModal icon went through three positions before settling. In a normal team flow that's three review cycles, each spanning a day. Here it was ~10 minutes total because the user could SEE each change on a hot-reloading dev server and respond with sketch-level specificity ("inside (to the left of what you chose - using a grid or flex)"). The bottleneck isn't the assistant's speed at generating code; it's the human's speed at evaluating visual decisions. Closing that loop is what unlocks the 25-40× number.

**Memory rules did silent work.** Three feedback memories applied without re-explanation this sprint: doc-rides-with-PR (every PR touched the design doc in the same commit), data-attrs-from-the-start (new SVG elements got `data-region` attrs in their first commit), and skip-verbose-browser-smokes (verify gate + reasoning, no preview_eval chains). The cost of writing those memories was 5 minutes each. The savings are forever.

---

*Generated by the session-process-log skill, with sprint boundaries from `docs/logs/time-log.md` per the `feedback_session_log_time_estimates.md` rule.*
