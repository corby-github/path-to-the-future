# Research artifact — Context % estimation bias after `/compact`

**Captured:** 2026-05-13 (immediately after a `/usage` snapshot during the
Day 4 morning two-thread push)

**One-line version:** *After a session compaction, Claude's heuristic for
context % over-estimates by ~4× because it pattern-matches the felt
narrative of the session, not the actual number of tokens visible at
estimation time.*

## The observation

When the `/usage` skill fires and the user hasn't supplied UI values,
Claude is supposed to estimate context % using a band-style heuristic
(roughly: short session → 5–15%, moderate → 20–45%, long with file reads
and code gen → 50–80%, extended → 80%+).

On 2026-05-13 ~06:48 I logged a snapshot for the Path to the Future
session and estimated **`~65% / ~540k tokens`**.

The user pasted the actual UI values seconds later:

> Context window: **143.3k / 1.0M (14%)**

So I was off by:

- **Context %:** estimated 65%, actual 14% → **~4.6× overshoot**
- **Tokens:** estimated ~540k, actual 143.3k → **~3.8× overshoot**

The session *felt* long: multi-day, post-compact resume, PR #61 had just
merged, PR #62 had just landed (generator + SWE previews + research
artifact + new universal skill). My heuristic correctly identified that
felt narrative as "extended, multiple PRs, deep back-and-forth" and
returned a band-3 estimate. But the felt narrative is not what's visible
to me at estimation time. The `/compact` earlier in this turn had
collapsed most of that history into a summary, and the live window I
could actually see was small.

The heuristic in `usage-log/SKILL.md` says the bands are "deliberately
wide" and that "the point is a directional signal, not precision." 4×
overshoot is not directional signal — it's the wrong direction-of-arrow
for "are we approaching a context limit." A row that says "65% est"
sitting next to a row that says "14% user" is misleading; it implies
the window grew when in fact it dropped.

## Why this matters

The usage log is meant to be the **calibration artifact** for "how
much room do I have left before I have to compact or hand off." If
post-compact estimates routinely read 4× high:

- The author makes premature handoff / compaction decisions based on
  bad numbers.
- The log loses its trustworthiness for retrospective analysis ("when
  did we typically hit 50%?").
- Future Claude sees a flagged-but-wrong estimate in the log file and
  inherits the bias.

## The mechanism

The estimation prompt asks Claude to gauge context % from "conversation
length and complexity." Claude's only proxy for that is the conversation
*it can currently see*. But after `/compact`:

1. Most of the conversation is now a single summary block, not the
   original turn-by-turn messages.
2. The summary feels long because it covers a long span — but it's
   maybe 5–10k tokens.
3. The post-compact turns are also small unless heavy file reads have
   happened *since the compact*.
4. Claude's pattern-match fires on the *content* of the summary
   ("we did A, B, C, D, E…") rather than the *length* of what's
   actually loaded.

In other words: the heuristic conflates "this story is long" with
"this conversation is long." Post-compact, only the second matters
for context %.

## Operating principles that follow

1. **After a `/compact`, default to LOW estimates.** Anchor at the
   "short session" band (5–15%) unless heavy work has happened
   *since* the compact. The pre-compact history doesn't count for
   the visible window.

2. **Calibrate against the most recent user-supplied value.** If the
   log has a recent `(user)` row, treat subsequent `(est)` rows as
   that value + a small delta proportional to work-since-then. Don't
   re-estimate from scratch each time when an anchor is available.

3. **When uncertain, prefer to ask the user for the UI value over
   guessing.** A row that says `— (user did not supply)` is more
   useful than a row that says `~65% (est)` and is silently wrong.

4. **Flag the bias in the log itself, not just in conversation.**
   When correcting an over-estimate, the Notes column should
   explicitly say "est was Nx high; compaction had reset the window"
   so the calibration story is preserved.

5. **Don't trust the felt-length signal for context estimation.**
   Felt length is fine for `session-process-log` (which is about the
   *story* of the work) but is the wrong proxy for context %.

## Implication for the `/usage` skill

The `usage-log/SKILL.md` heuristic section needs a paragraph added:

> **Post-compaction correction.** If the conversation has been
> compacted in the current session, default to the short-session band
> (5–15%) unless heavy new work (large file reads, long generation,
> deep back-and-forth) has happened *since* the most recent compact.
> The pre-compact history doesn't contribute to visible context.

This is a skill-body change the user may want to make to the canonical
SKILL.md. Filing the principle here first so the change is justified
when it lands.

## Cross-references

- `docs/logs/usage-log.md` — the worked example lives at the
  `2026-05-13 06:48` row. The Notes column captures the 4× miss.
- `~/.claude/skills/usage-log/SKILL.md` (or the plugin-managed path
  for the user's installation) — the skill whose heuristic this
  corrects. The "Estimating context % when not user-supplied"
  section is the specific paragraph to amend.
- `ai-human-review-asymmetry.md` — companion principle: AI
  pre-screening (like estimating context %) is signal, not approval.
  Same family of "trust the user's UI over the model's guess."

---

*Filed under: process / Claude-self-calibration.*
