# Path to the Future: Design Document

**Project:** Path to the Future — A Career of Choices
**Document version:** 1.1
**Status:** Living spec · Days 1–12 merged · Day 13 in progress (13a-c phasing)
**Last updated:** 2026-05-11

---

## Change log

This document is living. Every meaningful revision lands here so future
sessions (or contributors) can read the spec at any version cleanly.

| Version | Date       | Author                    | Summary |
|---------|------------|---------------------------|---------|
| v1.0    | 2026-05-10 | Corby Hoback              | Initial design — premise, architecture, room types, state model, decision/event schemas, modal presentation (§8b), mini-games, controls, save/load, identity, classes, visual style, init flow, build order, scope, project structure, open questions. |
| v1.1    | 2026-05-11 | Corby Hoback · Claude Code | Build-time deltas through Day 13a: **E** key for NPC/object interaction (§11); `progress.gameOver` state field + STATE_VERSION 1.2.0 (§6, §12); Pixelify Sans scoped to NPC modal as SNES homage (§15); Stacker mechanic for Reaction Sprint (§10); keyboard parity across init flow pickers (§16); build order updated (§17); project structure expanded (§19); spouse-name list resolved (§20). New sections: §21 Endgame & Recap, §22 Credits System, §23 Interactables. |

---

## 1. Premise

A narrative life-simulation game in which the player navigates 10 years (2020–2030) of a software engineering career, one month at a time. Each month is a "room" the player walks through, encountering decisions that compound into a unique life trajectory. Random events, era-flavored crises, and the player's own choices shape who they become by 2030.

**Tagline:** *A career of choices.*

**Style:** A choose-your-own-adventure where every decision you make impacts the outcome

**Tone:** Bittersweet, contemplative, occasionally playful. Life happens. You make the best of it.

**Length:** 45–90 minutes per playthrough. Replayable.

**Visual register:** Muted, contemplative, sparse, color-led — the *emotional* register of Kentucky Route Zero, achieved through flat-color SVG, not 3D rendering.

---

## 2. The Player's Loop

For each of 120 months, the player:

1. **Enters a room** (the month). Their character spawns at an entry point.
2. **Walks around.** Optionally interacts with flavor objects (read text), grabs stat modifiers (coffee, books), avoids hazards (stress clouds).
3. **Approaches a decision.** A modal opens with the prompt and 2–4 options.
4. **Chooses.** Stat effects apply. Flavor text resolves the choice.
5. **Random event roll.** Possibly a Monopoly-card moment ("Bank error in your favor"), possibly a stat-weighted catastrophe.
6. **Exits the room** through a door, advancing to the next month.

Most rooms take 30–60 seconds. Some take longer (mini-game). Some are skipped entirely (time-skip from grad school decision).

---

## 3. Architecture: The Career Pack System

The game engine is generic. All career-specific content is loaded from a **career pack** — a folder of JSON files plus SVG art tokens.

```
public/careers/software-engineering/
  manifest.json           ← career metadata, entry classes, palette
  months.json             ← 120 month entries with seed + theme
  decisions/
    universal/*.json      ← decisions reusable across careers
    swe/*.json            ← SWE-specific decisions
  events/
    universal/*.json      ← random events
    era-2020.json, era-2023.json, ... ← era-flavored event pools
    swe/*.json
  art/
    interactables/*.svg
    backgrounds/*.svg
```

**Adding a new career = writing a new pack. Engine code never changes.** The universal decision/event pools are reused for free.

### The North Star

Every architectural decision asks one question: *Does this make the SWE pack ship faster, or make the next career pack possible?* If neither, defer.

---

## 4. The Room Generator

Rooms are **deterministically generated** from a seed. The seed is:

```
hash(careerPack, entryClass, monthId, gameStateHash)
```

Where `gameStateHash` includes only the *macro* state that should affect room shape: current XP tier, active flags (in-relationship?, has-kids?, in-grad-school?), broad stat tiers (burnout: low/med/high). Raw stat numbers are *not* in the hash, so small fluctuations don't regenerate the room.

**Same seed → same room.** A player who restarts mid-game sees the same Jan 2024 they saw before. But two players (or two playthroughs) with different paths see different Jan 2024s.

