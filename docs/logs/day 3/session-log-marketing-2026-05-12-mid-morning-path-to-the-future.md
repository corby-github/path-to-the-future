# Three PRs in 106 minutes. One was built by an agent I never looked at.

Mid-morning sprint, day 3 of the build. I punched in at 9:24 AM, punched out at 11:10. In that window I merged a backward-replay system that lets the player walk through past months read-only, a kind-aware speaker header for NPC dialog boxes, and a placeholder-icon registry for the decision and event modals — the last of those built end-to-end by a background agent running in a separate git worktree while I focused on something else.

## What we built

Three merged PRs:

- **PR #40 — Backward replay (closes #33).** The full feature. Player walks into a new bottom-left "rewind door" in any decision room and the room remounts as the previous month, in read-only mode. Decisions and events are locked, NPC dialogues replay but their effects are suppressed, minigame months show a frozen result card. HUD dims to 0.7 opacity and the month label prefixes with `←`. The status bar picks one of 16 random flavor lines per replay-room mount — "Hindsight is 20/20", "Still no key", "Different month. Same coffee stain." Multi-step back works; "↩ Return to {liveMonth}" exits. STATE_VERSION 1.2.0 → 1.3.0. 18 files, 571 insertions.

- **PR #38 — NPCModal speaker header + icon-left sprite (closes #28).** Above the typewriter prompt, NPCs now get `"Intern says…"`; objects get `"Plant."` (no verb, they don't speak). A full-opacity sprite icon sits in a left column of the dialog box — the SAME sprite the player just walked up to. Both signals work together: the player always knows who's talking. Bundled in: a fix for the `npc-peer-eng` sprite whose "wristwatch" rectangle had been rendering as a dot below the waist line. (Pocket protector with a pen tip now. Much better trope.)

- **PR #39 — Modal icons placeholder registry.** Built by a background agent. A tiny `decisionId → IconComponent` registry now drives a placeholder square icon in DecisionModal (inline with the prompt and chosen-option label) and EventModal (top-centered above the title). Real SVG art swaps in per-id without ever touching the modal code. Three test IDs registered (`univ-stay-late-vs-log-off`, `univ-standup-too-long`, `evt-era-pandemic-furlough-friend`); all currently render the same placeholder.

Plus: the `/punch` time-tracking skill (built earlier this morning) graduated from project-local to user-global. The wall-clock window above (9:24 → 11:10) is the first sprint bounded by real punch events, not estimated.

## The numbers

- **Time spent:** 1h 46m of focused work — from `docs/logs/time-log.md`, not estimated from chat depth
- **Traditional-team equivalent:** 5–8 working days for 1 senior eng + 1 designer + 1 PM running normal async cadence
- **Compression ratio:** ~25–40× on working hours, ~2–3× on calendar days

The wall-clock number is honest because I literally punched in and out. The team estimate includes design iteration cycles, PR reviews, and the back-and-forth a normal team needs to land three independent PRs. It excludes real illustration art, accessibility audit, cross-viewport testing, and QA on the state-shape change. Production-ready and "spec-complete + engine-correct" are different things; this sprint achieved the second.

## What surprised me

**The background agent actually worked.** I told it: "go build the modal icon registry in this worktree, use the data-attrs memory rule, ship a PR." It went off, did the implementation, ran the verify gate, ran into a `git commit` permission wall, and came back. I finished the commit + push + PR myself in about a minute. Net: I focused on PR #40 (the big one) while PR #39 happened in parallel. **This is the first time real parallelism shows up in my AI-assisted workflow** — not "the AI does steps faster" but "two streams of work happen at the same time."

**Iterative visual review at hot-reload speed is the actual unlock.** The DecisionModal icon went through three positions (top-right → top-left → inline next to prompt/chosen-label) before the layout was right. In a normal team flow that's three review cycles spanning three calendar days. Here it was ten minutes total — I'd see each version on the dev server, sketch the next direction in text, watch the assistant land it. The bottleneck isn't AI generation speed; it's how fast I can evaluate visual choices. Tight loop = real velocity.

**The "still too big" debugging moment.** I told the assistant the 6+ month emit was still huge despite multiple font-size reductions. The fix wasn't in the font size — it was buried in a CSS keyframe whose `-50%` horizontal translate was scaling with element width, making wider strings (`+6 months pass`) drift further left and *look* bigger. The assistant traced the cause one layer up from the obvious spot. **When a fix at the obvious site doesn't satisfy, the source is somewhere else.**

## The catch

Three PRs in 106 minutes is real, but it's not three product-ready features. What this sprint did NOT do: outside code review (I'm the only set of eyes), real visual design (the placeholder icons are still placeholder squares — real art is a separate effort), accessibility audit on the replay flow and modal layouts, QA on the STATE_VERSION bump (existing saves will discard cleanly, but nobody's verified every state transition).

Three positions on the DecisionModal icon before the layout worked is also evidence of how much a designer would have saved up-front. A designer pre-routed to "inline" would have eliminated the two absolute-positioned attempts. The compression number above reflects what happened, not the optimal path.

## What's next

Issue #30 (transition vibe fix), Issue #26 (endgame timeline redesign), Day 13c polish bundle, then Day 14 (title screen) and Day 15 (analytics + GitHub Pages deploy). Plus a 42-minigame issue I owe — queued during this sprint, not yet filed. Also a few open issues for the arcade (#31) and Pong (#32) features that are specced but unbuilt.

---

*A working sprint with Claude (Opus 4.7, 1M context), 2026-05-12, 9:24 AM – 11:10 AM EDT. Time data from `docs/logs/time-log.md` — punched.*
