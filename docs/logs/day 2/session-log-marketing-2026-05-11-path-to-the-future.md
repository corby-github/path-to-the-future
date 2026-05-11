# Three more days of the game build, in one 105-minute sitting

This is part two. Yesterday's session covered the engine and the structure — Days 1 through 5 of a 13-day plan, the day I documented over dinner. Today was the day the game started to *do* something. Walking into a door now opens a decision modal. Choices shift stats. State persists across page refreshes. Rooms generate from a seed. Random events fire after decisions. Three more build days landed in one sitting — 6:15 AM to 8:00 AM, 1 hour 45 minutes from "I'm back" to "PR opened."

I built it in conversation with Claude (Opus 4.7, 1M context), continuing yesterday's session.

## What we built

- **Day 6** — decision modal with a phase machine (options → cinematic scene → flavor → continue), keyboard-first navigation, a stat-effect parser with §7 range clamping, auto-save to localStorage with version-stamped restore-on-refresh
- **Day 6 polish** — four nits caught after merging Day 6, all bundled into a follow-up PR
- **§8b design-doc addition** — typewriter text reveal spec for future NPC and object interactions. The contrast between snap-in door decisions and typewriter NPC dialogue carries meaning about who's initiating the encounter.
- **Day 7** — deterministic room generator: four hand-authored layout templates, seeded by macro game state (XP tier, burnout tier, three flags — *not* raw stat numbers, so small fluctuations don't reshape rooms), dev panel forcer for cycling templates
- **Day 8** — random event system: weighted event roll after each decision, era-filtered pool, stat-triggered events (*"burnout > 70 → you skipped breakfast"*), dedicated EventModal, extracted reusable ScenePlayer component, manifest-tunable `eventChance`, four placeholder events covering each scenario
- **Five PRs merged, sixth opening immediately.** Plus six pages of design-doc updates and a runtime bug caught and fixed pre-merge.

## The numbers

- **Focused-work time:** 1 hour 45 minutes (6:15 to 8:00 PM, end-to-end).
- **Traditional-team equivalent:** 5-8 working days for a small team (1 lead + 1 senior eng, normal async cadence, PR-review queues). Includes the code, the design conversations, the polish cycles, and the two real bugs that took a typical engineer hours each to diagnose.
- **Compression:** ~25-35× faster end-to-end. The ratio uses my actual wall-clock window against team working days — both numbers honest, methodology stated.

## What surprised me

**Bugs are catching themselves earlier in this loop than in any solo build I've done.** Two real runtime bugs hit me today — one where the player got stuck in March 2020 because React was reusing a component instance across same-type room transitions, and one where the scene-playback callback was calling the parent's setState from inside a state updater. Neither would have failed any test. Neither would have produced an obvious crash. Both took less than an hour from "I saw something weird" to "fixed and verified." The pattern is: AI builds, I play the game, I catch the symptom, AI diagnoses the root cause. The diagnosis is the hard part — understanding React's reconciliation rules and the commit-phase semantics required more than just reading the error message. But the *catching* is the part traditional testing pipelines miss. Playing the actual game finds bugs that lint and typecheck never will.

**Design conversations before code are now routine, not ceremony.** Three of today's four build days started with an explicit Q&A — I asked specific yes/no questions, Claude proposed answers, we ratified before any code got written. Day 8 had eight design questions answered point-by-point in well under ten minutes. Total design-conversation cost across all three days: maybe twenty-five minutes. Total time saved: I don't know exactly, because nothing got rewritten. **Zero rework.** That's the metric that matters. The temptation in AI-assisted dev is to keep typing because the tokens are cheap; the discipline is to pause and lock down the schema before the typing starts.

**The "polish after merge" pattern works at this velocity.** Twice today I merged a day's PR with "few minor nits" still open, then immediately surfaced specific fixes in a tight follow-up PR. The follow-ups were 3-file, ~10-line changes. The alternative — waiting for the perfect single PR — would have stalled progress by half an hour each time. With small focused PRs and a fast verify gate, ship-then-polish is just objectively faster than perfect-then-ship.

**Lint kept catching real things.** A new React-hooks rule fired during a refactor today and caught a synchronous setState inside an effect body that would have caused stale-closure bugs later. The fix wasn't cosmetic. Without that rule, I'd have shipped the bug and discovered it weeks later when the symptoms compounded. **The strictest gate I have is the one that earns its keep silently.** I never see the bugs it prevents.

## The catch

Same caveat as yesterday, mostly. The decision and event JSON files contain placeholder prose, not the real ~80 minutes of game content that lands Day 10. There's no HUD yet (Day 9). No name entry, no class picker. The visual register is intentionally developer-default — Day 13 is polish day. The era-mood deltas in the palette are perceptible but subtle; that's also a Day-13 tune. No browser/device QA beyond local Chrome. No accessibility audit.

What today *did* prove: when you give a careful human a competent AI partner and a load-bearing design document, the engineering velocity sustains across multiple sessions without quality degrading. Yesterday's compression number wasn't a fluke. Today landed three more days in similar wall-clock with similar rigor.

## What's next

Days 9 through 13: HUD, name entry, the real content pass (where the game gets its voice), three mini-games, the endgame recap, the polish day. Then a playable v1. After that: a second career pack — and the universal-decision pool we've been carefully tagging finally counts five-times-over.

Day 8 PR is opening now. Back to the keyboard.

---

*A working session with Claude, 2026-05-11. Continues 2026-05-10's session log in `day 1/`.*
