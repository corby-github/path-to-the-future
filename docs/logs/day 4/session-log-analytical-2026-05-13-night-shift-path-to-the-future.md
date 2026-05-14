# Sprint Log: Path to the Future — 2026-05-13, Night-Shift Sprint

**Date:** 2026-05-13 (sprint crossed midnight EDT into 2026-05-14)
**Sprint:** 4th of day 4 (after morning / afternoon / evening)
**Sprint window:** 22:53 EDT → 00:08 EDT (1h 14m 46s wall-clock; 02:53Z → 04:08Z UTC per `docs/logs/time-log.md`)
**Participants:** 1 human (Corby) + Claude Opus 4.7 (1M context)
**Output type:** Doc-sync pass + 5 follow-on code/UX PRs + 2 feedback memories + 1 GH issue
**Wider context:** Sprint 4 of day 4 in a multi-day conversation. The morning shipped icon coverage + the AI/human review research artifact; afternoon + evening shipped SWE icon revisions, the homeschool tone pass, and pack-aware class labels + 9 sprite components. This sprint picked up the design-doc drift the user flagged ("Career picker → check branches") and snowballed into a broader polish run.

---

## 1. Starting point

The user came back from a handoff break with a specific complaint: the design doc had drifted from `main` after the Day-4 PR run (#61–#69). Concretely, **§16 Init Flow** still listed 9 careers when `careers.ts` had been trimmed to 5; **§17 Build Order** showed Day 13c + Day 14 as ⏳ even though both had shipped; **§14 Class System** didn't mention the `manifest.classLabels` override that PR #69 had introduced; **§26 Homeschool sub-section** undercounted decisions / events / sprite tokens. PR #70 was the explicit ask.

Working tree was clean on `main`. Six prior PRs had merged that day; the design doc was at v2.0.1. Two memories from earlier in the conversation governed the rhythm: **`feedback_update_design_doc_with_prs.md`** (doc edits land inline with code, not as separate sync passes) and **`feedback_browser_smoke_minimal.md`** (trust the verify gate; don't run preview browser smokes unsolicited).

## 2. Deliverables produced

- **[PR #70](https://github.com/corby-github/path-to-the-future/pull/70)** — Design-doc sync v2.0.2. Rebuilt the §16 + §26 career rosters to match the 5-entry `careers.ts`. Added a *Pack-aware class labels (v2.0.2)* subsection to §14. Flipped Day 13c + 14 to ✅ in §17. Updated §18 + §26 homeschool counts (32 dec / 39 evt / 12 dedicated sprite tokens). Cosmetic code: CareerPicker subtitle "Six paths" → "Five paths"; `careers.ts` comment fixed.
- **Change-log reorder** — separate follow-up commit on the same branch: switched the change-log table from mixed-direction to consistent descending-by-version (newest at top). Done via a small Python one-liner — same content, new order.
- **[PR #71](https://github.com/corby-github/path-to-the-future/pull/71)** — Room template expansion v2.0.3. Added optional `packs?: readonly string[]` to `LayoutTemplate`; `eligibleTemplates(packId)` helper; `generateRoom(seed, packId, forced?)` signature. **7 new templates** authored in one pass (cubicles, classroom, park, grocery-store, kitchen, living-room, church). SWE pool 4 → 10; homeschool 4 → 8. Avg per-template repeats across 110 rooms drop from 27 → 11–14.
- **[PR #72](https://github.com/corby-github/path-to-the-future/pull/72)** — Maze template v2.0.4. Universal navigation-heavy template — 4 vertical walls with alternating gap positions (center → top → bottom → center). 60px gaps vs PLAYER_RADIUS=14. User verified the path works in-game.
- **[PR #73](https://github.com/corby-github/path-to-the-future/pull/73)** — Minigame icons v2.0.5. New `MINIGAME_ICONS: Record<MinigameVariant, ModalIconComponent>` registry (closed-union, typecheck-exhaustive). `MinigameIcon` helper alongside `DecisionIcon`/`EventIcon`. Wired into ArcadeModal rows (44px leading icons) and MinigameReplayCard (64px above the "looking back" header). Closes the orphan-art gap from the v1.6.x "42" iteration loop. Required a `git rebase --force-with-lease` after PR #72 merged first.
- **[PR #74](https://github.com/corby-github/path-to-the-future/pull/74)** — Pack-filter arcade + Stacker variation v2.0.6. `ARCADE_VARIANTS` gains `packs?` field; `code-review` excluded from homeschool runs. **Stacker variation**: alternating start side per block (L→R→L→R→L) + non-monotonic speed tuple `[480, 620, 520, 680, 560]` v.u./sec replacing the old `BASE_SPEED + idx*40` formula.
- **[PR #75](https://github.com/corby-github/path-to-the-future/pull/75)** — ProfileModal v2.0.7. New component opened by clicking the HUD identity chip. Inline-edits player name (dispatches `setProfile` — propagates through existing `{playerName}` interpolation immediately). Homeschool runs see a Children section with Hazel/Bram listed but **edit buttons disabled** with a "Coming soon" tooltip. `sanitizeName` extracted to a shared `src/game/content/nameSanitize.ts` so init-flow and edit-flow can't drift.
- **[Issue #76](https://github.com/corby-github/path-to-the-future/issues/76)** — Kid-name interpolation sprint spec'd. Captures the deferred work the ProfileModal kid-edit-disabled buttons are placeholding for.
- **Two feedback memories saved + indexed in `MEMORY.md`:**
  - `feedback_changelog_brevity.md` — keep design-doc change-log rows to 1-2 sentences pointing at the changed §.
  - `feedback_punch_log_brevity.md` — keep `/punch` notes tight; codifies the 3-bucket taxonomy (`product`, `process-tooling`, `human-review`).

## 3. Key decisions

### Match doc to code, not code to doc (PR #70)
- **Decision:** Reconcile the §16 + §26 career roster *down* to the 5 entries actually in `careers.ts`, not *up* to the aspirational 9 entries the v2.0 doc had committed to.
- **Reasoning:** The picker is what ships; the doc should describe what ships. The v2.0 nine-career roster was design intent, not a build commitment. Keeping the wider tonal aspiration in the surrounding prose (rather than a phantom table row) preserves the v2.0 thesis without lying about the picker contents.
- **Driver:** User picked from a 3-option AskUserQuestion.
- **Alternatives considered:** (a) Add 4 missing locked entries back to `careers.ts` to match the doc — rejected as overengineering. (b) Two-table approach (aspirational + actual) — rejected as confusing.

### Pack-aware template filter as a `packs?` field on the template (PR #71)
- **Decision:** Mirror the `LayoutTemplate.packs?: readonly string[]` shape (universal if omitted; pack-restricted if listed) rather than per-pack JSON manifests.
- **Reasoning:** Smallest possible delta over the existing TS-array layout system. Mirrors `manifest.statLabels` and `manifest.classLabels` patterns the user already knows. The full JSON-per-pack refactor is a real architecture move but a post-v1 one — keeping templates in TS lets us add the filter today without committing to that refactor.
- **Driver:** Claude proposed; user accepted with the explicit anti-loop directive *"do this fast + quality, don't spin v1 on nit-picking jokes no one may ever see."*
- **Alternatives considered:** (a) Per-pack JSON manifests for layouts (cleanest architecture, ~2-3× the work). (b) Exclude-list on each variant (less clean, mirrors no other pattern). (c) Just add more universal templates without filtering (lets office cubicles show up in homeschool runs).

### Pure-zigzag maze, no dead-end stubs (PR #72)
- **Decision:** Ship the maze with only the 4 zigzag walls. Skip the dead-end horizontal stubs that would make it feel more "maze-like."
- **Reasoning:** PLAYER_RADIUS=14 means the player diameter is 28px. Dead-end stubs that constrain navigable corridors to <60px risk soft-locking the player. The user explicitly said *"do the best you can, I'll verify the path works"* — pure zigzag is the conservative move that ships traversable on first pass. User confirmed *"good enough for now, I can navigate my way through"* — the right call.
- **Driver:** Claude flagged the soft-lock risk; user accepted the conservative geometry.
- **Alternatives considered:** Adding 2 dead-end stubs to create false-path interest. Held for a follow-up if a richer maze is wanted later.

### Player-name-only profile modal; kids disabled (PR #75)
- **Decision:** Ship the profile card with player-name editable and kid-name edit buttons **disabled** (tooltip explains why). File a separate GH issue (#76) for the full kid-name interpolation sprint.
- **Reasoning:** Kid names are hardcoded 74 times across `public/careers/homeschool-parent/*.json`. Editing them in the modal without also rewriting the content would create a UX mismatch (modal says "Lily," game says "Hazel"). The full interpolation sprint (state fields + init phase + content rewrite) is ~3-4 hours of mechanical work — its own focused PR. The disabled-with-tooltip pattern lets the UX surface ship today without faking what works.
- **Driver:** User explicitly chose *"player name w/edit and kids name w/disabled edit button"* from a 3-option AskUserQuestion.
- **Alternatives considered:** (a) Full kid-name interpolation in this PR (rejected as scope). (b) State-only kid edit without content rewrite (rejected as confusing UX).

### Closed-union typecheck enforces icon registry exhaustiveness (PR #73)
- **Decision:** Type the new registry as `Record<MinigameVariant, ModalIconComponent>` (not `Partial<...>` or a plain object). Adding a future `MinigameVariant` will fail the typecheck until `MINIGAME_ICONS` gets an entry.
- **Reasoning:** Closed-union exhaustiveness is the cheapest way to prevent the exact bug the PR was closing — orphaned art (icon authored, never registered). Future-Claude can't ship a new variant without also wiring its icon, because `npm run verify` will block.
- **Driver:** Claude; user didn't push back.
- **Alternatives considered:** `Partial<Record<...>>` with a PlaceholderIcon fallback (less guard-rail-y). A runtime registry-init assertion (more boilerplate).

### Stacker speeds as an explicit tuple, not a formula (PR #74)
- **Decision:** `BLOCK_SPEEDS = [480, 620, 520, 680, 560]` as a literal tuple, replacing `BASE_SPEED + idx * SPEED_INCREMENT`.
- **Reasoning:** User asked to *"alternate the speed"* — the literal pattern makes the alternation visible at the const-declaration site. A formula would have hidden the alternation behind arithmetic and made it easier to accidentally flatten back to monotonic during a future tweak.
- **Driver:** Claude interpretation of user instruction; user accepted.
- **Alternatives considered:** Keep the formula with an odd-block multiplier. Computed deterministically per play (random per session). Both rejected — the literal tuple is the most legible.

## 4. Tensions resolved

### Verbose change-log rows
User flagged mid-sprint that the design-doc change-log rows had grown to 500-800-word essays per version. *"Ideally you are only adding a change if you are editing the doc itself — a sentence or 2 is sufficient — point to the section changed."* Saved as `feedback_changelog_brevity.md` + indexed in `MEMORY.md`. The next change-log row (v2.0.7) honored the rule — but only partially; full compliance is a forward commitment. The earlier rows in this sprint (v2.0.2 through v2.0.6) stayed verbose because they were already in flight.

### Verbose `/punch` notes
End-of-sprint feedback: *"You're getting very verbose with punch in and out — what you just said was enough."* The in-chat sprint summary at punch-out (5 PRs + 1 issue + 1 memory + 1 takeaway line) was the right length target; the time-log row I'd just written was 6× longer. Saved as `feedback_punch_log_brevity.md`. Same conversation surfaced a taxonomy question — the user asked what bucket categories I was using. Answered: `product` / `process-tooling` / `human-review`. User dropped the experimental `features` bucket back into `product`. 3-bucket stable taxonomy now codified.

### Force-push approval before publishing the rebased PR #73
After PR #72 (maze) merged, PR #73 (minigame icons) had a clean conflict on the design-doc change-log table. Rebased locally; conflict was predictable (header + change-log row). Per the destructive-ops rule in CLAUDE.md, asked before force-pushing. User picked `--force-with-lease` (the safer variant). Smooth — the conversation about whether to force-push or merge-main-in took 1 turn; the publish itself took 1 command.

### Categorization of `features` as its own bucket
Earlier in day 4 evening I'd introduced a `features` boundary label (one-off, evening session). At end of this sprint, user confirmed: *"Drop features — that was product."* Memory updated to encode the 3-bucket taxonomy without `features`. The historical Day-4 evening `features` block stays in the log unchanged (time-log is append-only) but won't recur.

## 5. Time analysis

### Sprint duration (with product / process split)

- **Sprint duration (total):** 1h 14m 46s (02:53:31Z → 04:08:17Z, per `docs/logs/time-log.md` row for day 4 / night-shift).
- **Product wall time:** **1h 14m 46s** — no `boundary-open` / `boundary-close` pairs were logged in this sprint, so the full duration counts as product per the taxonomy.
- **Process tooling wall time:** **0 minutes (formally)**.

**Honest caveat the boundary scheme didn't catch:** the two feedback memories (`feedback_changelog_brevity.md` and `feedback_punch_log_brevity.md`) were authored mid-sprint without being boundary-bracketed. That's process tooling by the taxonomy — `feedback_punch_log_brevity.md`'s own definition. Realistic estimate: 6–8 minutes of memory-file writes folded into the unbracketed product time. Future sprints should `/punch boundary-open process-tooling` for these blocks. This sprint's product number is **slightly inflated by that 6–8 minutes** — call it 1h 7m honestly, 1h 15m formally.

### Traditional-team equivalent
**Assumed team:** 1 senior engineer + 1 designer (for UX/icon decisions) + 1 PM (for scope across 6 features).
**Assumed working pattern:** Async with 1–2 sync touchpoints per PR for review.
**Estimated duration:** **4–6 working days** for the scope of work this sprint shipped.

**What this estimate INCLUDES:**
- Architecture decisions (pack-filter design for layouts + arcade variants, registry typing, sanitization extraction)
- Code authoring across 6 PRs
- Design-doc updates inline with each PR
- Implementation of 7 new layout templates + the maze (8 templates total)
- Review iteration (assume 1 round per PR)
- Wiring + integration (MinigameIcon into 2 surfaces; ProfileModal into HUD)
- One GH issue spec'd in enough detail to hand off

**What this estimate EXCLUDES (and would still need to be done before ship):**
- Stakeholder review of the new templates (does the church belong universally?)
- User testing of the maze navigation (it's traversable but is it fun?)
- Visual design review of the ProfileModal (does the inline-edit pattern match the rest of the system's modal language?)
- Accessibility audit of the new clickable HUD button + the modal
- Cross-browser / cross-viewport verification of all 6 PRs
- Discussion of whether `code-review` should re-appear in homeschool with renamed copy ("homework review"?) instead of being excluded

### Honest framing
This sprint shipped roughly **4–6 days of small-team work in 1h 15m of focused single-human time**, for a compression ratio in the **30–50× range**. Two caveats lower that number in practice: (a) ~6–8 minutes of in-sprint memory-writing inflates the product figure; (b) the EXCLUDES list above is meaningful — a real team would also do stakeholder review, accessibility audits, and design language reviews that this sprint elided. With those layered back in, the realistic compression is more like **15–25×** — still the kind of headline that makes the artifact worth publishing, but honestly bounded.

The scope this sprint was also unusually doc-heavy: the design doc walked from v2.0.1 to v2.0.7 across 6 version bumps in 75 minutes. That's not a stable cadence — it's catching up after a multi-PR run where doc edits had drifted. Normal sprints will see one or two version bumps.

## 6. What's next

- **Day 15 (analytics + Pages deploy)** — the only remaining ⏳ row in §17 Build Order. The v1 ship gate. The user has consistently named this as *"save for very last."*
- **Issue #76** — kid-name interpolation sprint. ~3 hours per the handoff. Touches `profileSlice`, a new init-flow phase, `interpolate.ts` context, and ~74 mechanical content substitutions across `public/careers/homeschool-parent/*.json`. Enables the disabled `[Edit]` buttons on the ProfileModal kids section.
- **Backlog from earlier days:** [#66](https://github.com/corby-github/path-to-the-future/issues/66) vending machine, [#67](https://github.com/corby-github/path-to-the-future/issues/67) exit gates, [#68](https://github.com/corby-github/path-to-the-future/issues/68) chasing NPCs — the SWE-office-texture features. Won't block v1.
- **Possible follow-ups from this sprint:** Maze with dead-end stubs (if pure zigzag feels too easy after playthroughs). Weight bump on the arcade cabinet (currently `0.4` → ~6 sightings/run; could go to `0.6` for ~9 sightings if "stumbled upon" still misses too often).

## 7. Observations for publication

**The doc-as-load-bearing-artifact pattern keeps paying off.** The user's standing rule — *"update design doc with PRs"* — meant this sprint's PR #70 wasn't a "rebuild the spec" exercise. It was a 4-section reconcile (§14 / §16 / §17 / §26) that took ~15 minutes because each PR over the past 3 days had landed *most* of its doc edits inline. The drift was small and localized — career roster + missing classLabels subsection + stale build-order rows. The alternative (spec rewritten from scratch periodically) would have been hours of work.

**Closed-union typechecks beat planning meetings.** The minigame icon registry (PR #73) is exhaustive over the `MinigameVariant` closed union. Future-someone adds a new variant → the build fails until they wire its icon. No checklist, no review-time catch, no "did anyone update the icon registry?" sync. The same pattern is in `MINIGAME_ICONS`, will land in any future per-pack arcade list, and could be backported to a few other Record-keyed registries in the codebase. Cheap to author once; pays off forever.

**The "do this fast + quality, don't spin v1 on nit-picking" directive worked as a forcing function.** The user said it once (after the PR #70 roster reconcile, before the room-template work) and it shaped the rest of the sprint: one-pass authoring on 7 new templates, no preview generator built for layout review, no per-template iteration loop, conservative zigzag-only maze. The polish-loop research artifact (`docs/research/polish-loop-scope-creep.md`) filed in an earlier sprint named this exact pattern as a thing to avoid. Having both — the rule and the directive — kept the sprint moving.

**Verbose change-log entries are a real failure mode.** The user called this out twice in the sprint (once for the design doc, once for `/punch` notes). The pattern's worth naming: Claude defaults to detailed-narrative output, which compounds across an artifact that's *meant* to be an index. The two feedback memories are the corrective. The taxonomy clarification (`product` / `process-tooling` / `human-review`, drop `features`) is the related move — a stable 3-bucket vocabulary is easier to apply consistently than an ad-hoc one.

---

*Generated by the session-process-log skill.*
