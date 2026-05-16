# Closed a 6-tier game-mechanic ladder in 2 hours of focused work. Here's what would have taken a small team a workweek.

A two-and-a-half hour evening sitting on a personal game project. One conversation with Claude. Three pull requests merged: a feel-pass on the medium-tier collision system from earlier in the day; a new expert-tier with deterministic path-motion and tier-aware NPC placement; an "amp-it-up" hard-tier expansion of seven new templates. Plus a content-routing fix moving misclassified random events onto an NPC's dialogue list, and a research artifact documenting a workflow lesson the sprint surfaced.

## What we built

Three merged PRs and one bug-fix on the game's room-template system:

- **PR #90 follow-up (v2.0.19):** Two-phase smooth knockback (200 ms westward shove + 800 ms frozen stun) replacing the v1 instant snap, plus per-obstacle dedupe so cascading hits across multi-block layouts shove the player further west. Visual layer: a 3× HUD-sized "−4" damage floater at the impact point and three twinkling stars above the player for the full 1-second lock window. Input layer: a "must-release" gate so direction keys held through the lock stay ignored until physically released — no auto-resume.
- **PR #93 (v2.0.22):** Engine work for the new expert tier — `MovingObstacle` gains optional `path?: Vector2[]` for deterministic linear-interp paths, plus tier-aware NPC placement zoning (left half of room hosts NPCs, right half hosts the challenge). Two new expert templates exercise the new mechanic.
- **PR #96 (v2.0.24):** Seven new hard-tier templates — `paddle-pair-phase`, `counter-patrols`, `channel-paddle`, `tight-pickets`, `triple-paddle`, `crossfire`, `gauntlet`. All amped per the cross-session feedback "walls forcing the player into motion = the lever." Hard pool 4 → 11.
- **Bug-fix routing:** 11 misclassified `evt-era-ai-shift-intern-*` random events moved onto the intern NPC's dialogue list as tier-1 entries with the era gate preserved.
- **Research artifact:** `parallel-sessions-shared-working-tree.md` — a workflow lesson the sprint surfaced.

## The numbers

- **Time spent on product:** ~1h 57m of focused sprint time (sprint total 2h 27m; ~30m was interleaved playtest review).
- **Traditional-team equivalent:** 2.5 – 4 working days for a small product team (1 senior engineer + 1 game designer + 1 product owner doing playtest review).
- **Compression ratio:** Roughly **10–15× on product wall time**, in the same band the project has been running. Honest caveat: the leverage was content + composition + small engine extensions on a known engine surface, not greenfield architecture.

## What surprised me

**Cross-session feedback transferred for free.** I had two Claude sessions running in parallel this evening — this one finishing the §4 ladder, another one filling out medium-tier content. When I told the *other* session "the templates are too easy, amp them up — walls forcing the player into motion is the lever, multiple converging motions = hard," that framing was load-bearing for *this* session's hard-tier authoring even though I never said it directly to this session. Both sessions could see the conversation; both updated their model. Saved an entire round-trip of "ship → too-easy → re-author."

**Working-tree collisions were the unexpected friction tax.** Two Claude sessions sharing one local git checkout collided twice this evening at the working-tree boundary. Once when both sessions tried to edit the same file at the same time; once when a checkout silently shifted between sessions and a commit landed on the wrong branch. Each collision cost only a few minutes to clean up — but more importantly produced *uncertainty* about whose work was whose at the moment of recovery. The fix that would have prevented both: a separate `git worktree` per session. We documented this as a third, mechanical ceiling on parallel sessions, distinct from the attention ceiling I'd already known about.

**The change-log brevity rule learned by being broken.** I have a standing memory entry telling me to keep design-doc change-log rows to 1–2 sentences. I violated it (~3 paragraphs of implementation detail) on the v2.0.19 doc-sync push. The user caught it within minutes. I trimmed the row in place and *also* hardened the memory with a hard length checkpoint plus a bad-vs-good contrast example pulled from this exact violation. Fourth such memory I've sharpened this week through being corrected rather than getting it right first try. The pattern is starting to feel durable — these memories are improving from use, not from forethought.

## The catch

This sprint shipped engine extensions and content composition on a *known* surface — PR #4's collision pipeline (which itself was a couple weeks' worth of work) was already in place. The 10–15× compression number is the right framing for *iterative content + composition work on an existing system*; greenfield architecture is harder to compress this aggressively. A team would also have done the things I didn't: cross-browser testing, accessibility review of the new collision visuals, designer round-trip on the damage-floater + stun-stars combination, performance profiling. Those bills will eventually come due — they're deferred, not erased.

The other catch is the parallelism friction itself. The two working-tree collisions wouldn't have occurred in single-session work — they're a tax unique to the multi-session AI workflow, and they returned ~10–15 minutes of the saved time as cleanup overhead. Net-positive from parallelism, but with real measurable cost worth naming.

## What's next

Easy-tier expansion is the largest remaining gap on the issue #94 content sprint (+8 templates, light authoring style — maze-geometry variants with no motion). Probably another two-session evening: one session takes easy expansion, the other handles tuning iteration on the hard templates that just shipped. The room ladder itself is now closed end-to-end (simple → easy → medium → hard → expert), so subsequent work is tuning + content density rather than new mechanics.

---

*A working sprint with Claude, 2026-05-15 (evening, room-ladder thread of two concurrent sessions).*
