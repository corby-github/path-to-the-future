# 5 PRs in 100 minutes. The night I built a whole arcade into a one-person life sim.

I sat down at 7:35 PM. By 9:16 PM I'd merged five pull requests, closed three open feature issues, and added a working arcade subsystem — plus two brand-new minigames — to my in-progress indie game *Path to the Future*. The architecture from earlier sprints had finally compounded into something where adding content was the easy part. Here's what happened.

## What we built

In one 1h 41m sitting, with Claude Code as the pair-programmer:

- **An arcade interactable** that drops in any room. Walk up, press E, get a menu of every minigame the game knows about. Pick one and play. XP throttled to once per real-time hour per game, so you can't grind it.
- **A new "universal" content layer** under `public/universal/interactables.json` — entries every career pack inherits, not just the SWE pack. This is the architectural seam for future career packs to share content cleanly.
- **Pong**, from nothing. Paddle vs. AI paddle, ball physics with spin on off-centre hits, first to five. Scheduled at month 75 in the campaign *and* available in the arcade.
- **"The Ultimate Question"** — a Hitchhiker's Guide callback minigame. One question, four options, one correct (`42`), order shuffled per mount.
- **A title-screen flourish** — the arcade cabinet sprite stationed at the right edge of the floor band, always visible, always cool.

Plus two bugfix follow-ups within the same sprint (Pong's animation loop dying after the first goal; an invisible UI hint on the arcade modal), and a player-facing rename PR that hid a punchline from a menu row.

## The numbers

- **Time spent:** 1 hour 41 minutes of focused sprint time (measured by the `/punch` skill that writes ISO UTC timestamps to a tracked log file — no estimates).
- **Traditional-team equivalent:** 4–6 working days for one full-stack engineer with ad-hoc product input. Includes architecture, physics, AI tuning, content, design-doc updates. Excludes real playtesting, art polish, stakeholder reviews.
- **Compression:** roughly **20–30×** — but stated honestly, that multiplier is lifted hard by *good architecture from prior sprints*. The first minigame took a day. The fifth took 40 minutes.

## What surprised me

The shape of the work changed. Earlier sprints had been mostly architecture — laying down the room engine, the decision pool, the era-mood palette system, the persistence layer. Tonight was the first sprint where the architecture had already done most of the thinking. Each new minigame compiled into a checklist: add the variant to a closed TypeScript union, fill in the four call sites the compiler complained about, write the component, ship the PR. Pong, which would normally be a real engineering exercise, turned into about 90 minutes of work *including* the two bugfixes I shipped after playtesting.

The other surprise was how fast the *small editing decisions* surfaced. I renamed the "42" minigame to "The Ultimate Question" 90 minutes into the night, after both that PR and the title-screen decor PR had already merged. It's a one-line player-facing change — but it took 90 minutes of living with the artifact to realize the menu row was broadcasting the punchline. Player-eyes review is a different pass from playtest review, and it took spending time in the game to see it.

The third surprise was just how much the *playtest loop* did. I caught Pong's animation loop dying after a goal not from a test, not from a typecheck — but by playing one round, watching the ball freeze, and saying so out loud. The fix was one line. The loop of *ship → play → report → fix → ship again* was fast enough that it was effectively part of the build flow, not a separate phase.

## The catch

This sprint did *not* cover the things real product work needs: I haven't multiplayer-tested the AI difficulty on Pong. I haven't tuned the arcade's hourly throttle against actual play data. The arcade cabinet sprite is functional, not finalist art. The tutorial coachmark hasn't been updated to teach players the arcade exists. No marketing copy. No CI/CD review gate beyond me clicking merge.

The 20–30× compression also leans hard on three preconditions that won't replicate on every project: (1) the project already had a strong type-driven minigame pattern from earlier sprints, (2) the GitHub issues had pre-resolved most of the design calls, (3) I'm the only reviewer — there's no PR-review SLA to wait on. Take any one of those away and the multiplier shrinks.

What I can defend is the framing that **good architecture compounds**. The architectural work from the *earlier* sprints (the type system, the persistence layer, the minigame pattern) was the actual unlock for tonight's velocity. Sprint Five doesn't feel like Sprint One. That's the part that's reproducible — if you invest in pattern-quality up front, you get nights like this later.

## What's next

The v1 ship gate is Day 15 — analytics + GitHub Pages deploy. Specced, just needs implementation. After that, there's an open architectural question about a v2.0 multi-career-pack engine. Both are separate sprints. Tonight was the kind of sprint where you close out a backlog of "would be nice" issues in one push, and that's worth its own kind of recognition.

---

*A working sprint with Claude, 2026-05-12.*
