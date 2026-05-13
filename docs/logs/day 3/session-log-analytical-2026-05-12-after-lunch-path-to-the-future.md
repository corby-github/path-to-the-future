# Sprint Log: Path to the Future — 2026-05-12, after-lunch sprint

**Date:** 2026-05-12
**Sprint window:** 2026-05-12T17:41:26Z → 2026-05-12T20:34:00Z (≈ 2h 53m, per `docs/logs/time-log.md`)
**Participants:** 1 human (Corby Hoback — owner-builder) + Claude Code (Claude Opus 4.7, 1M context, acting as pair)
**Output type:** Six merged PRs (#42 – #47) + a started PR (#48) cut off by context limit
**Wider context:** Sprint 3 of day 3 of an ongoing build that began 2026-05-10. Day 3's early-morning and mid-morning sprints landed PRs #25 / #29 / #35 / #36 / #37 / #38 / #39 / #40 plus the `/punch` user-global move. This sprint picks up at the punch-in.

---

## 1. Starting point

At sprint start (13:41 EDT / 17:41 UTC), the mid-morning sprint had already wrapped: design doc was at v1.3, STATE_VERSION 1.3.0, `/punch` was validated working as a user-global skill, and the handoff doc + session logs from mid-morning were untracked in the working tree. Day 13c (a11y + era moods + cross-viewport) was the next priority per the handoff, with the original Day 13 scope still pending. Open issues on deck: #26 (endgame timeline unreadable), #30 (transition vibe), and an unfiled "42-minigame" promise from the previous sprint.

The user opened the sprint with two priors: do the housekeeping commit first (clean working tree before code), and re-establish what the project IS before diving in ("what are we building and what's the general vibe").

## 2. Deliverables produced

- **Housekeeping commit `4ae3986`** — mid-morning handoff + analytical/marketing session logs landed on main.
- **Issue #41 filed** — *42-minigame (Hitchhiker's Guide callback, universal, multiple-choice)* — fulfills the owed-promise queued during the mid-morning sprint.
- **PR #42 merged** — *Transition vibe* (closes #30). `progressSlice.monthAdvanceCueNonce` + `cueMonthAdvance` reducer; HUD listens to the cue and emits the `+1 mo` floater at fade-start (was after-fade) with a dedup ref for the subsequent `completeMonth` natural-emit. `POST_EFFECT_PAUSE_MS` trimmed 1400 → 900ms. Door-entry beat: `MODAL_POP_DELAY_MS` bumped 300 → 500ms; new `decision-modal-pop` + `decision-modal-dialog-pop` keyframes in `global.css`. New §4.1 *Room transition* in the design doc.
- **PR #43 merged** — *Endgame recap rework* (closes #26). New `CareerTimelineScreen` (dedicated full-canvas view, ↑↓/PgUp/PgDn/Home/End scroll, Close button + Enter/Space/Esc, `DecisionTimeline` accepts `forwardRef`). Final Stats rows now lead with `StatIcon` glyphs. Timeline rows render the decision prompt above the option taken (resolved against `pack.decisions` by `decisionId`, falls back to option-only). Date column widened 80 → 124px + `whiteSpace: nowrap`. 3-action recap nav (`Career Timeline` · `Credits` · `Begin again`). `DecisionModal.finale?: boolean` prop swaps "YOU CHOSE" for a centered "Well, then." / chosen-line / italic-flavor / "End" beat. `CreditsScreen` Begin Again confirm: 4 randomized snarky lines from a `REPLAY_CONFIRM_MESSAGES` pool, styled bold italic rust-red.
- **PR #44 merged** — *Day 13c polish bundle + first-run tutorial*. (1) a11y: `NPCModal` focus trap + restore + `aria-modal` + dynamic `aria-label`; `EffectChips` per-chip `aria-label` via local `STAT_NAMES_FOR_AT`; picker container `role="group"` + label; `NameEntry` counter `aria-live`; `@media (prefers-reduced-motion: reduce)` collapses all keyframes to 1ms. (2) Era-mood tuning in `manifest.json`: pandemic 0.7 → 0.55 sat / -8 → -14 hue; ai-shift 1.05 → 1.18 sat / +4 → +10 hue. (3) Cross-viewport code review at 1024 / 1440 / narrow-laptop — no code changes, flagged as audited; `palette.positive` contrast (3.15-3.35:1 across eras) noted as a known borderline. (4) First-run tutorial: `meta.tutorialDismissed` + `dismissTutorial`; `TutorialOverlay` 3-step coachmark with gameplay paused during the beat. (5) `CreditsScreen` confirm: font-size 16 → 15, line-height 1.5 → 1.
- **PR #45 merged** — *Finale month + locked-door interactable + dev triggers + tutorial reposition*. Month 120 layout: two doors stacked on the right edge — top is the **locked, examinable** door (proximity → `[E] try` → opens `NPCModal` with the synthetic `LOCKED_DOOR_INTERACTABLE`); bottom routes to a hardcoded `FINALE_DECISION` with prompt *"Ten years. Did any of that stick?"* and three deadpan options + flavors (*"Bits did. Most didn't."* / *"Not really. I'll leave it here."* / *"Hard to say. It mostly felt like a Tuesday."* — chosen after three drafting passes). New `locked-door` sprite token in `InteractableSprite` (padlock with shackle + body + keyhole). DevPanel "endgame: trigger" button replaced with a dropdown: `title` / `tutorial` / `finale month` / `endgame`. New `resetTutorial` action in metaSlice. TutorialOverlay repositioned from viewport-anchored to canvas-container-anchored (was pushing the bubble off the canvas right edge on widescreens).
- **PR #46 merged** — *Hide relationship in endgame UI until wired*. Confirmed via grep audit that no decision or event in the SWE pack moves `stats.relationship`. `StatsPanel` Relationship row and `ScorePanel` Relationship score line now conditionally render (`!== null` and `!== 0` respectively), matching the HUD's existing conditional. Underlying state, score formula, icon, screen-reader labels preserved.
- **PR #47 merged** — *Title screen (Day 14, §16.0)*. New `TitleScreen` component renders on app mount before InitFlow / Game. Wordmark in **JetBrains Mono 700** with a sharp `palette.accent` letterpress drop-shadow (+4px/+4px, no blur) — Pixelify Sans tried first per the v1.2 spec, rejected mid-iteration. Italic tagline (*"A life, one month at a time."* — pack-agnostic). Ambient floor band with 3 wandering NPCs + 2 stationary objects, deterministic-per-day sprite mix via date-seeded mulberry32. 1Hz-blinking *"PRESS ANY KEY TO START"* plain text (a pill version was tried, dropped — read as too UI-modern). First keydown/pointerdown unmounts; **acknowledge routing reworked from spec** — `gameOver === true` triggers full reset chain + `clearPersistedState` and falls through to InitFlow instead of routing to EndgameScreen.
- **Post-#47 tail commits** — landed on the `feat/title-screen` branch after the initial #47 merge: welcome-back block + prompt copy swap (continue/start), HUD preview row on resumable runs, `store.subscribe` auto-persist (fixes refresh-loses-init bug), Begin Again page reload, drop welcome subline. Corby pulled these into main directly during the post-session gap.
- **Started PR #48** — `feat/init-flow-canvas-frame`. Branch cut, App.tsx `TitleWrapper` renamed → `PageFrame` and `InitFlow` wrapped, `CareerPicker` outer reframed to canvas-frame styling. Context window filled before the other three init phases (NameEntry / ClassPicker / IntroScene) and the verify gate. Resumed in the after-dinner sprint.

## 3. Key decisions

### Endgame recap layout: dedicated view, not tabs
- **Decision:** The career timeline lives in its own full-canvas screen (`CareerTimelineScreen`) reached via a third recap action button — not as a tab inside the recap, and not by dropping the canvas frame.
- **Reasoning:** First proposal dropped `aspectRatio` so the recap could grow; user vetoed (broke consistency with the canvas-bounded rest of the app). Second proposal added Summary | Timeline tabs; user vetoed (felt over-abstracted for a recap screen, and the tab pattern wasn't established elsewhere). Third proposal — dedicated screen reached via button — matched the existing `CreditsScreen` pattern: same shape, same Esc-closes idiom, just a different content payload.
- **Driver:** Mutual. User pushed back on each technically-correct proposal that didn't fit the project's existing design language.
- **Alternatives considered:** Dropped: aspectRatio drop with page scroll; tabbed view with `Tab` key toggle; collapse-by-year expandable rows.

### Title-screen font: JetBrains Mono 700, not Pixelify Sans
- **Decision:** Wordmark renders in JetBrains Mono 700 (inherited via cascade) with a sharp `palette.accent` letterpress drop-shadow. Pixelify Sans loaded then unloaded.
- **Reasoning:** Design doc v1.2 nominated Pixelify Sans for the "SNES marquee" read. First sandbox at marquee size read as goofy on a contemplative-game title — wrong tonal register. JetBrains Mono at weight 700 reinforces the rest of the UI's terminal typographic identity; the letterpress drop adds the dimension Pixelify was bringing without the cartoon weight.
- **Driver:** User. Visually rejected Pixelify mid-iteration ("the font is terrible").
- **Alternatives considered:** JetBrains Mono lighter weights (didn't have enough presence); hand-rolled SVG wordmark (more work than warranted).

### Title-screen prompt: plain blinking text, not a pill
- **Decision:** *"Press any key to start"* / *"Press any key to continue"* is plain text with the 1Hz `typewriter-caret-blink` keyframe — no pill background.
- **Reasoning:** Pill was added because the surface-tinted floor band was washing out a plain prompt. User found the pill too UI-modern next to the letterpress wordmark; the retro arcade *"INSERT COIN(S)"* register fits the project's playful-contemplative blend better.
- **Driver:** User. After eyeballing both versions, the pill felt out of register.
- **Alternatives considered:** Pill kept (rejected); slow breath-pulse animation instead of blink (rejected — too contemplative, lost the arcade nod).

### Acknowledge routing on title screen: auto-reset on `gameOver`, not route to endgame
- **Decision:** When a player presses a key on the title and `progress.gameOver === true`, dispatch the full reset chain (`resetProfile` / `resetProgress` / `resetStats` / `resetFlags` / `resetHistory` / `resetMeta` + `clearPersistedState`) and fall through to InitFlow.
- **Reasoning:** Original spec routed straight to `<EndgameScreen />` to let the player review their finished run. In practice, this read as confusing — the player pressed "start" on the title and got dropped onto a summary. The endgame screen is still reachable in-session via the natural month-120 completion flow; after-reload, the player wants to start a fresh run.
- **Driver:** User. Reported the bug after testing finished-run reloads.
- **Alternatives considered:** Spec'd routing kept (rejected); add an explicit "review last run" choice on the title (rejected — broke the "single beat, no menu" §16.0 principle).

### Auto-persist via `store.subscribe`, not just per-room-transition
- **Decision:** `store.ts` now subscribes to every Redux dispatch and calls `persistState(store.getState())` — broad, not opportunistic.
- **Reasoning:** Welcome-back block on the title expected `profile.initComplete` to survive refreshes. It didn't, because persistence only fired from `useRoomTransition.exitRoom` (and a couple of one-offs). Anything done before the first room exit — career pick, name entry, class selection, narrative intro — was in-memory only. Subscribing to every dispatch closes the gap at minimal cost: dispatches in this game map to discrete events (decisions, transitions, init steps, tutorial advances), not per-frame movement (which lives in local React state, not Redux).
- **Driver:** Mutual. User reported the symptom; AI root-caused.
- **Alternatives considered:** Targeted persist calls at each init-flow `setProfile` (rejected — fragile, more places to forget); Redux middleware (rejected — heavier; subscribe is one line).

### Locked door becomes an interactable, not a status-bar swap
- **Decision:** The finale's top "locked" door is an examinable `LOCKED_DOOR_INTERACTABLE` (kind: `object`, art: `locked-door`). Proximity → `[E] try` hint → press E → opens `NPCModal` with the *"This one is locked! You don't seem to have the key... oh well."* line. No status-bar swap, no in-rect message.
- **Reasoning:** First implementation dropped the message into the status bar when the player walked into the rect. User read it as a hidden mechanism (text appears, no UI affordance) and asked for it to behave "like an NPC is saying it." Reusing the `NPCModal` flow makes the locked door read as something you examine, mirroring every other interactable in the room.
- **Driver:** User. Reframed the interaction model.
- **Alternatives considered:** Status-bar swap kept (rejected); a standalone modal component (rejected — duplication of NPCModal's visual idiom).

### Finale-decision copy: dry KRZ-meets-HHGTTG, not pop-culture quippy
- **Decision:** *"Ten years. Did any of that stick?"* with options *"Bits did. Most didn't."* / *"Not really. I'll leave it here."* / *"Hard to say. It mostly felt like a Tuesday."* and matching flavor replies.
- **Reasoning:** Three drafting passes. First draft had explicit pop-culture references (GameBoy manual, Blockbuster card, 8th-grade pop quiz) — user judged too quippy. Second draft dialed back to plainer phrasing (*"Probably nothing. I'll set it down."*) — closer but lost the comedic weight. Third draft introduced the *"Tuesdays do most of the work"* echo, which lifts the *"Same coffee stain"* banality motif from the §11.1 replay status pool — earned via in-game setup, not borrowed from outside.
- **Driver:** Mutual. User flagged cheesiness; AI re-drafted with explicit tonal anchors (KRZ minimalism, HHGTTG dryness, the *"Different month. Same coffee stain"* register).
- **Alternatives considered:** Three full sets (A: contemplative; B: dry/deadpan; C: wistful) plus per-slot menu before settling.

## 4. Tensions resolved

- **Endgame timeline: aspectRatio drop vs. canvas frame.** First AI proposal dropped `aspectRatio` so the timeline could grow vertically with page scroll. User pushed back ("this breaks the game canvas fixed size — we have no other scrolling of the game board"). Pivot to tabs. User pushed back on tabs. Pivot to dedicated screen. Took ~3 iterations; the final answer was inferable from the existing `CreditsScreen` pattern but wasn't the AI's first instinct.

- **Career timeline content: option text alone vs. prompt + option.** AI's first timeline implementation showed only the option label (*"Go"*, *"Build it"*, *"Sign up. You'll go."*). User flagged it as nonsensical without the setup ("Go what? Where did we go?"). Fix: resolve `decisionId` against `pack.decisions` to look up the prompt, render prompt above the option. The data was always available; the UX gap surfaced only via the human reader.

- **Tutorial overlay: viewport-relative vs. canvas-relative anchoring.** First implementation used `position: fixed; inset: 0` — pushed the door tip off the canvas right edge on widescreens (canvas is centered with margin; viewport edge ≠ canvas edge). Switched to `position: absolute` inside the DecisionRoom container (which is `width: var(--canvas-display-width); position: relative`). Per-step paddings hand-tuned: top-center for status bar, dead-center for objects, middle-right for door. Classic frame-of-reference mismatch.

- **Title-screen visual register: Pixelify spec vs. JetBrains Mono in practice.** Followed the v1.2 design-doc nomination of Pixelify Sans for the wordmark. Visually rejected at marquee size — read as cartoony, not contemplative. Swapped to JetBrains Mono Bold + letterpress drop. Updated the design doc to lock the new choice. The spec was wrong; the eyeball caught it.

- **Refresh-loses-init bug.** User reported refreshing wiped the player back to InitFlow even mid-run. AI initially expected the welcome-back block to work; the symptom revealed that `persistState` only fired on room transitions, not on init-flow dispatches. One-line fix (`store.subscribe`) but the design assumption — "we persist after each room" — quietly didn't extend to "we persist after each meaningful state change."

- **Begin Again routing.** User reported pressing any key on the title from a `gameOver=true` state dropped them onto the endgame screen ("I pressed start and got a summary"). Spec'd behavior was technically correct (route to last endgame for review); UX was wrong. Auto-reset on title key-press when `gameOver` — endgame review stays accessible in-session via the natural completion flow, but a reload-then-start always means "new run."

- **Init-flow canvas frame, mid-sprint.** Started PR #48 with ~15 minutes of context remaining. Got through App.tsx + CareerPicker before the limit. The branch + remote were established cleanly enough that the next sprint could resume from the punch-end note ("limit reached - stopped while processing feat/init-flow-canvas-frame") rather than starting over.

## 5. Time analysis

### Sprint duration

**Measured: 2h 52m 34s** (start 2026-05-12T17:41:26Z → end 2026-05-12T20:34:00Z, from `docs/logs/time-log.md`). Both bounds are real `/punch` events, not estimated.

### Traditional-team equivalent

**Assumed team:** 1 PM, 1 senior engineer, 1 mid-level engineer, 1 designer.
**Assumed working pattern:** Async work + 1 daily standup + design-review pairing where needed.

**Estimated duration: ~2.5 to 3.5 weeks** (12-17 working days), distributed roughly:

- **#42 transition vibe** — ~1.5 days. Spec'ing the cue-vs-direct-dispatch trade-off, implementing the dedup ref, hand-tuning the door-fade timing, regression-testing the multi-month skip path.
- **#43 endgame recap** — ~4 days. Most expensive: three design rounds, then ~1.5 days implementing the dedicated screen + forwardRef + keyboard scroll, then ~1 day on the tone-writing iterations for the random confirmation lines and finale-mode flavor phase, then a half-day on the decision-prompt-in-timeline content fix.
- **#44 Day 13c bundle** — ~2.5 days. a11y audit and fixes (1d), era-mood tuning + contrast measurement (0.5d), tutorial spec + build (1d).
- **#45 finale** — ~3.5 days. Finale layout + locked-door reframe as interactable (1.5d), DevPanel dropdown + `resetTutorial` (0.5d), tutorial overlay reposition + per-step paddings (0.5d), copy iteration through three drafts (1d).
- **#46 hide relationship** — ~0.5 day. Mostly the audit + grep; the code change is trivial.
- **#47 title screen** — ~2.5 days. Wordmark iteration including the Pixelify-then-JetBrains pivot (1d), ambient autoplay + deterministic seed (0.5d), acknowledge-routing rework (0.5d), then welcome-back + HUD preview + persist-fix iteration (0.5d).
- **Start of #48** — ~0.5 day spent (carries over).

**Total estimate range: 14–17 days** (~3 weeks for a small team).

**What this estimate INCLUDES:**
- Design discussion / pairing time
- Implementation
- In-iteration QA (eyeball verification by the user)
- Design doc updates within each PR
- Commit messages and PR descriptions

**What this estimate EXCLUDES (and would still be required in a real team workflow):**
- Stakeholder alignment / PM review cycles
- Real QA on a test environment
- User testing of the tutorial coachmark
- Visual design review beyond the user's own eye
- a11y testing with actual screen readers (the WCAG-3.0/3.15-ratio finding is from a calc-script, not from JAWS/VoiceOver users)
- Design-system documentation for the new patterns (canvas frame, modal-button style)
- Cross-browser / cross-device verification beyond desktop Chrome

### Honest framing

Roughly **6 PRs in ~3 hours of live pair-work, against a small-team estimate of 2.5-3 weeks.** That's a ~10-15× compression on the work actually performed, with the explicit caveat that the excluded categories (real QA, user testing, stakeholder reviews) are where a real product team spends a meaningful share of its time. The compression is real on the work-that-was-done axis; it is not a claim that this sprint produced shippable-without-further-process output.

The other honest note: this sprint sat on top of two prior sprints today (early-morning + mid-morning) that built the architectural ground these PRs landed on. Without the rewind-door foreshadow ("Something about a key" in §11.1) the locked-door payoff doesn't land. Without the existing modal-pop choreography from earlier in the day, the finale modal doesn't inherit a working motion vocabulary. Each sprint's compression ratio reads higher because of the unmeasured scaffolding the prior sprints left.

## 6. What's next

- **PR #48** — init-flow canvas frame. Resume from the punch-end note. NameEntry / ClassPicker / IntroScene still need their outer screen swap. (Resumed and merged in the after-dinner sprint that followed.)
- **Pull-in `feat/title-screen` tail commits** — welcome-back, HUD preview, `store.subscribe`, Begin Again reload, drop subline. Corby handled this directly while the AI was offline.
- **Day 15** — analytics (GoatCounter) + GitHub Pages deploy. Final critical-path item before v1 ship.
- **Open issues that didn't touch this sprint:** #31 (arcade), #32 (Pong), #41 (42-minigame). All deferrable to post-v1.

## 7. Observations for publication

The most repeatable observation from this sprint is that **the user's eye caught the things the AI's first proposals missed**. Not the technical correctness — the AI shipped code that worked on the first pass each time. What got missed was design-language fit: the aspect-ratio drop was correct for the timeline-readability problem but wrong for the canvas-framed-app context; Pixelify Sans was the spec'd font but wrong at marquee size; the pill background was correct for legibility but wrong for tonal register; the status-bar swap was a working signal but wrong for "this thing is examinable, like everything else in the room." Each of these required a human pass to surface, and once surfaced, the fix was usually a smaller change than the original implementation. This is the shape of the AI-pair workflow on a project with a strong opinionated design vocabulary: AI ships correct-but-generic; user redirects to the project's specific register; AI re-implements faster than first-time because the right answer is now legible.

A specific case worth pulling out is the **finale copy iteration**. The user's original prompts ("probably nothing. thanks for killing 2hrs of work time") sat in a clear voice — slightly bitter, deadpan, the player addressing the game. The AI's first two re-drafts drifted away from that voice toward pop-culture references (Blockbuster, GameBoy manuals) that the user judged too quippy. The breakthrough came when the user asked for "one more shot considering all the knowledge you have about this game" — explicit tonal framing surfaced the *"Tuesdays do most of the work"* line, which echoes a *"Different month. Same coffee stain"* line from the §11.1 replay status pool, which itself was an earlier in-game motif. The lesson: the AI can produce the project's voice when given the explicit invitation to anchor on it; left to its own register, it defaults to generic-comedic.

The other observation worth a published note is the **refresh-loses-init bug** that the new welcome-back block exposed. The bug had been latent for ~3 days of development — the title screen was the first feature to actually read `profile.initComplete` on app mount and expect it to survive a refresh. Once the symptom surfaced, the root cause was a 3-line addition (`store.subscribe`). The interesting bit: this is the kind of latent design assumption ("we persist after each room transition" mistaken for "we persist after each meaningful state change") that's hard to catch without a feature that exercises the boundary. The AI working alone wouldn't have noticed; the user reproducing a player-shaped flow surfaced it in seconds.

Finally, the **finale beat** itself is worth its own paragraph somewhere. The user designed an interactive emotional close to a 10-year career simulation that consists of (a) a door that doesn't open, with a wry message the player can examine, (b) a real exit door that asks a single honest question ("Ten years. Did any of that stick?"), and (c) three options that all amount to "no, not really" but in different rhetorical registers, each with a quiet response from the game ("Sounds about right." / "Fair. The door's right there." / "Tuesdays do most of the work."). It is the kind of small, deliberate ending beat that wouldn't survive a typical product-review process — too low-affordance, too easy to mistake for a stub. Building it with an AI pair that doesn't have a stakeholder layer to defend against is what makes it ship.

---

*Generated by the session-process-log skill — sprint window per `docs/logs/time-log.md`, deliverables cross-referenced against `git log`.*
