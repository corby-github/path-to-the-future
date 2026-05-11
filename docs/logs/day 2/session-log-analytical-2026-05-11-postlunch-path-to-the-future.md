# Sprint Log: Path to the Future — 2026-05-11, Post-Lunch (Sitting 3 of day 2)

**Date:** 2026-05-11
**Sprint:** Sitting 3 of 4 planned for day 2 (post-lunch through pre-dinner; sitting 4 to follow post-dinner)
**Sprint window:** Post-lunch through ~now — approximately **4 hours of focused work**, no significant breaks (user-confirmed: "basically worked full time")
**Participants:** 1 human + Claude (Opus 4.7, 1M context)
**Output type:** Working code (8 PRs) + design-doc bump (v1.0 → v1.1) + ~30K words of game content
**Wider context:** This is the 3rd sitting of day 2 (calendar 2026-05-11). Sitting 1 (morning) covered Days 6–8 of the build plan; sitting 2 (afternoon) covered Day 9 + polish. This sitting picks up Day 10 and runs through Day 13b.3.

---

## 1. Starting point

Heading into this sitting, the build was at the end of Day 9. Days 1–9 of the design doc §17 build plan were merged to main (`main` HEAD at `7032ed2`). The game had: player movement, room types, the room generator, decision + event systems, era-flavored content scaffolding (manifest + 4 era pools), HUD, class system, name entry, init flow, and the door-fade polish. Three rooms (Narrative, Consequence, Minigame) were scaffolded but lightly populated.

What was NOT yet in main:
- Day 10 content — the SWE career pack had only 2 stub decisions and 4 stub events
- Day 11 mini-games — placeholders only
- Day 12 endgame / score / recap — not started; game looped on month 120
- Day 13 polish — original "art tokens / sound / a11y" slot, undefined scope
- The §8b NPC/object modal spec — written into the design doc but with zero implementation

The plan going in was Days 10–13 across the rest of the day. What actually happened: Day 10–12 went mostly as planned; Day 13 was rebalanced mid-sprint into four sub-days (13a / 13b.1 / 13b.2 / 13b.3) when we surfaced that the §8b interactables system had never been built and was much more than a "polish" slot.

## 2. Deliverables produced

