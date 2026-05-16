# Path to the Future: A Life, One Month at a Time

A top-down life simulator fluent in the grammar of NES and SNES childhood — Zelda's rooms, Final Fantasy's dialog boxes, Oregon Trail's event rolls, Monopoly's random-card shrug — rendered in the flat-color stillness of Kentucky Route Zero, narrated in the dry register of Hitchhiker's Guide. Ten years. One career. Starting January 2020.

**[Play it now →](https://corby-github.github.io/path-to-the-future/)**

---

## What It Is

*Path to the Future* is a fully playable browser game — not a demo — that hands you a decade and asks what you'd do with it. 2020 to 2030. Two-month "rooms" filled with real decisions, random events, NPCs, mini-games, and the quiet chaos of being a person in a complicated world.

- Move through top-down rooms with your keyboard
- Interact with NPCs and objects, make decisions, survive events
- Track 8 live stats: Burnout, Savings, Health, Network, Relationship, Technical Skill, Reputation, and XP
- Choose from 2 careers (Software Engineer, Homeschool Parent) and 8 starting classes
- Play 5 mini-games including Blackjack, Pong, Code Review, and The Ultimate Question
- Replay your decade through the backward replay system
- Your progress is automatically saved — close and come back anytime

No installation. No account. Browser only.

---

## The Research

This game is also a research artifact. It was built in 7 calendar days (May 10–16, 2026) by one engineer working with Claude Code (Opus 4, 1M context, Max account) — from blank repo to deployed game.

The study tracked velocity, compression ratios, and workflow patterns across 14 sittings and 37 hours (37:11) at  the keyboard. Every line of code, every JSON event, every sprite, every piece of dialog was created from scratch and pushed to this repo in real time to keep the timestamps honest.

Preliminary & full report forthcoming.

---

## Stack

- TypeScript + React
- Redux for game state
- SVG `viewBox` virtual coordinate system (1000×600)
- localStorage for save persistence
- GoatCounter for analytics (DNT-respecting)
- Deployed via GitHub Pages

## Running Locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
npm run deploy
```

---

## Structure

```
src/
  game/         # Engine — rooms, player, obstacles, sprites
  careers/      # Career pack loader and registry
  minigames/    # Blackjack, Pong, CodeReview, Reaction, HitchhikersGuide
  components/   # HUD, modals, title screen, endgame
  store/        # Redux slices for game state
public/
  careers/      # JSON career packs (decisions, events, interactables)
    software-engineering/
    homeschool-parent/
    universal/
```

---

## Adding a Career Pack

Career packs are self-contained JSON folders. Adding a new career means writing content, not code:

```
public/careers/your-career/
  manifest.json
  decisions.json
  events.json
  interactables.json
  months.json
```

Universal decisions and events carry forward to every pack automatically.

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Built May 2026. All code, graphics, and dialog created from scratch during the 7-day study window.*