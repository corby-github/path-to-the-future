# Research artifact — Parallel sessions on a single working tree

**Captured:** 2026-05-16 (during the §4 room-content sprint, after issue [#94](https://github.com/corby-github/path-to-the-future/issues/94) batch authoring split across two concurrent sessions).

**One-line version:** *Two Claude sessions sharing one local git checkout can both edit the same file safely only if neither needs to `git checkout` while the other has uncommitted changes. "Section-disjoint" edits still collide at the working-tree boundary — git tracks state per-file, not per-region. Each context switch becomes a coordination tax.*

## The observation

The lived incident: while this session was finishing PR [#93](https://github.com/corby-github/path-to-the-future/pull/93) (expert tier), a second session opened [issue #94](https://github.com/corby-github/path-to-the-future/issues/94) and started executing batch 1 (medium-tier expansion, PR [#95](https://github.com/corby-github/path-to-the-future/pull/95)) on its own branch. Both sessions live in the same local checkout (`/Users/corby/path-to-the-future`).

When this session needed to start hard-tier expansion (issue #94 batch 2, PR [#96](https://github.com/corby-github/path-to-the-future/pull/96)) and tried `git checkout main`:

```
error: Your local changes to the following files would be overwritten by checkout:
        src/game/rooms/generator/layouts.ts
Please commit your changes or stash them before you switch branches.
```

The other session had **uncommitted edits to `layouts.ts`** — tuning the `gate-paddle` template based on the user's feedback that it was "too easy, amp it up." Those edits were on the medium-tier template (top of the file). My intended edits were on hard-tier templates (bottom of the file). **Section-disjoint, file-shared.** Git doesn't care about regions; it blocks the checkout because the file as a whole has uncommitted state that doesn't match any branch.

The cleanup:
1. `git stash push -m "other-session: medium-tier tuning in-flight on gate-paddle" src/game/rooms/generator/layouts.ts` — preserved the other session's work under a clearly-named stash.
2. `git checkout main && git pull && git checkout -b feat/hard-tier-expansion` — got onto a clean branch.
3. Did the hard-tier work + opened PR #96.
4. The other session, when it resumes, will need to `git stash pop` (or the user will manually do so).

The cost was real but bounded: ~minutes of cleanup, plus the conceptual overhead of figuring out *whose* edits those were and how to preserve them safely. Both sessions had been waiting on the user for the next decision (this one for "what to do after PR #93 merges," the other for "how to amp up the medium templates"), so neither was actively making forward progress at the moment of collision.

The user's framing: *"a small mess, nothing huge but loss of speed."*

## Why this matters

The existing [`concurrent-session-ceiling.md`](concurrent-session-ceiling.md) artifact frames the parallelism limit as **attention/throughput** — past 3-4 sessions, per-session pace falls faster than N grows because the human can't steer them all. The companion [`parallel-sessions-for-meta-work.md`](parallel-sessions-for-meta-work.md) gives the rule of thumb that **file-disjoint meta-work** (skills, research artifacts, usage logs, issue filing) is the safe shape for a parallel session because it doesn't compete for the working tree.

This incident reveals a **third, distinct ceiling** on parallelism — one that is *not* about attention and is *not* fully solved by "edit different files":

> **Working-tree state is per-file. Two sessions editing different sections of the same file cannot both have uncommitted changes when one of them needs to `git checkout`.**

Even with infinite human attention, this collision would have happened. The mechanic is git's, not the user's bandwidth. And it shows up exactly when parallel sessions are most attractive: *both* working on the same logical area of the codebase (here: room templates) at the same time.

The cost shape is also different from the attention ceiling. Attention overflow shows up as **slow per-session pace** spread across many sessions. Working-tree collision shows up as **a discrete event** — a sudden need to stash, decide whose work is whose, and pick up after a context switch. It's not gradual; it's an interruption.

## Operating principles that follow

1. **"File-disjoint" was a useful approximation; the true rule is "branch-disjoint with no cross-session checkout pressure."** Two sessions editing the same file can coexist *as long as* neither needs to switch branches while the other has uncommitted work. The moment one of them needs to touch the working tree (checkout, pull on a different branch, stash, reset), the other's WIP becomes a blocker.
2. **Commit (or stash) before any context switch when running parallel sessions.** If you're about to leave session A to look at session B for more than a minute, commit A's WIP to its branch first — even a "wip:" commit is fine; you can amend or squash later. Don't leave uncommitted edits in a shared working tree while another session is active.
3. **For real per-session isolation, use `git worktree`.** Each parallel session gets its own checkout directory pointing at the same repo. No cross-session checkout collisions are possible because each worktree has its own working tree state. The cost is disk space (one full checkout per worktree) and per-session `cd`/path setup. Worth it for sustained multi-session work on overlapping file areas.
4. **When two sessions are about to work on the same file (even different sections), name the seam explicitly.** "Session A: medium templates near the top. Session B: hard templates near the bottom." Helps both sessions reason about merge conflicts and gives the user a map for cleanup if a collision occurs anyway.
5. **If you must stash another session's WIP, name it descriptively and tell that session.** `git stash push -m "other-session: <what they were doing>"` makes recovery cheap. Then in your turn-end summary, surface the stash so the user (and the other session, when they look) know it exists. The default stash name is opaque and easy to forget.
6. **Treat a checkout-blocking error as a parallelism signal, not a git error.** When `git checkout` fails with "would be overwritten by checkout," the question to ask is *"is another session active in this repo?"* — not just *"how do I clear this?"* Resolving the git error blindly (e.g., `git stash` without naming) loses the context of whose work it was.
7. **The attention ceiling and the working-tree ceiling are independent.** A user with infinite attention still hits the working-tree ceiling when both sessions touch the same file. A user managing 5 file-disjoint sessions still hits the attention ceiling. Sizing parallelism means thinking about both axes — not just one.

## Cross-references

- [`concurrent-session-ceiling.md`](concurrent-session-ceiling.md) — the attention/throughput ceiling on parallelism. This artifact extends it with a second, mechanical ceiling that's independent of attention.
- [`parallel-sessions-for-meta-work.md`](parallel-sessions-for-meta-work.md) — names "file-disjoint meta-work" as the safe parallel-session shape. This artifact sharpens that rule: file-disjoint isn't always achievable (e.g., when both sessions are working on the same logical layer of the codebase), and even when it is, *checkout-time pressure* between sessions is a separate concern.
- [`ai-assisted-dev-as-second-full-time-job.md`](ai-assisted-dev-as-second-full-time-job.md) — the broader frame that AI-assisted dev compresses calendar time but not attention. Working-tree collisions are one mechanic by which the "saved time" gets partially returned to the user as cleanup tax.
- The triggering incident: PRs [#93](https://github.com/corby-github/path-to-the-future/pull/93), [#95](https://github.com/corby-github/path-to-the-future/pull/95), [#96](https://github.com/corby-github/path-to-the-future/pull/96), and [issue #94](https://github.com/corby-github/path-to-the-future/issues/94) — the §4 room-content sprint where two sessions parallel-authored template batches in the same `layouts.ts`.

---

*Filed under: process / workflow / git mechanics.*
