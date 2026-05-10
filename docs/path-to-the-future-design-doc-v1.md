# Path to the Future: Design Document v1.0

**Project:** Path to the Future — A Career of Choices
**Document version:** 1.0
**Status:** Approved, ready for implementation
**Last updated:** 2026-05-10

---

## 1. Premise

A narrative life-simulation game in which the player navigates 10 years (2020–2030) of a software engineering career, one month at a time. Each month is a "room" the player walks through, encountering decisions that compound into a unique life trajectory. Random events, era-flavored crises, and the player's own choices shape who they become by 2030.

**Tagline:** *A career of choices.*

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
  profile: { name, careerPack, entryClass, createdAt },
  progress: { currentMonth, completedMonths[], xp, classTier },
  stats: { burnout, savings, network, health, relationship, technicalSkill, reputation },
  flags: { inRelationship, hasKids, inGradSchool, ... },
  history: { decisions: [{ monthId, decisionId, optionTaken, timestamp }] },
  meta: { version, lastSaveAt }
}
```

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

**Score** is derived at endgame from final stat state, XP, and decision history. Not surfaced during play.

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
| **Blackjack**       | Chance      | Vegas / gambling decisions                    |
| **Code Review**     | Skill       | Senior-tier work decisions (find the bug)     |
| **Reaction Sprint** | Twitch      | High-pressure deadline decisions              |

All other "mini-game-shaped" moments are **narrated and resolved with a stat-weighted dice roll, not played out interactively.**

Example (no mini-game):
> "You raced through the maze to make the meeting. *(Rolling: focus + luck.)* You made it on time. The room went quiet when you walked in."

This pattern is the single biggest scope-saving decision in the doc.

---

## 11. Movement & Controls

- **Desktop:** Arrow keys + WASD. Smooth velocity-based movement, frame-rate independent. Diagonal movement normalized so it isn't faster than cardinal directions.
- **Tablet/mobile (architected, not tested for v1):** Tap-to-walk. Player walks toward tap point until reached or new tap supplied. Not pathfinding — just "go toward this point."
- **Virtual coordinate system:** all rooms are 1000×600 internally. Display scales via SVG `viewBox`.

---

## 12. Save / Load

- **localStorage only.** No cookies, no backend.
- **Multi-profile** on one browser:
  - `pttf:profiles` → list of profile names
  - `pttf:active` → current profile
  - `pttf:save:{name}` → full Redux state
- **Auto-save** after every room transition.
- **Sign out** clears active pointer; profile data remains.
- **No security or auth** in v1. Whoever opens the browser, plays.

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

---

## 17. Build Order

| Day | Deliverable |
|-----|-------------|
| 1   | ✅ Player movement engine (done) |
| 2   | Vite + TS + Redux Toolkit project scaffold; integrate Day 1 movement |
| 3   | Collision system + virtual coordinate system |
| 4   | Room types + room renderer + basic transition |
| 5   | Career pack loader + state management (Redux slices) |
| 6   | Decision system (modal, schema, effect application) + auto-save |
| 7   | Room generator (deterministic seeded layouts) |
| 8   | Random event system + era flavoring |
| 9   | HUD + class system + name entry + intro narrative |
| 10  | Content pass: write SWE career pack (decisions, events, months) |
| 11  | Mini-games (3) |
| 12  | Endgame / score / career recap |
| 13  | Polish: art tokens, sound (?), accessibility |

**Notes:**
- Save/load moved to Day 6 (was Day 8) — without it, iteration on Day 7+ becomes painful.
- Mini-games deferred to Day 11.
- Day 10 is the writing day. That's where the 80 minutes of playable content lives.

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
├── public/
│   └── careers/
│       └── software-engineering/      ← JSON content lives here
│           ├── manifest.json
│           ├── months.json
│           ├── decisions/
│           ├── events/
│           └── art/
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── game/
    │   ├── engine/                    ← pure logic hooks (no JSX)
    │   │   ├── usePlayerMovement.ts
    │   │   ├── useKeyboardInput.ts
    │   │   ├── useTouchInput.ts
    │   │   ├── useGameLoop.ts
    │   │   ├── useCollision.ts
    │   │   └── useRoomTransition.ts
    │   ├── entities/                  ← rendered things
    │   │   ├── Player.tsx
    │   │   ├── Interactable.tsx
    │   │   └── Hazard.tsx
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
    │   │   └── interpolate.ts         ← {playerName} substitution
    │   ├── state/
    │   │   ├── store.ts               ← Redux store config
    │   │   ├── slices/
    │   │   │   ├── profileSlice.ts
    │   │   │   ├── progressSlice.ts
    │   │   │   ├── statsSlice.ts
    │   │   │   ├── flagsSlice.ts
    │   │   │   └── historySlice.ts
    │   │   └── persistence.ts         ← localStorage save/load
    │   ├── ui/
    │   │   ├── HUD.tsx
    │   │   ├── DecisionModal.tsx
    │   │   ├── CareerPicker.tsx
    │   │   ├── ClassPicker.tsx
    │   │   └── NameEntry.tsx
    │   ├── minigames/
    │   │   ├── Blackjack.tsx
    │   │   ├── CodeReview.tsx
    │   │   └── ReactionSprint.tsx
    │   └── types/
    │       ├── geometry.ts
    │       ├── player.ts
    │       ├── room.ts
    │       ├── decision.ts
    │       ├── event.ts
    │       └── careerPack.ts
    └── styles/
        └── global.css
```

---

## 20. Open Questions (Defer to Build Time)

- **Spouse-name list** — when relationship begins, we draw from a name pool. Generate this in Day 10 content pass.
- **Number of layout templates** — start with 4, add more if rooms feel repetitive.
- **Mini-game art** — keep within the same flat-SVG vocabulary as rooms.
- **Endgame screen** — likely a "career recap" timeline showing key decisions + final stats. Day 12.

---

*End of design document v1.0.*
