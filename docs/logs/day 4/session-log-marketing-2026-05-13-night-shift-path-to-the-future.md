# Six PRs in 75 minutes. The week's worth of work I didn't realize I'd queued up.

I sat down for what was supposed to be a 30-minute design-doc cleanup. The doc had drifted — the career picker showed 9 careers but the code only listed 5; a couple of build-order rows said "in progress" for work that had already shipped. Fix the doc, walk away, get some sleep.

That's not what happened.

## What we built

In one sitting — 75 minutes of focused work, from 22:53 to 00:08 EDT — six PRs landed on `main`:

- **PR #70** — Design-doc sync. The doc went from claiming 9 careers to honestly listing the 5 that ship. New §14 subsection documented the pack-aware class label override (`Homeschooler Newbie` instead of `Novice Initiate` for the homeschool pack). §17 build order updated. §26 homeschool counts refreshed (32 decisions / 39 events / 12 dedicated sprite tokens, up from 30/37/3 in the prior doc).
- **PR #71** — Room template expansion. The game had **4** layout templates across ~110 decision rooms. That meant the player saw the same office layout 27 times per run, which was a fair part of why the game read as unpolished. Shipped **7 new templates** (cubicles, classroom, park, grocery store, kitchen, living room, church) with a `packs?: readonly string[]` filter so office cubicles never appear in a homeschool run and the classroom never appears in a software-engineering run.
- **PR #72** — Maze template. A 12th template, navigation-heavy: 4 vertical walls with alternating gap positions. The player has to zigzag up and down across the canvas to reach the door instead of walking a straight line.
- **PR #73** — Minigame icons. Five icons had been authored over the past week (cards, checkmark, lightning, paddles, the Hitchhiker's Guide "Deep Thought" wedge head for 42) but **rendered nowhere in the UI**. I'd literally iterated on the 42 icon four times and the player never saw it. Fixed: registered them, wired them into the arcade menu and the minigame replay card. The closed-union typecheck now blocks future variants from shipping without an icon.
- **PR #74** — Pack-filtered arcade + Stacker variation. Code Review (the SWE-coded minigame) no longer appears in the homeschool arcade — wrong register. The Stacker (timing/reaction game) used to start every block from the same side at monotonically increasing speeds, which made it too learnable; now it alternates starting side L→R→L→R→L and uses a non-monotonic speed pattern, so the player can't lock a single rhythm.
- **PR #75** — Profile modal. Click your name in the HUD's top-left → opens a card where you can edit your name mid-run. The new name propagates immediately through every decision and event because the engine already interpolates `{playerName}`. Homeschool runs also show the kids — Hazel and Bram — with their `[Edit]` buttons disabled and a "Coming soon" tooltip, since editing those names requires rewriting ~74 hardcoded occurrences across the homeschool content JSON. Filed as a separate GitHub issue for whenever I pick that up.

Plus the design doc walked from v2.0.1 to v2.0.7 — six version bumps in the same sitting — and the change-log table got globally reordered to descending-by-version (newest at top).

## The numbers

- **Time spent on product:** **1h 14m 46s** of focused single-human sprint time. No process-tooling boundary blocks were logged (though about 6-8 minutes inside that window went to authoring feedback memories about my own verbosity — context for the AI; not product per the taxonomy).
- **Traditional-team equivalent:** **4-6 working days** with a 1 engineer + 1 designer + 1 PM team. Six features, six design decisions, six PRs with review iteration.
- **Compression ratio:** **30-50× faster on shipped work alone**, dropping to **15-25×** once you account for the EXCLUDES list — stakeholder review, accessibility audits, design language review, user testing of the maze. The honest number is the lower one.

## What surprised me

**How much of this was paying off prior discipline.** The "update design doc with PRs" rule had been in force for days. That meant when I sat down to "fix the drift," there wasn't *that much* drift — four sections, maybe 15 minutes of real reconcile. The 9-vs-5 career roster thing was the only structural call. The rest was point updates that had been promised inline-with-each-PR and mostly delivered. **The doc isn't a periodic rewrite. It's a contract that gets honored at every PR or it's already broken.**

**The 42 icon thing was a wake-up call.** Four iterations on a Deep Thought wedge head that rendered *nowhere*. The polish-loop research artifact I'd filed an evening earlier (`docs/research/polish-loop-scope-creep.md`) named exactly this pattern as a thing to avoid: AI generates fast, human reviews slowly, and the gap fills with work that ships into the void. Closing the orphan with PR #73 took 30 minutes. The 4 hours of icon iteration that preceded it could have been ~30 minutes had the wiring landed in the same PR as the first icon. Lesson banked for next time: **art needs a render surface before the second iteration round.**

**The closed-union typecheck pattern is the most underrated tool in this codebase.** `MINIGAME_ICONS: Record<MinigameVariant, ModalIconComponent>` means a future contributor cannot ship a new minigame variant without also registering its icon, because `npm run verify` will fail. No code review catch, no checklist, no Slack reminder — the type system enforces the invariant. The next time anyone touches the minigame system, the gap from PR #73 cannot reopen.

## The catch

The 6-day team estimate excludes the work a real team would still do that I haven't done yet: stakeholder review of the new templates (does a church belong in both packs? does a homeschool parent feel the classroom?), accessibility audit of the clickable HUD button + the new modal, cross-browser verification of all 6 PRs, design language review of whether the profile-modal inline-edit pattern matches the rest of the system's modal idioms, user testing of the maze (it's traversable but is it *fun*?), and an honest re-look at whether `code-review` should have been *renamed* for homeschool ("homework review"?) instead of excluded entirely.

If you publish a 30-50× compression number without the EXCLUDES list, you're lying. The honest 15-25× — sprint-of-shipped-work to small-team-equivalent — is the publishable claim.

The other catch I'm tracking: the design doc walked six versions in 75 minutes. That's not a stable cadence. It's catching up after a multi-PR run where doc edits had drifted. The next sprint will see one or two version bumps, not six. The compression number drops if you average across normal sprints.

## What's next

Day 15 — analytics wiring + the GitHub Pages deploy — is the v1 ship gate. I've been saving it for very last and I'm one good sprint away. The kid-name interpolation sprint ([Issue #76](https://github.com/corby-github/path-to-the-future/issues/76)) is the ~3-hour mechanical pass that finally enables the disabled `[Edit]` buttons on the profile modal. Either is a clean lane for the next sitting.

---

*A working sprint with Claude, 2026-05-13 night-shift.*