The generator uses the seed to:
1. Pick a layout template (4–6 templates total: open, corridor, divided, etc.)
2. Place the decision trigger
3. Pick interactables from the career pack, weighted by month theme
4. Optionally place stat-modifier objects and hazards
5. Place exits

Generation runs once per room entry; output is rendered.

---

## 5. Room Types

| Type             | Purpose                                                  | Approx. count |
|------------------|----------------------------------------------------------|---------------|
| `DecisionRoom`   | Default — walk + decision + exit                         | ~110 of 120   |
| `MinigameRoom`   | Blackjack, code-review puzzle, twitch reaction           | ~3 total      |
| `NarrativeRoom`  | Pure text, no walking. Intro screen, year transitions    | ~5–10         |
| `ConsequenceRoom`| Framing for major outcomes (got fired, baby born, time-skip recap) | ~5–10 |

Every room config has a `roomType` field. The renderer picks the right component.

---

## 6. State Model

### Redux (persistent, save-loadable)

```ts
{
  profile: { name, careerPack, entryClass, createdAt, initComplete },
  progress: { currentMonth, completedMonths[], xp, classTier, gameOver },
  stats: { burnout, savings, network, health, relationship, technicalSkill, reputation },
  flags: { inRelationship, hasKids, inGradSchool, ... },
  history: { decisions: [{ monthId, decisionId, optionTaken, timestamp }],
             events:    [{ monthId, eventId, timestamp }] },
  meta: { version, lastSaveAt }
}
```

**v1.1 additions:**
- `profile.initComplete` (added Day 9) — flips true once the player completes
  Career → Name → Class → Intro. Drives `App.tsx` routing between `<InitFlow>` and `<Game>`.
- `progress.gameOver` (added Day 12) — flips true on `completeMonth(120)`. Drives
  `App.tsx` routing between `<RoomRenderer>` and `<EndgameScreen>` (§21).
- `history.events` (always present; spelled out in v1.1 — was implicit in v1.0).

### React refs/hooks (per-frame, never persisted)

Player position, velocity, facing, input state, animation timers, touch target.

### Local component state

UI: modal open/closed, hovered interactable, etc.

### The rule

**If it changes 60 times a second, it's not in Redux.** If it's something the save file needs, it *is* in Redux. There's almost zero overlap by design.

---

## 7. Stats

| Stat             | Range        | Visibility         | Notes                                                        |
|------------------|--------------|--------------------|--------------------------------------------------------------|
| `burnout`        | 0–100        | Visible bar        | High = events fire (sickness, mistakes)                      |
| `savings`        | 0–∞ ($)      | Visible number     | Gates "buy house," "quit job" decisions                      |
| `network`        | 0–100        | Visible bar        | Gates job opportunities                                      |
| `health`         | 0–100        | Visible bar        | Affects random event probabilities                           |
| `relationship`   | 0–100 / null | Visible if not null| Null = single. Going to 0 ends relationship.                 |
| `technicalSkill` | 0–100        | Visible bar        | Gates promotions, mini-game outcomes                         |
| `reputation`     | -100 to +100 | Visible bar        | Industry rep. Can go negative.                               |

**XP** is separate, monotonically increasing, drives class tier (Novice → Junior → Skilled → ...).

**Score** is derived at endgame from final stat state, XP, and decision history. Not surfaced during play. See §21 for the v1 formula.

---

## 8. Decision Schema

```json
{
  "id": "univ-launch-party-vs-spouse-birthday",
  "tags": ["work-life-balance", "relationship"],
  "requires": { "relationship": ">0", "month": ">=6" },
  "weight": 1.0,
  "prompt": "The launch party is tonight. So is {spouseName}'s birthday dinner.",
  "options": [
    {
      "label": "Go to the launch party",
      "effects": { "network": "+5", "reputation": "+3", "relationship": "-15", "burnout": "+5" },
      "flavor": "You stayed until 2am. The CEO knew your name by Monday."
    },
    {
      "label": "Go to the birthday dinner",
      "effects": { "relationship": "+10", "burnout": "-3", "reputation": "-1" },
      "flavor": "{spouseName} cried a little. The good kind."
    }
  ]
}
```

- `{playerName}`, `{spouseName}`, etc. are interpolated at render time.
- `requires` gates eligibility (e.g. spouse-birthday decision only fires if in a relationship).
- `tags` prevent same-flavor decisions appearing back-to-back.

### Universal vs. career-specific decisions

