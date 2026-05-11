# Session Log: Path to the Future

**Date:** 2026-05-10
**Session duration:** ~91 minutes (1:25 PM – 2:56 PM)
**Participants:** 1 human + Claude
**Output type:** Design doc + Day 1 code spike + reusable skill

---

## 1. Starting point

The user came in with a clear North Star prompt: a small, finishable, Zelda-style adventure game in React with SVG visuals, room-based, called *Path to the Future: A Career of Choices*. They had a structural intuition — 12 rooms × 10 years = 120 rooms, 2020 to 2030 — and a scope discipline ("not an RPG, not open-world, not procedural"). The Day 1 ask was concrete: build the player movement engine.

What was NOT yet decided going in: the actual game loop inside a room, branching architecture, content generation strategy, save model, art register, mini-game scope, mobile strategy, class/XP system, or how to keep 120 rooms from becoming a content death march. The user explicitly noted they had "hit enter early" and the foundation needed more work before code.

## 2. Deliverables produced

- **Day 1 movement engine code** — full TypeScript implementation: `useKeyboardInput`, `useGameLoop`, `usePlayerMovement`, `<Player />` SVG component, demo `<Room />`, type definitions, and a proposed folder structure. Frame-rate-independent, diagonal-normalized, ref-based to avoid re-render storms.
- **v1.0 Design Document** — 18 sections covering premise, player loop, career-pack architecture, room generator, room types, state model (Redux vs refs vs local), stats, decision schema, random event system, mini-games, controls, save/load, player identity, class system, visual style, build order, scope-out list, and the North Star.
- **Revised 13-day build plan** — moved save/load from Day 8 to Day 6, deferred mini-games to Day 11, added a dedicated content-pass day.
- **`session-process-log` skill** — a reusable, generic skill for documenting working sessions. Built, validated, packaged as a `.skill` file ready to upload to Claude.
- **Architectural commitments locked** — career-pack JSON system, deterministic procedural rooms, stat/XP/score separation, Redux-for-game-state-only boundary, soft permadeath, era-flavored event pools, 2 entry classes for v1 (Novice, Skilled).

## 3. Key decisions

### Procedural-but-deterministic rooms (not "random" or "templated")
- **Decision:** Rooms are generated from a seed `hash(careerPack, entryClass, monthId, gameStateHash)`. Same seed → same room every time.
- **Reasoning:** The user said two things in tension ("randomized by ground rules" + "room 1 always looks like room 1"). Deterministic procedural generation reconciles them: we build a generator once, tune the rules, and 120 rooms fall out — but a returning player sees the same Jan 2024 they saw before.
- **Driver:** Claude pushed back on the apparent contradiction; user agreed.
- **Alternatives considered:** Pure procedural (rejected — no stability), pure templated (rejected — content death march at 120 rooms).

