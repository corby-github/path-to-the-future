# Two hours, four PRs, one physics engine.

Day 6 of building *Path to the Future* in public. I sat down at the keyboard at 06:02 EDT and got up at 08:02. In that window, four pull requests landed against `main` (three merged, one open and awaiting playtest). One of them was a working moving-obstacle physics layer for the game's room-difficulty system — not a template, not a placeholder, real engine code with collision detection, knockback semantics, damage, and a bonus-XP reward for clean traversal.

I've shipped morning sprints before. This one was unusual because the physics PR landed on the *same* day as the small stuff, not the day after.

## What we built

- **NPC palette tokens** ([PR #86](https://github.com/corby-github/path-to-the-future/pull/86)). The game's NPCs were painted with the same warm-brown the engine used for doors, the arcade cabinet, the bench, most furniture — people read as just another piece of the room. New tokens (`npcAdult` yellow, `npcChild` green, plus matching ink colors for outlines) split NPC color out of `palette.accent`. Six body sites rewired in the sprite component; seven hair sites moved to warm brown in a follow-up commit. Both pack manifests updated.
- **GoatCounter analytics wrapper** ([PR #87](https://github.com/corby-github/path-to-the-future/pull/87)). New `track.ts` (~95 LOC) with init, pageview, event, and a React hook. Eleven pageview slugs wired across screens — title, every init phase, every monthly room, every minigame, endgame, credits, restart. Four custom events with params. All four guard layers from the spec enforced (PROD-only, env enable flag, DNT, script-available). Dev builds never load the GoatCounter script.
- **Easy-tier room templates** ([PR #88](https://github.com/corby-github/path-to-the-future/pull/88)). Promoted the existing `maze` template from "simple" to "easy" and authored two new universal templates (`s-curve`, `switchback`). 2021+ rooms now genuinely feel different from 2020 rooms; the difficulty curve in the design doc actually shows up in play.
- **Medium-tier templates + moving-obstacle physics** ([PR #90](https://github.com/corby-github/path-to-the-future/pull/90)). The big one. New `MovingObstacle` type with sine-wave vertical oscillation, a `useMovingObstacles` hook driving per-frame position updates, a collision callback inside the room's tick handler that knocks the player back 50 px toward spawn on overlap, a debounced damage system (health -2 per hit, burnout +5 after four hits in one room), and a +100 XP bonus for traversing a hazard room without taking a single hit. Two new authored templates use the system (`pendulum` and `shutters`).

The design doc walked four versions in the sprint (`v2.0.14 → v2.0.18`). Every PR updated the `§4 Layout templates` table or the change-log row inline. No doc drift.

## The numbers

- **Time spent on product:** 1 hour 59 minutes 29 seconds, focused. No process-tooling boundaries this sprint — full sitting was product work.
- **Traditional-team equivalent:** 3–4 working days for a small team (1 senior engineer with design review on the side).
- **Compression ratio:** roughly 9–12× faster, honestly stated — and that holds because the design doc is already at v2.0.18 and the framework PR (#79) had specced this work last sprint. Pure greenfield wouldn't hit this number.

## What surprised me

I expected the small PRs to land in the sprint window. Palette tokens, analytics wiring, two new template entries — those are the kind of pieces where the AI compression ratio holds up cleanly because the work is bounded and the spec is clear.

What surprised me was that PR #90 — *real engine physics work*, with a new collision system and side-effects firing per frame — landed in the *same* window. I would have called that a half-day task on my own. The compression ratio for content work (templates, copy, palette) is something I've gotten used to. The compression ratio for engine work was the new beat.

The other quietly-load-bearing thing: I spun up a GoatCounter account in about five minutes during PR #86 while Claude was wiring the palette tokens. Five minutes of admin work that absorbed cleanly into the AI loop — no pause, no context switch, no "wait for me to finish setting up." That kind of orthogonal admin is what makes the two-hour sprint achievable. The compression isn't *just* the AI being fast; it's the AI being fast enough that human-side work can run in parallel without anyone idling.

## The catch

This sprint did not playtest PR #90. The verify gate is clean (typecheck + lint + build all pass), the architecture review fits in the PR body, and the tuning constants are named and at the top of the file — but the actual *feel* of the moving obstacles is unplaytested. Knockback magnitude, cooldown duration, the damage curve, the bonus XP size — all those numbers were sized by spec, not by playing the game. The next sprint starts by walking the player through a `pendulum` room and seeing if the rhythm feels right.

A second Claude session was running in parallel on icon coverage in another thread; it shipped its own commit independently (`add99e6` — full homeschool icon coverage). The two-thread workflow worked, but I'm not crediting today's compression number with that thread's output. Sprints are measured one human-sitting at a time.

The team-time comparison also excludes things a real team would do before merging anything: code review by a second engineer, a QA pass on the medium-tier rooms, visual design review of the moving-block treatment. AI shipping at this speed only stays honest if you keep those scope boundaries explicit.

## What's next

Playtest PR #90, tune the constants if needed, then pick up PR5 (hard tier — pong-style paddle gates) on the same physics infrastructure. The §4 ladder still has two follow-ups (hard + expert) plus the Day 15 GitHub Pages deploy I deferred today. The week's velocity holds if the playtest doesn't surface anything I missed.

---

*A working sprint with Claude on Path to the Future, 2026-05-15.*
