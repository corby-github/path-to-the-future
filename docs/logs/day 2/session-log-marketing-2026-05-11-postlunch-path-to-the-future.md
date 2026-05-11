# Eight PRs in an afternoon: shipping a game's social systems with Claude

I sat down after lunch and shipped Days 10 through 13b.3 of the build plan for the narrative life-sim I've been building. By dinner, eight pull requests had landed (or were open for review), the game had a working endgame, a credits screen, three mini-games, and a fully populated NPC + object interaction system. The design doc bumped from v1.0 to v1.1 with three new sections.

I'm one developer with Claude (Opus 4.7, 1M context) in the loop. With a real team, this sprint would have been two to three weeks.

## What we built

In a single sitting: a complete content pass for the SWE career pack (34 decisions + 39 events + 40 spouse names — roughly **30,000 words** of voice-matched, dry-humor-laced game content). Three keyboard-driven mini-games: Blackjack, Code Review, and a Stacker-style timing game. A full endgame system: `gameOver` state routing, an interpretable score breakdown, a scrollable decision timeline, a JSON-driven auto-scrolling credits screen with a funny replay-confirmation gate. An entire NPCs-and-objects subsystem from spec to playable: a typewriter modal component, a per-room placement helper, 15 interactables (7 NPCs + 8 objects) with 30 mixed-tier dialogues, real flat-color SVG sprites for each, and random-walk NPC motion. Plus a tiered month-change feedback animation, a per-NPC pause system, a CSS-variable-driven game font architecture, and a typewriter skip-to-end bug fix.

## The numbers

- **Sprint duration:** ~4 hours of focused post-lunch work
- **PRs merged:** 7 (an 8th open at sprint end)
- **Words of content written:** ~30,000
- **Mini-games shipped:** 3
- **Major systems delivered:** 3 (endgame, credits, interactables)
- **Design doc revision:** v1.0 → v1.1, three new sections added
- **Traditional small-team equivalent:** 2–3 weeks (~80–120 person-hours)
- **Compression ratio:** roughly **20–30×** for these deliverables — but read the caveats below

## What surprised me

How much voice work mattered. Game writing isn't just words — it's tone calibration. I caught a "needs more humor" feedback after writing only 5 starter decisions instead of after writing 50. That tight loop changes everything: I could course-correct on register at 10% complete instead of finding out at 100%.

How many fixes came from *playing* the game, not from the design doc. The doc said NPCs should pause; play revealed they shouldn't *all* pause. The doc said a month transition would feel like time passing; play showed it didn't. The doc said the credits would scroll; play showed they should scroll *forever*. By the end of the sitting the doc had been updated to v1.1 to absorb what play taught me.

The discipline of fast small PRs. Each merged PR was a clean unit — content, then minigames, then endgame, then interactables (split into four sub-PRs of its own). Each was reviewable in isolation. When I merged PR #19 a beat too early and orphaned two commits on the closed branch, the recovery was a cherry-pick onto a fresh branch and a follow-up PR. Ten-minute fix, zero work lost. That recovery would have been a much bigger deal in a slower-cadence flow.

## The catch

This sprint *did not* deliver:
- Real game art. The interactable sprites are kind-distinct placeholders that read as "person" or "object." A finished art pass would need an actual illustrator.
- Sound. Still deferred per the design doc.
- An accessibility audit. Saved for tomorrow's polish day.
- Cross-viewport testing. Saved for the polish day.
- A working XP gain mechanic. The class-tier progression is currently dormant — `addXp` only fires at init. Logged as a known gap.
- Real user testing beyond my own play.

The compression number is real, but it's the compression of *output through me, on these specific deliverables*. It doesn't count the upstream design doc work that made today efficient, and it doesn't replace the things a team would do that a solo dev with Claude doesn't (stakeholder alignment, user research, accessibility review). The claim is "four hours of focused output equals 2–3 weeks of small-team output for the things we did," not "AI replaces a team."

## What's next

After dinner: the polish day (a11y audit, era mood tuning, cross-viewport check). The XP fix as a focused short PR. At some point, an artist's pass to turn the placeholder sprites into finished art. The build plan ends with sitting 4 of day 2 — and then the game ships.

---

*A working sprint with Claude, 2026-05-11.*
