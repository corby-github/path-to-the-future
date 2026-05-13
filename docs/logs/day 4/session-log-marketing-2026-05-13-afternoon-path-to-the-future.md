# I shipped ~30 icon revisions and a copy pass across two PRs in 73 minutes. The interesting part is what the previews caught that I would've missed.

I sat down at 4:30 PM. By 6:08 PM I had two PRs open: 30 icon revisions across three live review rounds plus a fourth from a reference image, and a copy pass that retired the word "pager" from the game (people use phones now) and tightened two event bodies. Both branches pushed to GitHub. Roughly 73 minutes of product time, plus a 25-minute block of irreplaceable human review.

The story is the previews. The morning sprint shipped a tool that renders every icon and every line of player-facing dialog into self-contained HTML pages. This was the first sitting that *used* that tool. It caught 30 problems with my icons I hadn't seen, and 7 problems with my copy I hadn't read.

## What we built

Two PRs:

- **[PR #63](https://github.com/corby-github/path-to-the-future/pull/63)** — `feat/swe-icon-revisions`, 4 commits, ~30 icon revisions to `src/game/ui/icons/modalIcons.tsx` and `scripts/icon-descriptions.ts`. Three live review rounds and a fourth from a Deep Thought reference image: a 2×2 video-call grid that doesn't look like infinity symbols, a vintage rotary desk phone for the recruiter-call icon, a Deep Thought silhouette for the Ultimate Question minigame (because the prior icon literally wrote "42" and spoiled the punchline), and 27 others.
- **[PR #64](https://github.com/corby-github/path-to-the-future/pull/64)** — `feat/swe-language-tweaks`, 1 commit, 7 files. Pager wording retired from the Software-Engineering pack (cell phones now), two event body rewrites caught by reading the text preview aloud (a grocery-checkout card-decline that pivots from isolated shame to small-community-kindness, and a flow-state line that lands "the plan and the code agreed for once"), plus shared "rumors of a virus" intro openings across both packs to anchor the January 2020 setting.

The repo is at [github.com/corby-github/path-to-the-future](https://github.com/corby-github/path-to-the-future).

## The numbers

- **Time spent on product:** ~1 hour 13 minutes of focused sprint time. (Sprint total was 1h 38m; the rest was ~25m of human review during a flagged boundary block where both Claude and I were producing changes simultaneously — I split that 50/50 in the time-log so the headline number stays honest.)
- **Traditional-team equivalent:** 2–4 working days. Assumed team: 1 icon designer doing 30 revisions across 3 review rounds at ~30–45 min each with review cycles (15–22 hours), 1 game writer for the intro + month-1 + event-body + pager pass (~half day), 1 dev for integration and 2 PRs (~half day), 1 reviewer for between-round callouts (~half day).
- **Compression ratio:** Roughly 13×–26× on this specific kind of work — iterating an existing icon set in a settled style, plus copy revisions on existing JSON content. Conservative end of the range, because round 1 over-engineered three icons and needed corrections in round 2.

## What surprised me

**Round 1 over-engineered.** Three of the 16 first-pass redraws were called out as *worse than the original*. The pattern was consistent: my (or Claude's) first instinct was to add detail to be "more literal" — a crescent profile for the handset, a fainting couch with button tufts, cupped palms with separated fingers and thumbs. At 80×80, those details collapse into noise. The round-2 corrections went the other way: a single filled handset silhouette, a plain three-seat sofa, a heart with a `$` glyph. **Icon iteration converges by subtraction more than addition.** Worth remembering.

**The previews caught things I had personally signed off on yesterday.** The Pandemic-close icon's description said "door with a padlock" — the actual drawing was a wall calendar with a big X. Two days old, never noticed. The Forty-Two minigame icon literally wrote "42" in 36-point — would have spoiled the punchline if it surfaced in the arcade menu or replay card before play. I had eyeballed both yesterday. The preview pages — every icon at 80×80 with caption, every line of dialog in earliest-month order — surfaced both in seconds. The cost of the review surface was about 30 minutes of morning sprint time. The value of the review surface was this sprint.

**The grocery-checkout copy got *better* in dictation.** The original line was *"You stood in the parking lot for a minute before driving home"* — isolated post-checkout silence. I dictated a replacement: *"The people behind you breathed a sigh of relief when the second card worked. 'We've all been there,' someone said."* Same scene, different register: from isolated shame to small-community-kindness. That kind of voice judgment can't come from the model — only from someone who has actually had a card declined at the grocery store. The model's job was to clean up the dictation (caught "sign" → "sigh", "release" → "relief", aligned past tense) and to suggest dropping the parking-lot ending so the kindness beat lands the moment. **The shape of the collaboration is: I bring the felt judgment, Claude does the orthographic work.**

## The catch

This is the third sprint in a row where I've had to flag a boundary in the time log for non-product time. The morning had 18 minutes of skill-edit / research-artifact work that doesn't ship the game. This sprint had 25 minutes of *concurrent product + review* — both Claude and I producing changes at the same time during a block I'd opened as `human-review`. I closed it with an explicit note that it's not pure non-product time, and recommended a half/half split for the time analyst.

The point: **honest time accounting on AI-assisted work is non-trivial.** "How long did this sprint take" is the wrong question if you're trying to compare against a small-team estimate, because some of the wall time is review (irreplaceable), some is meta-tooling (doesn't ship), and some is product (the thing you can compare against the team). The boundary scheme keeps the math honest. The compression ratio above (13×–26×) is what's defensible *after* you remove the parts that aren't comparable.

It also means a follow-up review pass is still owed: the SWE manifest intro and month-1 narrative shipped in PR #64 are JSON content — the preview shows them, but the actual rendered in-game flow (title → init → narrative room) needs an eyeball before merge. That's another 5–10 minutes I haven't done yet. None of that is in the sprint number.

## What's next

Merge both PRs after a quick browser pass for the intro flow. Then back to the homeschool-parent pack ramp: the 5+5 voice-checkpoint batch (5 decision icons + 5 event icons in the bittersweet-contemplative register that pack established in Phase 1) is still the named-next-step from this morning's handoff. The compression should hold for icon authoring. The review pass on the homeschool text — when it lands — will take what it takes.

---

*A working sprint with Claude (Opus 4.7, 1M context), 2026-05-13 — Day 4 afternoon of the Path to the Future build.*