Eight PRs total (#16–#23, with #23 still open at sprint end). Each is the unit of work for one Day or sub-Day.

- **PR #16 — Day 10 content pass.** SWE career pack expanded from 2/4 stubs to **34 decisions** (19 universal + 15 SWE-specific) and **39 events** across all four era pools + 12 stat-triggered + 4 SWE-pool. Plus **40 spouse names** in a standalone `spouse-names.json` (resolves §20 open question). Voice-matched to the §1 "bittersweet, contemplative, occasionally playful" register with a deliberate dry-humor lean on ~25% of entries. Approximately 30,000 words of authored content.
- **PR #17 — Day 11 mini-games.** Three keyboard-driven minigames per §10: **Blackjack** (hit/stand only, dealer plays to 17, $200 stake), **Code Review** (single hand-authored snippet with an off-by-one bug, four MC options), **Stacker** (Reaction Sprint — 5 blocks visible from start, bottom-up activation, target column, soft-fail). Placed at months 32 / 60 / 90 in `months.json`. DevPanel gained a `minigame` jump dropdown for fast iteration.
- **PR #18 — Day 12 endgame + score + recap + credits.** `progress.gameOver` state field + routing; `computeScore` (pure breakdown function); `EndgameScreen` (stats + class + score breakdown + decisions-by-year timeline + Credits/Begin Again buttons); `CreditsScreen` (auto-scroll, two entry modes, infinite loop after first iteration); `endgame-taglines.json` + `credits.json` (27 credit roles, JSON-driven). STATE_VERSION bumped 1.1.0 → 1.2.0 with old saves auto-discarded. Init-flow pickers got full keyboard parity. Funny replay confirmation ("If we do this, there's no going back. I know how fickle you can be.").
- **PR #19 — Day 13a interactables system.** Closes the gap between §8b spec and implementation. `TypewriterText` component (character reveal, punctuation pauses, `[[pause:N]]` tags, skip-to-end). `NPCModal` (Tier 1 + Tier 2 dialogues). `InteractableDef` + `InteractableDialogue` types. Loader updated tolerantly. Two starter entries (intern + coffee-machine). E-key proximity trigger in `DecisionRoom`.
- **PR #20 — NPC random walk (rescued from PR #19).** Two commits that landed on the branch *after* PR #19 was merged. NPCs wander within ±80px of their spawn at 40–70 px/sec; stop when player adjacent or modal open. Cherry-picked clean onto a fresh branch.
- **PR #21 — Day 13b.1 content + generator integration.** Interactables.json expanded from 2 entries to **15** (7 NPCs + 8 objects), **30 dialogues** (23 Tier 1 / 7 Tier 2). `placeInteractables` helper (seeded, weighted 1–3 per room, non-overlapping placement). `DecisionRoom` refactored for multi-interactable rendering, nearest-target proximity, parallel-array NPC motion in a single RAF.
- **PR #22 — Day 13b.2 sprite art + game font + typewriter fix.** Real flat-color SVG sprites per `art` token (7 NPC variants — coffee cup / glasses / clipboard / hair tuft / wrist watch / backpack / tie — and 8 distinct object glyphs). New `--font-game` CSS variable single source of truth (swapped Pixelify Sans → JetBrains Mono for small-text readability). Typewriter skip-to-end bug (key press bounced reveal backward) fixed via `skippedRef`.
- **PR #23 — Day 13b.3 playability (open at sprint end).** Tiered month-change feedback (HUD label pulse + tiered "+N mo" floater + explicit status-bar message for jumps ≥ 2). Per-NPC pause logic (only the targeted NPC freezes; object interactions never freeze NPCs). Baseline +1 network for any NPC interaction.

**Design doc bumped v1.0 → v1.1** mid-sprint. Change log added at the top. Surgical inline updates to §6 (gameOver, initComplete), §7 (score formula reference), §10 (Stacker mechanic), §11 (E interaction key), §12 (STATE_VERSION progression table), §15 (Pixelify scope note — superseded later), §16 (init-flow keyboard parity), §17 (build order completion + 13a/b/c phasing), §19 (project structure expansion), §20 (spouse-name list resolved). Three new end-sections: §21 Endgame & Recap, §22 Credits System, §23 Interactables.

## 3. Key decisions

### Voice/tone checkpoints during content pass
- **Decision:** Author a small "starter batch" (5 decisions + 5 events) and validate voice with the user before scaling to the full pool of 34/39.
- **Reasoning:** Voice is load-bearing for this game. Writing 50+ entries in the wrong register is unrecoverable without a rewrite.
- **Driver:** Assistant proposed the cadence option (a/b); user chose (a) starter-batch.
- **Alternatives considered:** Write the whole pool then review (faster but riskier).

### Stacker mechanic redesign
- **Decision:** Replaced original Reaction Sprint design (10 attempts, click-to-hit) with **Stacker** — 5 blocks visible from start, bottom-up activation, spacebar to lock, target column highlight, soft-fail per miss.
- **Reasoning:** User wanted keyboard-only input (matching the rest of the game) and a more "game-y" mechanic than generic twitch.
- **Driver:** User. ("we should make it keyboard, like the others"; later "use 5 blocks, all visible from the start").
- **Alternatives considered:** Mouse-driven target-clicking (rejected as off-pattern).

### Endgame score formula: interpretable over balanced
- **Decision:** Score is a line-item breakdown (`experience + savings/10 + wellbeing*25 - burnout*15 + relationship*20 + decisions*25`) shown to the player on the recap screen.
- **Reasoning:** Voice + transparency. Players see why they scored what they did.
- **Driver:** Assistant proposed formula; user signed off ("we can always tweak").
- **Alternatives considered:** Hidden "balanced" score (rejected — defeats the recap purpose).

### Credits as a JSON-driven statement
- **Decision:** Credits screen pulls from `public/credits.json`. Auto-scrolling roll with a 2s hold at top. Two entry modes (browse from button; replay gate with "BEFORE YOU DO THIS AGAIN..." banner + funny confirm).
- **Reasoning:** User wanted credits to be a public statement about the human + AI collaboration. JSON keeps it editable without code changes. The replay gate gives the player a moment of pause before nuking their run.
- **Driver:** User asked for it explicitly during Day 12.
- **Alternatives considered:** Inline TS constants (less flexible); single mode (less considered for replay confirmation).

### Day 13 phasing
- **Decision:** Rebalanced the original "Day 13 polish" slot into four sub-days: 13a (interactables system + 1 NPC + 1 object proof), 13b.1 (content fill + generator integration + multi-interactable rendering), 13b.2 (sprite art + game font architecture), 13b.3 (playability fixes from playtest).
- **Reasoning:** The §8b interactables system had been spec'd but never built. Building it required engine + schema + content + visuals + interaction layer — far more than "polish." Splitting into focused sub-days kept each PR reviewable.
- **Driver:** User. Surfaced mid-PR-22 review that interactables were a real gap.
- **Alternatives considered:** Cram into one Day 13 PR (rejected as too much for one reviewable unit); defer to a Day 14 (rejected — was scope-creep into a new build day).

### Font architecture: --font-game CSS variable
- **Decision:** Single CSS custom property in `:root` controls the game font. Body uses `var(--font-game)`. All inline `fontFamily` references collapsed to `'inherit'` except real monospace blocks (DevPanel, CodeReview's `<pre>`, Blackjack card faces).
- **Reasoning:** First iteration scoped Pixelify Sans to NPC modal only → user reported the modal felt disconnected from the rest of the UI → broadened Pixelify Sans to the whole game → user reported small text was illegible → swapped to JetBrains Mono via the new CSS variable. The variable means future font swaps are one line.
- **Driver:** User pushed back twice; assistant proposed the CSS-variable structure to make the third swap painless.
- **Alternatives considered:** Per-component font props (rejected — bloats every component); class-based theming (rejected — overkill).

### Per-NPC pause logic
- **Decision:** Replaced single boolean "NPCs should move" gate with layered rule. Global pause (all stop): committed / decision / event. Per-NPC pause (just one stops): player adjacent to that NPC, or player talking to it. Object interactions don't pause any NPCs.
- **Reasoning:** Original logic froze every NPC whenever any modal opened. User playtest revealed this killed the "alive room" feeling, especially when the modal was just a coffee-machine object.
- **Driver:** User playtest feedback.
- **Alternatives considered:** Pause only the engaged NPC even during decision/event modals (rejected — the door decision is meant to be a "world pauses" beat).

### Network baseline for NPC interactions
- **Decision:** Talking to any NPC grants `+1 network` on modal close, regardless of dialogue tier. Tier 2 effects layer on top.
- **Reasoning:** Playtest revealed that Tier 1 flavor dialogues felt like wasted engagement — no signal that "you reached out to a person." A baseline reward makes social interaction always slightly positive while still letting Tier 2 picks compound (or counteract, in the case of decline options).
- **Driver:** User.

## 4. Tensions resolved

- **PR #19 missed merge window.** The user clicked "merge" before two later commits (NPC movement + speed bump) had been pushed. Result: two orphaned commits on a closed-PR branch. Resolution: cherry-pick onto a fresh branch from main, open follow-up PR #20. Cost: ~10 minutes of recovery, no work lost. Lesson noted: timing of merge vs. push matters when iteration is fast.

- **"More humor" feedback after the starter batch.** Initial 5+5 starter batch read as too earnest. User: "tone is right - a little cynical is fine - we need some more humor as well." Resolution: humor-focused second batch (6 decisions + 6 events leaning observational deadpan: the 47-minute standup, the MLM pitch, the Friday deploy, etc.). Got the lock on voice before scaling to the full pool.

- **Oregon Trail "spreadsheets" line.** Initial special-thanks entry — "Oregon Trail, for showing how to make spreadsheets feel like life" — didn't land. User: "why does the oregon trail reference spread sheets? not sure about that one." Replaced with the user's own framing: "Oregon Trail, for showing us that dying of dysentery doesn't have to be the end of the game."

- **Credits screen needed to loop infinitely.** First implementation played credits once then showed action buttons. User: "we need the credits to scroll again after they are done." Resolution: switched to `animation-iteration-count: infinite`, made action buttons always visible, removed the `phase` state machine.

- **Canvas wireframe during door fade.** When the player walks through the door, the SVG fades to opacity 0. Originally the border faded with it — the modal floated in black space. User: "it would be nice to keep the game canvas bounds — light gray, very low opacity is fine." Resolution: moved the border from the SVG to a wrapper div so it survives the fade.

- **Multi-month jumps were invisible.** User: "when we jump months, it's almost totally lost on the user. It can be a lot of time 'lost'." First fix was a single floater + pulse (same treatment for all magnitudes). User pushed back: jumps need more weight. Resolution: tiered floater (13/18/24 px font, 1.2/1.9/2.7s duration) plus an explicit "N months pass." in the status bar for jumps ≥ 2.

- **Font dissonance, then readability.** Modal-only Pixelify Sans → user noted dissonance ("the modals now look separated from NPCs because of the fonts"). Broadened to all UI → user noted small-text illegibility ("this font... it's cool for larger text but not smaller fonts"). Resolution: swap to JetBrains Mono, formalize via `--font-game` so the next swap is trivial.

- **NPC pause was too aggressive.** User: "when I interact with a printer (object) NPCs stop moving — I don't like that. Same when I stop one NPC, all others stop — nah, let's fix." Resolution: per-NPC pause logic.

## 5. Time analysis

### Sprint duration

**Approximately 4 hours of focused post-lunch work**, no significant breaks. User-confirmed: "basically worked full time."

The estimate is from work volume + conversation depth, not measured timestamps. If a stricter accounting is needed, the user could refine — but the sprint clearly fits within a single afternoon between lunch and dinner.

### Traditional-team equivalent

**Assumed team:** 1 PM, 1 game designer, 1 writer, 2 engineers (frontend + game systems), 1 visual designer.
**Assumed working pattern:** async work + 2–3 sync meetings per major decision; standard review cycles.
**Estimated duration:** **2–3 weeks of team time** (≈80–120 person-hours).

**What this estimate INCLUDES (everything the sprint actually produced):**
- ~30K words of game content (decisions + events + spouse names + credits + interactable dialogues)
- 3 mini-games (mechanic + content + integration)
- Endgame system (gameOver routing, score formula, recap screen, decision timeline)
- Credits system (JSON content + screen + two entry modes + replay flow)
- Interactables system (schema, content, placement, sprites, NPC modal, typewriter, room rendering, multi-interactable proximity, NPC movement)
- Game font architecture (CSS variable + JetBrains Mono swap)
- Tiered month-change feedback
- 8 PRs with review-and-merge cycles
- Design doc v1.0 → v1.1 update (change log + inline edits + 3 new sections)
- Multiple iterative playtest fixes

**What this estimate EXCLUDES (would still need to be done before "v1 ship"):**
- Real user testing (3–5 days)
- Accessibility audit (Day 13c work — deferred)
- Era mood tuning + cross-viewport testing (Day 13c)
- Sound design (deferred per design doc)
- Real sprite art polish (placeholders are functional, not finished — would need an artist 2–3 days)
- XP gain mechanic — currently `addXp` is only called at init seed; nothing accumulates after. Flagged in memory as a known gap.
- Stakeholder review cycles
- Mobile-specific testing

### Honest framing

This sprint delivered roughly **2–3 weeks of small-team output in ~4 hours**. The compression is in the ~20–30× range for *these deliverables*. Caveats: the underlying design doc work that made the sprint efficient was done in earlier sittings (not counted here); the placeholder visuals would need an artist's pass; player-facing polish (a11y, era mood, sound) was deliberately deferred to a later sub-day. The compression number means more when paired with what was *not* done — see the "excludes" list above.

## 6. What's next

- **After dinner (sitting 4):** Day 13c polish — a11y audit, era mood tuning, cross-viewport check. Maybe typewriter tick sound (deferred § 8b polish).
- **XP gap fix as a focused small PR.** `addXp` is called only at init. The class-tier progression is dormant. Design call needed: flat per-decision XP, per-month base, or stat-derived formula. ~30 min PR when triggered.
- **Real sprite art polish (13b.3 polish pass).** The current sprites are kind-distinct placeholders; an artist's pass would replace them with finished art tokens.
- **Soft-permadeath events (deferred from earlier days).** `EventDef.endsGame: true` is wired but no events use it. When authored, the endgame screen would also trigger on event-driven game-overs (not just month 120).
- **PR #23 (currently open) merge** — playability batch.

## 7. Observations for publication

**Starter batches saved rework.** The "write 5 first, validate voice, then scale" cadence caught the "more humor" feedback before 30+ entries were written in the wrong register. This pattern would be hard to enforce in a traditional content-writing process where draft → review cycles are days apart; with the AI it's minutes. The discipline isn't about speed — it's about catching tone drift early.

**Iterative playtest produced design fixes not in the spec.** Per-NPC pause logic, multi-month feedback, baseline network for NPC chats, canvas wireframe during fade, credits looping — none were in the design doc v1.0. All emerged from playing the game and noticing what didn't feel right. The doc is a starting point; play surfaces what specification can't. By the end of the sitting the doc had been updated to v1.1 to absorb these fixes.

**Phasing as a tool.** When the §8b interactables system gap was surfaced mid-sprint, the natural answer was "expand Day 13's scope." Instead we split Day 13 into 13a / 13b.1 / 13b.2 / 13b.3 — four sub-days, each shipping a focused PR. Each PR was reviewable on its own; each gave a clear merge point. The lesson: when a day grows beyond a day, the answer is more days, not bigger PRs.

**Lint as a design forcing-function.** React Compiler's `set-state-in-effect` rule forced three meaningful rewrites this sprint (TypewriterText reset-on-text, Stacker NPCs, NPCModal phase derivation). Each rewrite was annoying in the moment but resulted in cleaner code. The rule isn't ceremony; it catches real anti-patterns. Worth defending against the temptation to disable.

**The "playability PR" pattern.** The final PR (#23) is purely about feel — month-change feedback, NPC pause behavior, network baseline. Each one came from playtest, not the build plan. Reserving a dedicated PR for these (rather than mixing them into feature PRs) means each can be reviewed and reverted independently if any of them lands wrong.

**The cherry-pick rescue.** Merging a PR before all the intended commits have been pushed is a real failure mode in fast-cadence flow. The recovery (cherry-pick onto a fresh branch off main) is now routine, but the lesson is worth keeping: confirm pushed state before clicking merge when iteration is mid-stream.

---

*Generated by the session-process-log skill.*