The decision pool is `[universal] + [career-specific]`, loaded at career-pack init.

**Universal examples (work in any career pack):**
- Take promotion to manager vs. stay as a practitioner
- Stay for the launch party vs. spouse's birthday dinner
- Late-night travel partying vs. fresh meeting in the morning
- Bury yourself in work vs. maintain work-life balance
- Vegas weekend with bonus vs. rest at home with family

**SWE-specific examples:**
- Coder vs. architect path
- BS + experience vs. go back for a Master's
- People manager vs. tech lead

Every universal decision counts 5× when we add the next career pack.

---

## 8b. Modal Presentation for NPCs & Objects

NPC and object interactions use a typewriter text reveal evoking the dialog boxes of NES/SNES-era adventure games (Zelda, Final Fantasy, Pokémon). This is distinct from the §8 door decision modal — that one snaps in (the world is acting on you), while NPC/object modals reveal at a human reading cadence (you are engaging deliberately).

### Entrance
- Modal fades in with a subtle scale (0.96 → 1.0) over ~200ms, ease-out.
- Backdrop dims behind the modal (rgba black at ~40% opacity).

### Text reveal
- The prompt string renders one character at a time at a fixed cadence.
- **Default speed:** 30ms per character. Settable globally via `manifest.json` (`typewriterSpeedMs`) and overridable per modal instance.
- **Punctuation pauses:** `,` adds +60ms; `.` `!` `?` add +180ms; `—` adds +120ms. Natural rhythm without explicit timing markup.
- **Tag support for explicit pauses:** `[[pause:500]]` inserts a 500ms hold mid-string. Use sparingly — for dramatic beats.
- A blinking caret (`▌`) sits at the current reveal position during the animation.

### Skip-to-end
- Any key press / tap during reveal immediately completes the text (does not advance past it).
- A second press, after full reveal, advances focus to the options (or closes the modal for read-only flavor).

### Options (Tier 2 only)
- Options are hidden during prompt reveal.
- After reveal completes, options fade in sequentially (~80ms stagger).
- A small `▼` indicator appears at the bottom of the prompt box once reveal is complete, signaling "ready for input."

### Sound (deferred to Day 13)
A soft per-character tick (like classic dialog boxes) is a Day 13 polish candidate. v1 ships visual-only.

### Implementation note
A single `<TypewriterText>` component handles Tier 1 (read-only flavor) and Tier 2 (interaction) modals. Props: `text`, `speedMs` (default 30), `onComplete`, `skipOnInteract` (default true). Encapsulates punctuation-pause rules and `[[pause:N]]` tag parsing internally.

The Tier 3 door decision modal (§8) does **not** use this component — it intentionally snaps in to feel different (systemic vs. embodied).

---

## 9. Random Event System

After every decision, `rollEvents(state, monthId)` runs. Pulls from:
- Universal pool
- Era pool (2020 = pandemic, 2023 = AI boom, 2026+ = predicted trends)
- Career pack pool
- Stat-triggered pool (high burnout opens "you got sick" events)

Events can:
- Adjust stats
- Set flags
- Skip months (`advanceMonths: 24`)
- Trigger a `ConsequenceRoom`
- End the game (soft permadeath: dysentery, financial ruin, breakdown)

**Tone:** Oregon Trail meets Monopoly. Mostly minor, occasionally significant, rarely catastrophic. "Bank error in your favor" energy. We're not taking ourselves too seriously — life happens, but mostly, good decisions yield good things.

### Era event guidelines

- **Real macro-trends, no proper nouns.** "A pandemic shutters offices" ✅. "OpenAI launches ChatGPT" ❌.
- **2026–2030 predictions stay vague and trend-based.** Generative AI displacement, economic correction, etc.
- **Era flavoring is content; the engine is era-agnostic.** Era is just a tag on event JSON files.

---

## 10. Mini-Games (3 in v1)

| Mini-game           | Mechanic    | Triggered by                                  |
|---------------------|-------------|-----------------------------------------------|
| **Blackjack**       | Chance — hit/stand only, dealer plays to 17, $200 stake | Vegas / gambling decisions |
| **Code Review**     | Skill — one hand-authored snippet, find the bug from 4 options | Senior-tier work decisions |
| **Reaction Sprint** (Stacker) | Timing — block slides L↔R; **SPACE** locks; land inside the highlighted column. 5 blocks visible from start, bottom-up activation, speed ramps per block | High-pressure deadline decisions |

