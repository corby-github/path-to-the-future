# Sprint Log: Path to the Future — 2026-05-13, Day 4 Evening

**Date:** 2026-05-13
**Sprint:** Day 4, evening session (matches `/punch` Day=4, Session=evening)
**Sprint window:** 2026-05-13T22:43:18Z – 2026-05-14T01:23:48Z (2h 40m 30s total)
**Participants:** 1 human (Corby) + Claude (Opus 4.7, 1M context)
**Output type:** Product — PR #69 (pack-aware class system + 20 modal icons + 9 sprite components + label tweaks) + preview-regen sync. Meta: 1 research artifact + 3 GH issues filed.
**Wider context:** Third sitting of Day 4. The morning sprint (PR #61 + PR #62) shipped the SWE icon coverage + the review-page generator. The afternoon sprint (PR #63 + PR #64) shipped the first SWE polish round + language pass. This evening sprint did the homeschool pack's content tone pass + 5+5 voice-checkpoint icons + the full §26 deferred-follow-ups closure. The "feat/homeschool-tone-pass" PR #65 was already mid-flight from the start of the evening session — its review block is the boundary that took 2h of this sprint.

---

## 1. Starting point

Corby came into the evening session having just finished dinner. The afternoon had shipped PR #63 (icons) and PR #64 (language) and had logged a *concurrent-product-and-review* boundary block for ~50m. Open work going in: the `feat/homeschool-tone-pass` branch had just landed its first major batch (round 1 + 2 in earlier conversation pieces) but the linear voice-review of the regenerated homeschool preview hadn't happened at scale yet — that was the explicit reason the session opened.

The mid-evening discovery was that the `homeschool-parent` pack's apparent "80/81 icons covered" was a misread of the preview HTML (the rendered icons were SWE-pack + universal-pool icons, not homeschool-specific ones). Actual coverage: zero hp-* / evt-hp-* icons registered. That re-set the next-step plan inside the sprint.

## 2. Deliverables produced

**[PR #69 — `feat/homeschool-classes-and-icons`](https://github.com/corby-github/path-to-the-future/pull/69):** 6 commits, merged this evening.

- `ae27cc0` — Pack-aware class labels. New optional `Manifest.classLabels?: Partial<Record<string, ClassLabel>>` field; ClassPicker + Hud read manifest-first, fall back to universal `CLASSES`. Homeschool pack gets 8 tier labels (Newbie / Settled Routine / Veteran Parent / Curriculum Sage / Co-op Lead / Mentor Parent / Elder / Oracle).
- `291e718` — First 5+5 voice-checkpoint homeschool modal icons: `IconHomeschoolBinder`, `IconCoopGroup`, `IconSnackProtest`, `IconSlowTablet`, `IconBackpack`, `IconBittenCrayon`, `IconParkBench`, `IconMeltedCandy`, `IconTabletFlip`, `IconWobbleBoard`.
- `064e269` — IconSlowTablet redrawn (spinner dropped) + IconFortyTwo redrawn to line-art Deep Thought per user-supplied reference + second 5+5 batch: `IconScreenTime`, `IconInLawSpeaks`, `IconThermometerSick`, `IconSwingset`, `IconOrganicEmail`, `IconBookStack`, `IconFridgeMagnetArt`, `IconSingleShoe`, `IconGrandmaCall`, `IconHeldDinner`.
- `f0ac79a` — 5 homeschool object sprites (closes half of the §26 deferred-follow-up list): `ObjArtBin`, `ObjKitchenTable`, `ObjFridgeDrawing`, `ObjCouchBlanket`, `ObjCoopSignup`. Homeschool `interactables.json` rerouted from `stress-ball` / `whiteboard` / `calendar` / `plant` / `monitor` to the new `parent-pack`-coded tokens.
- `a5df864` — 4 class-label tweaks: First-Year Parent → Homeschooler Newbie, Veteran Parent → Experienced Veteran, Homeschool Elder → Elder, Reason Co-ops Exist → The Oracle.
- `a2485f4` — 4 homeschool NPC sprites (closes the other half of §26): `NPCMotherInLaw` (older + bun + glasses + handbag), `NPCSpouse` (long hair frame + coffee mug + steam), `NPCCoopParent` (ponytail + tote bag in sage), `NPCNeighbor` (short bob + waving arm). All hard-coded female for v1 per explicit user choice. New `parent-*` art-token namespace.

**Preview regen sync (`6dcf9b4`):** After PR #69 merged, `IconFortyTwo` had diverged between the two preview HTMLs (SWE preview was a stale wedge-tripod silhouette from PR #63 era; homeschool preview already had the line-art Deep Thought). Regenerated both packs to align.

**Three GH issues filed (parked for future "SWE office texture" sprint):**

- **[#66](https://github.com/corby-github/path-to-the-future/issues/66)** — Vending machine interactable with soda + snack subclasses, four outcome buckets (works / out of order / takes money / one-item-stock with Peach-Iced-Tea + Winter-Fresh-Gum as the lone survivors).
- **[#67](https://github.com/corby-github/path-to-the-future/issues/67)** — Exit-gate game logic. `MonthDef.exitGate` field; player must complete a required interaction before the exit door fires.
- **[#68](https://github.com/corby-github/path-to-the-future/issues/68)** — Chasing NPCs that auto-engage. `InteractableDef.behavior: 'chase'` + per-engagement cooldown + ordered dialogue index for "the IT-guy-printer-loop" comic shape.

**Research artifact:** [`docs/research/polish-loop-scope-creep.md`](../../research/polish-loop-scope-creep.md) — concrete worked example of the morning's `ai-human-review-asymmetry.md`. Six operating principles around when to call a content pack "polished" vs. "shipped."

**Memory-transfer handoff:** [`docs/handoffs/handoff-2026-05-13-2.md`](../../handoffs/handoff-2026-05-13-2.md) — written as the session wrapped up. Captures Key Decisions, Dead Ends, Current State, and Next Tasks for the next session.

## 3. Key decisions

### Pack-aware class labels via `manifest.classLabels` instead of removing the class system
**Decision:** Add a new optional field, override universal labels per pack. ClassPicker reads `classLabels[id] ?? CLASSES[id]`.
**Why:** User flagged that homeschool players saw "Novice Initiate / Junior Adventurer / Vanguard Strategist" (SWE/RPG-coded) in the picker. Two paths: rip out the class system entirely vs. override labels. Removal would touch `progress.classTier`, HUD, endgame, design doc §14 — ~1–2 hours and a doc rewrite. Override is ~45 min localized. SWE pack omits the field; falls through to existing universal labels.
**Driver:** User chose "Pack-aware labels (recommended)" from an AskUserQuestion.

### 5+5 voice-checkpoint batch + defer 51 remaining homeschool icons
**Decision:** Author 20 homeschool modal icons (5+5 voice-checkpoint + 5+5 second batch). Leave 51 as `PlaceholderIcon`.
**Why:** The homeschool-icon-ramp item from the morning's handoff turned out to be 71 missing icons, not the ~5 the prior preview misleadingly suggested. Authoring all 71 would be 4–6 hours and burn the rest of the 5h budget. User explicitly chose "Highest-impact 20-25" from the AskUserQuestion. The polish-loop research artifact filed mid-session captures exactly this trade.
**Driver:** User. Explicit choice.

### Hard-code 4 female homeschool NPC sprites for v1
**Decision:** Mother-in-law / spouse / co-op parent / neighbor all rendered as female. New `parent-*` art-token namespace.
**Why:** Matches existing copy register ("another mom at the park" / "the neighbor mom" / "a friend left the co-op"). Easy to flip individuals later or add a runtime gender system; not blocking ship. User chose this over (a) hard-coded mixed genders or (b) deferring until a gender-pick init phase ships.
**Alternative considered:** Adding a player-choice gender-pick init phase tonight. Two flavors: sprite-only (Option A, ~1 hour) vs. gendered pronouns in content (Option B, ~3–4 hours and undoes the recent spouse-`they` sweep). Rejected — the polish-loop research artifact named this exact escalation pattern, and the user agreed to defer.
**Driver:** User explicit choice.

### "We always homeschooled" framing fix across 5 events + month-1 narrative
**Decision:** Rewrote so the pack establishes the player's family as the steady continuous homeschoolers; other families cycle in/out around them.
**Why:** User explicitly flagged that the pack was reading as if homeschool *started* during the pandemic — but they always homeschooled. The pandemic just means OTHER families joined temporarily, then mostly left. Anchors the pack's identity.
**Driver:** User mid-review.

### +10 humor lift on heaviest decision flavors
**Decision:** 11 decision-flavor rewrites with bolder kickers; 14 event-body lifts in the same SWE-register direction.
**Why:** User explicitly named the existing tone as too somber — "boring and depressing" was the literal phrase. Asked for "+10 humor," not the previous "+1." Used the user-authored tablet decision + Research-allegedly event as the target register. Soft-death-adjacent decisions (dyslexia diagnosis, mental-health flag, aging-parent fall, graduation-frame) intentionally left alone — those stay weighty by design.
**Driver:** User direction.

### IconFortyTwo redrawn from user reference (line-art, NOT silhouette)
**Decision:** Outlined wedge head + slight forward lean + two short feet + horizontal slot + status-light dot. Line-art, strokeWidth 3.
**Why:** Prior versions overshot — round 4 was a filled-silhouette wedge-monitor with tripod stand; round 5 was a "head on hand" silhouette that dangled on the feat branch and never made it to main. User supplied a clear reference image; line-art outline matches the 2005 Hitchhiker's Guide film design more faithfully.
**Driver:** User with reference image.

### Defer kid-name interpolation to a separate sprint
**Decision:** Don't bundle the kid-name (Hazel/Bram → player-chosen) interpolation work into PR #69. Park as the explicit next sprint.
**Why:** ~3 hours of clean lift; design doc §26 already deferred it as known-future work. Better as its own focused sprint than mixed in with sprite + class work.
**Driver:** User explicit choice via AskUserQuestion.

### Three GH-issue features parked (#66 / #67 / #68)
**Decision:** File comprehensive specs for vending machine, exit gates, and chasing NPCs as backlog. Don't implement tonight.
**Why:** Each is a meaningful feature with real engine implications. User raised each as side-note suggestions; the right move was to spec them carefully without scope creep into the current PR. These would form a future "SWE office texture" sprint after v1 ships.
**Driver:** User raised; Claude proposed parking as GH issues; user accepted.

## 4. Tensions resolved

**The "80/81 icons" mirage.** Mid-evening, the homeschool preview HTML showed 80 of 81 icon slots filled — and Claude (me) initially reported homeschool icons as essentially done. The real number was 71 missing. The 80 "real" icons in the preview were SWE-pack + universal-pool icons inherited by the homeschool pack's content; the preview generator iterates the FULL registry, not just pack-scoped icons. The actual coverage signal was in the "Missing icons" section at the bottom of the preview HTML, which I missed on the first pass. This is dead-end #3 in the handoff. Lesson: the coverage gauge section, not the rendered-icon count, is the source of truth.

**The "boring/depressing" tone reset mid-evening.** User explicitly named the homeschool pack's tone as too somber, asked for "+10 humor — like, +10. So far you have been adding +1. If we go too far, I'll let know." This was a pivot from the AI/human review asymmetry direction (Claude generates, human evaluates voice) to an explicit register-anchor: use the user-authored tablet decision + "Research, allegedly" event as the target. Resulted in 11 decision flavors rewritten and 14 event bodies lifted. The "softer-death" beats (dyslexia, mental-health, aging-parent) were intentionally left somber by design — those should hit hard.

**The 80/81 mirage → "what was I going to verify?" loop.** Once the real count surfaced (71 missing), the natural next move was "let me audit which sprite/icon decisions to make next." Rather than scaling to all 71, the user chose the highest-impact 20-25 surfaces — the same shape as the afternoon's "highest-impact 20-25 untouched flavors" choice. The polish-loop research artifact filed during this exchange captured the pattern explicitly: when an AI-aided content pass keeps surfacing "one more thing," that's the trap shape.

**Concurrent product+review during the human-review boundary.** Same pattern as the afternoon's review block. User was reading the regenerated previews + flagging issues + driving content decisions while Claude was authoring sprite components + icon SVGs + tone rewrites. The boundary close-row again notes: NOT pure non-product time; recommend ~half product / ~half review for the analyst. Both sittings showed this shape.

**IconFortyTwo: three rounds + a dangling commit.** Round 3 of the icon iteration (round 4 chronologically across the day) shipped a wedge-tripod silhouette. Round 5 (the "head on hand" silhouette) was committed AFTER PR #63 had already merged — to a stale feature branch that never re-PR'd. That commit (`9b93edc`) is dangling on `feat/swe-icon-revisions` and never made it to main. Tonight's IconFortyTwo redraw is a fresh line-art outline per a different user reference. Lesson captured in the handoff dead-ends section: when iterating an icon after its PR has merged, open a new PR.

**Class-label conflict between `entryClasses` (legacy) and `classLabels` (new).** The HUD's class-label lookup originally read `entryClasses[id].label`. With the new system, classLabels takes priority + universal CLASSES as fallback. Resolved via a three-step fallback chain: `classLabels[id]?.label ?? CLASSES.find(c => c.id === id)?.label ?? entryClasses[id]?.label ?? id`. Backwards-compat preserved without touching legacy data.

## 5. Time analysis

### Sprint duration (with product / review / meta split)

Authoritative timestamps from [`docs/logs/time-log.md`](../../time-log.md):

- **Sprint duration (total):** 2h 40m 30s — 2026-05-13T22:43:18Z → 2026-05-14T01:23:48Z.
- **`human-review` boundary block:** 2h 05m 53s, opened at 22:57:03Z, closed at 01:02:56Z. Per the close-row note: NOT pure non-product time (concurrent product+review pattern); recommend ~half product / ~half review.
- **`features` boundary block:** 20m 51s, opened at 01:02:57Z, closed at 01:23:48Z. Per the close-row note: ~80% product / ~20% meta (the sprites + label tweaks ship; the regen + handoff are small meta).

Computed split:

- **Pre-boundary product:** 13m 45s (22:43:18 → 22:57:03 — initial context-load + setup).
- **Boundary product (half):** ~1h 02m 56s.
- **Boundary review (half):** ~1h 02m 57s.
- **Features product (80%):** ~16m 41s.
- **Features meta (20%):** ~4m 10s.

| Bucket | Time | What's in it |
|---|---|---|
| **Product wall time** | ~1h 33m | Pre-boundary setup + concurrent product authoring inside review block (sprites, icons, code) + features-block product (4 NPC sprites + label tweaks + regen). **This is the number to compare against the traditional-team estimate.** |
| **Review wall time** | ~1h 03m | Half of the human-review boundary block. Eyes-on-screen pass through the regenerated homeschool preview, calling out 30+ specific edits across decisions + events. |
| **Meta wall time** | ~4m | The handoff doc + research artifact filing portions of the features block — small overhead. |

### Traditional-team equivalent

**Assumed team:** 1 senior frontend dev + 1 illustrator + 1 game writer + 1 reviewer (PM or lead).

**Estimated duration for the equivalent product work:** 3–5 working days.

**What this estimate INCLUDES:**
- 9 new sprite components (5 objects + 4 NPCs) in a flat-color palette-pure style — illustrator + dev integration, ~1.5–2 working days for design + implementation + iteration.
- 20 new modal-icon components in Treatment A style — illustrator-coded, ~1 working day at ~25–30 min per icon with review.
- Class-label system refactor — dev, ~0.5 working days (manifest schema + 3 file touches + tests).
- Class label content authoring (8 tiers + 4 tweak rounds) — writer, ~0.25 working days.
- 3 GH-issue specs (vending, exit gates, chasing NPCs) — PM/dev, ~0.5 working days for the spec writing alone (real PRs would add a week each).
- Polish-loop research artifact + handoff doc — ~0.5 working days.

**What this estimate EXCLUDES:**
- The remaining 51 hp-* / evt-hp-* icons. Deferred.
- Kid-name interpolation. Explicit next sprint.
- The 3 GH-issue features themselves (only specs, not implementation).
- Day 15 analytics + GitHub Pages deploy.

### Honest framing

For this evening's product work (sprite components + modal icons + a small class-system schema change + content tweaks), the team-equivalent range is **3–5 working days = 24–40 working-hours**. Sprint product wall time was ~1h 33m. That gives a defensible compression range of **roughly 15×–25× on this sprint** — not counting the ~1h 03m of review time that's irreplaceably human.

Same caveat as the afternoon: the compression number is honest about what AI did. It's silent about the value of the ~1 hour of review — which is the part that catches "wrong icon," "wrong copy," "wrong joke spoiled," "wrong pronoun reading." Per both research artifacts: that ratio between generation time and review time only widens as AI generation gets faster.

## 6. What's next

- **Kid-name interpolation sprint.** ~3 hours. Touch points: `profileSlice` (add kidAName/kidBName), new init-flow phase, `manifest.requiresKidNames` opt-in field, `interpolate.ts` context, re-author every Hazel/Bram in `homeschool-parent/*.json`. Design doc §26 has this scoped already.
- **Day 15 — Analytics (§24) + GitHub Pages deploy.** Last v1 build day. The user-stated "save for very last" item — this is the v1-ship gate.
- **Optional follow-up:** sprite-only gender-pick init phase (~1 hour) if the user wants player customization beyond the hard-coded female homeschool NPCs.
- **Backlog (won't block v1):** GH issues [#66](https://github.com/corby-github/path-to-the-future/issues/66), [#67](https://github.com/corby-github/path-to-the-future/issues/67), [#68](https://github.com/corby-github/path-to-the-future/issues/68); remaining 51 homeschool modal icons.

## 7. Observations for publication

**The review surfaces shipped this morning paid for themselves twice today.** The afternoon sprint's PR #63 + PR #64 were entirely driven by reading the SWE preview HTMLs and calling out icons/lines that didn't read right. The evening sprint's PR #69 was the same pattern applied to the homeschool pack: a regen, a read-through, ~30 specific callouts, fixes. The morning's research artifact (AI/human review asymmetry) said "build review surfaces before you scale content"; today proved out the prediction in production. Two consecutive sprints where the review HTML was the dev loop.

**The polish loop has a name now and that helped end it.** Mid-evening, with the user 2+ hours deep in eye-on-screen review of regenerated previews and the running game untouched for hours, the user explicitly recognized the pattern as scope creep. The polish-loop research artifact captured it concretely. Naming the pattern made it possible to choose: "highest-impact 20-25 and ship" rather than "let me keep finding things." This was a real-time application of the morning's principle.

**Boundary scheme handled a new shape it wasn't designed for.** The boundary scheme was authored to mark *non-product* time (process tooling, skill edits, research artifacts). This evening's `features` boundary was a different kind: product work, just bucketed for visibility into "what kind of product work" (features vs. content polish). The system absorbed it without schema change — labels are open-ended; the analyst decides what to do with each label at rollup time. The honest accounting in the close-row ("~80% product / ~20% meta") preserves accuracy. This shape will probably recur in future sessions when the work has multiple sub-types worth distinguishing.

**Hard-coding NPC genders was the right scope call.** The temptation was to build a full gender-pick init phase before authoring the NPC sprites. That would have been ~1–4 hours of init-flow work + state-shape changes + content interpolation changes. Hard-coding 4 female sprites took ~30 minutes. The user got the homeschool pack visually distinct from SWE tonight; a future gender-pick system can substitute sprites at runtime if it matters later. **The right time to add an option is when not having it is causing pain — not before.**

---

*Generated by the session-process-log skill. Sprint 3 of Day 4 — Path to the Future.*
