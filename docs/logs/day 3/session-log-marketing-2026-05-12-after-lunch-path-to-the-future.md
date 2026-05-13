# I shipped six PRs in three hours after lunch. The ending isn't the part you'd expect.

After lunch on day 3 of building **Path to the Future** — a 10-year, month-by-month software-engineering career simulator — I sat down for one sprint. Two hours and fifty-three minutes later, six pull requests had been merged into main, a seventh was started, and the game had a working finale beat I'd been circling for days. The numbers below are honest. The thing that stuck with me afterward isn't the numbers.

## What we built

In one sitting, with Claude as the pair:

- **A polished room-to-room transition** — the `+1 mo` HUD floater now fires at fade-start instead of fade-end (cause-and-effect, not empty-canvas-then-explanation), and the door-entry beat got a 200ms "settled dark" before the decision modal eases in. (PR #42)
- **A complete redesign of the endgame recap screen** — career timeline moved to its own dedicated full-canvas view reached via a third action button, stat icons added, decision prompts now appear above each option in the timeline so the recap actually reads as a story rather than a list of punchlines. (PR #43)
- **The Day 13 polish bundle** — accessibility pass (focus traps, screen-reader-friendly chip labels, `prefers-reduced-motion` support), era-mood palette tuning for 2020 pandemic + 2025 AI-shift, and a brand-new 3-step first-run tutorial coachmark. (PR #44)
- **The finale month** — December 2029 gets two doors on the right edge of the canvas. The top one is locked. You can examine it. *"This one is locked! You don't seem to have the key... oh well."* The bottom door asks a single question — *"Ten years. Did any of that stick?"* — and gives you three deadpan ways to answer no. (PR #45)
- **A small but load-bearing cleanup** — hiding a stat in the endgame UI that the game never actually modifies. (PR #46)
- **The title screen** — *"PATH TO THE FUTURE"* in heavy mono with a letterpress drop, ambient room of NPCs and props going about their business in the lower band, a 1Hz-blinking *"PRESS ANY KEY TO START"* in the classic arcade register. Plus a welcome-back beat that greets returning players by name with a preview of where they left off. (PR #47)
- **Started, didn't finish** — the init-flow canvas frame: making the career picker, name entry, class picker, and intro scene sit inside the same bounded 1000×600 frame as the rest of the game. Context window filled. Resumed the next sprint.

## The numbers

- **Time spent:** 2 hours 53 minutes of focused sprint time. Measured by `/punch` events, not estimated.
- **Traditional-team equivalent:** 2.5–3.5 weeks for a small team (1 PM, 1 senior engineer, 1 mid-level engineer, 1 designer — async + daily standup).
- **Compression ratio:** Roughly **10–15× faster** on the work actually performed.

## What surprised me

The thing I keep noticing on this build: **the AI ships correct-but-generic; my eye catches the design-language fit.** Not the code — Claude's code worked on the first pass each time. What got missed was the project's specific register. The first endgame proposal dropped the canvas aspect ratio so the timeline could scroll naturally — technically right, completely wrong for a game where every other screen is bounded by the same 1000×600 frame. The first title-screen wordmark was Pixelify Sans, which the design doc had nominated, which read as goofy the moment it rendered. The first finale-decision copy had Blockbuster cards and GameBoy manuals in it — quippy in a way the game's contemplative-meets-Hitchhiker's tone explicitly isn't. Each of these required exactly one human "no" before Claude re-implemented faster than first-time, because by then the right answer was legible.

The most surprising single moment was the **finale copy iteration**. We went through three drafts. The breakthrough came when I asked for "one more shot considering all the knowledge you have about this game." That prompt produced *"Hard to say. It mostly felt like a Tuesday."* followed by *"Tuesdays do most of the work."* — a line that echoes a *"Different month. Same coffee stain"* beat from the rewind-door status messages I'd written weeks earlier. The AI can produce the project's voice when given the explicit invitation to anchor on it. Left to its own register, it defaults to generic-comedic. That's a usable rule.

The other thing that surprised me is how **a single new feature exposed a latent bug from days ago**. The title screen's welcome-back block expected `profile.initComplete` to survive page refreshes. It didn't, because state was only being persisted on room transitions — anything you did before walking through your first door was in-memory only. The fix was three lines (subscribe to every Redux dispatch, write to localStorage). The bug was three days old. I couldn't have found it without a feature that crossed the boundary.

## The catch

This compression ratio is real on the work-that-was-done axis. It is not a claim about shippable product. None of these PRs went through real QA on a test environment. The accessibility audit measured contrast with a calculator script, not with actual screen-reader users. There's no PM stakeholder layer to align with, no design-system documentation for the new patterns we invented (canvas frame, modal-button style, finale flavor phase), no cross-browser verification beyond desktop Chrome. The compression is on the *building* — the part where decisions get made and code gets written. The full-team-equivalent estimate would have absorbed that overhead too, which is partly why their numbers run higher.

The other catch worth naming: this sprint sat on top of two earlier sprints today and ten days of architectural work before that. The finale's locked-door payoff lands because there's a *"Something about a key"* line in the rewind-door status pool I wrote weeks ago. The modal pop-in motion the finale inherits was choreographed in the same morning. Each sprint's compression ratio reads higher because of the unmeasured scaffolding underneath.

## What's next

PR #48 was started mid-sprint and resumed in the after-dinner block (init-flow phases now framed inside the same canvas bounds as the rest of the app). After that: Day 15 — analytics and the GitHub Pages deploy. Then v1 ships.

The finale beat is the part I wanted to get right, and it's the part the AI helped me build that I most doubt would have survived a typical product-review process. Too low-affordance. Too easy to mistake for a stub. A door that doesn't open, a question with three forms of "no," and a quiet response from the game. Building it with a pair that doesn't have a stakeholder layer to defend against is what made it ship.

---

*A working sprint with Claude, 2026-05-12.*
