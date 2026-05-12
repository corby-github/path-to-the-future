# I couldn't sleep, so I shipped five PRs before sunrise

I woke up at 4 AM because I couldn't stop thinking about the game I'm building. By 6 AM I'd shipped five PRs to `main`, filed eight design-specced GitHub issues, expanded the design document by three new sections, and saved four process-improvement memories that'll change how every future sitting with Claude goes. Two hours. No breaks. No standups. No PR review delays.

This is the kind of compression you don't get on a team of three engineers and a PM. Not because individuals are slower — because *teams have coordination cost*, and a solo dev + AI loop has almost none.

## What I built

In one ~2-hour sitting:

- **Closed the dormant XP system.** Class tiers (Novice → Junior → Skilled → ...) had been wired into the design doc for days but never actually progressed during play. Two commits: baseline +50 per decision, plus minigame XP (250/100/25 for win/partial/fail) plus a `xp` effect key for promotion-shaped decisions (+300 for taking the tech lead role, joining the startup, moving cities; +150 for big stretches like pitching the rewrite or taking the on-call pager). The whole career-progression arc now actually fires across a 120-month run.
- **Made the DOM identifiable.** Sprinkled `data-component` / `data-region` / `data-action` attributes across 20 UI components in one PR. Now I can say "the `career-timeline` region" and Claude finds it instantly in source, and devtools queries actually work.
- **Killed the same-scenario-twice-in-a-row bug.** History-aware filter in the decision and event selectors. Two tiers: hard-exclude scenarios seen in the last N months, prefer ones never seen. No state-shape change — the history was already being tracked, the selectors just weren't reading it.
- **Labeled the interactables.** Every NPC and object in the game now shows its name below the sprite ("Plant", "Intern", "Boss's boss"). Cheap fix, huge readability win.
- **Specced a future scoreboard, an arcade, a Pong minigame, a backward-door replay system, and a title screen** — each as a complete GitHub issue with file references, schema changes, design alternatives, and acceptance criteria. None of them are coded. All of them can be picked up cold by any future session.
- **Wrote four memory rules** that close my own process gaps — "add identifiability attributes from the start, not retroactively," "update the design doc in the same PR as the code," "skip verbose browser smoke tests, I'll verify myself," "honor the project spirit (race to finish + learn while having fun, pragmatic over purist)."

## The numbers

- **Time spent:** ~2 hours of focused solo work (no breaks)
- **Traditional-team equivalent:** 3-5 working days for 1 engineer + 1 PM + 1 designer running normal agile cadence
- **Compression ratio:** roughly 12-20× on working hours, ~2× on elapsed calendar time

The 12-20× number is the one I'm most willing to defend. The team's elapsed time is dominated by waiting — for the next standup, for code review, for design alignment. Strip the waiting and the gap collapses; the AI loop is a tight version of what a senior engineer's keyboard would feel like without the rest of the org.

## What surprised me

**The memory system did the heavy lifting.** I corrected Claude on four things this morning (don't verbose-smoke in the browser, build data-attrs in from the start, update the doc with the PR, calibrate to a 22-year SWE not to a junior). Each correction got saved as a feedback rule. By the end of the sprint I wasn't repeating myself anymore — Claude was applying the previous rules to the next piece of work. A team would have built this into a "team conventions" doc that nobody reads. Memory files get loaded into context every session, so they're actually in force.

**"Spec it, then code the smallest unblocker" became the rhythm.** I had four feature ideas at the top of the sprint (arcade, Pong, backward door, dedup). All four became real GitHub issues. Only one — dedup — got coded today. The others are durable artifacts now; the next session can pick them up without re-deriving the design. This is the opposite of how I usually work alone, where ideas die in a notes app.

**Iteration speed was the killer feature, not generation speed.** When the new interactable labels rendered with the wrong color and the wrong position, I said one sentence ("too light, put it under the object") and the fix landed in under a minute. In a normal PR review cycle that's a comment → next-day fix → another review. The compression isn't from writing code faster; it's from the loop being seconds instead of days.

## The catch

What this sprint did NOT do:
- No outside code review. I'm the only set of eyes.
- No user testing. Nobody has played this game yet.
- No visual polish — placeholders everywhere.
- No accessibility audit (it's on the list).
- No stakeholder alignment because there are no stakeholders.

So the honest framing isn't "I replaced a team of three." It's: *I produced spec-complete, engine-correct work at a velocity that a coordinated team would have taken a week to match*. Production-readiness is still a separate effort. Issues #26, #28, #30, #31, #32, #33 are all specced but unbuilt. The work is real, but it's also *only* the work a senior engineer would do — not the work a team would do.

## What's next

Merging PR #37, then knocking down the small UX fixes (transition vibe, endgame timeline). Then Day 13c polish (a11y + era mood + viewport). Then the title screen and analytics + deploy. The arcade, Pong, and backward-door features are queued for after v1 ships.

Or I'll have a coffee and stare at a wall for a while. Both are valid.

---

*A working sprint with Claude (Opus 4.7, 1M context), 2026-05-12, 4 AM – 6 AM EDT.*
