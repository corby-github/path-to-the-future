# Research artifact — Parallel sessions are well-suited to meta-work

**Captured:** 2026-05-15 (mid-MVP, while running a Complexity-tiers thread alongside the main session)

**One-line version:** *Skill creation, research artifact capture, usage logs, and issue/bug filing are ideal candidates for a parallel Claude session — they don't lock the same files, don't depend on the main session's in-flight state, and terminate cleanly. The main session keeps its focus; the side session does one bounded thing.*

## The observation

The [concurrent-session-ceiling](concurrent-session-ceiling.md) artifact frames *how many* parallel sessions a human can usefully steer (~2–3 for speed, ~3–4 for long-running). This artifact is the orthogonal question: **what task shape makes a parallel session pull its weight vs. waste a slot?**

The shape that works: **meta-work that is bounded, file-disjoint from the main session, and doesn't gate on in-flight decisions.** Concretely, the categories that have proven well-suited in this project:

1. **Skill creation, editing, and tuning.** The skill lives in `~/.claude/skills/<name>/` (or a plugin). It touches files the main session has no reason to read. The main session doesn't care about the skill's authoring loop — only its eventual triggering behavior. Skill work also tends to be self-contained (one SKILL.md + maybe a helper script), so the side session terminates cleanly.

2. **Research artifact additions (this skill).** `/research` writes one new file under `docs/research/`. The main session does not touch that directory. The body is synthesized from prior conversation, so the side session inherits enough context from its triggering message to work without bothering the main thread.

3. **Usage reports / `/usage` snapshots.** Appending to `docs/logs/usage-log.md` is point-in-time bookkeeping. It doesn't read code, doesn't compete for the working tree, and is trivially independent.

4. **Issue / bug filing.** Composing a GitHub issue (or backlog note) for something the main session noticed but isn't fixing now. The main session captures the observation in a sentence; a side session expands it into a proper issue with repro steps and links. The main session keeps shipping.

What these have in common:

- **File-disjoint.** The side session edits files the main session won't open. No merge conflicts, no "wait, this file changed under me" surprises.
- **State-disjoint.** The side session doesn't need to know what the main session decided last turn. It works from the triggering message + the project on disk.
- **Bounded.** One file produced, one issue filed, one skill tuned. There's a natural finish line, so the side session doesn't drift into a long-running thread that costs steering attention.
- **Low decision density.** These tasks rarely surface architecture forks. They're more "execute well" than "decide between options," so they survive the lower per-session attention that parallel sessions get.

## Why this matters

The default failure mode without this framing is to keep meta-work in the main session because it "only takes a minute." Three problems with that:

1. **Context pollution.** A 600-line skill edit or a 2,000-word research artifact eats main-session context that was holding code architecture, recent edits, and design-doc references. The cost shows up later as a `/compact` happening sooner than it needed to.
2. **Flow break.** The main session is mid-implementation; switching it to write a skill loses the in-head state of the thing being implemented. Coming back costs a re-load.
3. **Wrong tool selection.** A main session in implementation flow may try to do meta-work with its current toolset and conventions, instead of the meta-work's natural shape. (Example: writing a research artifact in the middle of an `Edit` chain instead of invoking `/research`.)

A parallel side session sidesteps all three: the main session keeps its context, keeps its flow, and the meta-work happens in a session sized for it.

The flip side — tasks **not** well-suited to a parallel session — are the ones that share files with the main work, depend on in-flight decisions, or have high decision density. Implementing a feature, reviewing the same PR the main session is shipping, debugging something the main session also has open — these compete with the main session and force the user to hold two versions of the same context. The [concurrent-session-ceiling](concurrent-session-ceiling.md) cap applies hardest to these.

## Operating principles that follow

1. **When a "quick aside" surfaces in the main session, ask: is this meta-work?** If the task is bounded, file-disjoint, and decision-light, it's a strong candidate for a separate session. Spin one up instead of derailing the main thread.
2. **Default candidates for the side-session lane:** skill work, `/research`, `/usage`, `/punch`, issue/bug filing, session-process logs, memory-transfer handoffs, documentation generated from a snapshot. None of these benefit from the main session's in-flight state.
3. **Don't run *implementation* in parallel with itself.** Two sessions editing the same area of the codebase will collide. The parallelism budget is best spent on meta-work that runs alongside a single implementation thread, not on two implementation threads racing.
4. **The parent session can fire-and-forget.** Once the side session has its triggering message + a clear bounded ask, the parent session shouldn't track it. The output (a file, an issue, a log entry) is the signal of completion; no status check needed.
5. **Side-session output goes to disk, not back to the parent.** Side sessions write artifacts the parent can find later (or the human can read later). Don't design workflows where the parent session is supposed to consume the side session's reply directly — that turns the side session into a blocker.
6. **If the side session starts surfacing decisions, treat it as a signal the task wasn't actually bounded.** A skill edit that grows into "should we restructure the whole skills directory?" is no longer meta-work. Pull it back into the main session or scope it down.

## Cross-references

- [`concurrent-session-ceiling.md`](concurrent-session-ceiling.md) — sibling artifact on *how many* parallel sessions are useful; this one is on *what kinds of work* belong in them.
- [`ai-assisted-dev-as-second-full-time-job.md`](ai-assisted-dev-as-second-full-time-job.md) — the broader frame: attention is the scarce resource, so workflows that conserve it (file-disjoint side sessions) pay off.
- [`polish-loop-scope-creep.md`](polish-loop-scope-creep.md) — a side session is also a clean place to capture a "polish idea" without letting it creep into the main session's scope.

---

*Filed under: process / workflow.*
