# Research artifact — Concurrent Claude session ceiling

**Captured:** 2026-05-15 (mid-MVP, while running a parallel Complexity-tiers thread alongside this one). **Revised:** 2026-05-15 to sharpen the framing — the ceiling is about **throughput**, not feasibility.

**One-line version:** *You can run 10 parallel Claude sessions and slowly cycle through them — the question is throughput. If speed-per-thread is the goal, human steering capacity caps useful parallelism at 2-3 for short PRs and 3-4 for long-running work; past that, more sessions trade breadth for slowness, not gain.*

## The observation

There is no hard cap on how many Claude Code sessions a single human can keep open. You can have 10 going and patiently rotate through them. They'll all eventually finish. **The constraint is throughput, not feasibility.**

The lived heuristic from running this project, framed as a throughput question:

- **2-3 concurrent sessions is the throughput sweet spot for short PRs / steering-heavy work.** Each session gets enough of the human's attention to keep moving at near-its-natural pace.
- **3-4 is the sweet spot for long-running, hands-off work.** Builds, audits, multi-file refactors with locked scope — these don't ask for steering minute-to-minute, so each session can sit idle longer without the per-session pace degrading.
- **Past 3-4, per-session throughput starts dropping faster than parallelism adds.** You're not running N fast sessions — you're cycling slowly through N stalled ones. Aggregate work-per-hour flattens, then declines.
- **Short PRs hit the ceiling sooner because they need steering more often.** A short PR with three design choices and four review rounds is mostly Claude-waiting-on-human time. Three of those in parallel saturates the human at ~33% per session — still tolerable. Five of them and each gets ~20%, which is below the threshold where progress feels coherent.

The asymmetry is structural: **Claude waits silently when blocked on the user.** The cost to Claude of waiting is zero. The cost to the user shows up two ways:

1. **Per-session pace** — each thread advances proportional to how often the human looks at it. More open sessions means each one gets less attention, advances slower.
2. **Re-loading cost on each switch** — every time the user re-enters a session, they have to remember which session they were in, what was being decided, and what they wanted. That cost scales with the number of open sessions and with how long since they last looked at each one. Past some N, the re-loading cost per visit exceeds the work done in the visit.

The throughput math is roughly: at N sessions, each gets ~1/N of attention; per-session pace falls accordingly; total throughput = N × (per-session-pace) which compounds nicely up to ~3-4 and then flattens because per-session-pace is dropping faster than N grows.

## Why this matters

Without this framing, two failure modes:

1. **"I can't run more than 3 sessions"** — too restrictive. You absolutely can, if breadth matters more than speed. A weekend audit pass across 8 repos can happily live across 8 idle sessions; you'll work through them all over a few days. The ceiling doesn't apply when speed isn't the goal.
2. **"More parallelism is always more throughput"** — too greedy. When speed is the goal — finishing PRs today, shipping features this week — past 3-4 sessions you're substituting breadth for speed without realizing it.

The right frame: **decide whether the goal is speed or breadth, then size parallelism accordingly.** Speed wants 2-3 (short PRs) or 3-4 (long-running). Breadth tolerates more, with the understanding that each thread will move slowly.

Naming the ceiling also lets the user set Claude's expectations. A Claude session that knows the user may be multiplexed should pause for key decisions rather than barrel through — because the user may not be present to course-correct mid-stream.

## Operating principles that follow

1. **Decide goal first: speed or breadth.** Speed → cap at 3-4. Breadth → as many as you can stand to re-enter; accept slow per-thread pace.
2. **For speed-targeted work, cap parallelism at ~3 for short / steering-heavy PRs.** If three sessions are open and another short PR comes up, finish one before starting the next. Adding a fourth at this scope makes everything slower.
3. **Allow ~3-4 for long-running / hands-off work.** Builds, audits, multi-file refactors with locked scope — these tolerate parallelism because the human isn't in the loop minute-to-minute, so per-session pace degrades less.
4. **Recognize when per-session pace has dropped silently.** If you notice a session has been "open for hours" and you can't remember what it was on, that's a signal you're past the ceiling — the throughput claim has already failed for that session.
5. **Claude should pause for key decisions, not push past them.** When a session hits a substantive fork (architecture choice, scope ambiguity, destructive action), stop and ask. The user may be in another session and unable to retroactive-fix a wrong turn cheaply.
6. **Claude should not assume undivided attention.** If the user mentions running another thread, treat it as a real constraint: their feedback may be slower, partial, or context-light. Lead with summary, not narration. Make clarifying questions count.
7. **The user's "queue another one" instinct deserves a sanity check.** If the user is reaching for parallelism to compensate for slow throughput on a single session, the better move is often to fix the slow session, not spin up another. Adding sessions doesn't make the slow one faster.
8. **Plate-dropping is silent.** Sessions don't surface that they're being neglected — Claude waits patiently. So past-the-ceiling shows up later as forgotten context, half-finished work, and PRs that need re-reading, not as visible failure at the moment of overcommitment.

## Cross-references

- [`ai-assisted-dev-as-second-full-time-job.md`](ai-assisted-dev-as-second-full-time-job.md) — the broader frame that AI-assisted dev compresses calendar time but the human attention budget stays fixed.
- [`ai-human-review-asymmetry.md`](ai-human-review-asymmetry.md) — same shape (human review is incompressible), applied to content review specifically; this artifact extends it to session-level steering.
- [`polish-loop-scope-creep.md`](polish-loop-scope-creep.md) — failure mode that the parallelism reflex can mask: spinning up a new session because the current one is in a polish loop, instead of recognizing the loop.

---

*Filed under: process / workflow.*
