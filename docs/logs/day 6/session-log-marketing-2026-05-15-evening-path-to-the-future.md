# We shipped 12 game levels in two hours. A small team would have spent a week.

In one evening sitting, my AI partner and I composed twelve new room-layout templates for *Path to the Future*, retuned nine existing ones, filed two GitHub issues, and walked the design doc through three version bumps. Wall time: 2h 27m. Of that, roughly two hours was product work; the rest was playtest-and-feedback round-trips.

## What we built

Twelve new TypeScript level templates inside the existing `LayoutTemplate` schema — every one composed from the same primitives (static walls + sine paddles + horizontal patrols + path-based sentinels) just combined and tuned differently. Six landed in PR #95 (`gate-paddle`, `s-curve-patrol`, `switchback-paddle`, `slow-orbit`, `twin-patrols`, `maze-gauntlet`); six more in PR #97 (`triple-paddle-slow`, `east-corridor`, `asymmetric-block`, `triangle-sentinel`, `sync-patrols`, `mini-orbits`).

On top of that, the `crossfire` level grew from 3 motions to 8 (and got reclassified expert), the `gauntlet` level was redesigned end-to-end, and four other templates were retiered after playtest. The pool went from 22 templates to 35.

## The numbers

- **Time spent on product:** ~1h 57m of focused sprint time (sprint total: 2h 27m 40s — the rest was playtest review interleaved with code edits).
- **Traditional-team equivalent:** 4–5 working days for a small team (1 designer + 1 engineer + a playtester rotation).
- **Compression ratio:** roughly **10–15× faster**, accounting honestly for what we did and didn't do.

## What surprised me

The most valuable thing the AI brought wasn't the level designs themselves. It was the *speed of conversion* from a one-line playtest read to corrected code. I'd hit play on a new template, type "weak haha" or "switchback-paddle is fine — too slow", and ~30 seconds later the period was retuned, a different paddle pattern was on disk, and I was hitting play again. We went around that loop ~15 times in the sprint. Each round would have been a sit-down-and-think for a human designer.

The other surprise was how consistently the AI over-estimated its own templates' difficulty. Open geometry kept playing two tier bands easier than predicted — without the playtest read, the "hard tier" PR would have shipped with four templates that actually play medium or simple. We learned a rule together that's now baked into the design doc: motion without forcing geometry doesn't hold its tier. Wide-bar paddles, frame walls, center splits — those are the reliable amp-up moves.

A smaller but real surprise: writing the *composition grammar* down (geometric base × motion overlay × parameter axis) made each subsequent template cheaper than the last. The first new medium template took ~20 minutes to think through. The sixth took ~3. The grammar pays back the cost of naming it on the second use.

## The catch

This was a particularly favorable kind of work: mechanical, rectangle-based, with a single fast-loop playtester at the keyboard. No art was needed. No stakeholder coordination. No multi-playtester validation. The compression ratio collapses if any of those are in scope. Two hours of room geometry is not two hours of "shipping a game."

The other catch worth naming: two of the sprint's slowest moments came from working-tree collisions between concurrent Claude sessions sharing one local checkout. Each one cost 5–10 minutes of re-typing. Parallel AI sessions get faster as you add them, but coordination tax is real and shows up exactly where you'd expect it — at the git boundary.

## What's next

Playtest the six PR #97 templates, retier whatever plays wrong, then ship the remaining content batches: easy expansion (seven more templates needed) and a medium batch 3 to fully close the gap. The 60-room target is now in sight.

---

*A working sprint with Claude, 2026-05-15.*