**v1.1 note:** Reaction Sprint shipped as the "Stacker" mechanic (Day 11). The
original "twitch" framing was reshaped to a keyboard-driven timing game — see
`src/game/minigames/Stacker.tsx`. Win threshold: 4-5 stacks. Partial: 2-3.
Fail: 0-1. Slot placements in v1: month 32 (Blackjack), month 60 (Code Review),
month 90 (Stacker).

All other "mini-game-shaped" moments are **narrated and resolved with a stat-weighted dice roll, not played out interactively.**

Example (no mini-game):
> "You raced through the maze to make the meeting. *(Rolling: focus + luck.)* You made it on time. The room went quiet when you walked in."

This pattern is the single biggest scope-saving decision in the doc.

---

## 11. Movement & Controls

- **Desktop:** Arrow keys + WASD. Smooth velocity-based movement, frame-rate independent. Diagonal movement normalized so it isn't faster than cardinal directions.
- **Tablet/mobile (architected, not tested for v1):** Tap-to-walk. Player walks toward tap point until reached or new tap supplied. Not pathfinding — just "go toward this point."
- **Virtual coordinate system:** all rooms are 1000×600 internally. Display scales via SVG `viewBox`.

### v1.1 — interaction key

- **E** — interact with the nearest NPC or object when the player is within
  proximity (~75 virtual units). Opens the §8b modal (see §23). Mouse is
  not required; keyboard-first per project policy.
- Door triggering remains walk-into-door (no key required).
- All modals support keyboard navigation: ↑↓←→ to choose, Enter/Space to
  confirm, Esc where applicable, 1-N direct hotkeys for option lists.

---

## 12. Save / Load

- **localStorage only.** No cookies, no backend.
- **Multi-profile** on one browser (per §12 spec; v1 ships with a single key while the multi-profile flow is deferred):
  - `pttf:profiles` → list of profile names
  - `pttf:active` → current profile
  - `pttf:save:{name}` → full Redux state
- **Auto-save** after every room transition.
- **Sign out** clears active pointer; profile data remains.
- **No security or auth** in v1. Whoever opens the browser, plays.

### STATE_VERSION (v1.1)

Lives in `src/game/state/persistence.ts`. Bumped on any **breaking change to
the persisted shape**; old saves are auto-discarded on load.

| Version | Day  | Change |
|---------|------|--------|
| 1.0.0   | 6    | Initial persistence (single-key `pttf:save:default`). |
| 1.1.0   | 9    | `profile` gains `initComplete`; `careerPack` / `entryClass` no longer default to hardcoded SWE. |
| 1.2.0   | 12   | `progress` gains `gameOver`. |

`metaSlice.initialState.version` imports `STATE_VERSION` so fresh saves stay synced.

---

## 13. Player Identity

Before entering the game, the player provides a **name**. Sanitized (HTML stripped, length capped at 24 chars). Woven into narrative copy:

> *"Maya, the world has gone quiet..."*

Spouse name (when relationship begins) is randomly drawn from a list, or eventually player-named.

---

## 14. Class System

**Eight entry classes** (Novice → Elite Oracle), with v1 shipping **only 2 playable**: **Novice** and **Skilled**. The other 6 appear in the picker as **"Coming Soon"** (grayed out, not selectable).

| #  | Class                  | Role                          | XP Range          | v1 status     |
|----|------------------------|-------------------------------|-------------------|---------------|
| 1  | Novice Initiate        | Intern / Apprentice           | 0–999             | ✅ Playable   |
| 2  | Junior Adventurer      | Junior Engineer               | 1,000–4,999       | 🔒 Coming Soon |
| 3  | Skilled Operative      | Software Engineer II          | 5,000–14,999      | ✅ Playable   |
| 4  | Vanguard Strategist    | Senior / Principal Engineer   | 15,000–59,999     | 🔒 Coming Soon |
| 5  | Commander Architect    | Tech Lead / Director          | 60,000–129,999    | 🔒 Coming Soon |
| 6  | Legendary Leader       | VP / CTO (Hands-On)           | 130,000–199,999   | 🔒 Coming Soon |
| 7  | Mythic Visionary       | Founder / CEO / Chief Architect | 200,000–299,999  | 🔒 Coming Soon |
| 8  | Elite Oracle           | Founder-of-Founders           | 300,000+          | 🔒 Coming Soon |

