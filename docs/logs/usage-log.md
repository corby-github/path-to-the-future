# Usage Log

Point-in-time snapshots of context window, plan usage, and token estimates.
Flags: `(user)` = user-reported from UI, `(est)` = Claude's rough estimate.
Entries are append-only.

| When             | Ctx %      | Plan usage                        | Tokens (est)   | Notes                                       |
|------------------|------------|-----------------------------------|----------------|---------------------------------------------|
| 2026-05-13 06:24 | 43% (user) | 5h 49% · wk 66% (user)            | 426.3k (user)  | post-restart; values from UI screenshot ~06:25 EDT, after PR #61 push |
| 2026-05-13 06:48 | 14% (user) | 5h 64% · wk 68% (user)            | 143.3k (user)  | post PR #62 push (generator + SWE previews + research artifact + /research skill); UI screenshot — my ~65% est was wildly off (compaction reset the window) |
| 2026-05-13 07:08 | 21% (user) | 5h 68% · wk 68% (user)            | 205.4k (user)  | break-time snapshot at /punch end day-4 morning; all activity since prior snapshot was process tooling (boundary-scheme formalization in /punch + session-process-log skills, time-log edits, this snapshot) — see two boundary blocks in time-log totaling 18.4 min |
| 2026-05-13 18:01 | ~65% (est) | —                                 | ~500k (est)    | post-PR #63 push + boundary-close on day-4 afternoon human-review. Fresh afternoon session (not anchored to 07:08 row). Heavy: design-doc reads, ~30 icon-SVG edits across 3 review rounds, decisions.json + events.json reads/edits, multiple verify + gen:previews runs, 3 commits + PR. Plan usage left blank — supply from UI if you want it filled in. |
| 2026-05-13 18:06 | 29% (user) | 5h 21% · wk 70% (user)            | 293.1k (user)  | UI screenshot. My 18:01 ~65% est was 2.2× too high — same overestimation pattern as the morning ~65%→14% miss (see `docs/research/context-estimation-bias-after-compact.md`), this time without a compact in play. Diagnosis: I conflated "felt-length of heavy tool work" with "tokens loaded right now"; system-reminder full-file dumps cost tokens at emit but don't all stay resident. Anchor for the rest of the afternoon: ~29% + small deltas. |