### Career-pack architecture
- **Decision:** The engine is generic. All career-specific content (decisions, events, art, stat names) lives in JSON packs under `public/careers/{career}/`. Shipping only `software-engineering` for v1.
- **Reasoning:** The user mentioned future careers (CPA, Nurse, etc.) and that some decisions are universal across careers. A pack architecture means writing the engine once, adding careers later as JSON. The universal decision pool means every universal decision counts ~5×.
- **Driver:** Mutual — user described the constraint, Claude named the architecture.
- **Alternatives considered:** Career-specific engine code (rejected — wouldn't scale).

### XP, stats, and score are three different things
- **Decision:** XP is monotonically increasing career progression (drives class tier). Stats (burnout, savings, etc.) go up and down and gate decisions/events. Score is a derived endgame number.
- **Reasoning:** Conflating them would create bugs and design confusion. Each has different update cadence, different visibility rules, different roles in branching logic.
- **Driver:** Claude proposed the three-way split when the user used "stats" and "score" interchangeably.
- **Alternatives considered:** Single "score" abstraction (rejected — too coarse).

### Redux for game state, refs for movement
- **Decision:** Redux Toolkit owns persistent state (month, stats, decisions made, save data — updated ~once per room). React refs/hooks own per-frame state (position, velocity, input). Local component state for UI bits.
- **Reasoning:** Redux at 60fps causes re-render storms. The bright-line rule "if it changes 60×/sec it's not in Redux" prevents the most common React-game performance bug.
- **Driver:** Claude flagged the trap when user said "introduce Redux Toolkit."
- **Alternatives considered:** All-Redux (rejected — perf), all-refs (rejected — save/load nightmare).

### Mini-games: 3 real, the rest narrated
- **Decision:** Build 3 mechanically distinct mini-games (blackjack, code-review puzzle, reaction sprint). All other "mini-game-shaped" moments are narrated with a stat-weighted dice roll.
- **Reasoning:** User's instinct ("we say: 'You raced through the maze and made it on time / didn't'") is the right scope move. Player still feels agency; we wrote 8 lines of JSON instead of building a game.
- **Driver:** User proposed the stub-in pattern; Claude affirmed and proposed the 3 distinct mechanics.
- **Alternatives considered:** No mini-games (rejected — flat), 10+ mini-games (rejected — scope explosion).

### Soft permadeath with random events
- **Decision:** No game-over screens, but bad outcomes can end a playthrough early (Oregon Trail dysentery, financial ruin, breakdown). Random events run after every decision, weighted by stats, era, and history.
- **Reasoning:** Stakes without punishment. The Oregon-Trail-meets-Monopoly tone the user wanted requires real consequences but not a frustration spiral.
- **Driver:** Mutual — user named the tone references, Claude named the system.
- **Alternatives considered:** Pure permadeath (rejected — punishing), no failure states (rejected — stakeless).

### Visual register: muted/contemplative, not Kentucky Route Zero
- **Decision:** Flat-color SVG, 4–5 colors per room, era-driven mood palettes, generous negative space, no animation beyond movement and modal transitions.
- **Reasoning:** User loved Kentucky Route Zero's feel. Claude was honest that KRZ's actual rendering (3D, custom shaders, Unity) is unreplicable in SVG, but the *emotional register* — quiet, considered, melancholy-warm — is achievable in flat shapes. Browser performance at 20–50 SVG nodes per room is a non-issue.
- **Driver:** Claude pushed back on a literal reading; user agreed the emotional register was the actual ask.
- **Alternatives considered:** Bright/cartoony (rejected — wrong tone), pixel art (rejected — ages poorly, off-brief).

### Single project, not monorepo
- **Decision:** One `package.json`, modular folder structure, one `npm install`. Content packs are JSON files in `/public/careers/`.
- **Reasoning:** Monorepo tooling tax (workspaces, build orchestration, package linking) buys nothing on a solo project. Folder boundaries enforce architecture without overhead.
- **Driver:** Claude after user asked for clarification on the term.
- **Alternatives considered:** True monorepo with `packages/` (rejected — over-engineered).

## 4. Tensions resolved

- **"Make 120 rooms" vs "don't write 120 rooms by hand."** User initially framed it as authored content. Claude flagged the scope problem; user pivoted to "build a generator." Resolved by deterministic procedural generation.
- **"Every decision impacts the outcome" vs combinatorial explosion.** Claude flagged that fully branching state means 2^120 playthroughs. Resolved by stat-based branching with hard flags only at year boundaries.
- **"Zelda-style movement" vs "choose your own adventure."** Claude flagged that pure CYOA makes the movement decorative. Resolved by giving rooms multiple in-room interactions (flavor, stat-modifiers, hazards) so movement matters but isn't combat.
- **Save/load on Day 8 vs Day 6.** Claude argued for moving it earlier because losing state every refresh would slow iteration. User agreed; build plan revised.
- **TypeScript "if helpful" vs commit.** User left it open. Claude argued for committing to TS now because a 120-room state machine with branching benefits enormously from the type system.
- **Class picker: ship all 8 vs ship 2.** Claude argued for shipping 2 (Novice, Skilled) with the others grayed out as "Coming Soon." User agreed.
- **Mobile-first vs desktop-first.** User wanted mobile in scope. Claude proposed architecting for it (virtual coordinate system, tap-to-walk hook seam) without testing it in v1. User accepted.
- **Real era events vs proper-noun trouble.** Claude flagged that referencing real companies/products dates the game and creates legal risk. Resolved by macro-trends only, no proper nouns.

## 5. Time analysis

### Session duration
**~91 minutes** of wall-clock time (1:25 PM to 2:56 PM, based on conversation timestamps). The session was continuous and high-density — no breaks, every exchange substantive.

### Traditional-team equivalent
**Assumed team:** 1 product person, 1 engineer, 1 designer.
**Assumed working pattern:** mix of async work and 2–3 sync meetings.
**Estimated duration:** **3–5 working days.**

**What this estimate INCLUDES:**
- Initial scoping and North Star alignment
- Architectural design discussion (state model, save/load, content pipeline)
- Branching/decision system design
- Stat/XP system design
- Visual style direction conversation
- Mini-game scope conversation
- Mobile strategy
- A 13-day build plan
- A working Day 1 code spike (player movement engine, ~150 LOC TypeScript)
- A reusable artifact (the session-log skill)

**What this estimate EXCLUDES (and would still need to be done in a real product process):**
- Stakeholder interviews and approval cycles
- Competitive research / genre study
- User testing or playtesting plans
- Visual design mocks (palette boards, character concepts, room composition studies)
- Technical performance spikes (we asserted SVG would be fine; we didn't measure)
- Sound design direction
- Accessibility review
- Legal review of era-event content
- Project management overhead (Jira tickets, standups, retros)

### Honest framing

What we did was **design discovery + Day 1 spike**, not a shipped feature. With those caveats, this session compressed roughly 3–5 days of small-team design work into ~91 minutes — a **~25–40× compression on the work that was actually performed**. That number drops if you include the work that was *not* performed (stakeholder alignment, user research, visual mocks). The credible claim is "we did 3–5 days of architectural and scope-shaping work in an hour and a half"; the less credible claim would be "we built a game in 90 minutes."

The compression came primarily from two places: (1) the absence of meeting overhead and async wait time, and (2) the user's willingness to be pushed back on. Several scope traps (120 hand-authored rooms, combinatorial branching, mini-game proliferation) were caught in the same minute they were proposed, where in a team setting they might survive a week before someone surfaced them.

## 6. What's next

- User installs the `session-process-log` skill via Settings → Capabilities → Skills.
- Claude scaffolds the Vite + TS + Redux Toolkit project.
- Day 1 movement code is ported into the real project structure.
- Dev server comes up.
- Day 2 work begins: collision system + virtual coordinate system.
- Open questions to revisit during build: exact starting stats per entry class, the universal-vs-SWE decision pool ratio, the per-era palette tokens.

## 7. Observations for publication

**Where AI helped most:** Pattern-matching at speed. Several moments in the session — "those are opposite goals" (procedural vs deterministic), "XP and stats are not the same thing," "Redux at 60fps will cause re-render storms" — are exactly the kind of architectural mistakes that survive into a real codebase because nobody on the team has done this specific shape before. Claude has seen enough adjacent shapes to flag the trap fast. This was the dominant value mode of the session.

**Where the human had to push back:** Claude initially wrote a movement engine for a game that the user hadn't actually described. The user's "i hit enter early" message redirected the entire conversation toward design discovery before code. Without that redirection, we would have built a great movement engine for the wrong game. The human judgment call — *we are not ready to code yet* — was the most valuable single move in the session.

**What the workflow felt like:** Less like prompting a tool, more like a design review with a senior engineer who never gets tired and has read every game architecture post-mortem. The texture of the conversation — push, pushback, "actually here's the gotcha you missed" — is qualitatively different from typical AI use cases. The human's role shifted from "writer of requirements" to "decision-maker on tradeoffs Claude surfaced."

**The replicable lesson:** The single highest-leverage move was the user explicitly slowing down to do design before code, even when an AI was available to write code instantly. The temptation to skip-to-code with AI is the opposite of where AI's actual leverage is. The leverage is in the design conversation that would otherwise happen in a meeting next Tuesday.

---

*Generated by the session-process-log skill.*
