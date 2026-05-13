# Sprint Log: Path to the Future — 2026-05-13, Day 4 Afternoon

**Date:** 2026-05-13
**Sprint:** Day 4, afternoon session (matches `/punch` Day=4, Session=afternoon)
**Sprint window:** 2026-05-13T20:29:54Z – 2026-05-13T22:08:24Z (1h 38m 30s total)
**Participants:** 1 human (Corby) + Claude (Opus 4.7, 1M context)
**Output type:** Product — SWE icon polish (PR #63) + SWE/homeschool language polish (PR #64). Process tooling: none net-new this sprint.
**Wider context:** Day 4 of a multi-day build that started 2026-05-10. Day 4 morning shipped PR #61 (SWE icon coverage) + PR #62 (preview generator + research artifact). This sprint is the first one to exercise the morning's review surfaces in anger — the icons and text previews became the primary review artifact that drove the work.

---

## 1. Starting point

Corby came into the afternoon with the explicit intent to do the 5+5 homeschool voice-checkpoint batch (5 hp-* decisions + 5 evt-hp-* events as a register check before scaling). The handoff doc named this. The conversation opened with `/punch start day-4 afternoon homeschool-icons` and a request to start the batch.

The handoff was loaded and the design doc was read for homeschool voice anchors (§26: bittersweet-contemplative-occasionally-dry, identity-sacrifice-community axis, NOT sappy/snarky/parenting-blog; four locked Phase-1 anchor lines). I had just begun framing the homeschool batch when Corby pivoted: *"hold on — we need to correct some existing ones."* Two new priorities, in order:

1. **Update SWE icons** that didn't read right during a prior review pass.
2. **Update SWE language** that didn't sit right.

Homeschool work was deferred to a later sprint. The session label `homeschool-icons` was kept for time-log continuity but the actual work shifted entirely; this is noted in the time-log row.

## 2. Deliverables produced

**[PR #63 — `feat/swe-icon-revisions`](https://github.com/corby-github/path-to-the-future/pull/63):** 4 commits, ~30 icon revisions across three live review rounds + a fourth single-icon update from a user-supplied reference image. Touches `src/game/ui/icons/modalIcons.tsx`, `scripts/icon-descriptions.ts`, and the regenerated `docs/icons-previews/swe.html`.

- **Round 1 (`4e93e5c`)** — 16 redraws + 7 description tweaks:
  - `IconPandemicFurlough` mask → empty office chair
  - `IconVideoCall` chromed window + circles → 2×2 grid of distinct tiles
  - `IconRecruiterCall` front-facing barbell → handset profile + waves (later revised)
  - `IconCouch` stacked rects → fainting couch (later revised)
  - `IconPalmTree` straight trunk → curved trunk from island center
  - `IconHeartHands` single curve → cupped palms (later revised)
  - `IconDoorKey` ambiguous key → large key with bow + shaft + teeth
  - `IconThresholdDoor` arch + light beams → door ajar + exit arrow
  - `IconCards` plain rects → heart + spade suits (later revised for occlusion)
  - `IconUpwardArrow` zigzag → ascending staircase + up-arrow
  - `IconBrowserTabX` big X on screen → close-X on the tab (later revised)
  - `IconLostWallet` ambiguous rect → bi-fold wallet + $ + motion lines
  - `IconWalker` disconnected head → connected walking figure (motion dashes later removed)
  - `IconMentorPointing` arrow at notepad → figure pointing at mentee (arm later removed)
  - `IconCycleArrow` confusing loop → rising sun
  - `IconInboxBlast` floating envelopes → tray with incoming arrows
  - Plus: `IconPandemicClose` description corrected ("door with a padlock" → "wall calendar with a big X"; the original description described the wrong drawing).
- **Round 2 (`ce54020`)** — 7 second-pass revisions from preview-review callouts:
  - `IconRecruiterCall` crescent profile → single filled handset silhouette ("just be done")
  - `IconCouch` fainting profile read as a piano → front-view three-seat sofa
  - `IconHeartHands` cupped hands over-engineered → heart line-art with `$` inside (donation-direct)
  - `IconBrowserTabX` close-X felt fussy → window + two tabs, no X
  - `IconEconomyDown` arrowhead misaligned with polyline endpoint → clean V-chevron
  - `IconCards` no visible occlusion → spade behind, heart in front with `palette.background`-fill rect
  - `IconPager` belt-clip pager (anachronistic) → portrait smartphone with alert badge + buzz waves
- **Round 3 (`50cac8c`)** — 6 third-pass revisions:
  - `IconBrowserTabX` two tabs too much → single document with folder-style tab notch + content lines (matched user-supplied reference)
  - `IconWalker` dropped left motion dashes
  - `IconMentorPointing` dropped pointing arm — size diff carries mentor/mentee read
  - `IconFortyTwo` "42" glyph → retro mainframe (spoils punchline if shown pre-play)
  - `IconRecruiterCall` handset silhouette → vintage rotary desk phone (☎️)
  - `IconPager` notification badge dropped (buzz waves alone carry the alert)
- **Round 4 (`addbfbd`)** — 1 redraw from a user-supplied reference image:
  - `IconFortyTwo` mainframe cabinet → wedge-headed CRT monitor on a tripod A-frame stand (the iconic Deep Thought silhouette from the 2005 Hitchhiker's Guide film). User attached the reference image directly.

**[PR #64 — `feat/swe-language-tweaks`](https://github.com/corby-github/path-to-the-future/pull/64):** 1 commit (`3494a86`), 7 files. Bundles the language edits authored during the icon review:

- **SWE `manifest.json` intro** rewritten: "March 2020 / The world has gone quiet, {playerName}. / Offices empty. Inboxes loud." → "It's January 2020. / {playerName}, there are rumors of a virus. / A pandemic?" — anchors pandemic earlier and uses a shared opening across both packs.
- **SWE `months.json` month-1** narrative tightened — drops the redundant date stamp (manifest intro establishes it).
- **SWE `decisions.json`** — pager wording retired across `swe-oncall-volunteer` ("Take the pager" → "Take the rotation", "A pager hits your phone" → "Your phone is on the rotation now", "3:14am: a page" → "3:14am: a vibrating phone", "Someone else takes the pager" → "Someone else takes the rotation"). `swe-opensource-maintainer` scene: "A first 3am page" → "A first 3am call".
- **SWE `events.json`** — two body rewrites discovered during text-preview review:
  - `evt-stat-low-savings-card` ("Card, declined."): parking-lot beat replaced with community-kindness beat — *"The people behind you breathed a sigh of relief when the second card worked. 'We've all been there,' someone said."* Register shifts from isolated shame to small-community-kindness.
  - `evt-swe-flow-state` ("An afternoon you'll remember."): middle sentence tightened to *"The plan and the code agreed for once."* "For once" makes the rarity bite.
- **Homeschool `manifest.json` intro** rewritten to mirror the SWE pack's "rumors of a virus" opening (4 lines instead of the prior 8-line cinematic). Kids' ages (Hazel 6, Bram 3) move from intro to month-1 body.
- **Homeschool `months.json` month-1** aligned with the SWE pack pattern.
- **`docs/text-previews/swe.html`** regenerated to reflect the SWE pack content changes.

**Time-log artifacts:** Three commits on `main` to `docs/logs/time-log.md` (punch-in, boundary-open `human-review`, boundary-close with concurrent-work note, punch-end) + one commit to `docs/logs/usage-log.md` capturing the 18:01 est (~65% / ~500k) and 18:06 user-supplied actual (29% / 293.1k).

## 3. Key decisions

### Pivot from homeschool icons to SWE polish before the homeschool ramp
- **Decision:** Defer the 5+5 homeschool voice-checkpoint batch; do SWE icon and language polish first.
- **Reasoning:** Corby had just done a personal review pass over `docs/icons-previews/swe.html` and surfaced 17 icons that didn't read right at 80×80. The morning's preview generator (PR #62) had paid off — review surfaces flagged the issues. Pushing forward on homeschool with known SWE issues unaddressed would mean iterating two packs on the same flaws. Polish the one that exists, then ramp the second.
- **Driver:** User.
- **Alternatives considered:** Continue with homeschool and circle back to SWE polish later. Rejected because the icon-revision feedback was already loaded in Corby's head — colder to revisit.

### Icons and language as separate PRs, not one bundle
- **Decision:** Author icon revisions on `feat/swe-icon-revisions` and language edits on `feat/swe-language-tweaks`; two independent PRs into `main`.
- **Reasoning:** Different review surfaces (icons preview vs. text preview), different reviewer attention modes (visual scan vs. read-aloud), and cleaner diffs per PR. Bundling would muddy both.
- **Driver:** Claude proposed at start; user implicit-OK by proceeding.
- **Alternatives considered:** One bundled "SWE polish" PR. Rejected for review clarity.

### Boundary label `human-review` instead of `process-tooling` or `meta-work`
- **Decision:** When Corby paused to read the regenerated preview, the boundary was opened with the label `human-review`.
- **Reasoning:** The morning's research artifact (`docs/research/ai-human-review-asymmetry.md`) named this exact category — review is load-bearing, irreplaceably human, but conceptually distinct from Claude-side generation time. Bucketing it separately keeps the AI-velocity numerator honest without conflating it with skill-edit / meta-tooling time.
- **Driver:** Claude proposed during `/punch` ambiguity check; user picked `human-review` from a 3-option `AskUserQuestion`.
- **Alternatives considered:** `end the session` (treat review as out-of-sprint), `boundary-open review` (less aligned with the research artifact's framing). User explicitly chose `human-review` to align with the research vocabulary.

### Boundary-close note flags concurrent product+review work
- **Decision:** The `boundary-close` row explicitly states that the 50m 38s block was *not* pure non-product time — Corby was authoring language edits in the JSON files *while* Claude was iterating on icon SVGs, and Corby was simultaneously calling out new icon issues. The row recommends a ~half product / ~half review split for `session-process-log` rather than subtracting the full block from product time.
- **Reasoning:** Corby flagged this directly at `/punch boundary-close`: *"note that I was reading, and editing the html/json while you were also working/editing."* Treating the block as pure process tooling would under-credit a sprint where both parties were producing product changes throughout. The boundary scheme was designed for one-sided meta-work (skill edits, research authoring) — concurrent product authoring is a different shape and needs a different rule.
- **Driver:** User flagged the nuance; the close-row note is the durable record.
- **Alternatives considered:** Don't open a boundary at all (lose the review-vs-generation distinction). Or open the boundary and count it as 100% process (under-credit). The half/half compromise was the honest split.

### `IconFortyTwo` semantic change — stop showing "42"
- **Decision:** The minigame icon stopped displaying the "42" glyph. First revision: retro mainframe cabinet. Second revision (after user-supplied reference image): wedge-headed CRT monitor on a tripod stand — the iconic Deep Thought silhouette from the 2005 Hitchhiker's Guide film.
- **Reasoning:** The minigame is titled "The Ultimate Question" in player-facing surfaces precisely to keep the punchline (the answer is 42) for the play moment. The original `IconFortyTwo` literally wrote "42" in 36pt, which would spoil it if the icon ever surfaced pre-play (arcade menu, replay card). Corby caught this on review.
- **Driver:** User caught the spoiler; user supplied the Deep Thought reference image to nail the silhouette.
- **Alternatives considered:** Keep the mainframe cabinet from round 3 (close enough). Rejected when user provided the specific reference — the wedge-on-tripod is more iconic.

### Function names kept (e.g., `IconCycleArrow` now draws a sun)
- **Decision:** When a redraw changed the conceptual subject of an icon (cycle-arrow → sun, forty-two → mainframe→Deep Thought, upward-arrow → staircase), the SVG body changed but the function/component name was preserved.
- **Reasoning:** Renames would cascade through `modalIconRegistryData.ts` imports without changing behavior; mid-iteration that's churn. The function-name → drawing mismatch is a deferred cleanup — flagged in commit messages, will be picked up later.
- **Driver:** Claude proposed in round 1 commit message; no pushback.

### Pager wording retired across the SWE pack
- **Decision:** "Pager" the device is gone from all SWE text; "page" the verb/noun is also dropped in favor of more universal language ("the rotation", "a vibrating phone", "a call"). Modern on-call lingo *does* preserve "page" (PagerDuty etc.), but the game's audience is mixed and "page" reads as anachronistic to non-SWEs.
- **Reasoning:** Corby's instruction: *"people can be on call, but they use cell phones — that also means the page icon needs to change."* The icon change cascaded into both the language change and a description-grid update.
- **Driver:** User. Claude proposed specific replacements and surfaced one judgment call (keep "page" as authentic jargon vs. drop for readability). User chose drop.

## 4. Tensions resolved

**Round 1 had a high "made it worse" rate.** Corby's round-2 review opened with: *"IconRecruiterCall is worse! just make a profile of a handset, and be done"* and *"IconCouch is worse — looks like a piano now"* and *"IconHeartHands is worse! — just use a heart with a $ inside since its about donation."* Three of the round-1 redraws had overshot — over-engineered the geometry, lost the reading at 80×80. Round 2 was deliberately simpler: just a filled handset; a clear front-view sofa; a heart with `$` glyph. The pattern: when the first attempt added detail to be more "literal," it actually obscured the read. Simpler shapes won at icon size.

**Concurrent product + review during the human-review boundary.** Mid-block, Corby was authoring language changes (manifest intro rewrites, month-1 narrative changes) at the same time Claude was authoring icon SVGs and the grocery-checkout / flow-state event rewrites. When the boundary closed, Corby flagged this explicitly so the time-accounting wouldn't bucket the whole 50m as non-product. This led to the close-row note recommending a ~half product / ~half review split — a small but important refinement to how the boundary scheme should be interpreted when both parties are active.

**Context-estimation overshoot again, this time without a `/compact`.** My 18:01 `/usage` estimate was ~65% / ~500k. User screenshot at 18:06 showed 29% / 293.1k — 2.2× overshoot. The morning had the same shape but for a different reason (post-compact reset). This time the conversation hadn't been compacted; I conflated "felt-length of heavy tool work" with "tokens loaded right now." System-reminder full-file dumps cost tokens when emitted but don't all stay resident in the working context. The usage-log row captures the diagnosis. This is a second data point for `docs/research/context-estimation-bias-after-compact.md` — the bias generalizes beyond the post-compact case.

**Grocery-checkout copy: user proposed, Claude refined.** User typed "The people behind you breathed a sign of release when the second card worked. We've all been there someone says" (dictation: "sign" → "sigh", "release" → "relief"). Claude cleaned the dictation, matched the original paragraph's past tense ("someone said" not "says"), and recommended dropping the parking-lot ending (the kindness beat now lands the moment, so the parking-lot breath would be redundant). User approved. The result shifts the event's register from isolated shame to small-community-kindness — a deliberate tonal lean that the design doc's "bittersweet" anchor permits.

**Flow-state copy: middle sentence weakness flagged and replaced.** Original: *"You wrote the thing in your head and then the thing on the screen and they matched."* The structural issue: two `and`s, "the thing" repeated, "matched" lands flat. Claude offered three alternatives; user picked *"The plan and the code agreed for once."* The "for once" is the move — makes the rarity bite, which is the bittersweet anchor.

## 5. Time analysis

### Sprint duration (with product / process split)

Authoritative timestamps from `docs/logs/time-log.md`:

- **Sprint duration (total):** 1h 38m 30s — 2026-05-13T20:29:54Z → 2026-05-13T22:08:24Z.
- **Boundary block:** `human-review`, 50m 38s — 2026-05-13T21:09:37Z → 2026-05-13T22:00:15Z.

The boundary-close row in `time-log.md` **explicitly flags this block as concurrent product + review work**, not pure process tooling. Both parties (user + Claude) authored product changes during the block. Recommended split per the close-row note: roughly half product / half review.

Applying that recommendation:

- **Product wall time:** ~1h 13m. Composed of:
  - Pre-boundary product (39m 43s): kickoff, handoff read, design-doc read, round-1 16-icon batch + 7 description tweaks, verify + gen:previews, commit, PR #63 push.
  - Boundary's product half (~25m): rounds 2 + 3 icon redraws, Deep Thought reference round 4, two text-language tweaks (grocery + flow-state), pager wording retirement, user's concurrent language authoring (intro + month-1 in both packs).
  - Post-boundary product (8m 9s): PR #64 commit, push, PR creation, usage log update.
- **Review wall time:** ~25m — the review half of the boundary. Corby's eye-on-screen time reading the regenerated previews and naming icons/lines that didn't work.

**Caveat on the split.** The "half/half" rule for the boundary is a sensible heuristic for this specific shape (concurrent two-way authoring during review), not a general rule. It reflects the boundary-close note's recommendation. If a future sprint logs a boundary that's actually pure non-product, the split should be 0% product / 100% process as the scheme originally intended.

### Traditional-team equivalent

**Assumed team:** 1 icon designer + 1 game writer + 1 dev for integration + 1 reviewer (PM or lead).

**Assumed working pattern:** Sync review meetings between rounds; async authoring between meetings.

**Estimated duration for the equivalent work:** 2–4 working days.

**What this estimate INCLUDES:**
- 30 icon revisions across 3 review rounds + a 4th round from a reference image. At ~30–45 min per icon revision (including review-cycle overhead), that's 15–22 hours of designer time across multiple sittings — typically spread over 2–3 days for sustainable pace and to allow the reviewer time to write up callouts between rounds.
- Game-writer time for the SWE manifest intro rewrite, month-1 narrative rewrite, two event body rewrites, and the pager-wording retirement (5 spots in `decisions.json` + 1 in `events.json`): roughly half a day.
- Dev integration: pulling the icon changes into the registry, running the preview generator, opening two PRs with summaries, verifying CI green: another half-day.
- Reviewer time: reading the previews between rounds, articulating callouts, signing off on copy: ~half a day total.

**What this estimate EXCLUDES (and would still need to be done):**
- Playtesting the SWE pack with real players to validate that the bittersweet register holds across the run.
- Visual QA across the four era-mood palettes (each icon re-tints under HSL shifts — only spot-checked).
- Cross-platform legibility check at smaller sizes than 80×80 (some icons may appear in the endgame timeline at 32×32).
- Native-speaker copy review for tone/register on the homeschool intro changes.

### Honest framing

For this specific shape of work — iconography revision in an already-established Treatment A style, plus copy edits to existing JSON content — sprint product wall time was ~1h 13m. The traditional-team equivalent is conservatively 2–4 working days (16–32 working-hours wall time). That gives a defensible compression range of roughly **13×–26×** on this sprint, not counting the ~25m of review time that's irreplaceably human.

The compression number is honest about what AI did. It's silent about the value of the 25m review block — which is the part that actually catches "wrong icon" / "wrong copy" / "wrong joke spoiled." Per the morning's research artifact: that ratio between generation time and review time only widens as AI generation gets faster.

## 6. What's next

- **Merge PR #63 and PR #64** after a final eyeball pass (or land them whenever Corby's ready).
- **Browser-side check of the SWE manifest intro + month-1 narrative.** The text preview catches the JSON-side content, but the actual rendered flow (title → init → narrative room) deserves a quick browser pass before merge — flagged in PR #64's test plan.
- **Resume the homeschool ramp.** The 5+5 voice-checkpoint batch (hp-* + evt-hp-*) is still the named-next-step from the morning handoff. The handoff document and design-doc §26 are both already loaded as context for that sprint.
- **Function-rename cleanup.** Several icon function names no longer match their drawings (`IconCycleArrow` is a sun, `IconUpwardArrow` is a staircase, `IconFortyTwo` is Deep Thought, etc.). Low-priority hygiene — picked up when something else touches `modalIconRegistryData.ts`.
- **Possibly: expand `docs/research/context-estimation-bias-after-compact.md`** with the second data point from this sprint (2.2× overshoot *without* a compact). The pattern is broader than the post-compact case — the underlying bias is "felt-length of work" vs. "tokens currently in scope." Defer to a process-tooling block in a later sprint.

## 7. Observations for publication

**Review surfaces paid off in the first sprint after they shipped.** The morning's preview generator (PR #62) was a meta-bet: invest tooling time now so that voice/visual review at scale becomes tractable. This was the first sprint to *use* that bet, and it paid for itself within an hour — 30 icon issues and ~7 copy issues surfaced in a single eye-on-screen pass that would have been invisible at the individual-icon-PR scale. The honest framing of the morning's research artifact — that human review is the irreplaceable part — held up in practice.

**Round 1 over-engineered; rounds 2–3 simplified.** Three of the 16 round-1 redraws were called out as *worse than the original* (`IconRecruiterCall`, `IconCouch`, `IconHeartHands`). The pattern: my first instinct was to add detail to be "more literal" (a crescent profile for the handset; a fainting couch with tufts; cupped palms with finger separations and thumbs). Each of those overshot the icon-size legibility threshold. The corrections were simpler: filled handset silhouette; plain three-seat sofa front-view; heart with `$` glyph. **Icon iteration converges by subtraction more than addition.** Worth remembering as a working rule.

**The boundary scheme needed a new shape.** The morning's `process-tooling` boundary was clean: Claude was editing skill bodies while no product work happened. This afternoon's `human-review` boundary was different — both parties were producing product changes *during* the boundary. The original scheme assumed boundaries were one-sided non-product time; this sprint forced an interpretation rule for concurrent work. The close-row note carries the rule (half/half split for this shape); if future sprints surface other shapes, the `/punch` skill body may want a formal taxonomy.

**The context-estimation bias generalizes beyond post-compact.** The morning's research artifact was framed around `/compact` resetting the visible context window while the conversation summary makes it *feel* longer. This sprint surfaced the same overshoot (2.2×) without any compact in play. The underlying bias is more general: I anchor estimates against "felt-length of heavy tool work" rather than "tokens currently in scope." System-reminder full-file dumps are expensive at emit-time but don't all stay resident. The research artifact deserves an expansion when there's a process-tooling block to spend on it.

---

*Generated by the session-process-log skill. Sprint 2 of Day 4 — Path to the Future.*
