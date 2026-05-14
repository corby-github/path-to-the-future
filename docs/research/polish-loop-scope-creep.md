# Research artifact — Polish-loop scope creep on AI-generated content packs

**Captured:** 2026-05-13 (day-4 evening, mid-review of the homeschool pack on `feat/homeschool-tone-pass`)

**One-line version:** *AI compresses initial content authoring to minutes. A multi-round polish loop on that content stays bounded by human reading speed — and accumulates into hours of work that don't show up in any scope estimate, because they happen one "small tweak" at a time.*

## The observation

Mid-evening on day 4, the user (Corby) realized that the homeschool pack — already "shippable" since Phase 2 landed on PR #60 — had consumed several hours of additional review-iteration this evening, with no actual gameplay testing happening in parallel. Quote:

> "It's obvious now that homeschool pack is scope creep. I want to be sure the game has 2 selections for career, but reading and rewording the copy and reviewing and remaking the images is taking time — a lot of time. I don't think I have opened the game in the past few hours. Just reviewing the `/text-previews/` and `/icons-previews/`. This is time that is compressed some by the generation/replacements of the AI but nothing speeds up the reading and reviewing."

The original v1 goal was simple: ship with 2 playable career packs. The homeschool pack cleared that bar on PR #60 (30 decisions + 37 events + 12 interactables + intro + endgame taglines). It has been shippable since.

The Day 4 evening work — which generated PRs #63 (SWE icon revisions), #64 (SWE language tweaks), and #65 (homeschool tone pass) — is post-shippable polish. It's high-quality polish. It's also been the user's *primary* activity for the entire evening session.

## The data point — what the polish loop looked like, concretely

Across two packs in one evening session (~3 hours of focused review time):

- **PR #63** — three rounds of SWE icon revisions, ~30 icons redrawn, driven by the user's eyeball-review of the icons preview.
- **PR #64** — pager wording retired across SWE language; two SWE event bodies rewritten (grocery checkout + flow-state); intros + month-1 narratives revised in both packs.
- **PR #65** — homeschool review pass, now multi-commit:
  - 5 framing fixes ("we always homeschooled") + 5 humor tune-ups
  - 10 spouse-"they" pronoun rewrites
  - 8 wording tweaks + new church event + Mr Nobody melted M&Ms event
  - 4 new content pieces (snack rebellion + tablet decisions; Mr Nobody + Research-allegedly events)
  - 14-event SWE-register tone lift on heavy bodies
  - 11 decision-flavor rewrites at "+10 humor"

That's roughly **80+ surgical edits in one evening**. Each was small (1–3 sentences, often less). Each took Claude seconds to produce and the user 30–60 seconds to read, judge, approve or redirect. The cumulative load on the user was hours of focused reading-and-judgment time. The cumulative load on Claude was minutes of generation time.

## Why this matters

**The compression asymmetry is real and load-bearing.** The morning's [`ai-human-review-asymmetry.md`](ai-human-review-asymmetry.md) named the principle abstractly. This evening provides the worked example: AI generated 80+ edits in seconds-to-minutes total; the user reviewed them in hours. The compression ratio on generation is enormous. The compression ratio on review is 1:1 with eyes-on-screen time.

**Scope creep on polish is invisible at decision time.** No single edit felt like scope creep. Each looked like "one more small fix while I'm here." But the loop is unbounded if the success criterion is "everything reads exactly right" — because the writer's ear can always find the next thing.

**The "shippable" line and the "polished" line are different lines, and they should be priced separately.** Phase 2 of the homeschool pack was shippable. The evening's tone pass is making it good. Making-it-good costs hours of irreplaceable human review time that no model upgrade will compress.

**There is no game-time happening during the polish loop.** The user explicitly noted: hasn't opened the running game in hours. The review surfaces (`docs/text-previews/homeschool.html`, `docs/icons-previews/homeschool.html`) *became* the activity. Playtesting and feel-of-the-game review have not been getting attention. The preview HTMLs are a fast loop; the game itself is the slow ground-truth loop, and the fast loop has been crowding it out.

## Operating principles that follow

1. **Define "done enough to ship" and "polished" as different lines from the start.** "Done enough" means content is in the game, plays through, doesn't break. "Polished" is a separate budget — capped, time-boxed, or explicitly accepted as scope expansion. When the pack crosses the first line, the second line is OPTIONAL work, not "remaining work."
2. **Budget polish-review hours up front, separately from authoring hours.** A 30-decision pack might cost 1 hour to author with Claude and 4 hours to polish-review. Both numbers are real. Estimate both, in advance.
3. **Watch for "I keep finding small things" as a signal the review pass should end.** When the rate of "this isn't right" callouts is going DOWN but you're still finding them, that's normal. When it's going UP, the pack has structural register issues that need a re-anchor (like the user's "tablet decision is the target register" mid-evening reset) before more surface tweaks help. The polish loop in this evening had both modes.
4. **Use review-surface artifacts as the rate-limiter, not the goal.** Generate them, review them, fix what's worth fixing, ship. Don't let the review surface become the dev loop. The actual game is the dev loop.
5. **Re-open the running game periodically during a polish loop.** A 20–30-minute playtest after every 1–2 hours of preview-review re-anchors what's actually shipping vs. what's living only in the static HTML. This evening's review went past that ratio.
6. **Recognize "I'm still reading" as work that needs its own time budget.** It IS work. It IS valuable. But it's not "post-shippable easy cleanup" — and treating it that way is how polish loops eat days.

## Cross-references

- [`ai-human-review-asymmetry.md`](ai-human-review-asymmetry.md) — the principle this artifact provides a concrete worked example for.
- [`context-estimation-bias-after-compact.md`](context-estimation-bias-after-compact.md) — same family: Claude's intuition about effort doesn't track human reality. Today saw a second data point (afternoon ~65% est vs. 29% actual without a compact in play).
- PRs in flight at time of capture: [#63](https://github.com/corby-github/path-to-the-future/pull/63), [#64](https://github.com/corby-github/path-to-the-future/pull/64), [#65](https://github.com/corby-github/path-to-the-future/pull/65).
- `docs/logs/time-log.md` — day-4 afternoon `human-review` boundary (≈50m) and day-4 evening session (in progress, mostly review). The boundary scheme exists exactly to keep this kind of work visible in the time accounting.
- Design doc §17 (Build Order) lists Day 13c polish + Day 14 title + Day 15 analytics. The implicit assumption was that content polish belonged to "earlier days." This artifact suggests content polish on a shipped pack is its own multi-hour bucket that should appear *explicitly* in build planning, not as residual cleanup.

---

*Filed under: design philosophy / process / time accounting.*
