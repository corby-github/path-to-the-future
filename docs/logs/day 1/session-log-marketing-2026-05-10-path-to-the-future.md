# Five days of a game build, before dinner.

I sat down this afternoon with an approved 20-section design document for a narrative life-simulation game and Day 1 of the build already complete (the player movement engine). I got up four-ish hours later with Days 2 through 5 in `main` and seven merged PRs. The game now walks 120 months of a software-engineering career end-to-end: room types, transitions, collision, Redux state, content-driven routing, era-themed palette, and 120 hand-tagged month entries.

I built the whole thing in conversation with Claude (Opus 4.7, 1M context).

## What we built

- **Days 2-5 of a 13-day plan**, end-to-end, merged into `main`. 7 PRs reviewed and shipped.
- **Roughly 35 source files + 4 content JSON files.** Day 5 alone was +630 lines / −68 across 19 files.
- A working game that loads a career pack, routes 120 months through four room types (decision, narrative, minigame, consequence), and tints its palette by era — pandemic, rebound, ai-shift, uncertain-future.
- Strict TypeScript, ESLint-clean, production build green.
- Zero rework. Every line that landed in `main` is still there.

## The numbers

- **Time spent:** ~3.5 hours of continuous focused work.
- **Traditional-team equivalent:** 4-7 working days for a small team (1 lead + 1 senior eng, normal async cadence, PR review queues). Includes implementation, the mid-session audit, the design check-in before Day 5, and the bug fixes — not stakeholder alignment, user research, or art.
- **Compression:** ~10-15× faster end-to-end, with quality maintained, not skipped.

## What surprised me

**I expected speed. I didn't expect rigor.** Three of my best decisions today were *stops*, not *moves*: a mid-session audit before Day 4 that caught two real React 19 bugs in code we'd already shipped on Day 1; pausing before Day 5 to draft and review JSON schemas before any code was written; refusing to pre-tokenize colors before we had a real manifest contract to model. Every one of those stops would have been pure friction in a typical "AI codegen" session — they're the exact moments where the temptation is to keep typing. Here they paid for themselves.

**The hardest bug of the session was a one-line fix that took an hour to find.** After Day 5 was implemented and verified, I tested in the browser and got stuck on March 2020 — couldn't advance. The cause: React's component reconciliation was reusing the same `DecisionRoom` instance across same-type month transitions, leaking a ref that should have reset. The bug had been latent since Day 4, hidden by demo wiring that alternated room types. Day 5's content-driven routing finally produced the consecutive-same-type pattern that exposed it. The fix: `key={monthId}`. The diagnosis: deeply non-obvious without understanding React's reconciliation rules. The takeaway: the design-doc-following discipline paid off — the bug *would* have shipped to Day 6 otherwise, and might have been blamed on the new code instead of the old.

**The design doc was the load-bearing artifact, not the assistant.** Every architectural decision in this session anchored to a numbered section of the doc — `§6` for state placement, `§11` for movement, `§17` for build-day scope. When I deviated, I had to say why. When I asked Claude to do more, it kept reminding me what *wasn't* on the day's scope. The doc became the rate-limiter, the litmus test, and the disciplinarian. Without it, scope creep would have eaten the day.

## The catch

This session shipped engine work, not content. The 120 months are tagged but their decision text and event flavor are placeholders. There's no real art beyond flat-color SVG. No HUD yet, no name entry, no class picker — those are Days 9 and 10. No stakeholder alignment because there are no stakeholders. No accessibility audit. No multi-browser testing. No real visual design — the muted beige aesthetic you'd see on `localhost:5173` is developer-default placeholder, intentionally so, because Day 13 is the polish day.

What the compression ratio captures is *engineering velocity on a well-specified problem*. It doesn't capture the work of writing a good spec, which I did separately. It doesn't capture stakeholder management, which doesn't apply here. The honest claim is narrower than the headline: **AI-assisted dev, when given a load-bearing design doc and a human willing to enforce it, can produce strict, lint-clean, reviewed code at roughly 10-15× the pace of a small team's normal cadence.**

That's still a real number. It's just a precise one.

## What's next

Day 6: the decision modal — where the game starts to *do* something. Decisions actually shift stats, and the work persists across refreshes. After that: the room generator (Day 7), random events (Day 8), HUD and pickers (Day 9), the content pass that brings the game to life (Day 10), three mini-games (Day 11), endgame (Day 12), polish (Day 13). Eight days of work, in a build that's tracking ahead of schedule.

I'll do tomorrow afternoon what would be a sprint.

---

*A working session with Claude, 2026-05-10.*