Each entry class sets:
- Starting XP
- Starting stats (a Skilled engineer starts with $40K savings, network 60, etc.)
- Starting flags
- Decision pool weighting (a Skilled engineer gets senior-flavored decisions early)

XP accumulates monthly + via decisions. Class tier updates automatically as XP crosses thresholds. **You can gain XP, but not lose it.**

---

## 15. Visual Style

- **Flat-color SVG.** Limited palette, 4–5 colors per room.
- **Era-driven mood palettes.** 2020 = cool/washed (pandemic). Mid-decade = warmer. Per-era palette tokens defined in career pack.
- **Generous negative space.** Rooms feel sparse, not busy.
- **Restrained typography.** A single humanist sans-serif (Inter or similar), one accent face for headings.
- **No animation beyond movement and modal transitions.** Stillness is the style.
- **Style enforced by tokens** in the career pack. No room may use off-palette colors.

### v1.1 — Modal-scoped retro font

The NPC/object dialog box (§8b implementation in §23) uses **Pixelify Sans**
loaded from Google Fonts. This is intentionally scoped to that one modal —
the typewriter reveal IS the SNES homage; the rest of the UI keeps Inter so
the bittersweet/contemplative register stays clean. Don't expand it.

---

## 16. Init Flow

1. **Career picker** (only SWE selectable in v1)
   - Software Engineering ✅
   - CPA / Personal Finance 🔒
   - Medical Supplier 🔒
   - Nurse 🔒
   - Security / Police Officer 🔒

2. **Name entry**

3. **Class picker** (Novice and Skilled selectable; others 🔒 Coming Soon)

4. **Narrative intro** — the 2020 setup screen (NarrativeRoom)

5. **Game begins** at January 2020.

If a saved profile is detected on load, skip directly to resume; offer "sign out / new profile" from the HUD.

**v1.1 keyboard parity:** All pickers honor full keyboard navigation — ↑↓←→
cycles through playable entries (skipping locked ones), Enter/Space confirms,
mouse hover gives focus parity. First playable entry is auto-selected on mount
so keyboard users can press Enter immediately. The Class picker shows the
italic line *"Where you start. Not where you'll end up (hopefully). Play your
cards right."* below its subtitle.

---

## 17. Build Order

| Day | Deliverable | Status |
|-----|-------------|--------|
| 1   | Player movement engine | ✅ |
| 2   | Vite + TS + Redux Toolkit project scaffold; integrate Day 1 movement | ✅ |
| 3   | Collision system + virtual coordinate system | ✅ |
| 4   | Room types + room renderer + basic transition | ✅ |
| 5   | Career pack loader + state management (Redux slices) | ✅ |
| 6   | Decision system (modal, schema, effect application) + auto-save | ✅ |
| 7   | Room generator (deterministic seeded layouts) | ✅ |
| 8   | Random event system + era flavoring | ✅ |
| 9   | HUD + class system + name entry + intro narrative | ✅ |
| 10  | Content pass: write SWE career pack (decisions, events, months) | ✅ |
| 11  | Mini-games (3) | ✅ |
| 12  | Endgame / score / career recap + credits | ✅ |
| 13a | NPCs & objects — interactables system (§23) | ✅ |
| 13b | Content fill: more NPCs/objects + room-generator placement + sprite art | ⏳ |
| 13c | Polish: art tokens, sound (?), accessibility, era mood, viewport | ⏳ |

**Notes:**
- Save/load moved to Day 6 (was Day 8) — without it, iteration on Day 7+ becomes painful.
- Mini-games deferred to Day 11.
- Day 10 is the writing day. That's where the 80 minutes of playable content lives.

**v1.1 Day 13 split:** Originally one "Polish" day. At build time we discovered
the §8b NPC/object spec had not been implemented — rooms had no inhabited
content. Day 13 was reshaped into three sub-days: **13a** ships the interactables
engine + 2 starter entries (this PR), **13b** fills out the content + integrates
with the room generator + adds sprite art, **13c** is the original polish list
plus an a11y audit of the new modal flow.

---

## 18. Out of Scope (v1.0)

