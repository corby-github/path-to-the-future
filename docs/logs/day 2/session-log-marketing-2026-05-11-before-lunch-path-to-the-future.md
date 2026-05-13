# I built a full game HUD + init flow + custom icon set + two polish PRs in one ~2-hour afternoon sprint.

The morning sprint shipped Days 6–8 of my 13-day design-doc plan. After lunch I sat down and built **Day 9** — *plus* I cycled through two consecutive UX polish PRs driven entirely by playtesting the first one. Three pull requests opened, reviewed, merged.

## What we built

**Day 9 (PR #13):** A full top-anchored game HUD (8 stat chips + identity + location), a 4-screen init flow (career picker → name entry → class picker → atmospheric intro narrative), an 8-tier class system, deferred-stat machinery, and Redux + Context plumbing to make it all hang together. **Eight hand-drawn SVG stat icons** — flame, two letterform glyphs (`$` and `XP`), a network graph, a first-aid kit, a heart, code brackets, a star — drawn in `<symbol>` previews first, then wired as a `<StatIcon>` component. Custom, not Lucide. The aesthetic stays §15 — flat color, restrained, palette-token themable.

**Polish PR #14:** Floating `+N` / `−N` HUD deltas on stat change (sage for positive, warm-accent for negative), preview chip rows on the decision flavor screen so the player sees what's about to apply BEFORE hitting Continue, a "...time passes" status-bar message that swaps in during the post-Continue beat. Movement freezes once you walk through the door. Keyboard navigation on year-change screens. A new sage-green palette token. Three pulsing dots under each scene line so atmospheric moments never feel frozen.

**Polish PR #15:** Zelda-style fade-to-dark when entering a door. Three-column HUD (identity left | stats middle | location right). Responsive canvas that scales to fit the viewport while preserving the design-doc-specified 1000×600 aspect ratio. Bottom padding that matches the top. Modal hints anchored to modal bottoms.

## The numbers

- **Time spent:** ~2 hours (marker-bounded — not an estimate from conversation depth)
- **PRs merged:** 3 (#13 Day 9, #14 polish, #15 polish)
- **Files changed:** ~30 across the three PRs
- **Lines added:** ~2,800 (icons + components + state slice changes + tests)
- **Traditional-team equivalent:** 4–6 working days (designer + frontend engineer + PM, with normal review cycles)
- **Compression ratio:** roughly **15–20×**, defensibly. Custom icon art especially: a designer at a studio doesn't draw 8 icons AND iterate them twice AND wire them as React components AND build the HUD that displays them in the same afternoon.

## What surprised me

The biggest single UX improvement came from a *negative* decision. I built a fancy canvas-blur overlay for the post-Continue "time passes" moment — fade the game world to dim, float an italic message over it. Looked nice. **Felt completely wrong.** "My eye doesn't know where to go," I said.

We tried swapping blur for opacity-dim. Still wrong.

Third try, I described the actual problem: the status bar between the HUD and the canvas was already the slot my eye went to for "what's happening right now." Use that slot for the transition message. Don't touch the canvas at all.

That's the version that shipped. It's simpler than either wrong attempt, and it's the one that lands. **When UX iteration produces "still not quite right," try reducing the design surface area, not adding to it.**

The other thing that surprised me: deferring stat effects from option-pick to Continue had cascading consequences. The original code applied effects when you clicked your choice — but the modal was still open, so the HUD floating animations fired silently behind it. The player never saw them. Once we deferred to Continue, the modal closes, the HUD animates IN FRONT of the player, the new status-bar message floats over the gap, and the whole choice→consequence beat suddenly has rhythm. **State-flow shape and visual feedback shape are the same problem.** I'd never said that out loud before, but the AI loop made it obvious because the fix was 20 lines and we shipped it in 10 minutes.

Custom-drawn icons over a library was the right call. The savings glyph started as a stacked-coin illustration, which was too abstract at 20px. The user pushed for a literal piggy bank. I drew the piggy bank — body + snout + ear + slot + nostril + two legs. The user said "not obvious — let's go with a `$` symbol icon." I made `$` a heavy-weight letterform glyph styled to match the XP glyph. Three iterations, eight minutes total, ended up at the strongest version. **At studio speed that's a week of designer back-and-forth.**

## The catch

Two hours is two hours of focused work — it doesn't include the design-doc revisions and decision-shape thinking we did over the past two weeks. The §16 init flow was already specified before this sitting started; I was implementing a spec, not inventing one. The icon-design exploration drew on §15's visual rules that were locked in months ago. **The AI-assisted compression sits on top of slow careful upstream design work.** Without that, the rate would be a lot lower.

Also: I'm one person, one viewport, one browser. There's no QA across screen sizes, no accessibility audit, no localization pass, no cross-browser testing. The "compression ratio" assumes a team would have done those — and would have, and should still happen on a real product. Days 11 (mini-games), 12 (endgame), and 13 (polish + accessibility + sound) will close some of that gap. Today wasn't that work.

## What's next

Day 10 is the writing day — the largest single content-authoring effort in the plan. The decision pool, the random events catalog, the month-to-month flavor entries. After today's polish, the engine is ready for content. The afternoon sprint just made the showroom; now we fill it.

---

*A focused 2-hour sprint with Claude. Three PRs. Day 9 of 13 shipped. 2026-05-11, afternoon (post-lunch sitting).*
