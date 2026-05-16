# Day 6 of building a game in public: 8 PRs, 35 room templates, one closed mechanic ladder, and the day I learned how parallel AI sessions actually feel.

Two sittings. Roughly four hours of focused product work. By evening, the game's room-difficulty system was fully populated end-to-end (simple → easy → medium → hard → expert), the template pool had grown from 14 to 35, and the design doc had walked through eleven version bumps. The headline number is the compression ratio — but the more interesting story is what happened when I added a second Claude session to the evening.

## What we built

**Morning (06:02–08:02 EDT, 1h 59m).** Four PRs against `main` (three merged, one open by the end). NPC palette tokens (people now read as people, not as more furniture). A working analytics wrapper with eleven pageview slugs and four custom events, gated to production-only behind multiple guard layers. Three new "easy tier" room templates — the difficulty curve in the design doc finally shows up in play. And the load-bearing one: a working **moving-obstacle physics layer** for the medium tier — collision detection, knockback semantics, damage system, and a +100 XP bonus for clean traversal. Real engine code, not a placeholder.

**Evening (19:24–21:51 EDT, 2h 27m, two concurrent Claude sessions).** Four more PRs merged. The morning's medium-tier physics got a feel pass (smooth two-phase knockback replacing the v1 instant snap, twinkling stun stars above the player, a "must-release" input gate so held keys don't auto-resume). A new **expert tier** with deterministic linear-interp path motion and tier-aware NPC placement zoning. Seven amped **hard-tier** templates closing the §4 ladder. Twelve new **medium-tier** templates filling the content gap in two batches. A bug-fix moving misclassified random events onto an NPC's dialogue list. Two GitHub issues filed. Two research artifacts captured. Design doc walked from v2.0.18 → v2.0.25.

Pool count by end of day: **13 simple + 4 easy + 8 medium + 6 hard + 4 expert = 35 unique room templates**, up from 14 at the morning's open.

## The numbers

- **Wall time across two sittings:** 4h 27m (1h 59m morning + 2h 27m evening).
- **Focused product wall time:** ~3h 56m (~30m of evening was interleaved playtest review).
- **Traditional-team equivalent:** 7–9 working days for a small team (1 senior engineer + 1 game designer + a playtester rotation).
- **Compression ratio:** roughly **14–18× on product wall time**, in the band the project's been running. Honest caveats below.

## What surprised me

**Engine-vs-content compression was the genuinely new beat.** Compression on content work — palette tokens, analytics wiring, template authoring — is something I've gotten used to. The new beat was that **engine work compresses too**. The morning's medium-tier physics PR landed inside the same 2-hour window as three smaller PRs. Real collision detection, real knockback semantics, real bonus-XP scoring, all in one sitting. That's a "tomorrow afternoon" task in any other workflow. It happened next to the small PRs.

**Cross-session feedback transferred for free.** I had two Claude sessions running in parallel during the evening. When I told the medium-content session that PR #95 templates were "too easy, walls forcing the player into motion is the lever," that framing was load-bearing for the *room-ladder* session's hard-tier authoring even though I never said it directly to that session. Both sessions could see the conversation. Both updated their model. Saved an entire round-trip of "ship → too-easy → re-author."

**Working-tree collisions were the unexpected friction tax.** Two Claude sessions sharing one local git checkout collided twice this evening at the working-tree boundary. Once when both sessions tried to edit the same file at the same time; once when a checkout silently shifted between sessions and a commit landed on the wrong branch. Each collision cost only a few minutes to clean up — but more importantly produced *uncertainty* about whose work was whose at the moment of recovery. The fix that would have prevented both: a separate `git worktree` per session. We documented this as a third, mechanical ceiling on parallel sessions, distinct from the attention ceiling I'd already known about. Net-positive from parallelism, but with real measurable cost worth naming.

**The composition grammar paid back its writing cost on the second use.** Naming the *(geometric base × motion overlay × parameter axis)* framework took ~10 minutes of upfront work in the issue write-up. By the sixth template in the second medium batch, the per-template authoring cost had collapsed from ~20 minutes to ~3 — the grammar was internalized and the variation was on dimensions already named. This is the leverage of writing the grammar down: each subsequent batch inherits the prior batch's vocabulary.

**Terse playtest feedback was the day's highest-leverage signal.** Lines like "weak haha", "switchback-paddle is fine — too slow", or "tight-pickets is good — probably the first expert one I have seen" carried more design information per word than long debate. The skill the AI brought wasn't pattern authoring — anyone with the schema can write rectangles — but *conversion speed*: 30 seconds from a one-line read to corrected code, with period, amplitude, and wall geometry all adjusted to the implied tier. The evening went around that loop ~15 times.

## The catch

Several. Naming them is the credibility move.

**This isn't greenfield.** The compression ratio holds at this magnitude *because* the project's domain has been worked through extensively (design doc at v2.0.18 entering the day, 5 days of prior context, established architectural patterns). The morning's physics PR was scoped against a framework PR specced last week; the evening's content sprints leveraged the morning's just-shipped motion primitives. Pure greenfield wouldn't compress like this.

**The traditional-team excludes things a real team would do.** Stakeholder review, multi-playtester validation, code review by a second engineer, QA pass on the new rooms end-to-end, visual-design review of the moving-obstacle treatment, cross-browser testing, accessibility review of the new collision visuals, performance profiling. None of these were in scope today. The number is honest *for the work that was done*, not for the work a team would also do.

**Parallel sessions have real coordination cost.** The two working-tree collisions returned ~10–15 minutes of the saved time as cleanup overhead. Single-session work wouldn't have caused them. The lesson is now a research artifact: future multi-thread sprints should commit much more frequently, or use `git worktree` for true per-session isolation.

**The AI consistently over-estimated its own templates' difficulty.** Open geometry kept playing two tier bands easier than predicted. Without the playtest read, the hard-tier PR would have shipped with four templates that actually play medium or simple. The fix is now a rule baked into the design doc: motion without forcing geometry doesn't hold its tier. Wide-bar paddles, frame walls, center splits — those are the reliable amp-up moves.

## What's next

The §4 mechanic ladder is closed. The remaining content gap (~8 easy templates, ~5 more medium) is the next sprint or two — and the per-template cost is now ~3 minutes thanks to the grammar. Two issues filed today (keyboard tutorial widget + double-tap sprint) are fully spec'd and ready to be picked up as a combined PR. Day 15's analytics deploy half (GitHub Pages) is the only outstanding item on the original build plan.

The week's velocity holds.

---

*A working sprint with Claude on Path to the Future, 2026-05-15. Consolidated record across the day's two sittings. Per-sitting logs are in the same folder; this is the canonical record.*