- Other careers (CPA, Nurse, etc.) — pack architecture supports them; we just don't ship the JSON
- Class entry points beyond Novice and Skilled
- Backend / accounts / cloud save
- Mobile-specific UI tuning (architected for, not tested)
- Sound design (optional Day 13)
- Achievements
- Difficulty modes
- Localization

---

## 19. Project Structure

Single project. Vite + TypeScript + React + Redux Toolkit. **Not a monorepo.**

```
path-to-the-future/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html                          ← Pixelify Sans font link (v1.1)
├── public/
│   ├── credits.json                    ← v1.1 — credits system content (§22)
│   ├── endgame-taglines.json           ← v1.1 — random tagline pool (§21)
│   └── careers/
│       └── software-engineering/       ← JSON content lives here
│           ├── manifest.json
│           ├── months.json
│           ├── decisions.json          ← single file, pool field per entry
│           ├── events.json             ← single file, pool field per entry
│           ├── interactables.json      ← v1.1 — NPCs / objects (§23)
│           └── spouse-names.json       ← v1.1 — relationship-system content
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── game/
    │   ├── engine/                    ← pure logic hooks (no JSX)
    │   │   ├── usePlayerMovement.ts
    │   │   ├── useKeyboardInput.ts
    │   │   ├── useGameLoop.ts
    │   │   └── useRoomTransition.ts
    │   ├── entities/                  ← rendered things
    │   │   └── Player.tsx
    │   ├── rooms/
    │   │   ├── RoomRenderer.tsx       ← picks DecisionRoom / Minigame / etc.
    │   │   ├── DecisionRoom.tsx
    │   │   ├── MinigameRoom.tsx
    │   │   ├── NarrativeRoom.tsx
    │   │   ├── ConsequenceRoom.tsx
    │   │   └── generator/
    │   │       ├── seedRng.ts
    │   │       ├── layouts.ts
    │   │       └── populate.ts
    │   ├── content/
    │   │   ├── loader.ts              ← loads career pack JSON
    │   │   ├── interpolate.ts         ← {playerName} substitution
    │   │   ├── applyEffects.ts        ← effect parser + stat ranges
    │   │   ├── applyEvent.ts
    │   │   ├── applyEraMood.ts        ← HSL shifts on palette per era
    │   │   ├── careers.ts             ← career list constant
    │   │   ├── classes.ts             ← class tier constant
    │   │   ├── computeScore.ts        ← v1.1 — endgame score (§21)
    │   │   ├── evaluateRequires.ts
    │   │   ├── rollEvents.ts
    │   │   ├── selectDecision.ts
    │   │   ├── roomConfigForMonth.ts
    │   │   ├── CareerPackProvider.tsx
    │   │   ├── careerPackContext.ts
    │   │   └── useCareerPack.ts
    │   ├── state/
    │   │   ├── store.ts               ← Redux store config
    │   │   ├── hooks.ts
    │   │   ├── slices/
    │   │   │   ├── profileSlice.ts
    │   │   │   ├── progressSlice.ts
    │   │   │   ├── statsSlice.ts
    │   │   │   ├── flagsSlice.ts
    │   │   │   ├── historySlice.ts
    │   │   │   └── metaSlice.ts
    │   │   └── persistence.ts         ← localStorage save/load + STATE_VERSION
    │   ├── ui/
    │   │   ├── Hud.tsx
    │   │   ├── DecisionModal.tsx
    │   │   ├── EventModal.tsx
    │   │   ├── ScenePlayer.tsx
    │   │   ├── EffectChips.tsx
    │   │   ├── CareerPicker.tsx
    │   │   ├── ClassPicker.tsx
    │   │   ├── NameEntry.tsx
    │   │   ├── IntroScene.tsx
    │   │   ├── InitFlow.tsx
    │   │   ├── CurrentRoomContext.tsx ← Provider
    │   │   ├── currentRoomContextValue.ts ← hook
    │   │   ├── icons/StatIcon.tsx
    │   │   ├── EndgameScreen.tsx      ← v1.1 (§21)
    │   │   ├── CreditsScreen.tsx      ← v1.1 (§22)
    │   │   ├── NPCModal.tsx           ← v1.1 (§23)
    │   │   └── TypewriterText.tsx     ← v1.1 (§8b implementation)
    │   ├── minigames/                 ← v1.1 — Day 11 deliverables
    │   │   ├── Blackjack.tsx
    │   │   ├── CodeReview.tsx
    │   │   └── Stacker.tsx
    │   ├── dev/
    │   │   ├── DevPanel.tsx
    │   │   ├── DevControlsContext.ts
    │   │   ├── DevControlsProvider.tsx
    │   │   └── useDevControls.ts
    │   ├── coordinates.ts             ← virtual 1000×600 coords
    │   ├── calendar.ts                ← monthId → "Aug 2020"
    │   └── types/
    │       ├── geometry.ts
    │       ├── player.ts
    │       ├── room.ts
    │       └── careerPack.ts          ← Manifest, MonthEntry, DecisionDef,
    │                                     EventDef, InteractableDef (v1.1),
    │                                     InteractableDialogue (v1.1)
    └── styles/
        └── global.css                 ← keyframes for HUD delta, status swap,
                                          scene dots, credits scroll, typewriter
                                          caret blink, NPC modal pop
```

