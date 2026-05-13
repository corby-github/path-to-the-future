# I shipped 38 hand-drawn icons, an SSR review pipeline, and a design-philosophy artifact in under two hours. The catch is the part you can't compress.

I sat down at 4:58 AM. By 7:08 AM I had two PRs merged: 38 new SVG icons completing one of my game's content packs, plus a working Node script that renders every modal icon and every line of player-facing dialog into self-contained HTML review pages. Both shipped to `main`. Somewhere in the middle I also accidentally authored a research artifact about why this entire workflow has a hard, irreducible floor.

That floor is the thing this post is about.

## What we built

In one ~2-hour sitting, two PRs landed in `path-to-the-future`:

- **PR #61** — 38 new icon components in `src/game/ui/icons/modalIcons.tsx` (now 1,344 lines, 80+ icons), each registered in `modalIconRegistryData.ts`. The Software-Engineering content pack went from ~half-covered to 100%: 35 decisions + 39 events + 1 finale, every id with real Treatment-A line-art SVG.
- **PR #62** — A Node TS generator (`scripts/generate-previews.tsx`, ~600 LOC) that reads a career pack and emits two self-contained HTML files: one with every word the player will read in earliest-month order banded by era (1,857 lines), one with every icon rendered through `react-dom/server` against the pack's palette (758 lines, 81 SVGs). Plus an `icon-descriptions.ts` caption table (~80 entries), a `tsx` tsconfig for SSR, and an `npm run gen:previews` script.

The whole thing is at [github.com/corby-github/path-to-the-future](https://github.com/corby-github/path-to-the-future) if you want to look.

## The numbers

- **Time spent on product:** 1 hour 52 minutes of focused sprint time. (Sprint total was 2h 10m; the other 18m was meta-tooling I'll explain below, and I deliberately don't count it as product velocity.)
- **Traditional-team equivalent:** 3–4 working days. Assumed team: 1 designer doing 38 Treatment A icons at ~25–30 min each with revisions (~16–19 hours), plus 1 engineer building the SSR pipeline + caption table (~5–8 hours), plus ~1–2 hours of PM time articulating the design-philosophy artifact, plus PR review cycles.
- **Compression ratio:** Roughly 10–15× faster, on this specific kind of work — iconography in a single consistent style, plus build-time tooling that reuses code already in the project.

## What surprised me

The marginal cost of the 35th icon was the same as the 5th. No fatigue, no style drift, no "I'll get the next batch right." Once the Treatment A rules were settled (80×80, line-art at strokeWidth 2.5, rounded caps, filled accents in `palette.ink`), the model produced 38 of them in a single PR window without me having to re-anchor the conversation. A team would have spread that work over a week — partly for sustainable pace, partly because designers fatigue at "do the next icon in the same style" much faster than you'd hope.

The SSR generator was the surprising win. I expected to spend 30 minutes scoping "should we add preview HTML pages." It took 30 minutes from "let's add them" to "two HTMLs rendered, npm script wired, `npm run verify` clean." The generator imports the React icon components and renders them via `react-dom/server` with the pack's own palette — so what shows in the review page is what ships in the game. No drift surface.

The thing I didn't expect was how many times I had to push back. Four moments stand out: the icons shouldn't have a tile background (visual judgment); the cell-phone icon read as ambiguous (legibility judgment); a single time-log marker doesn't communicate duration (schema judgment); meta-tooling time shouldn't be counted as product velocity (epistemic honesty judgment). None of those were things Claude would have caught alone. The pattern was consistent: plausibly-good output, generated fast — and my job, as the human, is to catch the places where "plausibly good" silently drifts from "actually right."

## The catch

This is the part that's load-bearing.

I also wrote a research artifact during this sprint titled "AI/human review asymmetry." It says: AI generates content in minutes; a human reviewing that content for voice, tone, feel, art, and gameplay quality **cannot be compressed**. Reading every line, looking at every icon, judging palette and feel — those steps take the time they take, because the whole point of the judgment is that it's *mine*, not a model's approximation of mine.

The 10–15× compression number above is honest about what the AI did. What it can't tell you is what comes *next*: I now have to sit down with the SWE preview HTML and read every line aloud to make sure the voice holds. That's a 30–60-minute step that no amount of model upgrade will eliminate. The icons review is another 15–30 minutes of scanning for legibility and stylistic consistency. None of that is in the sprint number.

The sprint I just logged shipped the *tooling that makes that review possible* — `docs/text-previews/swe.html` and `docs/icons-previews/swe.html` are the cheapest surfaces that still preserve the irreplaceable human step. If I'd just generated the content and skipped the review surface, I'd be a week into the project before noticing voice drift at month 87, and the rework cost would be much higher than the review cost would've been.

I also did 18 minutes of pure meta-tooling that I excluded from product time: a new universal `/research` skill, a research artifact about a context-estimation bug Claude had post-`/compact`, a patched `/usage` skill body, a paired-boundary time-tracking scheme. None of that ships the game. Counting it as product velocity would inflate the headline and damage the credibility of the comparison. So I built a boundary scheme into my time log to keep myself honest about it. That's now durable in the `/punch` skill body for any future project.

## What's next

Homeschool-parent pack ramp: 67 more icons in the same Treatment A style, then run the same generator (`npm run gen:previews -- --pack=homeschool-parent`), then a linear review pass before scaling. The compression should hold for the icon batch. The review pass will take what it takes.

---

*A working sprint with Claude (Opus 4.7, 1M context), 2026-05-13 — Day 4 morning of the Path to the Future build.*
