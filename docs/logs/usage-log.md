# Usage Log

Point-in-time snapshots of context window, plan usage, and token estimates.
Flags: `(user)` = user-reported from UI, `(est)` = Claude's rough estimate.
Entries are append-only.

| When             | Ctx %      | Plan usage                        | Tokens (est)   | Notes                                       |
|------------------|------------|-----------------------------------|----------------|---------------------------------------------|
| 2026-05-13 06:24 | 43% (user) | 5h 49% · wk 66% (user)            | 426.3k (user)  | post-restart; values from UI screenshot ~06:25 EDT, after PR #61 push |
| 2026-05-13 06:48 | 14% (user) | 5h 64% · wk 68% (user)            | 143.3k (user)  | post PR #62 push (generator + SWE previews + research artifact + /research skill); UI screenshot — my ~65% est was wildly off (compaction reset the window) |
| 2026-05-13 07:08 | 21% (user) | 5h 68% · wk 68% (user)            | 205.4k (user)  | break-time snapshot at /punch end day-4 morning; all activity since prior snapshot was process tooling (boundary-scheme formalization in /punch + session-process-log skills, time-log edits, this snapshot) — see two boundary blocks in time-log totaling 18.4 min |
