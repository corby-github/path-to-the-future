---
name: punch
description: Record working-session start/end times to docs/logs/time-log.md. Use when the user says "punch in", "punch out", "punch start day-N label", "punch end", "start session", "end session", "log session start/end", or invokes /punch. Produces the authoritative time data that session-process-log will read.
---

# Punch

A small time-tracking skill. Writes a `start` or `end` event to `docs/logs/time-log.md` so working sessions are bounded by real wall-clock timestamps, not after-the-fact estimates.

The file this skill writes is the **authoritative source** for `anthropic-skills:session-process-log` — when that skill runs, it should read `docs/logs/time-log.md` for session boundaries instead of asking the user.

## When to invoke

Trigger phrases:
- "punch in" / "punch out"
- "punch start day-N {label}" / "punch end"
- "start session day-N {label}" / "end session"
- "log session start" / "log session end"
- "/punch start ..." / "/punch end"
- Any time the user says they're starting or ending a focused working block

If the user invokes ambiguously ("punch this"), ask whether they mean start or end and what the label should be — don't guess.

## Args

The skill takes a single argument string in one of two shapes:

### Start
```
start day-N session-label [optional note in quotes]
```

- `day-N` — the build day (e.g., `day-3`). Should match the project's day counter (the same one used for `docs/logs/day N/`).
- `session-label` — short kebab-case label (e.g., `early-morning`, `midday`, `afternoon`, `evening`). Should be unique within a day so multiple sessions in one day don't collide.
- `note` (optional) — trailing string in quotes for context (e.g., `"back from coffee"`).

Example: `start day-3 afternoon "after the punch-skill build"`

### End
```
end [optional note in quotes]
```

No day or label — `end` auto-closes the most recent unclosed `start`. Optional trailing note.

Example: `end "stopping for dinner"`

## Process

### 1. Read the log

Read `docs/logs/time-log.md`. Parse the table rows below the header. Each row is `| Day | Session | Event | Timestamp | Notes |`.

Compute the **open session**: the most recent `start` row that has no matching `end` row (matched by Day + Session label). If multiple unclosed starts exist (shouldn't happen, but defensively), the open session is the latest one by timestamp.

### 2a. If `start`

- **Reject if any session is already open.** Tell the user which session is open and that they should `/punch end` first. Do not append.
- Parse the args (`day-N`, `session-label`, optional note).
- Get current UTC timestamp: `date -u +"%Y-%m-%dT%H:%M:%SZ"` via Bash.
- Append a row to the table:
  ```
  | {N}  | {session-label} | start | {ISO-UTC-timestamp} | {note or empty} |
  ```
  Use the Read+Edit tool flow to insert the row at the bottom of the table; don't rewrite the whole file.
- Confirm to user:
  > Punched in: day {N} / {label} at {local-time}.

### 2b. If `end`

- **Reject if no session is open.** Tell the user there's nothing to close. Do not append.
- The closing row uses the same `Day` and `Session` values as the open `start`.
- Get current UTC timestamp.
- Append a row:
  ```
  | {N}  | {session-label} | end | {ISO-UTC-timestamp} | {note or empty} |
  ```
- Compute duration: `end_timestamp - start_timestamp`. Format as `Xh Ym` (e.g., `2h 04m`).
- Confirm to user:
  > Punched out: day {N} / {label}. Duration: {Xh Ym}.

### 3. Commit and push to main

After appending, commit directly to `main` (user explicitly opted out of PRs for time logging — this is just timekeeping):

```bash
git add docs/logs/time-log.md
git commit -m "docs(time-log): punch {start|end} day-{N} {label}"
git push origin main
```

If the working tree has unrelated uncommitted changes, stage **only** `docs/logs/time-log.md` (use `git add` with the explicit path, not `git add -A`). Don't sweep up unrelated work into the punch commit.

If `git push` fails (no network, auth issue), keep the local commit and tell the user — they can push later. Never force-push for a punch event.

## File format

`docs/logs/time-log.md`:

```markdown
# Time Log

{preamble}

| Day | Session       | Event | Timestamp            | Notes |
|-----|---------------|-------|----------------------|-------|
| 1   | planning      | start | 2026-05-10T17:25:00Z | ...   |
| 1   | planning      | end   | 2026-05-10T18:56:00Z | ...   |
...
```

- Append-only. Past entries are not rewritten.
- Timestamps are UTC ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`).
- Day column is just the number (`1`, `2`, `3`, ...) — no `day-` prefix.
- Session labels are kebab-case (`early-morning`, not `Early Morning`).

## Edge cases

- **User invokes punch with malformed args.** Ask once for the correct shape, then proceed.
- **User wants to backfill a past session.** Don't do it through this skill — the user edits `docs/logs/time-log.md` directly. The skill is append-only with current-time stamps. Tell the user this if asked.
- **User punches end with no open session.** Refuse with a clear message; suggest they may need to `/punch start ...` first.
- **User punches start when one is already open.** Refuse with the open session's day/label; suggest `/punch end` first.
- **Git operations fail.** Keep the local file update. Tell the user. Don't roll back the file edit.

## Reading guidance for other skills

When `anthropic-skills:session-process-log` (or any future tool) wants session times:

1. Read `docs/logs/time-log.md`.
2. Find the matching `start` and `end` rows for the sprint (by Day + Session label).
3. Use those timestamps as authoritative — don't ask the user, don't estimate.
4. If a session has no matching `end` yet, the sprint is still in progress; the end is "now."

This is the rule. The relevant feedback memory (`feedback_session_log_time_estimates.md`) points to this file as the source of truth.