---

## 20. Open Questions (Defer to Build Time)

- ✅ **Spouse-name list** — generated in Day 10. Lives at `public/careers/software-engineering/spouse-names.json` (40 names). Not yet consumed by an engine relationship-system; that lands when relationship/marriage events are authored (a later day).
- **Number of layout templates** — start with 4, add more if rooms feel repetitive.
- ⏳ **Mini-game art** — keep within the same flat-SVG vocabulary as rooms. Currently using placeholder shapes; sprite work is part of Day 13b.
- ✅ **Endgame screen** — shipped Day 12. See §21.

---

## 21. Endgame & Recap (v1.1)

Added Day 12.

**Trigger.** `progress.gameOver` flips true inside the `completeMonth` reducer
when the player completes month 120 (or, theoretically, when an `endsGame: true`
event fires — wired in the schema but no events use it yet). `App.tsx` routes to
`<EndgameScreen />` instead of `<RoomRenderer />` when `gameOver` is true. Once
true, the only escape is "Begin again" which dispatches a full state reset.

**Score formula** (`src/game/content/computeScore.ts`). Returns a breakdown
shown on the recap screen so the player can see which dimensions paid off:

```
experience      = progress.xp
savings         = floor(stats.savings / 10)
wellbeing       = (network + health + technicalSkill + max(0, reputation)) × 25
burnoutPenalty  = -stats.burnout × 15
relationshipBonus = (stats.relationship !== null) ? stats.relationship × 20 : 0
decisions       = history.decisions.length × 25
total           = sum
```

Weights are tunable — interpretability over precision.

**Recap screen** (`EndgameScreen.tsx`). Layout:
- Title `Ten years done.` + `{Name}'s Career`
- Random italic tagline pulled from `public/endgame-taglines.json` (one rolled
  per view; editable so new lines can be added later)
- **Final stats** panel (all 7 stats with their final values, `palette.background`
  fill with `palette.surface` border for readability)
- **Class + XP + Score breakdown** panel (line-item with total)
- **Decision timeline** — scrollable list grouped by year, every decision the
  player made shown as `Month — option taken`
- Two actions: **Credits** and **Begin again**, with keyboard nav (←→ cycles
  focus, Enter/Space confirms)

**Replay.** "Begin again" routes through the credits screen first (see §22) so
the player gets a moment to register what they made before nuking the save.
Confirmation step is: *"If we do this, there's no going back. I know how
fickle you can be."* On confirm: `resetProfile`, `resetProgress`, `resetStats`,
`resetFlags`, `resetHistory`, `resetMeta` all dispatched, `clearPersistedState`
called. App re-renders → `initComplete` is false → `<InitFlow>` renders.

---

## 22. Credits System (v1.1)

Added Day 12.

A self-contained credits screen, JSON-driven so content can be edited without
touching code. The credits are the project's "statement" — a record that the
build was a collaboration between Corby Hoback and Claude Code, with both
serious and self-deprecating roles.

