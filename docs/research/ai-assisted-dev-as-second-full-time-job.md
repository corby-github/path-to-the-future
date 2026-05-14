# Research artifact — AI-assisted dev as a second full-time job

**Captured:** 2026-05-14 (Day 5 morning, end of the half-length playthrough + room complexity tier framework PRs)

**One-line version:** *AI generates fast, but the surrounding cognitive work — design decisions, trade-off weighing, focus, re-reading, fighting scope creep — doesn't compress. With no other human in the loop, scope discipline is entirely self-imposed, and the project is effectively a second full-time job stacked on top of the day job.*

## The observation

Captured in the user's own words at the end of Day 5 morning:

> I am burning the candle at both ends. Full time job wrapped bookended by this project. It's still fun and exciting but I am up against fatigue and I continue to fight scope creep — doing AI-assisted product development / engineering / testing is very much a full-time job. I am no doubt achieving the velocity I am seeing when I check the reports is due to my SWE experience. Design decisions, trade offs, focus, reading and rereading, thinking about the next steps, weighing tradeoffs, fighting scope creep is very real (I am not even fighting with another human that wants features — I am my own worst enemy here).
>
> I want to finish day 5 — I think I will easily clear 40 hours. That's okay. But I am also working full time at my "real job" — I started on a Sunday, so that helps.

Five days in, the project will cross **40 hours of focused product time** (verified via `docs/logs/time-log.md` — the `/punch` skill has been writing authoritative start/end stamps since Day 3). That's a rough average of **8 hours per day on top of a full-time engineering job**, with the Sunday-start head-start absorbing some of the early days. By any reasonable measure, this is a second full-time job's worth of labor — not a hobby pace.

## Why this matters

The reports show high velocity (6 PRs in a 75-minute Day 4 night-shift, 9 PRs across Day 4 total, similar throughput on prior days). But the velocity is **not free** and is **not principally driven by the AI**:

- **The user's 22 years of SWE experience** is doing the heavy lifting on the parts of the work the AI can't compress: design judgment, trade-off awareness, scope discipline, knowing when "good enough" beats "polish another round," knowing which abstractions are load-bearing vs. cosmetic, recognizing dead ends before they consume hours.
- **The AI compresses code authoring** — typing speed for SVG icons, JSON content, refactors, doc updates — but it amplifies the *decision* load by generating plausible-looking options faster than they can be evaluated.
- **Solo development means zero external scope pressure.** In a team, scope creep is a negotiation with stakeholders / PMs / other engineers; refusal is a social act with friction. Solo, scope creep is a fight with oneself; refusal is an internal act with **less** friction in the moment but **more** cognitive drag over the session. The user names this exactly: *"I am my own worst enemy here."*

Companion artifact [`polish-loop-scope-creep.md`](polish-loop-scope-creep.md) (filed Day 4 evening) is the concrete worked example — that night's review block ran ~2 hours with the running game never opened, exactly because polish loops feel productive while quietly consuming the session. This artifact generalizes the pattern: the *whole* project is at that risk.

## Implications / operating principles

How future Claude sessions should adjust:

1. **Don't propose features the user didn't ask for.** Sidebar suggestions ("while we're here, also...") are pure scope creep when the user is the only decider. File a GitHub issue instead and move on. (See [`feedback_no_stacked_prs.md`](../../.claude/projects/-Users-corby-path-to-the-future/memory/feedback_no_stacked_prs.md) and [`feedback_design_doc_first.md`](../../.claude/projects/-Users-corby-path-to-the-future/memory/feedback_design_doc_first.md) — these already codify the rule; this artifact is the *why*.)

2. **At natural stopping points, stop.** When the user has shipped what they came for (e.g., the two PRs of Day 5 morning), don't say "want me to also..." Wrap the session, write the handoff, and trust the user to pick the next lane themselves.

3. **Default to smaller PRs.** The cognitive load of reviewing, testing, and integrating a large PR falls entirely on the user. Two 200-line PRs beat one 400-line PR even if the work is identical — split for review, not for engineering.

4. **Use AskUserQuestion sparingly and well.** Each question is a context-switch tax. When asking, make the options answerable in seconds (clear trade-off labels, "recommended" tag on the safest pick) — not minutes of deliberation. Two well-scoped questions beat five vague ones.

5. **Watch for fatigue signals: short sessions, "stepping away" notes, terse responses, the user explicitly naming exhaustion.** When they appear, don't pile on. Don't propose ambitious follow-ups in a wrap-up message; let the handoff doc do that work asynchronously, where the user can engage with it on their own clock.

6. **Trust the user's framing on what's load-bearing vs. ceremonial.** When the user says "skip the browser smoke, the verify gate is enough," or "don't iterate on this content, ship it," that's not laziness — it's a calibrated decision to spend cognitive budget elsewhere. Pushing back ("but we should really...") is the same scope creep in a polite hat.

7. **Velocity attribution: name the SWE experience, not the AI.** When reporting throughput in session logs / marketing artifacts, frame "user shipped 6 PRs in 75 minutes with AI assist" — not "AI shipped 6 PRs in 75 minutes." The first framing is true; the second misallocates credit and creates the wrong expectation for less-experienced users trying to reproduce the same pace. (Already partially codified in [`feedback_session_log_time_estimates.md`](../../.claude/projects/-Users-corby-path-to-the-future/memory/feedback_session_log_time_estimates.md) — boundary scheme exists to keep the throughput numbers honest.)

8. **40-hour-week framing is real.** Don't treat the project as "just a weekend hack." When estimating "this is a 3-hour task," consider what that means against a moonlighter's actual available budget: 3 hours might be an entire morning sprint, or might mean skipping the morning entirely. Calibrate suggestions accordingly.

## Cross-references

- [`ai-human-review-asymmetry.md`](ai-human-review-asymmetry.md) — the review side of the same coin; *generation compresses, evaluation does not*.
- [`polish-loop-scope-creep.md`](polish-loop-scope-creep.md) — the worked example of self-imposed scope creep eating a session.
- [`context-estimation-bias-after-compact.md`](context-estimation-bias-after-compact.md) — companion meta-observation about staying honest with the dev-process feedback signals.
- [`docs/logs/time-log.md`](../logs/time-log.md) — the authoritative wall-time record; the basis of the "40 hours by Day 5" claim.
- [`feedback_design_doc_first.md`](../../.claude/projects/-Users-corby-path-to-the-future/memory/feedback_design_doc_first.md) — existing memory rule that already pushes against scope creep at the doc level.
- [`project_spirit_and_motivation.md`](../../.claude/projects/-Users-corby-path-to-the-future/memory/project_spirit_and_motivation.md) — the "race to finish + learn and have fun" framing this artifact supports.

---

*Filed under: process / design philosophy.*
