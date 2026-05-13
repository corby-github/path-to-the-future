# Research artifact — the AI/human review asymmetry

**Captured:** 2026-05-13 during the Day 4 morning two-thread push (PR #62, the
review-page generator).

**One-line version:** *AI can generate content in minutes. A human reviewing
that content for voice, tone, feel, art, and gameplay quality cannot be
compressed. The review takes the time it takes, and any process that tries
to skip it produces a product that doesn't sound like the author.*

## The asymmetry

There is a structural mismatch between two halves of the production
pipeline on this project:

| Phase                         | Speed                          | Compressible by AI? |
|-------------------------------|--------------------------------|---------------------|
| Generate decisions / events / flavor / scene lines | Minutes per batch of dozens | Yes — fast.         |
| Generate icons / SVG art      | Seconds per icon               | Yes — fast.         |
| Generate engine plumbing      | Minutes per feature            | Yes — fast.         |
| **Read every line of dialog for voice / tone fit** | **30–60 min per pack**       | **No.**             |
| **Look at every icon, judge whether it reads** | **15–30 min per pack**       | **No.**             |
| **Play through a sequence and judge feel** | **Real-time playback**       | **No.**             |
| **Validate colors / palette under different eras** | **Manual eyeballing per scene** | **No.**             |

The generation phases scale superlinearly with AI assistance. The review
phases do not — they are bounded by how fast Corby can read, look, and
react. There is no "AI compressor" for human aesthetic judgment, because
the whole point of the judgment is that it's Corby's, not a model's
approximation of his.

## Why this matters for the project

The whole pitch of *Path to the Future* is that it should sound like a
specific person wrote every line. The decisions should feel deadpan but
warm. The scenes should be three beats, never four. The flavors should
land like a quiet observation, not a punchline. The icons should read
at a glance and never feel "AI-generated."

If we let generation outpace review — author 200 decisions in an
afternoon, register 80 icons in a sprint, and only spot-check — we
inherit voice drift, tone wobble, and visual inconsistencies that
compound silently. By the time someone (Corby) sits down to do a
linear read at month 87, the rework cost is much higher than if the
review had been concurrent.

## The tooling response

This is the explicit reason we built the review-page generators
(`scripts/generate-previews.tsx`, PR #62):

- **`docs/text-previews/<pack>.html`** — every word a player will ever
  read, in earliest-month order, banded by era. One long scroll that
  Corby can read aloud in a sitting to feel whether the voice holds.
- **`docs/icons-previews/<pack>.html`** — every registered icon
  rendered at 80×80 against the pack's own palette. One grid that
  Corby can scan to judge legibility and stylistic consistency.

These pages do not make review faster. They make review **possible**
without dragging the whole game open and clicking through 120 months.
They are the cheapest surface that still preserves the irreplaceable
human step.

## Operating principles that follow

1. **Generation is cheap. Don't apologize for re-running it.**
   If a batch of 30 decisions doesn't pass Corby's voice review, throw
   them out and regenerate. The cost is minutes; the cost of shipping
   off-voice content is permanent.

2. **Review is not a bottleneck — it's the value.**
   When the schedule says "review pass for pack X," that block is the
   thing that makes the pack ship-worthy. Calling it a bottleneck
   misframes it. It is the work.

3. **Build review surfaces before you need them.**
   The review-page generators were built *before* the homeschool icon
   sprint specifically because that sprint will produce a lot of art
   that needs to be looked at all together. Generator first, content
   second, review third.

4. **Voice-checkpoint protocols beat full-pack regenerates.**
   The 5+5 starter batch (5 decisions + 5 events, reviewed before
   scaling) catches voice drift early. Adopted on PR #56 for
   homeschool — caught no issues, but the protocol is cheap insurance.

5. **Spot-checking does not substitute for linear reading.**
   Sampling 5 of 30 decisions reads "good enough" 90% of the time.
   The other 10% is where the voice has quietly drifted on a tag we
   didn't sample. Linear read or it doesn't count.

6. **AI can pre-screen for obvious tone violations, but cannot
   approve.** When Claude flags "this line is louder than the others
   in this batch" it's useful. Claude saying "the pack reads cohesive"
   is not approval — it's an LLM predicting it has produced cohesion.
   Only the author confirms cohesion.

## What this *isn't*

This is not a complaint about review being slow. It's a recognition
that the review step is the **load-bearing quality gate** for a
single-author voice-driven game. Trying to compress it is the same
mistake as trying to ship a game without a final pass — the artifact
you ship is not the artifact you wanted.

## Tooling backlog implied by this principle

- **Voice diff highlighter** — when a batch of decisions is
  regenerated, surface which lines changed so review can focus there.
- **Era-band heatmap** — visualize tonal density per era (e.g., are
  pandemic events too uniformly grim? Are rebound events too uniformly
  upbeat?). Heuristic, not gating, but useful as a pre-review pulse.
- **Side-by-side pack compare** — render SWE and homeschool review
  pages side-by-side for the universal-pool decisions so voice parity
  is auditable in one screen.
- **Icon swap-diff** — when an icon is replaced, generate a small
  before/after card so the reviewer doesn't have to remember the
  previous version.

None of these compress the review itself. They make the review more
**focused** — which is the only legitimate move.

---

*Filed under: design philosophy / process. Reference this when anyone
(including future Claude) proposes "let's just generate the whole
pack and ship." The answer is yes to generate, no to ship without
the linear read.*