**Content** (`public/credits.json`): project metadata (title, tagline, version,
copyright, timeSpent, builtWith), a list of links (GitHub, LinkedIn, etc.),
27 credit roles mixing real (Architect, Engineer, Programmers, Code Reviewer,
Bug Reporter) with cheeky (Department of Bittersweet, Off-By-One Error Spotter,
Person Who Said 'What If We Just Use SVG', Reader of System Reminders),
special-thanks lines, a bold `timeStatement` rendered prominently, the closing
line, and a `legalNotice` ("All other names belong to the people who made the
things we love. We are not them.") in fine print.

**Screen** (`CreditsScreen.tsx`). Auto-scrolling credit roll inside a fixed
height "band" with a soft top/bottom fade mask. First line starts visible at
the top with a **2s hold** before motion (a beat to register what the player
is looking at), then continuous scroll. After the first iteration, **loops
infinitely** at constant speed (~55 px/sec, computed from content height so
the speed is uniform regardless of credits length). The static area below
the band shows the bold time-statement, then the italic closing line, then
the links, then a fine-print line with copyright · version · time · build
tool · legal notice.

**Two entry modes:**
- **'browse'** — Credits button on endgame. `[Close]` button (Enter / Space /
  Esc all close).
- **'replay'** — Begin Again button on endgame. Top banner reads `BEFORE YOU
  DO THIS AGAIN…`. Static action area replaces Close with the funny confirm
  prompt + `[No, take me back]` / `[Yes, begin again]` buttons (←→ toggle,
  Enter/Space commits the focused choice, Esc cancels). Defaults focus to
  cancel so a stray Enter doesn't blow away the save.

---

## 23. Interactables — NPCs & Objects (v1.1)

Added Day 13a. This is the implementation of the §8b modal presentation spec
plus the surrounding system §8b couldn't describe on its own (schema, content,
room placement, proximity trigger).

**Schema** (in `careerPack.ts`):

```ts
interface InteractableDef {
  id: string;
  kind: 'npc' | 'object';
  art: string;                        // sprite token (real art in 13b)
  tags: string[];                     // 'office', 'coworker', etc.
  weight: number;                     // generator weighting (used in 13b)
  requires?: Record<string, string>;  // eligibility gate (same expr lang as decisions)
  dialogues: InteractableDialogue[];
}

interface InteractableDialogue {
  tier: 1 | 2;                        // 1 = read-only flavor, 2 = options
  prompt: string;                     // supports [[pause:N]] tags
  options?: { label: string; effects: Record<string,string>; flavor?: string }[];
  requires?: Record<string, string>;
}
```

**Content.** `public/careers/software-engineering/interactables.json`. Day 13a
ships 2 starter entries (1 NPC, 1 object); 13b expands.

**Loader.** Tolerant — older career packs without the file fall through to an
empty array. No breaking change for any existing pack.

**Placement.** Day 13a hardcodes a single interactable per decision room at
position `(200, 130)`, picked deterministically from the pack via a seeded
random (`monthId + INTERACTABLE_SEED_SALT`). Day 13b moves placement into the
room generator (multiple per room, weighted by month theme, layout-aware).

**Proximity + trigger.** `DecisionRoom`'s tick handler computes distance from
the player to the interactable. Within `INTERACT_PROXIMITY` (75 virtual units),
`adjacent` flips true; a dashed `palette.accent` halo + `[E] talk` label render
above the interactable. Pressing **E** (when adjacent, no other modal active,
not committed to the door) picks a random eligible dialogue and opens the
modal. Movement is paused while the modal is open, matching the decision /
event / minigame pattern.

**TypewriterText** (`src/game/ui/TypewriterText.tsx`). Implements §8b's
character-reveal: 30ms/char default, punctuation pauses (+60ms `,`, +180ms
`.!?`, +120ms `—`), inline `[[pause:N]]` hold tags, skip-to-end on first
press, advance on second, blinking `▌` caret. Derived completion state to
avoid `setState`-in-effect; reset semantics rely on `key` prop remount.

**NPCModal** (`src/game/ui/NPCModal.tsx`). Distinct visual from the systemic
DecisionModal — fade-in scale (0.96 → 1.0 over 200ms), Pixelify Sans (§15),
chunky ink border, inset bezel. Tier 1: prompt with typewriter → `▼` ready
indicator → any-key close. Tier 2: prompt → options panel (↑↓←→ + 1-N + Enter
/ Space + Esc) → flavor with typewriter → effects dispatched on advance
(deferred so the HUD floating-delta lands after modal close, matching the
DecisionRoom pattern).

**Door fade preserves canvas bounds.** The room SVG's border was moved to a
wrapper div so it persists through the door-commit fade. Modals land on a
visible-but-empty room outline instead of black.

---

*End of design document v1.1.*
