# Path to the Future: Design Document

**Project:** Path to the Future — A Career of Choices
**Document version:** 2.0.18
**Status:** Living spec · Days 1–14 (title screen) merged · Day 15 — analytics wrapper + slug/event instrumentation wired (GoatCounter `pathtothefuture.goatcounter.com`); GitHub Pages deploy still pending · Two packs playable (SWE + Homeschool Parent) · Half-length playthrough (1 cinematic + 6 playable months/year, 70 monthIds total) · 16 layout templates (11 simple + 3 easy + 2 medium) · Room complexity tier ladder PR4/5 — first moving-obstacle physics + medium templates authored · All 8 class tiers selectable · Finale trophy on the recap screen · Kid names player-controlled in Homeschool pack · NPC palette tokens split out from `accent` (adult vs child)
**Last updated:** 2026-05-15

---

## Change log

This document is living. Every meaningful revision lands here so future
sessions (or contributors) can read the spec at any version cleanly.

| Version | Date       | Author                    | Summary |
|---------|------------|---------------------------|---------|
| v2.0.19 | 2026-05-15 | Corby Hoback · Claude Code | **PR4 follow-up — moving-obstacle feel pass.** Tuning bumps (knockback 50→100 px, health hit −2 → −4, burnout threshold 4 → 8). Imperative knockback snap replaced with a two-phase smooth slide: 200 ms westward shove (`MOVING_OBSTACLE_SLIDE_MS`) + 800 ms frozen stun (total = `MOVING_OBSTACLE_TOTAL_LOCK_MS = 1000`). Per-obstacle dedupe so cascading hits from a *different* obstacle in the slide path push the player further west naturally (chain-shoves clamp at the left wall via the existing `resolveMovement` bounds clamp). Visual feedback: 3× HUD-sized in-canvas "−N" floater at the impact point + 3 ★ stars twinkling above the player for the full 1-sec lock window (mirror the lock lifetime exactly, follow player position during the slide and sit above the stationary stunned player). Input: `usePlayerMovement` gains optional `externalVelocityRef` (overrides keyboard when non-null) + a must-release gate so direction keys held through the lock stay ignored until physically released. §4 *Complexity tiers* medium-tier row updated. No `STATE_VERSION` bump (purely engine-side feel + tuning, no schema change). |
| v2.0.18 | 2026-05-15 | Corby Hoback · Claude Code | **Medium-tier templates + moving-obstacle physics (PR4 of the §4 ladder).** First non-trivial engine work on the v2.0.9 framework. New `MovingObstacle` type in `types/geometry.ts` (sine-wave vertical oscillation: `baseRect` + `amplitude` + `period` + `phase`), new optional `movingObstacles?: readonly MovingObstacle[]` field on `LayoutTemplate` + carried through `RoomLayout`. New `useMovingObstacles(list, active)` hook + `currentRectFor(mo, t)` pure helper drive per-frame position updates via the existing `useGameLoop` rAF; the hook short-circuits and never subscribes when the list is empty so simple/easy rooms are zero-cost. `usePlayerMovement` widens its return shape to `{ state, setPosition }` so callers can imperatively reposition the player; `circleIntersectsRect` exported from `engine/collision`. **DecisionRoom** wires the collision callback inside `handleTick`: each frame, if the player overlaps any moving-obstacle rect (cooldown-debounced 600 ms, suppressed in replay), we (a) knock the player back 50 px west via `player.setPosition`, (b) dispatch `applyStatEffect(health -2)`, (c) increment a per-room hit counter, (d) dispatch `applyStatEffect(burnout +5)` once the counter hits 4. On forward-door commit, if the room had moving obstacles AND the hit counter is 0, dispatch `addXp(XP_TIER_BONUS_UNTOUCHED = 100)` — a clean traversal of a hazard room reads as a meaningful reward (sized between minigame partial and minigame win). New rendered group: `<rect data-region="moving-obstacle">` painted with `palette.accent` + thicker stroke so the moving block reads visually distinct from static furniture. **Two new universal medium templates:** `pendulum` (single oscillating block at canvas center, amplitude 180 / period 2400 ms) and `shutters` (two blocks at x=350 / x=650, π-phase-offset so they cross). Pool sizes: SWE = 15 (10 simple + 3 easy + 2 medium); Homeschool = 13 (8 simple + 3 easy + 2 medium). 2023+ years now actually roll medium (was falling through to easy). Hard / expert rolls still cascade down to medium → easy → simple until follow-up PRs land. §4 *Layout templates* table widens with the two new rows; §4 *Complexity tiers* fallback paragraph updated. No `STATE_VERSION` bump (additive on layout templates + new XP constant; saves carry no template state). |
| v2.0.17 | 2026-05-15 | Corby Hoback · Claude Code | **Easy-tier templates (PR3 of the §4 complexity-tier ladder).** First content drop on the v2.0.9 framework. `maze` is promoted from `simple` → `easy`, and two new universal easy templates ship: **`s-curve`** (two offset vertical walls forcing an S-shape detour: spawn → up → over → down → over → up to door, 3 direction changes, lower cognitive load than maze) and **`switchback`** (2-wall maze-lite with 200 px gaps, reads as a corridor twist). Pool sizes — SWE: simple 10 + easy 3 = 13 eligible; Homeschool: simple 8 + easy 3 = 11 eligible. 2020 (100% simple) drops by 1 (maze leaves the simple pool); 2021–2022 now pull `maze`/`s-curve`/`switchback` for the easy slice of the year mix. Medium / hard / expert rolls still fall through to the easy pool until follow-up PRs author them. §4 *Layout templates* table widens to a `Tier` column + reflects the new pool math; §4 *Complexity tiers* fallback paragraph updated. No `STATE_VERSION` bump, no schema change, no engine change — pure template authoring on the v2.0.9 seam. |
| v2.0.16 | 2026-05-15 | Corby Hoback · Claude Code | **Day 15 — analytics wrapper + slug/event instrumentation (GoatCounter).** New `src/game/analytics/track.ts` exposes `initAnalytics()`, `trackPageview(path)`, `trackEvent(name, params?)`, and a `useTrackPageview(path)` React hook. All three guard layers from §24 enforced: no-op when `import.meta.env.PROD === false`, when `VITE_ANALYTICS_ENABLED !== 'true'`, when `navigator.doNotTrack === '1'`, or when `window.goatcounter` is undefined. Wrapper dynamically injects the GoatCounter script tag from `VITE_GOATCOUNTER_ENDPOINT` so dev builds never load it. Custom event params encode as a query string on the event name (e.g. `game_started?career=software-engineering&class=skilled`). New `.env.production` with `VITE_ANALYTICS_ENABLED=true` + `VITE_GOATCOUNTER_ENDPOINT=https://pathtothefuture.goatcounter.com/count`. New `src/vite-env.d.ts` types both env vars. **11 pageview slugs wired:** `/title` (TitleScreen), `/init/career` (CareerPicker), `/init/name` (NameEntry), **`/init/kid-names`** (KidNamesEntry — added to the §24 list to match the v2.0.14 init phase), `/init/class` (ClassPicker), `/init/intro` (IntroScene), `/month/{01..70}` (RoomRenderer per `key={monthId}` remount), `/minigame/{variant}` (MinigameRoom — replay mounts skip the slug so it reads as "actually played"), `/endgame` (EndgameScreen), `/credits` (CreditsScreen mode='browse'), `/restart` (CreditsScreen mode='replay'). **4 events wired:** `game_started` (career, class) at `InitFlow.handleIntroComplete` + the dev-skip path so it doesn't fire on resume; `game_completed` from `EndgameScreen` mount; `restart_confirmed` from `EndgameScreen.onConfirmReplay`; `minigame_completed` (id, result) from each minigame's `handleContinue` next to the existing `recordMinigame` dispatch (gated on `mode === 'scheduled'` to mirror the history-record gate; arcade plays don't fire). Blackjack normalizes its `'win'|'lose'|'push'` vocab to the spec's `'win'|'partial'|'fail'`. §24 *Tracked slugs* gets the `/init/kid-names` row. **Out of scope of this PR (per user direction):** GitHub Pages deploy + the matching `package.json` `homepage` field — Day 15's deploy half remains ⏳. No `STATE_VERSION` bump. |
| v2.0.15 | 2026-05-15 | Corby Hoback · Claude Code | **NPC palette tokens split out from `accent`.** `Palette` widens with `npcAdult` / `npcAdultInk` / `npcChild` / `npcChildInk` (mirrors the `player` / `playerInk` pattern). Both pack manifests gain the four hex values (yellow `#ffc91c` + olive ink for adults; green `#1aff5e` + dark-green ink for kids). `InteractableSprite.tsx` rewires 6 NPC body sites — `NPCBase` body+head, `NPCKidBase` body+head, the redrawn head in `NPCCoopParent`, and the waving hand in `NPCNeighbor`. Accessory strokes (cup, glasses, clipboard, tie, watch, backpack) stay on `palette.ink` so they remain readable against the new body colors. Seven hair sites (designer tuft, Bram tuft, mother-in-law crown + bun, spouse long-hair frame, co-op-parent ponytail, neighbor bob) move from `palette.ink` to `palette.accent` — the warm brown reads as hair where the near-black ink was too harsh against the new body colors. The other 33 `palette.accent` references (objects, doors, UI selection, EffectChips negative, EndgameScreen trophy, minigame flourishes) are unchanged — splitting those is a separate design conversation. `CareerPackProvider` runs the new tokens through `applyEraMood` like the rest of the palette, so NPCs drain in the pandemic era and saturate in the ai-shift era like everything else. New §15 *NPC palette tokens (v2.0.15)* subsection. No `STATE_VERSION` bump — palette lives in the pack manifest, not in saves. |
| v2.0.14 | 2026-05-14 | Corby Hoback · Claude Code | **Kid-name interpolation sprint shipped ([closes #76](https://github.com/corby-github/path-to-the-future/issues/76)).** `profileSlice` gains `kidAName` / `kidBName` (defaults `Hazel` / `Bram`) + `kidNamesSet` flag. New `KidNamesEntry` init-flow phase between Name and Class, mounted only when `manifest.requiresKidNames` is set (Homeschool: `2`; SWE omits and skips the phase). New optional `requiresKidNames` field on `Manifest`. `interpolate.ts` context expanded with `kidA` / `kidB`; wired into `DecisionModal` / `EventModal` / `IntroScene` / `NPCModal` / `NarrativeRoom` (the last two previously bypassed interpolation entirely). `labelFor` / `speakerHeaderFor` take an optional `vars` arg so kid-NPC labels resolve `{kidA}` / `{kidB}` at render time. **74 `Hazel` / `Bram` occurrences** across 5 homeschool JSON files (`decisions` / `events` / `interactables` / `months` / `endgame-taglines`) retemplated to `{kidA}` / `{kidB}` via a one-shot perl pass. ProfileModal Children rows are now inline-editable (Save dispatches `setProfile({ kidAName | kidBName })`); the `[Edit]` buttons' "Coming soon" tooltip retired. §13 ProfileModal section + §26 Homeschool *Deferred follow-ups* updated to reflect the shipped state. No `STATE_VERSION` bump — defaults back-compat old saves. |
| v2.0.13 | 2026-05-14 | Corby Hoback · Claude Code | **Finale trophy on the recap screen.** New inline `TrophyCrown` component in `EndgameScreen.tsx` — Treatment-A flat-color SVG (cup + handles + stem + tiered base, `palette.accent` fill + `palette.ink` strokes + a small ink-dot insignia), 88 px tall, rendered as a centered crown above the *"Ten years done."* header. No emoji (cross-platform render consistency). Also fixes two stale narrative comments left over from the v2.0.8 half-length playthrough: `EndgameScreen.tsx` "full 120-decision list" → "~60 rows under v2.0.8"; `progressSlice.ts` XP economy comment updated to acknowledge the 60-playable-month arc + flagged for a future tuning pass. **No `STATE_VERSION` bump, no schema change.** §21 *Endgame & Recap* gains a v2.0.13 trophy note. |
| v2.0.12 | 2026-05-14 | Corby Hoback · Claude Code | **Replay back-door spawn position + rewind narrative-skip ([issue #77](https://github.com/corby-github/path-to-the-future/issues/77) + follow-up).** (1) **Spawn position.** Entering a previous month via the rewind door now spawns the player just LEFT of the forward door (`{ x: door.x - 30, y: door.y + door.height / 2 }`) instead of at the layout's default left-edge spawn. Reads as "you stepped out of the door you originally exited." Live forward-entry + `exitReplay` still use the standard left spawn. New `replaySpawnFor(door)` helper; `isReplay ? replaySpawnFor(layout.door) : layout.spawn`. (2) **Rewind narrative skip.** `previousReplayableMonth()` now skips both `consequence` AND `narrative` rooms — walking back from Feb 2021 (id 9) lands on Dec 2020 (id 7), not Jan 2021 narrative (id 8). Per v2.0.8 the cinematic Januaries are forward-only year-transition beats; the back-door target should be the previous *decision* room. §11.1 *Backward replay* updated with the new spawn rule + the narrative-skip rule. |
| v2.0.11 | 2026-05-14 | Corby Hoback · Claude Code | **All 8 class tiers selectable.** SWE + Homeschool manifests gain `entryClasses` for `junior` / `vanguard` / `commander` / `legendary` / `mythic` / `oracle` with calibrated `startingXp` + `startingStats` per tier. Labels match each pack's `classLabels` overrides where present (Homeschool: Settled Routine / Curriculum Sage / Co-op Lead / Mentor Parent / Elder / The Oracle). ClassPicker auto-gates by `entryClasses` membership, so no engine code change. §18 *Out of Scope* updated — the "Class entry points beyond Novice and Skilled" item retired with a v2.0.11 strike-through pointing at the new entries. Starting stats are unplaytested; tuning will follow runs. |
| v2.0.10 | 2026-05-14 | Corby Hoback · Claude Code | **Doc-sync + content `requires.month` gate remap after v2.0.8.** PR #78 regenerated `months.json` (120 → 70) but left `requires.month` / `trigger.month` gates in `decisions.json` / `events.json` on the old 12-slot/year calendar — leaving 9 homeschool decisions + 2 events **unreachable** (gates above the new 70 cap) and silently shifting SWE arc pacing ~4 months earlier than authored. New one-shot `scripts/remap-old-month-gates.mjs` converts each old monthId to the smallest new slot whose calendar month is ≥ the old monthNum. **72 gates remapped** across 4 JSON files (SWE 32 + Homeschool 40). Doc sync: §24 analytics slugs refreshed (`/month/{001..120}` → `/month/{01..70}`; minigame slug list expanded to all 5 variants — was a stale 3-entry list); `game_completed` event description updated; inline 120→70 sweep of engine-cap references across §2, §3, §5, §6, §8, §11.2, §21, §25, §26 (Homeschool era table + counts; Student fork-month note pinned to v2.0.8 scale). |
| v2.0.9  | 2026-05-14 | Corby Hoback · Claude Code | **Room complexity tier framework (no new rooms yet).** New `ComplexityTier` type + required `complexity` field on `LayoutTemplate` (all 12 templates tagged `simple` for now); `YEAR_TO_COMPLEXITY_MIX` table + `pickComplexityTier(year, rng)` sampler; `eligibleTemplates(packId, complexity?)` extends the pack filter with a tier filter + downward fallback chain (expert → hard → medium → easy → simple). `generateRoom(seed, packId, year, forced?)` signature widened; `RoomLayout.complexity` exposes the picked tier. Play unchanged from v2.0.8 (every roll falls through to `simple`). New §4 *Complexity tiers (v2.0.9)* subsection. No `STATE_VERSION` bump. Companion PR to v2.0.8; both branched from `main` per the no-stacked-PRs rule. |
| v2.0.8  | 2026-05-14 | Corby Hoback · Claude Code | **Half-length playthrough — every other month is playable, + HUD calendar-emit fix.** Each year is now 7 slots: 1 cinematic January + 6 playable months (Feb/Apr/Jun/Aug/Oct/Dec). `months.json` drops **120 → 70** across both packs. `src/game/calendar.ts` gains `SLOTS_PER_YEAR = 7` + `SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12]`; `monthLabel(id)` reads from the slot table. Minigame slots remapped in SWE pack (Blackjack m19, Code Review m35, Pong m45, Reaction Sprint m53). `progressSlice` clamps move 120 → 70; `FINALE_MONTH_ID` moves 120 → 70; finale-decision id renamed `finale-month-120` → `finale-month`. `STATE_VERSION` 1.6.0 → 1.7.0 to discard pre-refactor saves. Rewind door semantics unchanged (`previousReplayableMonth` walks across cinematic Januaries). New `calendarMonthDelta(fromId, toId)` helper + HUD update so the month-change floater shows the actual calendar delta (typically +2 / −2, with +1 / −1 only at the Jan↔Feb and Dec↔Jan boundaries) instead of slot delta. New §4 *Half-length playthrough (v2.0.8)* subsection. |
| v2.0.7  | 2026-05-13 | Corby Hoback · Claude Code | **Mid-game profile editing via clickable HUD chip.** Adds the *"You: {name} [edit]"* profile card the user mocked up. (1) **New `ProfileModal` component** (`src/game/ui/ProfileModal.tsx`) — centered modal opened from the HUD identity chip. Player-name row supports inline editing: click `[Edit]` swaps the value to a text input prefilled with the current name + Save / Cancel buttons. Save dispatches `setProfile({ name })` against the existing `profileSlice`; since every decision / event / endgame string already interpolates `{playerName}` via `interpolate.ts`, mid-game edits propagate through future content automatically with no further wiring. (2) **HUD identity chip is now a `<button>`** in `Hud.tsx` (was a `<span>`) — same visual weight + size, adds pointer cursor + underline-on-hover affordance, opens the modal on click. Activates via Enter/Space if focused (free keyboard support via native button semantics; no global shortcut). (3) **Kids section (homeschool-parent pack only).** Modal shows `Hazel` and `Bram` under a *"Children"* header, mirroring the names hardcoded in `public/careers/homeschool-parent/*.json` (74 occurrences). **The kid `Edit` buttons are disabled** with a `title="Coming soon — needs the kid-name interpolation sprint to update event/decision content too."` tooltip. Tracked as a separate GitHub issue (kid-name interpolation sprint) — the full feature requires adding `profile.kidAName` / `profile.kidBName` defaults, an init-flow phase gated on `manifest.requiresKidNames`, `{kidA}` / `{kidB}` context entries in `interpolate.ts`, and a mechanical pass through all 74 occurrences. (4) **Shared sanitization** — extracted `MAX_NAME_LENGTH` and `sanitizeName(raw)` from `NameEntry.tsx` to a new `src/game/content/nameSanitize.ts` module. Both the init-flow `NameEntry` and the mid-game `ProfileModal` import from the same source, so init-time and edit-time validation rules can't drift. Move was also forced by `react-refresh/only-export-components` (a `.tsx` file with a component can't co-export non-component helpers). (5) **Interaction details:** Esc cancels an in-progress inline edit; Esc again closes the modal (standard inline-edit UX). Backdrop click also closes. Click on the dialog interior stops propagation so the player can interact without accidentally dismissing. The modal uses `position: fixed` + `zIndex: 110` so its DOM nesting inside `Hud` doesn't affect overlay positioning. (6) **§13 *Player Identity*** gains a *Mid-game profile editing (v2.0.7)* subsection documenting the trigger, the inline edit pattern, the kids section + disabled-edit rationale, and the mouse-first design choice. **No `STATE_VERSION` bump, no schema change, no save migration** — `setProfile` is an existing reducer; only the call sites grow. |
| v2.0.6  | 2026-05-13 | Corby Hoback · Claude Code | **Pack-filtered arcade variants + Stacker variation pass.** Two unrelated polish moves bundled because both came from a single playthrough observation. (1) **Code Review excluded from homeschool arcade.** New optional `packs?: readonly string[]` field on each `ARCADE_VARIANTS` entry in `ArcadeModal.tsx` — mirrors the `LayoutTemplate.packs` pack-filter pattern from §4. Undefined = universal (every pack lists the variant). Listed = only matching pack ids. Today only `code-review` is gated (`packs: ['software-engineering']`); the SWE-coded *"spot the bug, beat the panel"* register doesn't fit a homeschool run, and homeschool months don't schedule it. Homeschool arcade now lists 4 variants (blackjack, reaction-sprint, pong, forty-two); SWE arcade still lists all 5. Filter applied via `eligibleVariants = ARCADE_VARIANTS.filter(v => v.packs === undefined || v.packs.includes(manifest.id))`, memoized on `manifest.id`. Arrow-key bounds + number-key clamps updated to `eligibleVariants.length`. (2) **Stacker (Reaction Sprint) variation.** Old behavior: every block started at `BLOCK_MIN_X` moving right at `BASE_SPEED + idx * 40` (monotonic 480/520/560/600/640 v.u./sec). Pattern was too learnable — one locked-in rhythm carried all five blocks. New behavior: (a) **starting side alternates** L→R→L→R→L per block via `startingXForBlock(i)` + `startingDirForBlock(i)` helpers (even = left/+1, odd = right/-1); (b) **per-block speeds** declared as a literal `BLOCK_SPEEDS = [480, 620, 520, 680, 560]` tuple alternating moderate/fast bands instead of the old monotonic formula. Win/partial/fail thresholds unchanged. **Doc edits:** §10 *Reaction Sprint* row reflects the new alternation; new *v2.0.6 variation tuning* paragraph names the helpers + the speed tuple. §10.1 gains a *Pack-filtered variants (v2.0.6)* paragraph documenting the `packs?` field. **No `STATE_VERSION` bump, no schema change, no save migration.** |
| v2.0.5  | 2026-05-13 | Corby Hoback · Claude Code | **Minigame icons wired into ArcadeModal + MinigameReplayCard.** Closes the orphan-art gap left by the v1.6.x "42" iteration loop: five minigame icons (`IconCards` / `IconCheckmark` / `IconLightning` / `IconPaddles` / `IconFortyTwo`) had been authored in `modalIcons.tsx` but registered nowhere — the comment in `modalIconRegistryData.ts` named the gap as "future MinigameIcon registry." This version ships that registry. (1) **New `MINIGAME_ICONS: Record<MinigameVariant, ModalIconComponent>` map** at the bottom of `modalIconRegistryData.ts`. Keyed by the closed `MinigameVariant` union, so typecheck fails if a new variant lands without an entry. Five entries today. (2) **New `MinigameIcon` helper** in `modalIcons.tsx` — sibling of `DecisionIcon` / `EventIcon`, ~10 lines, same shape (consults the registry, defensive `PlaceholderIcon` fallback even though the union is closed). Renders `<MinigameIcon variant={...} palette={...} size={...} />`. (3) **`ArcadeModal` variant rows** restructured to `flex-row` with a 44 px leading icon column; the existing label / blurb / cooldown-pill stack moves into a `flex-column` content slot to the right. Row padding tightened 12 → 10 px to keep the menu visually compact. The 42-icon iteration loop's output (line-art Deep Thought wedge head) now actually renders next to "The Ultimate Question." (4) **`MinigameReplayCard`** gets a 64 px `MinigameIcon` rendered above the small *"…looking back"* uppercase header — gives the replay-mode summary a glance-recognizable signature of which minigame the player is recalling. (5) **Doc edits:** §10.1 *Arcade access* gains a *Per-variant icons (v2.0.5)* paragraph documenting the registry + the two render surfaces. **No engine code change beyond the new helper, no `STATE_VERSION` bump.** This is a pure-UI polish pass — addresses the user observation "we looped on 42 icon but I don't see it anywhere," which had become a worked example of the polish-loop scope-creep pattern (ship art, forget to wire it). Future minigame variants automatically need a `MINIGAME_ICONS` entry to typecheck. |
| v2.0.4  | 2026-05-13 | Corby Hoback · Claude Code | **`maze` layout template added (universal).** Twelfth template; first navigation-heavy entry. Four vertical walls at x = 200 / 400 / 600 / 800 (60 px wide each), each with a 60-px gap that alternates **center → top → bottom → center** — forces the player to zigzag up/down across the canvas before reaching the door instead of walking a straight line. Gap height (60 px) is >2× `PLAYER_RADIUS` (14, so diameter 28), comfortably navigable; matches the existing `divided` template's gap size. 8 obstacle rects total (2 per wall). Universal pack-filter (`packs` omitted) — both packs can roll it; mazes aren't pack-coded the way cubicles or classrooms are. **Pool sizes now:** SWE = 11 (universal 8 + swe 3), Homeschool = 9 (universal 8 + homeschool 1). Avg repeats drop again from ~11/14 → ~10/12 per template. §4 *Layout templates* table updated with the new row + pool-size math; no schema change, no `STATE_VERSION` bump. Path-correctness was authored once (the user verifies in-game) — no preview iteration loop per the `polish-loop-scope-creep.md` rule. |
| v2.0.3  | 2026-05-13 | Corby Hoback · Claude Code | **Room-template expansion + pack-aware layout filtering.** Doubles the layout pool from 4 templates to **11** and introduces a pack-filter mechanism so the room generator no longer reads as "the office is everywhere I go." (1) **New `packs?: readonly string[]` field on `LayoutTemplate`** in `src/game/rooms/generator/layouts.ts`. Undefined = universal (eligible for every pack); listed = only those packs roll the template. New `eligibleTemplates(packId)` helper does the filter. (2) **`generateRoom(seed, packId, forced?)`** signature widened — pulls the eligible pool, falls back to the full pool with a dev-mode warning if a pack matches nothing (defensive). `forcedTemplateId` from DevPanel still bypasses the filter so devs can preview any template. (3) **7 new templates authored** in one pass per the polish-loop research artifact's rules (no per-template review rounds, trust the rectangles): **`cubicles`** (swe — 4 small blocks in 2×2 grid), **`classroom`** (homeschool — 4 student desks + teacher's desk), **`park`** (universal — bench + tree-blob, asymmetric), **`grocery-store`** (universal — 3 vertical aisles with mid-aisle gaps for navigation), **`kitchen`** (universal — top counter + right counter + center island), **`living-room`** (universal — couch + coffee table + TV stand cluster), **`church`** (universal — 2 rows of 3 pews + 2 plants flanking the altar). Existing `open-office` + `shared-desks` got the `software-engineering` tag; `library` and `divided` left untagged (universal). (4) **Pool sizes per pack:** SWE = 10 (7 universal + 3 swe), Homeschool = 8 (7 universal + 1 homeschool). Across ~110 DecisionRooms the avg-repeats-per-template drop from ~27 to ~11–14 — the "felt-unpolished" beat the user named was 4-template monotony, not a deeper structural issue. (5) **New *Layout templates (v2.0.3)* subsection in §4** documents the schema, the pack-filter spirit ("spaces both packs visit are universal; spaces only one pack visits get tagged"), the current 11-template table with pack tags, and the three-layer visual-variety frame (template + interactables + palette/era-mood). The §4 generator-step list now references the new subsection. (6) **DevPanel unchanged** — the Force-layout dropdown still lists every template (`LAYOUT_TEMPLATES`, unfiltered) so any template can be previewed in any run. (7) **Engine surface kept minimal** — no JSON-per-pack refactor (templates stay in TS for v1; pack-JSON migration is the post-v1 architecture move that matches the interactables pattern). **No STATE_VERSION bump, no schema change to save data.** DecisionRoom is the only caller of `generateRoom`; it passes `profile.careerPack` for the active run. Authoring guardrails followed per the user's "no nit-picking jokes no one may ever see" directive: one-pass obstacle authoring, no preview generator, no per-template iteration loop. |
| v2.0.2  | 2026-05-13 | Corby Hoback · Claude Code | **Design-doc sync pass.** Doc had drifted from `main` after the Day-4 PRs (#61 SWE icon coverage, #62 preview generator + SWE text+icon previews, #63 SWE icon revisions ×30, #64 SWE+homeschool language pass, #65 homeschool tone pass, #69 pack-aware class labels + 20 modal icons + 9 sprite components). This revision is doc-only with one cosmetic code fix: (1) **§16 *Init Flow*** career listing rebuilt to match `src/game/content/careers.ts` — **5 shipped entries** (SWE ✅, Homeschool Parent ✅, Accounting 🔒, Nursing 🔒, Security / Police 🔒) instead of the aspirational 9-entry v2.0 roster; "only SWE selectable" line replaced with the two-playable reality. (2) **§26 *The expanded roster*** table similarly compressed from 9 rows to 5 rows; the 9-career aspiration kept as design intent in surrounding prose so the v2.0 thesis (life-stages-as-careers) doesn't get lost. (3) **§14 *Class System*** gains a new *Pack-aware class labels (v2.0.2)* subsection documenting the `Manifest.classLabels?: Partial<Record<ClassId, ClassLabel>>` override that ClassPicker + Hud both consume — homeschool overrides all 8 tiers (Homeschooler Newbie → The Oracle), SWE omits the field and falls through to `CLASSES.label`. Engine playability gates unchanged — still only Novice + Skilled selectable. (4) **§17 *Build Order*** Day 13c (polish bundle, shipped per v1.3.3) and Day 14 (title screen, `src/game/ui/TitleScreen.tsx` wired in `App.tsx`) flipped from ⏳ to ✅; Day 15 (analytics + Pages deploy) is now the only ⏳ row. (5) **§18 *Out of Scope*** "other careers — we just don't ship the JSON" softened — homeschool JSON ships; three packs (accounting / nursing / security-police) remain JSON-less. (6) **§26 *The Homeschool Parent pack*** sub-section content counts updated to current JSON state — **32 decisions** (was 30) and **39 events** (was 37) after the PR #65 tone pass added the snack-rebellion / Mr-Nobody / Research-allegedly / tablet decisions / church-stayed-open beats; **12 dedicated sprite tokens** (was 3) after PR #69 added 5 homeschool objects (`art-bin`, `kitchen-table`, `fridge-drawing`, `couch-blanket`, `coop-signup`) + 4 female parent NPCs (`parent-in-law`, `parent-spouse`, `parent-coop`, `parent-neighbor`); modal-icon coverage explicitly named at **20 of 71** real `hp-*` + `evt-hp-*` icons with 51 still `PlaceholderIcon` per [`docs/research/polish-loop-scope-creep.md`](research/polish-loop-scope-creep.md); the "Pack-specific sprite art for reused tokens" deferred-follow-up retired since PR #69 shipped it. (7) One cosmetic code edit in `src/game/ui/CareerPicker.tsx` — the subtitle string "Six paths in v1 — two playable" was off-by-one from the actual 5-entry roster; fixed to "Five paths in v1 — two playable" so the picker copy matches what it renders. Comment in `careers.ts` ("remaining four entries") similarly corrected to "remaining three." **No engine code change, no schema change, no STATE_VERSION bump.** This pass closes the design-doc-vs-`main` gap that opened across PRs #61–#69; future PRs should land their design-doc updates inline per the `feedback_update_design_doc_with_prs.md` memory rule. |
| v2.0.1  | 2026-05-13 | Corby Hoback · Claude Code | **Homeschool Parent pack Phase 2 shipped.** Second playable pack now full-scale: 30 decisions (5 Phase-1 + 25 Phase-2), 37 events (5 + 32), 12 interactables (0 + 12), 8-line cinematic intro replacing the Phase-1 placeholder, 16 monthTransitions (up from 7), 12 pack-scoped endgame taglines, and the pack's §26 section in the design doc filled in with arc, relabels, voice anchor, content counts, era distribution. Two additive engine changes: (1) **`EndgameScreen` now prefers `careers/{packId}/endgame-taglines.json`** when present, falling back to the universal pool — SWE pack unchanged, homeschool pack gets its bittersweet-register taglines. (2) **Three new sprite tokens** in `InteractableSprite.tsx`: `textbook-stack`, `kid-hazel`, `kid-bram` — all Treatment-A flat-color, palette-pure per §15. Other homeschool interactables route through existing tokens (whiteboard for kitchen-table-as-school, calendar for fridge-drawing, plant for sick-day-couch, etc.) — flagged for follow-up if visual mismatch reads wrong after playthroughs. Voice register matched the four Phase-1 anchor lines (bittersweet-contemplative-occasionally-dry, identity-sacrifice-community axis, parent's interior life). Kid-name interpolation deferred — no UI flow asks the player for kid names, "Hazel"/"Bram" stay hardcoded in copy. No STATE_VERSION bump (pure content + additive plumbing). |
| v2.0    | 2026-05-12 | Corby Hoback · Claude Code | **Multi-career architecture, formalized.** Engine has always loaded career-specific content from packs (§3), but the implicit assumption — never written down — was that every pack would use the SWE-shaped stat model from §7. v2.0 owns that the model is SWE-coded and gives packs two escape hatches: (1) **`manifest.statLabels`** — an optional `Record<StatKey, string>` letting a pack relabel the seven canonical stats in the HUD without touching engine code or decision JSON (e.g. Student pack relabels `technicalSkill` → "Grades", `savings` → "Money", `burnout` → "Stress"). (2) **Pack-additive `flags`** — packs may rely on `flags` fields that older saves don't have, defaulting gracefully (precedent: `meta.tutorialDismissed` in v1.3.3). New §26 *Career Packs: Beyond SWE* documents the relabel mechanism, the expanded 9-career roster, and the Student pack in detail (10-year 13→22 arc, post-HS fork at month ~66 as the structural centerpiece, the three new flags — `parentTrust`, `hasJob`, `postHSPath` — that gate its back-half decision pool). §26 also names what's deferred: a future pack-defined stat schema refactor (Option C in the design discussion), per-pack score formula, per-pack endgame framing copy, and per-pack arc length. §16 *Init Flow* career listing updated to match the new roster; "only SWE selectable in v1" line removed since v2.0 anticipates Student becoming playable. No engine code change required to ship this version of the doc — the `statLabels` plumbing is small (one HUD lookup + one optional manifest field), and the rest is content. No STATE_VERSION bump (Student's new flags are additive with graceful defaults). The honest framing in §26 — that `technicalSkill` is SWE-coded and the score formula in §21 references it by name — is the contribution that matters most; future packs will be built knowing where the joints are. |
| v1.6.1  | 2026-05-12 | Corby Hoback · Claude Code | Player-facing rename: the 42 minigame is now titled **"The Ultimate Question"** in the arcade menu and the replay card. Hides the punchline from the menu row so the answer reveals during play instead of being pre-spoiled. Internal `MinigameVariant` id stays `'forty-two'` (no schema churn). Blurb tightened to *"Life, the universe, everything. Four options."* No STATE_VERSION bump. |
| v1.6    | 2026-05-12 | Corby Hoback · Claude Code | Issue #41 — **"42"** (the Hitchhiker's Guide callback) added as the fifth minigame variant. Pure multiple-choice: one question, four options, one correct (`42`); the other three are plausible-but-wrong (`7`, `1138`, `∞`) with their own quiet references. Option order is shuffled per mount so the player can't memorise position. Binary outcome — `win` (picked 42 → `XP_MINIGAME_WIN`) or `fail` (anything else → `XP_MINIGAME_FAIL`); no `partial` bucket. Esc forfeits; arrow keys + `1-4` + Enter for selection. **Arcade-only** in v1 — no scheduled slot (per issue: "the reference lands harder when stumbled upon"). New `src/game/minigames/FortyTwo.tsx` (the smallest minigame in the codebase — no rAF loop, no physics, closer to `DecisionModal` than to `Stacker`). `MinigameVariant` widens to include `'forty-two'`; `progress.lastArcadeXpAt` gains `forty-two: number`. Added to `MinigameByVariant`, `ArcadeModal.ARCADE_VARIANTS`, and `MinigameReplayCard.VARIANT_LABELS`. **STATE_VERSION 1.5.0 → 1.6.0** (old saves discarded). §10 table grows to 5 rows. |
| v1.5    | 2026-05-12 | Corby Hoback · Claude Code | Issue #32 — **Pong** added as the fourth minigame variant. New `src/game/minigames/Pong.tsx` — single-player vs. AI paddle, ↑↓ / W-S keyboard, first-to-5. AI tracks the ball with a capped speed (`AI_MAX_SPEED = 360 v.u./sec`) and an anti-jitter deadzone; ball speed creeps `× 1.04` per paddle hit, capped at 720, with off-centre hits adding angle ("spin"). Win/partial/fail mapping per acceptance: `5-0…5-2` wins → `win`; `5-3 / 5-4 / 4-5` → `partial`; `5-0…5-2` losses → `fail`. XP only (no stat side-effects — "purest XP" minigame per #32). Scheduled at month 75 (Mar 2026, ai-shift era) in SWE pack and listed in the arcade variant menu. `MinigameVariant` union widens to include `'pong'`; `progress.lastArcadeXpAt` gains a `pong: number` key. `MinigameReplayCard` `VARIANT_LABELS` updated. **STATE_VERSION 1.4.0 → 1.5.0** (old saves discarded on load). §10 table gains a Pong row; v1 slot list updated (32 / 60 / 75 / 90). |
| v1.4    | 2026-05-12 | Corby Hoback · Claude Code | Issue #31 — **arcade cabinet (universal interactable).** New `feature?: 'arcade'` field on `InteractableDef` (§23). Universal interactables live at `public/universal/interactables.json` and are merged into every pack's interactable pool by the loader (pack-specific wins on id collision). New `obj-arcade-game` entry (`art: 'arcade-game'`, `weight: 0.4`) — the cabinet renders as an upright sprite with screen, joystick, and two buttons. `[E] play` opens **`ArcadeModal`** (`src/game/ui/ArcadeModal.tsx`) — a menu of every minigame variant in the closed `MinigameVariant` union with per-variant **READY / Cooling down · Nm** status. Picking a game renders `MinigameByVariant` inline (new shared component at `src/game/minigames/MinigameByVariant.tsx`, also used by `MinigameRoom`); on Continue the modal returns to the menu so plays chain. **Throttle:** all rewards (XP + stat effects) are gated to once per real-time hour per variant — throttled plays still run for fun but dispatch nothing. New state `progress.lastArcadeXpAt: Record<MinigameVariant, number>` + `setLastArcadeXpAt` reducer. Arcade plays are **not** recorded to `history.minigames` — the replay timeline (§11.1) is for scheduled-month plays only. Minigames gain `mode: 'scheduled' \| 'arcade'` + `awardRewards` props; `MinigameRoom` always passes `mode='scheduled'`. New §10.1 *Arcade access* documents the cabinet; §23 documents the `feature` flag + universal-interactables layer. **STATE_VERSION 1.3.0 → 1.4.0.** |
| v1.3.4  | 2026-05-12 | Corby Hoback · Claude Code | **Finale month (December 2029) + polish bundle.** (1) **Finale layout.** Month 120 gets a special two-door layout on the right edge — a top "locked" door (examinable interactable, [E] try → opens `NPCModal` with the synthetic `LOCKED_DOOR_INTERACTABLE` containing *"This one is locked! You don't seem to have the key... oh well."*) and a bottom forward door that routes to a hardcoded `FINALE_DECISION`. The "Something about a key" foreshadowing from the rewind status pool (§11.1) pays off here. (2) **Finale decision.** Prompt: *"Ten years. Did any of that stick?"* Three deadpan options + flavors, each in a distinct rhetorical register: *"Bits did. Most didn't."* → *"Sounds about right."*; *"Not really. I'll leave it here."* → *"Fair. The door's right there."*; *"Hard to say. It mostly felt like a Tuesday."* → *"Tuesdays do most of the work."* (the Tuesday echo lifts the *"Same coffee stain"* banality motif from §11.1). Empty effects across all options — the run's score is computed before this pick lands. (3) **Finale flavor phase.** `DecisionModal` gains a `finale?: boolean` prop. When true, the flavor phase swaps the generic *"YOU CHOSE"* + icon-left layout for a centered *"Well, then."* / chosen-line / italic-flavor / **"End"** button beat. (4) **New sprite token** `locked-door` in `InteractableSprite.tsx` — padlock with shackle + body + keyhole. (5) **DevPanel** *"endgame: trigger"* button becomes a **`trigger ▼`** dropdown with three options: `endgame` (dispatch `setGameOver(true)`), `tutorial` (new `resetTutorial` action flips `meta.tutorialDismissed` back to false so the next DecisionRoom re-shows the coachmark), `finale month` (`setCurrentMonth(120)`). (6) **Tutorial overlay repositioned.** Was viewport-anchored (pushed off the canvas on widescreens, hovered above the status bar instead of next to it). Now `position: absolute` inside the DecisionRoom container (which is `width: var(--canvas-display-width); position: relative`), so the bubble anchors to the canvas frame. Per-step paddings hand-tuned: top-center for the status-bar tip, dead-center for the objects/people tip, middle-right for the door tip. No state-shape change, no STATE_VERSION bump. |
| v1.3.3  | 2026-05-12 | Corby Hoback · Claude Code | **Day 13c polish bundle + first-run tutorial.** (1) **a11y pass:** `NPCModal` gets a focus trap, focus restore, `aria-modal="true"`, and a real `aria-label` derived from `labelFor(interactable)`; `EffectChips` chips get per-chip `aria-label` like "Burnout +5" (composed via local `STAT_NAMES_FOR_AT` map) with visual children explicitly hidden from AT; `CareerPicker` / `ClassPicker` options containers get `role="group"` + `aria-label`; `NameEntry` counter gets `aria-live="polite" aria-atomic`. New `@media (prefers-reduced-motion: reduce)` block in `global.css` collapses every keyframe + transition to 1ms (not `none` — `animationend` handlers in ScenePlayer would otherwise stall). (2) **Era mood tuning** in `public/careers/software-engineering/manifest.json`: pandemic pushed harder (saturation 0.7 → 0.55, hueShift -8 → -14 — drained-of-warmth feel without blowing out highlights); ai-shift pushed harder (saturation 1.05 → 1.18, lightness 1.0 → 1.02, hueShift +4 → +10 — sharper "rendered" vibe). Rebound and uncertain-future unchanged. (3) **Cross-viewport review:** code audit at 1024 / 1440 / narrow-laptop widths; the `--canvas-display-width` `min()` formula scales cleanly, modals use `min(WxPx, NN%)`, flex containers have `minWidth: 0` where needed. No code changes — flagged as reviewed. Known borderline: `palette.positive` contrast vs background measures 3.15-3.35:1 across eras (passes WCAG AA for large text/UI 3.0, below 4.5 for normal text). Held for future palette tuning decision rather than landed in this bundle. (4) **First-run tutorial.** New `meta.tutorialDismissed` flag (graceful default for older saves — no STATE_VERSION bump) + `dismissTutorial` reducer. `TutorialOverlay` renders a 3-step coachmark bubble (status bar / interactables / door) on the player's first DecisionRoom; Space/Enter/→ advance, ← back, Esc skip. Gameplay is paused via `tutorialActive` (player movement + E-key + door entry all gated). Dismissal dispatches `dismissTutorial` and immediately persists so the flag survives a reload. Resets on Begin Again via `resetMeta`. Replay mode never shows the tutorial. (5) **Begin-again confirmation** in `CreditsScreen` retuned: font-size 16 → 15px, line-height 1.5 → 1 for tighter visual weight on the destructive-action line. |
| v1.3.2  | 2026-05-12 | Corby Hoback · Claude Code | Issue #26 — **endgame timeline readability**. EndgameScreen keeps its 1000×600 canvas frame (consistency with the rest of the app — no out-of-game scroll). Stats + score panels sit inline below the header; the **Career timeline** moves to a dedicated full-canvas view (`CareerTimelineScreen` — ↑↓/PgUp/PgDn/Home/End scroll, Close button, Enter/Space/Esc close) reached via a third recap action button. Three-action recap keyboard nav with wrap-around: **Career Timeline** · **Credits** · **Begin again**. Date column in the timeline widened to 124px with `whiteSpace: nowrap` — `February 2021` no longer wraps inside an 80px column (root cause of the visual collision with option text). §21 rewritten. |
| v1.3.1  | 2026-05-12 | Corby Hoback · Claude Code | Issue #30 — **room-transition vibe**. New §4.1 *Room transition* documents both transition beats (door-entry and end-of-room) and their choreography. **End-of-room:** new state `progress.monthAdvanceCueNonce` + `cueMonthAdvance` reducer; `useRoomTransition.exitRoom` dispatches the cue *before* flipping the fade flag; HUD listens to the cue nonce, emits the `+1 mo` floater at fade-start (was after-fade), and dedups the would-be duplicate emit from the subsequent `completeMonth` advance via a suppression ref; `POST_EFFECT_PAUSE_MS` trimmed from 1400 → 900ms in `DecisionRoom`. **Door-entry:** `MODAL_POP_DELAY_MS` bumped 300 → 500ms in `DecisionRoom` (was racing `DOOR_FADE_MS = 300` and reading as fade-interrupted); new `decision-modal-pop` + `decision-modal-dialog-pop` keyframes in `global.css` so DecisionModal and EventModal ease in deliberately, matched-family with `npc-modal-pop`. No STATE_VERSION bump (additive field, ephemeral by use, safe across reloads — ref-init pattern in the HUD swallows mount-time effects). |
| v1.3    | 2026-05-12 | Corby Hoback · Claude Code | Issue #33 — **backward replay**. New §11.1 *Backward replay* describes the rewind-door mechanic: walk-back-one-month read-only exploration, multi-step chaining, era-mood follows the viewed month, decisions/events locked, NPC/object dialogues play with effects suppressed, minigame months show a frozen result from `history.minigames`, consequence rooms skipped via `previousReplayableMonth()`. New state: `progress.viewingMonth: number \| null` + `enterReplay` / `exitReplay` reducers; `history.minigames: MinigameRecord[]` + `recordMinigame` reducer dispatched at the end of each minigame's `handleContinue`. **STATE_VERSION 1.2.0 → 1.3.0** (§12). HUD telegraphs replay mode (opacity drops to 0.7, month label prefixes with `←`). New file: `src/game/rooms/MinigameReplayCard.tsx`. **§8 / §9** also gain a *Modal icons (v1.3+)* subsection (PR #39): registry pattern (`src/game/ui/icons/modalIcons.tsx`) maps decision/event `id` → palette-aware SVG component with a `PlaceholderIcon` fallback. DecisionModal renders the icon inline next to the prompt (options phase) and chosen-option label (flavor phase); EventModal renders it top-centered above the title. Initial entries: `univ-stay-late-vs-log-off`, `univ-standup-too-long`, `evt-era-pandemic-furlough-friend` — all placeholders for now. |
| v1.2    | 2026-05-12 | Corby Hoback · Claude Code | New §16.0 **Title Screen** as the first thing on app mount — wordmark, tagline, ambient NPC autoplay, "Press any key to start." Pixel-font scope expanded from NPC-modal-only to also include the title wordmark (§15) — display size sidesteps the legibility constraint that ruled it out of body UI. New §24 **Analytics & Tracking** (GoatCounter, virtual pageviews, no PII, no cookies, no consent banner). New §25 **Future: Public Scoreboard** — deferred-but-specced graffiti board (CF Workers + D1, anon writes, no replay verification); §18 updated to point to it. **§1 Premise** gains an **Inspirations** list (Zelda/Final Fantasy/Pokémon, Kentucky Route Zero, Oregon Trail, Monopoly, Another World, Hitchhikers Guide, Ready Player One, the pandemic) — names the tonal anchors that were previously implicit. **§8 / §9** gain a *Selection: history-aware de-dup* subsection documenting the two-tier filter shipped in PR #35 (no same scenario back-to-back, prefer unseen across the run; 5-month window for decisions, 3-month for events). **§23 Interactables** gains an optional `label` field on `InteractableDef` (shown under the sprite as a name caption per #27) — additive, no schema break. **§23 NPCModal** gains a *Speaker header + icon (v1.2)* subsection per #28: kind-aware header above the prompt (`"Intern says…"` / `"Plant."`) plus a full-opacity sprite icon on the left as a fixed-width column. Shared `labelFor` / `speakerHeaderFor` helpers extracted to `src/game/content/interactableLabel.ts`. Day 14 (title screen) and Day 15 (analytics + GitHub Pages deploy) added to the build order (§17). New file entries in §19. No state-shape change (no STATE_VERSION bump). |
| v1.1    | 2026-05-11 | Corby Hoback · Claude Code | Build-time deltas through Day 13a: **E** key for NPC/object interaction (§11); `progress.gameOver` state field + STATE_VERSION 1.2.0 (§6, §12); Pixelify Sans scoped to NPC modal as SNES homage (§15); Stacker mechanic for Reaction Sprint (§10); keyboard parity across init flow pickers (§16); build order updated (§17); project structure expanded (§19); spouse-name list resolved (§20). New sections: §21 Endgame & Recap, §22 Credits System, §23 Interactables. |
| v1.0    | 2026-05-10 | Corby Hoback              | Initial design — premise, architecture, room types, state model, decision/event schemas, modal presentation (§8b), mini-games, controls, save/load, identity, classes, visual style, init flow, build order, scope, project structure, open questions. |

---

## 1. Premise

A narrative life-simulation game in which the player navigates 10 years (2020–2030) of a software engineering career, one month at a time. Each month is a "room" the player walks through, encountering decisions that compound into a unique life trajectory. Random events, era-flavored crises, and the player's own choices shape who they become by 2030.

**Tagline:** *A career of choices.*

**Style:** A choose-your-own-adventure where every decision you make impacts the outcome

**Tone:** Bittersweet, contemplative, occasionally playful. Life happens. You make the best of it.

**Length:** 45–90 minutes per playthrough. Replayable.

**Visual register:** Muted, contemplative, sparse, color-led — the *emotional* register of Kentucky Route Zero, achieved through flat-color SVG, not 3D rendering.

**Inspirations:**

- **The Legend of Zelda / Final Fantasy / Pokémon** (NES + SNES + Game Boy era) — the core gameplay grammar. Top-down room-by-room exploration, walk into a doorway to transition, approach an NPC or object and press a key to interact, dialog boxes that fill the bottom of the screen. Zelda leads the trio (the room/door pattern is the most direct lineage); Final Fantasy and Pokémon land for the dialog-box presentation specifically (§8b cites all three).
- **Kentucky Route Zero** — visual register: flat color, generous negative space, stillness as style. The mood we're chasing.
- **Oregon Trail** — the event-roll pattern. Mostly minor, occasionally significant, rarely catastrophic. "You have dysentery" energy, applied to a career.
- **Monopoly** — the random-card flavor. "Bank error in your favor" / "Advance to Boardwalk." Most events are minor jolts that color the month, not engine-breakers. §9 calls this out directly ("Oregon Trail meets Monopoly").
- **Another World / Out of This World** — flat-color cinematic minimalism done with intent. Whole worlds built from a tiny palette.
- **The Hitchhikers Guide to the Galaxy** — the comedic register. Dry, occasionally absurd, willing to undercut its own seriousness. Permission to be funny inside a contemplative game.
- **Ready Player One** — the texture of player agency in a sandbox of references. Less the plot, more the *"every object might have a story"* feel.
- **The pandemic** — the anchor for January 2020. Not as a topic to dramatize, but as the shared moment the player and the game both remember.

---

## 2. The Player's Loop

For each of 70 monthIds (10 cinematic Januaries + 60 playable months across 2020–2029, per §4 *Half-length playthrough*), the player:

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
  months.json             ← 70 month entries with seed + theme (per §4 half-length playthrough)
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

### Half-length playthrough (v2.0.8)

Each calendar year has **7 monthId slots** — 1 cinematic January
(`roomType: 'narrative'`) + 6 playable months (Feb / Apr / Jun / Aug /
Oct / Dec). Over 2020–2029 that's **70 entries** in `months.json` (was
120). The slot mapping lives in `src/game/calendar.ts`:

```ts
SLOT_TO_MONTH_NUM = [1, 2, 4, 6, 8, 10, 12]   // 7 slots per year
// monthId → year/month:
//   year       = 2020 + Math.floor((monthId - 1) / 7)
//   calendarMo = SLOT_TO_MONTH_NUM[(monthId - 1) % 7]
```

Most forward room exits advance **+2 calendar months** (Feb→Apr,
Apr→Jun, etc.). Two slots per year advance +1: Dec→Jan (next year's
cinematic) and Jan→Feb. The HUD month-change floater uses the helper
`calendarMonthDelta(fromId, toId)` so it shows the **actual calendar
delta** (typically `+2 mo` / `−2 mo`, with `+1 mo` / `−1 mo` only across
the Jan↔Feb and Dec↔Jan boundaries) — not the slot-id delta. The
fade-start cue handshake (§4.1) still dedups in slot units since
`completeMonth` always advances exactly 1 slot.

The rewind door (§11.1) walks back through the same slot table.
`previousReplayableMonth` scans `id - 1, id - 2, ...` until it finds a
non-`consequence` entry, so April's left/back door naturally lands on
February, June's on April, and Feb 2021's on Jan 2021 (the cinematic).
Feb 2020 (id 2) has no rewind target — the loop's `id >= 2` guard
returns null, matching the existing first-month UX.

Finale is monthId **70** (was 120). The synthetic finale decision was
also renamed `finale-month-120` → `finale-month` so the id doesn't
encode a stale magic number.

### Complexity tiers (v2.0.9)

Every layout template declares a `complexity` tier:

| Tier | Behavior | Stat impact |
|---|---|---|
| `simple` | Static obstacles only — walk around to reach the door. Everything in v1 today. | None beyond standard collision-walk. |
| `easy` | Unmovable wall patterns / mazes. Navigation-only challenge. The current `maze` template is the closest reference. | None beyond collision. |
| `medium` | One or two random shapes oscillating vertically in front of the player. Wait for a gap, then advance. Like `maze` but with the gap moving slowly. | Collision triggers a two-phase 1-sec input lock: 200 ms smooth westward slide + 800 ms frozen stun. Per-obstacle dedupe so cascading hits from a *different* obstacle in the slide path push further west (player can be shoved all the way to the left wall via a chain). Direction keys held through the lock stay ignored until physically released. Each hit costs health; passing the per-room hit threshold also adds burnout. Untouched traversal earns bonus XP. Visual feedback: 3× HUD-sized in-canvas "−N" floater at the impact point + 3 twinkling stars above the player for the full lock window. |
| `hard` | Faster moving obstacles + a "paddle" thin rectangle moving up/down in front of the door (pong-style timed gate). Advance when it slides clear. | Same as medium, faster timing windows. |
| `expert` | Medium/hard, plus a slow-moving block tracing a deterministic diagonal/zigzag path across the room that knocks the player back on contact (no pong-style randomness — natural safe zones exist). | Same as hard. May iterate after playtest to remove bad behavior. |

Tier picks come from `YEAR_TO_COMPLEXITY_MIX` in `layouts.ts`:

| Year | Mix |
|---|---|
| 2020 | 100% simple |
| 2021 | 75% simple / 25% easy |
| 2022 | 50% simple / 50% easy |
| 2023 | 50% easy / 50% medium |
| 2024 | 50% easy / 50% medium |
| 2025 | 50% easy / 50% medium |
| 2026 | 20% easy / 80% medium |
| 2027 | 50% medium / 50% hard |
| 2028 | 20% medium / 80% hard |
| 2029 | 50% hard / 50% expert |

**Fallback chain.** If a year picks a tier that has no authored templates
yet, `eligibleTemplates(packId, complexity)` walks DOWN the difficulty
ladder (expert → hard → medium → easy → simple) until it finds a match.
As of v2.0.18 the **simple**, **easy**, and **medium** pools are populated
(11 + 3 + 2 templates respectively); hard / expert rolls fall through to
medium until their authored templates land in PR5/PR6. So 2023–2026 rooms
now genuinely include moving-obstacle hazard rooms at the year-mix
weights, and 2027+ years still resolve to medium until hard ships.

**NPC + interactable placement** in harder tiers follows two rules per
the original spec:
- For `simple` / `easy` / `medium`, NPCs and objects can sit anywhere
  navigable (the moving walls in medium are predictable; NPCs avoid
  spaces that would clip into a moving boundary).
- For `hard` / `expert`, the left half of the room hosts NPCs / objects;
  the right half hosts the movement challenge. NPCs stay clear of the
  pong-paddle's swept area and the deterministic block's path.

The placer in `src/game/rooms/generator/placeInteractables.ts` will gain
tier-aware zone rules in the follow-up PRs; v2.0.9 doesn't change
placement since no harder tiers ship yet.

### Generator

Rooms are **deterministically generated** from a seed. The seed is:

```
hash(careerPack, entryClass, monthId, gameStateHash)
```

Where `gameStateHash` includes only the *macro* state that should affect room shape: current XP tier, active flags (in-relationship?, has-kids?, in-grad-school?), broad stat tiers (burnout: low/med/high). Raw stat numbers are *not* in the hash, so small fluctuations don't regenerate the room.

**Same seed → same room.** A player who restarts mid-game sees the same Jan 2024 they saw before. But two players (or two playthroughs) with different paths see different Jan 2024s.

The generator uses the seed to:
1. Pick a **layout template** from the active pack's eligible pool (see *Layout templates* below).
2. Place the decision trigger.
3. Pick interactables from the career pack, weighted by month theme.
4. Optionally place stat-modifier objects and hazards.
5. Place exits.

Generation runs once per room entry; output is rendered.

### Layout templates (v2.0.3)

Templates live in `src/game/rooms/generator/layouts.ts` as a flat
`LAYOUT_TEMPLATES` array. Each entry declares a `spawn` point, an
`obstacles: Rect[]` pattern, a `door` rect, and an optional `packs?: readonly string[]`
filter:

```ts
interface LayoutTemplate {
  id: string;
  label: string;
  spawn: Vector2;
  obstacles: Rect[];
  door: Rect;
  packs?: readonly string[];  // undefined = universal
}
```

**Pack filtering.** `generateRoom(seed, packId, forced?)` calls
`eligibleTemplates(packId)`, which keeps entries where
`packs === undefined` (universal) **or** `packs.includes(packId)`
(pack-specific). The active pack is `profile.careerPack`. A
`forcedTemplateId` from the DevPanel bypasses the filter — devs may want
to preview a homeschool-only template inside an SWE run.

**Spirit: spaces both packs visit are universal; spaces only one pack
visits get tagged.** SWE-ers spend time in offices, but also go to
parks, grocery stores, kitchens, libraries, and churches. Homeschool
parents don't typically walk into a cubicle farm. The tag is for
*exclusion of the obviously-wrong*, not for fine-grained per-pack
curation — most templates are universal.

**Current pool (16 templates — 11 simple + 3 easy + 2 medium as of v2.0.18):**

| Template id | Label | Pack filter | Tier | Notes |
|---|---|---|---|---|
| `open-office` | Open office | `software-engineering` | simple | 1 mid-canvas blob (smallest template) |
| `shared-desks` | Shared desks | `software-engineering` | simple | Desk + 2 shelves + table |
| `cubicles` | Cubicles | `software-engineering` | simple | 4 small blocks in 2×2 grid |
| `classroom` | Classroom | `homeschool-parent` | simple | 4 student desks + teacher's desk |
| `library` | Library | universal | simple | Long shelves top + bottom |
| `divided` | Divided | universal | simple | Center wall with gap |
| `park` | Park | universal | simple | Bench + tree-blob, asymmetric |
| `grocery-store` | Grocery store | universal | simple | 3 vertical aisles, gaps mid-aisle |
| `kitchen` | Kitchen | universal | simple | Top counter + right counter + center island |
| `living-room` | Living room | universal | simple | Couch + coffee table + TV stand |
| `church` | Church | universal | simple | 2 rows of 3 pews + 2 plants |
| `maze` | Maze | universal | easy | 4-wall zigzag (center → top → bottom → center gaps); promoted simple → easy in v2.0.17 |
| `s-curve` | S-curve | universal | easy | 2 offset vertical walls; player snakes UP → over → DOWN → over → up to door (3 direction changes, lower cognitive load than maze) |
| `switchback` | Switchback | universal | easy | 2-wall maze-lite with 200-px gaps; reads as a corridor twist rather than a zigzag puzzle |
| `pendulum` | Pendulum | universal | medium | Single 60×100 block at canvas center, oscillates y=70..430 (amplitude 180, period 2.4 s); pure timing puzzle, no static walls |
| `shutters` | Shutters | universal | medium | Two oscillating blocks at x=350 / x=650, π-phase-offset (one up while the other is down); player weaves between them |

**Pool sizes per pack (v2.0.18):**
- SWE simple = 10 (universal 7 + swe 3); SWE easy = 3 (universal); SWE medium = 2 (universal); SWE total eligible = 15.
- Homeschool simple = 8 (universal 7 + homeschool 1); Homeschool easy = 3 (universal); Homeschool medium = 2 (universal); Homeschool total eligible = 13.

In 2020 (100% simple) SWE picks from 10 / Homeschool from 8. From 2021 onwards the easy pool engages at the v2.0.9 mix weights. From 2023 onwards medium rolls actually pull the new oscillating templates rather than falling through to easy.

**Moving obstacles** — declared via the optional `movingObstacles?: MovingObstacle[]` field on a template (currently used only by medium-tier templates). Each obstacle has a `baseRect` (rest position), `amplitude` (px), `period` (ms), `phase` (rad). Detected separately from static `obstacles` — the player can walk through but takes a knockback (50 px west) + health hit (-2) + adds burnout (+5 once the per-room hit counter reaches 4). A clean traversal (zero hits on door entry) of a room that had any moving obstacles awards `XP_TIER_BONUS_UNTOUCHED` (+100 XP). All side-effects suppressed in replay mode. Tuning lives as named constants at the top of `DecisionRoom.tsx` — revisit after playtest.

**Visual variety comes from three layers**, not template count alone:
the obstacle pattern (this section), the interactables placed on top
(pack-aware via `interactables.json`), and the palette / era-mood
(pack-aware via `manifest.palette` + per-era mood transforms). A "park"
template + homeschool palette + a `parent-neighbor` NPC reads as a
*homeschool* park; the same template + SWE palette + a `person-pm` NPC
reads as a *coworker-met-at-the-park* park.

**Door accessibility lint.** `populate.ts` includes a dev-mode
`assertDoorAccessible` check that warns if any obstacle intersects the
door rect — catches the "obstacle placed on top of the door" authoring
mistake. Full spawn → door pathfinding is deferred until templates gain
seeded within-template variation; the current obstacle sets are
hand-tuned to leave clear corridors.

**DevPanel.** The Force layout dropdown lists every template
(`LAYOUT_TEMPLATES`, unfiltered) — overrides the pack filter at pick
time. Useful for previewing pack-specific templates in any run.

### 4.1 Room transition (v1.3+)

Two distinct transition beats — both choreographed to read as one event each, with #30 doing the tuning pass:

**Door entry → DecisionModal (start-of-room).** Player walks into the door rect:
1. `committed = true` flips → canvas opacity transitions to 0 over `DOOR_FADE_MS = 300ms`.
2. ~200ms of settled-dark beat (the gap between `DOOR_FADE_MS` and `MODAL_POP_DELAY_MS`).
3. `MODAL_POP_DELAY_MS = 500ms` after door entry, `setActiveDecision` fires → DecisionModal renders.
4. Modal backdrop + dialog ease in over ~240ms via `decision-modal-pop` / `decision-modal-dialog-pop` keyframes (matched family with `npc-modal-pop`).

Pre-#30 these were `DOOR_FADE_MS = MODAL_POP_DELAY_MS = 300`, which raced — the modal snap-appeared during the canvas fade's final frames and read as the fade being interrupted. The dark beat + intentional modal entrance fixes that. EventModal uses the same entrance animation for consistency.

**Decision continue → next-room fade (end-of-room).** The post-Continue beat is choreographed across four signals that must read as **one event** ("a month passed"), not four sequential events. The current sequence — also tuned in issue #30:

1. **Player commits** the decision (or finishes an event/narrative/minigame). Effects dispatch; stat chips animate (~900ms HUD pop).
2. **Status bar swaps** to a "time passes" line from `manifest.monthTransitions` (or `"N months pass."` for multi-month events).
3. **POST_EFFECT_PAUSE_MS = 900ms** pause so the message + stat-pop have a beat to read. (Was 1400ms pre-#30 — felt ceremonial because the message lingered well past the HUD pop.)
4. **Room fade starts.** `useRoomTransition.exitRoom` dispatches `cueMonthAdvance` *before* flipping the fade flag. The HUD listens for the cue nonce and emits the `+1 mo` floater **at fade-start**, so the player sees cause-and-effect ("a month passed, so the world dimmed") instead of empty-canvas-then-explanation.
5. **FADE_MS = 220ms** opacity drop on the RoomRenderer wrapper.
6. **`completeMonth` dispatch** advances `progress.currentMonth`. The HUD's natural `currentMonth.id` effect would emit a duplicate `+1 mo` here — `suppressNextCompleteEmitRef` guard swallows it.
7. **New room mounts** (RoomRenderer keyed on `config.monthId`).

**Multi-month jumps** (`event.advanceMonths > 1`) skip the cue path. They emit the floater naturally via the `currentMonth.id` effect when `skipMonths` dispatches mid-pause — the cue still fires at fade-start for the final +1, producing two emits (`+N mo` then `+1 mo`) which together describe the full advance.

**Replay-door paths** (forward / rewind) don't go through `exitRoom`; they dispatch `enterReplay` / `exitReplay` directly and don't emit floaters (the replay HUD-dim is the signal instead).

Premium alternative (deferred): a true crossfade — render outgoing + incoming rooms briefly together — would eliminate the empty moment entirely. Not pursued in v1; the cue + tightened pause was the cheap fix that landed.

---

## 5. Room Types

| Type             | Purpose                                                  | Approx. count |
|------------------|----------------------------------------------------------|---------------|
| `DecisionRoom`   | Default — walk + decision + exit                         | ~60 of 70     |
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
- `progress.gameOver` (added Day 12) — flips true on `completeMonth(70)` (LAST_MONTH_ID, was 120 pre-v2.0.8). Drives
  `App.tsx` routing between `<RoomRenderer>` and `<EndgameScreen>` (§21).
- `history.events` (always present; spelled out in v1.1 — was implicit in v1.0).

**v1.4 additions (issue #31):**
- `progress.lastArcadeXpAt: Record<MinigameVariant, number>` — per-variant
  epoch ms of the last arcade play that awarded XP. Throttles arcade-mode
  rewards to once per real-time hour per minigame. `0` means "never
  awarded yet (ready)." Scheduled minigame slots (months 32 / 60 / 90)
  don't touch this — only arcade plays write it.
- STATE_VERSION bumped to 1.4.0.

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

### Selection: history-aware de-dup (v1.2)

`selectDecision` filters the eligible pool through two tiers before the
weighted random pick:

1. **Recent window (hard).** Exclude any decision whose `id` appears in
   `history.decisions` for monthIds within `currentMonth - 5`. Same
   scenario can't appear in two consecutive months and won't appear
   anywhere inside a 5-month rolling window.
2. **Prefer unseen (soft).** Among what survives the recent window,
   prefer decisions never seen in this run. If none are unseen, fall
   back to the not-recent set.

Fallback chain: `neverSeen → notRecent → eligible`. The selector never
returns null due to filtering; only if no decisions pass `requires` at
all. With current SWE content (34 decisions vs 60 playable months under v2.0.8) the fallback
degrades gracefully — adding content automatically reduces repetition
without code changes. Configured by `RECENT_WINDOW_MONTHS` in
`src/game/content/selectDecision.ts`.

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

### Modal icons (v1.3+)

Each decision can ship a small palette-aware SVG icon, rendered top-right of
the DecisionModal during the options and flavor phases (hidden during the
scene phase so it doesn't fight `ScenePlayer` for attention). The icon gives
each scenario a recognizable visual hook — a rocket for the late-night launch
decision, a meeting glyph for the long-standup decision, etc.

Implementation: `src/game/ui/icons/modalIcons.tsx` exposes a tiny registry:

```
DECISION_ICONS: Record<decisionId, ModalIconComponent>
getDecisionIcon(id) → registered component | PlaceholderIcon
```

Each `ModalIconComponent` takes `{ palette, size? }` and returns SVG markup
keyed to the active career-pack palette (so the icon re-tints under era-mood
HSL shifts alongside the rest of the modal). Unregistered ids fall back to a
bounded `PlaceholderIcon` square — `palette.surface` fill, `palette.ink`
border, ~80×80 with a muted `?` glyph. **No content change is needed to add
an icon** — registering an id in the map is the entire integration.

Real SVG art is authored incrementally; the registry is the seam. The v1.3
ship registers a placeholder for `univ-stay-late-vs-log-off` (future: rocket /
launch night) and `univ-standup-too-long` (future: meeting). Identifiability:
the SVG wrapper carries `data-region="modal-icon"`; the slot in the dialog
carries `data-region="modal-icon-slot"` and `data-icon-id={decisionId}`.

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

### Selection: history-aware de-dup (v1.2)

Same two-tier filter as §8, applied to events with a tighter window:
`RECENT_WINDOW_MONTHS = 3` (events fire more often than decisions, so a
5-month window would starve the pool fast at current content volume).

1. **Recent window (hard).** Exclude any event whose `id` appears in
   `history.events` for monthIds within `currentMonth - 3`.
2. **Prefer unseen (soft).** Among what survives, prefer never-seen
   events. Fallback chain: `neverSeen → notRecent → eligible`.

Dev-mode `findEventById` (used by the DevPanel's force-event dropdown)
deliberately **bypasses the filter** — forcing a specific event should
work regardless of history. Configured by `RECENT_WINDOW_MONTHS` in
`src/game/content/rollEvents.ts`.

### Era event guidelines

- **Real macro-trends, no proper nouns.** "A pandemic shutters offices" ✅. "OpenAI launches ChatGPT" ❌.
- **2026–2030 predictions stay vague and trend-based.** Generative AI displacement, economic correction, etc.
- **Era flavoring is content; the engine is era-agnostic.** Era is just a tag on event JSON files.

### Modal icons (v1.3+)

Same registry pattern as §8 (Decision modal icons), keyed by event `id` and
rendered **top-centered above the title** in the EventModal — the icon stays
visible across the scene → body phase transition so the event has a single
consistent visual anchor while the text reveals.

`src/game/ui/icons/modalIcons.tsx` exports:

```
EVENT_ICONS: Record<eventId, ModalIconComponent>
getEventIcon(id) → registered component | PlaceholderIcon
```

Unregistered event ids fall back to the shared bounded `PlaceholderIcon` (no
crash on missing). The v1.3 ship registers a placeholder for
`evt-era-pandemic-furlough-friend` (future: phone — a friend calls). Real
SVGs swap in one event at a time; the modal layout is fixed.

---

## 10. Mini-Games (5 in v1)

| Mini-game           | Mechanic    | Triggered by                                  |
|---------------------|-------------|-----------------------------------------------|
| **Blackjack**       | Chance — hit/stand only, dealer plays to 17, $200 stake | Vegas / gambling decisions |
| **Code Review**     | Skill — one hand-authored snippet, find the bug from 4 options | Senior-tier work decisions |
| **Reaction Sprint** (Stacker) | Timing — block slides L↔R; **SPACE** locks; land inside the highlighted column. 5 blocks visible from start, bottom-up activation. **Starting side alternates** L→R→L→R→L per block (even-indexed from left, odd-indexed from right) and **speed alternates** between moderate / fast bands (480 / 620 / 520 / 680 / 560 v.u./sec) so the player can't lock a single rhythm — every other block ramps harder than its neighbors | High-pressure deadline decisions |
| **Pong** (v1.5) | Reflex — ↑↓ / W-S paddle vs. AI paddle, ball bounces between, off-centre hits add spin, first to 5 points wins | Arcade-only by default; one scheduled slot at month 75 |
| **The Ultimate Question** (v1.6) | Multiple-choice — one question (*"What is the answer to the ultimate question of life, the universe, and everything?"*), four options, order shuffled per mount, binary right/wrong (`42` is correct) | Arcade-only — no scheduled slot |

**v1.1 note:** Reaction Sprint shipped as the "Stacker" mechanic (Day 11). The
original "twitch" framing was reshaped to a keyboard-driven timing game — see
`src/game/minigames/Stacker.tsx`. Win threshold: 4-5 stacks. Partial: 2-3.
Fail: 0-1.

**v2.0.6 variation tuning.** The original Stacker had every block start on
the left moving right at `BASE_SPEED + idx * 40` (monotonic ramp:
480/520/560/600/640 v.u./sec). The pattern was too learnable — a single
locked-in rhythm carried all five blocks. v2.0.6 introduces two
alternations:

- **Starting side** flips per block. Even indices (0, 2, 4) start on the
  left (`BLOCK_MIN_X`, direction +1); odd indices (1, 3) start on the
  right (`BLOCK_MAX_X`, direction -1). Helpers `startingXForBlock(i)` and
  `startingDirForBlock(i)` in `Stacker.tsx` own the mapping.
- **Per-block speeds** declared as a literal `BLOCK_SPEEDS = [480, 620, 520, 680, 560]`
  tuple — alternates moderate / fast / moderate / fast / moderate
  bands. Replaces the old `BASE_SPEED + idx * SPEED_INCREMENT` formula.
  The player can't pre-load a rhythm; every block is a fresh recalibration.

Win/partial/fail thresholds unchanged.

**v1 slot placements:** month 32 (Blackjack), month 60 (Code Review),
month 75 (Pong — added v1.5), month 90 (Stacker). These four appear in
the arcade cabinet (§10.1) plus **42** (v1.6, arcade-only — no scheduled
slot, by design).

**Pong (v1.5).** Single-player vs. AI paddle. Player on the left, AI on
the right, ball bounces between them; first to 5. Outcome mapping per
issue #32 acceptance:
- **win** — match ends with player at 5 and AI at 0-3 → `XP_MINIGAME_WIN`
- **partial** — went the distance, either 5-4 (won close) or 4-5 (lost close) → `XP_MINIGAME_PARTIAL`
- **fail** — lost 5-0 / 5-1 / 5-2 → `XP_MINIGAME_FAIL`

AI behaviour: tracks the ball's centre with a capped speed
(`AI_MAX_SPEED = 360 v.u./sec`) and an anti-jitter deadzone. Ball speed
creeps `× 1.04` per paddle hit, capped at 720; the contact point on the
paddle adds angle (hits near the top/bottom kick the ball away from
centre). XP only — no stat side-effects, the "purest XP" minigame.

**The Ultimate Question (v1.6).** The smallest minigame in the
codebase. One question (*"What is the answer to the ultimate question
of life, the universe, and everything?"*), four options shuffled per
mount — `7`, `42`, `1138`, `∞`. Binary outcome:
- **win** — picked `42` → `XP_MINIGAME_WIN`
- **fail** — picked anything else → `XP_MINIGAME_FAIL`

No partial bucket, no stat side-effects, no timer. It's a beat, not a
challenge. Arcade-only — the reference (Hitchhiker's Guide, named in
§1's *Inspirations*) lands harder when stumbled upon than scheduled in.
Internal variant id remains `'forty-two'` for code brevity; only the
player-facing title changed (initially shipped as "42" in v1.6 then
renamed to "The Ultimate Question" in the same version line — the title
now telegraphs the *question*, not the *answer*, so the reveal lands on
the punchline rather than the menu row).

All other "mini-game-shaped" moments are **narrated and resolved with a stat-weighted dice roll, not played out interactively.**

Example (no mini-game):
> "You raced through the maze to make the meeting. *(Rolling: focus + luck.)* You made it on time. The room went quiet when you walked in."

This pattern is the single biggest scope-saving decision in the doc.

### 10.1 Arcade access (v1.4, issue #31)

The scheduled slots at months 32 / 60 / 90 are the only "official" minigame
moments — they're load-bearing on the XP economy. The **arcade cabinet**
gives the player ad-hoc access to any minigame without breaking that
balance.

**Interactable.** Universal `InteractableDef` with `feature: 'arcade'` (see
§23). Sprite is an upright cabinet with a screen, joystick, and two
buttons (`art: 'arcade-game'`). Weight `0.4` — visible but not in every
room. Loaded from `public/universal/interactables.json` and merged into
every pack's pool by the loader (pack-specific wins on id collision).

**E-press → ArcadeModal.** `DecisionRoom` routes arcade-feature
interactables to `src/game/ui/ArcadeModal.tsx` instead of the standard
`NPCModal`. The modal has two phases:

- **menu** — a row per `MinigameVariant`: name, blurb, and a status
  pill — `READY · +{XP_MINIGAME_WIN} XP` or `Cooling down · Nm`.
  ↑↓ / 1-N / Enter to pick.
- **playing** — renders `MinigameByVariant` (the shared switch extracted
  from `MinigameRoom`) with `mode='arcade'`. On the minigame's Continue,
  control returns to the menu so plays chain. Esc at any time walks away
  from the cabinet.

**Throttle (real-time, all rewards gated).** XP and stat effects are
awarded only when at least `ARCADE_THROTTLE_MS` (1 real-time hour) has
elapsed since the last *rewarded* play of the **same variant**. Throttled
plays still run end-to-end — the minigame is fun on its own — but the
minigame's `handleContinue` skips every `applyStatEffect` and `addXp`
dispatch when `awardRewards=false`. The ArcadeModal computes eligibility
at launch time and forwards the boolean. After a rewarded play it
dispatches `setLastArcadeXpAt({ variant, at: Date.now() })` so the next
play of that variant cools down. Real-time was chosen over in-game time
because real-time is grind-proof: clicking through months can't fast-
forward the cooldown.

**No history recording.** Arcade plays don't write to `history.minigames`
(§11.1). That timeline is the player's "what happened in the scheduled
moments" record; arcade play is for fun and doesn't belong in the
retrospective. Minigames check `mode === 'scheduled'` before dispatching
`recordMinigame`.

**Closed `MinigameVariant` union for v1.** The arcade lists every variant
in the union (`'blackjack' | 'code-review' | 'reaction-sprint' | 'pong' | 'forty-two'`).
The union is closed by design — no plugin model in v1.

**Pack-filtered variants (v2.0.6).** Each `ARCADE_VARIANTS` entry in
`ArcadeModal.tsx` carries an optional `packs?: readonly string[]` field —
mirrors the layout-template pack-filter pattern from §4. Undefined =
universal (every pack shows the variant). Listed = only those packs show
it. Today only `code-review` is gated (`packs: ['software-engineering']`)
— the SWE-coded *"spot the bug, beat the panel"* register doesn't fit a
homeschool run, and homeschool months don't schedule it. Homeschool
players see 4 variants in the arcade menu (blackjack, reaction-sprint,
pong, forty-two); SWE players see all 5. Adding a future pack-specific
variant means listing its pack id on the entry — same shape as
`LayoutTemplate.packs`.

**Per-variant icons (v2.0.5).** Each `ArcadeModal` row carries a
**44×44 leading icon** rendered by the shared `MinigameIcon` helper
(sibling of `DecisionIcon` / `EventIcon` in `src/game/ui/icons/modalIcons.tsx`).
The icons live in a new `MINIGAME_ICONS: Record<MinigameVariant, ModalIconComponent>`
registry — exhaustive over the closed union, so adding a future variant
without a registry entry fails the typecheck. Five entries today:
`blackjack → IconCards`, `code-review → IconCheckmark`,
`reaction-sprint → IconLightning`, `pong → IconPaddles`,
`forty-two → IconFortyTwo` (the line-art Deep Thought authored over
multiple iterations in PR #69's lineage). The same `MinigameIcon` helper
also renders a 64×64 icon above the *"…looking back"* header in
`MinigameReplayCard` (§11.1) so the replay summary tells the player
which game they're recalling at a glance.

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

### 11.1 Backward replay (v1.2, issue #33)

A second door lets the player walk *back* through past months in read-only
mode. Decisions and events you already committed stay locked; NPC and
object dialogues replay but **no effects fire**, no XP is awarded, no
stats change. Pure exploration of the past room.

**State.**
- `progress.viewingMonth: number | null`. Null = viewing the live current
  month. When non-null, `CareerPackProvider` renders that month's room
  instead of `progress.currentMonth`.
- New reducers: `enterReplay(monthId)` (gates: target must be `>= 1` and
  `< currentMonth`) and `exitReplay()`.
- New history field `history.minigames` records each minigame outcome
  (`monthId`, `variant`, `result`, optional `detail`) so the frozen-result
  card in replay can reproduce what happened.
- STATE_VERSION bumped to 1.3.0.

**Doors.** In every `DecisionRoom`:
- **Forward door** (right wall, `palette.accent`) — live: commits the
  decision, advances the month. Replay: dispatches `exitReplay`, returns
  to the live current month. Label `↩ return to {liveMonth}` only appears
  when `isReplay`.
- **Rewind door** (bottom-left, `palette.surface` tint at 0.85 opacity,
  subdued vs. the forward door) — visible whenever a non-consequence
  past month exists. Walking in: dispatches `enterReplay(prevId)`. The
  helper `previousReplayableMonth()` skips both `consequence` rooms
  ("punchlines, replay feels wrong" per user call) **and `narrative`
  rooms** (the cinematic Januaries are forward-only year-transition
  beats — back-walking from Feb 2021 lands on Dec 2020, not Jan 2021,
  per v2.0.12 user feedback). Both doors fade the SVG (`DOOR_FADE_MS`)
  before the state dispatch so the transition is visually clean.

**Room-type behavior in replay:**
- **DecisionRoom** — no decision fires, no event rolls. Status-bar prompt
  changes to *"Looking back. ← back · ↩ return →"*. NPC/object dialogues
  still play but effects are suppressed (`NPCModal.handleClose` checks
  `isReplay` and short-circuits before dispatching).
- **NarrativeRoom** — re-readable IF reached. Continue button label
  becomes `↩ Return to {liveMonth}` and dispatches `exitReplay` instead
  of advancing. Note: narrative rooms are not normally reached via the
  rewind door anymore — `previousReplayableMonth()` skips them (v2.0.12).
  They can still be VIEWED by the player walking back further past one
  (the search jumps the narrative slot entirely).
- **MinigameRoom** — routes to `MinigameReplayCard` which reads
  `history.minigames` and renders a frozen summary (result + optional
  detail). No re-playing the game, no XP. If no record exists (replay
  predates the recording, or month was never played), shows a graceful
  *"You played a round here, but the details are blurry now."*
- **ConsequenceRoom** — explicitly **not** replayable. The rewind helper
  skips consequence months; a consequence room is never reached via the
  backward door.

**Era mood follows the viewed month.** Palette resolves against the
SHOWN month (so walking back to 2020 brings back the pandemic palette
even if the live month is 2027) — see `CareerPackProvider`.

**HUD telegraphs replay.** In replay mode, the HUD's opacity drops to
0.7 and the month label prefixes with `←` (e.g. `← Aug 2022`). `data-replay`
is set on the HUD root for devtools / future styling hooks.

**Forward (multi-step back).** Player can chain — walk into the rewind
door from a replay room to go further back. All the way to month 1 if
desired. The return door always exits to the live month, not the
intermediate ones.

**Replay spawn position (v2.0.12, issue #77).** When the player walks
*through* the rewind door into a previous month's room, the player
spawns **just left of the forward door** of the replayed room — not at
the layout's default left-edge spawn. Reads as "you stepped out of the
door you originally exited," symmetric to the right→left back-door trip
the player just took. Implementation: `replaySpawnFor(door)` in
`DecisionRoom.tsx` returns `{ x: door.x - 30, y: door.y + door.height / 2 }`;
the component selects `isReplay ? replaySpawnFor(layout.door) : layout.spawn`
as `usePlayerMovement`'s `initialPosition`. The standard left spawn is
still used for forward room entry + `exitReplay` (return to live).

**Out of scope** (called out in the issue): inventory; jumping back
multiple months at once (only one-step navigation); replaying mid-decision
(when a modal is open the rewind door is inert via the existing
`triggered.current` guard).

### 11.2 Finale month (v1.3.4+)

Month **70** (December 2029, per the v2.0.8 slot table) is the player's last live room — a special
DecisionRoom layout that wraps the run on a small smile rather than the
generic forward-door commit.

**Two doors stacked on the right edge:**
- **Top door — locked (examinable).** Renders with `palette.surface`
  fill, dashed `palette.inkMuted` stroke, plus a small lock glyph in the
  centre and a "Locked" label above. Behaves like an interactable rather
  than a passive prop: a proximity check on `handleTick` flips
  `lockedDoorAdjacent` when the player is within `INTERACT_PROXIMITY` of
  the door's centre, an `[E] try` hint renders below the door, and
  pressing E opens the standard `NPCModal` with a synthetic
  `LOCKED_DOOR_INTERACTABLE` (`kind: 'object'`, `art: 'locked-door'` — a
  padlock sprite added to `InteractableSprite`, `label: 'Locked door'`).
  Tier-1 dialogue body reads *"This one is locked! You don't seem to have
  the key... oh well."* Any key closes; no effects fire (object close
  doesn't grant the +1 network that NPC interactions do). A wink at the
  "Something about a key" line from the rewind status-message pool
  (§11.1) — there is no key, never was, that's the joke.
- **Bottom door — forward (real exit).** Standard accent fill / ink
  stroke. Walking in routes to a hardcoded **`FINALE_DECISION`** instead
  of a pack-selected one. Prompt: *"Ten years. Did any of that stick?"*
  Three deadpan options, each with a short flavor reply from the game:
  *"Bits did. Most didn't."* → *"Sounds about right."*; *"Not really.
  I'll leave it here."* → *"Fair. The door's right there."*; *"Hard to
  say. It mostly felt like a Tuesday."* → *"Tuesdays do most of the
  work."* (the Tuesday echo picks up the *"Same coffee stain"* banality
  motif from §11.1's replay status pool). All options have empty
  `effects` — the run's score is computed from state BEFORE this final
  pick lands, so there's no stat hook to attach here.

**Finale flavor phase.** `DecisionModal` accepts a `finale?: boolean`
prop. When true (DecisionRoom passes it for `FINALE_DECISION`), the
flavor phase replaces the generic *"YOU CHOSE"* header + decision-icon
column with a centered three-beat layout: small italic *"Well, then."*,
larger centered chosen-label, italic muted flavor line. The Continue
button becomes **"End"**, hint reads *"Press Enter to roll credits"*.
After Continue, normal `onExit` flow fires → `completeMonth(70)` →
`gameOver=true` → `<EndgameScreen />`.

**Replay of month 70 uses the standard layout** — the finale is a
one-time live beat, not a walkable replay state (`isFinale = monthId ===
FINALE_MONTH_ID && !isReplay`). The rewind door still renders so the player can walk
back through prior months before sealing the run.

**Implementation.** All constants (`FINALE_MONTH_ID`,
`FINALE_LOCKED_DOOR`, `FINALE_FORWARD_DOOR`, `FINALE_LOCKED_MESSAGE`,
`FINALE_DECISION`, `LOCKED_DOOR_INTERACTABLE`) live in `DecisionRoom.tsx`.
`FINALE_DECISION` and `LOCKED_DOOR_INTERACTABLE` are kept inline rather
than added to `pack.decisions` / `pack.interactables` so the pool filter
can't accidentally select them for non-finale months. New sprite token
`locked-door` in `src/game/rooms/sprites/InteractableSprite.tsx` —
padlock with shackle + body + keyhole. No new state slice, no
STATE_VERSION change.

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
| 1.3.0   | —    | Issue #33 backward replay: `progress` gains `viewingMonth: number \| null`; `history` gains `minigames: MinigameRecord[]`. |

`metaSlice.initialState.version` imports `STATE_VERSION` so fresh saves stay synced.

---

## 13. Player Identity

Before entering the game, the player provides a **name**. Sanitized (HTML stripped, length capped at 24 chars). Woven into narrative copy:

> *"Maya, the world has gone quiet..."*

Spouse name (when relationship begins) is randomly drawn from a list, or eventually player-named.

### Mid-game profile editing (v2.0.7)

The **HUD identity chip** (top-left, see `src/game/ui/Hud.tsx`) is
clickable — it opens a `ProfileModal` (`src/game/ui/ProfileModal.tsx`)
that lets the player edit their name in-place mid-run. Edits dispatch
`setProfile({ name })` against the existing `profileSlice` — since every
decision / event / endgame string already interpolates `{playerName}` via
`interpolate.ts`, mid-game name changes propagate through future content
automatically. Already-rendered modal text isn't retroactively updated
(no live re-render), but the next room / next event sees the new name.

**Inline edit pattern.** The name row swaps between view-mode
(`Name [Edit]`) and edit-mode (`<input> [Save] [Cancel]`). Enter / Save
sanitizes via the shared `sanitizeName` helper exported from
`NameEntry.tsx` (so the rule is identical to init-flow validation) and
dispatches. Esc cancels the edit; Esc again (or backdrop click) closes
the modal.

**Children section (homeschool-parent pack only, v2.0.14).** The modal
shows the live `profile.kidAName` and `profile.kidBName` under a
*"Children"* header. Both rows are inline-editable via the same Save /
Cancel pattern as the player-name row — the kid-name interpolation
sprint ([issue #76](https://github.com/corby-github/path-to-the-future/issues/76))
shipped the underlying state + content rewrites (74 `Hazel` / `Bram`
occurrences in `public/careers/homeschool-parent/*.json` retemplated to
`{kidA}` / `{kidB}`), so mid-game edits propagate through every
decision / event / interactable / narrative beat immediately. Pre-v2.0.14
the Edit buttons were disabled with a *"Coming soon"* tooltip.

**Mouse-first by design.** Per the v2.0.7 build call, the trigger is a
mouse click (the HUD chip is now a `<button>` so it also activates via
Enter / Space if focused). No global keyboard shortcut for opening the
modal — the click target is the primary entry. Esc within the modal
behaves per standard inline-edit UX (cancels edit first, then closes).

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

### Pack-aware class labels (v2.0.2)

The 8 tier labels above (Novice Initiate → Elite Oracle) are SWE-coded — the
RPG-flavored register that defined the v1 pack. Packs may override the
display strings via an optional manifest field, same shape as
`statLabels` (§26):

```ts
// types/careerPack.ts
interface ClassLabel { label: string; role: string; }

interface Manifest {
  // ...
  classLabels?: Partial<Record<ClassId, ClassLabel>>;
}
```

Rules:

- Keys are the **canonical engine class ids** (`novice`, `junior`, `skilled`,
  `vanguard`, `commander`, `legendary`, `mythic`, `oracle`). The class
  mechanics — XP thresholds, starting stats, decision-pool weighting —
  reference those canonical ids and don't move.
- Values are the **display strings the picker + HUD show**. ClassPicker
  reads `manifest.classLabels?.[id]?.label ?? CLASSES[id].label`; Hud
  reads the same with `entryClasses.label` as last fallback.
- Omitted keys default to the engine label. A pack only relabels what
  needs relabeling.
- **Playability is unchanged.** v1 still ships Novice + Skilled selectable;
  the other 6 stay 🔒 *Coming Soon* regardless of how a pack relabels them.
  The relabel is cosmetic — same selectable rows, different words on them.

Today the Homeschool Parent pack overrides all 8 tiers:

| Engine id    | SWE default (CLASSES.label) | Homeschool override   |
|--------------|------------------------------|------------------------|
| `novice`     | Novice Initiate              | Homeschooler Newbie    |
| `junior`     | Junior Adventurer            | Settled Routine        |
| `skilled`    | Skilled Operative            | Experienced Veteran    |
| `vanguard`   | Vanguard Strategist          | Curriculum Sage        |
| `commander`  | Commander Architect          | Co-op Lead             |
| `legendary`  | Legendary Leader             | Mentor Parent          |
| `mythic`     | Mythic Visionary             | Elder                  |
| `oracle`     | Elite Oracle                 | The Oracle             |

SWE omits the field; its tiers fall through to `CLASSES.label` unchanged.
PR #69 shipped both the engine plumbing and the homeschool override; v1
playability gates kept verbatim.

**Why labels-not-tiers.** The alternative was a per-pack tier *system*
— different XP thresholds, different number of tiers, different role
copy structures. That's a much bigger refactor (Hud, ClassPicker,
endgame, progression curve, `progress.classTier` save shape) for a
smaller user-facing payoff: every pack would still climb 8 named rungs.
Labels-only is ~45 minutes of localized change and bought the pack
identity beat that mattered ("Homeschooler Newbie" reading as
homeschool, not RPG).

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

### v1.2 — Title-screen wordmark exception

The **title-screen wordmark** (§16.0) is the one place outside the NPC modal
where a retro pixel face is a candidate. Final font choice is TBD at build
time, but if we land on Pixelify Sans (or any pixel face), this is the
sanctioned second use. The legibility constraint that scoped it out of body
UI doesn't apply at display size (≥100px) — the letters are bigger than
your thumb. Keep the rest of §15 honest regardless: no pixel font in HUD,
picker labels, or body copy.

### NPC palette tokens (v2.0.15)

Through v2.0.14, NPC bodies fell back to `palette.accent` — the same warm-brown
that paints doors, the arcade cabinet, the bench, the textbook stack, and most
of the furniture. People read as just another piece of the room. v2.0.15 splits
NPC color out of `accent` so adults and kids each get their own dedicated
fill + outline pair, mirroring the existing `player` / `playerInk` precedent.

**The four new tokens** (required on `Palette`, set in each pack's
`manifest.json` palette block):

| Token | Default hex | Used for |
|---|---|---|
| `npcAdult` | `#ffc91c` (warm yellow) | Adult NPC body + head fill (`NPCBase`) plus the redrawn head in `NPCCoopParent` and the waving hand in `NPCNeighbor`. |
| `npcAdultInk` | `#a2810f` (olive) | The matching outline stroke on the same shapes. |
| `npcChild` | `#1aff5e` (bright green) | Kid NPC body + head fill (`NPCKidBase`, used by `NPCKidHazel` + `NPCKidBram`). |
| `npcChildInk` | `#13a83f` (dark green) | The matching outline stroke. |

**What stays on `palette.accent`.** Object bodies (plant, calendar, stress-ball,
arcade cabinet, textbook stack, art-bin, kitchen table, couch+blanket, coop-signup),
doors (`DecisionRoom.tsx`), UI accent (Career/Class picker selection, EffectChips
negative, EndgameScreen trophy, Hud + StatChip negative-delta, TitleScreen
wordmark text-shadow), and minigame flourishes (Blackjack red suits, Pong
ball/paddle, Stacker blocks). Once NPCs move to yellow/green, the visual
collision the user flagged ("NPCs the same color as the door") is gone — no
need to also split door color or UI accent in this pass. If a future PR
wants to give doors their own `doorAccent` token, that's a separate design
call worth its own conversation.

**Accessory strokes stay on `palette.ink`.** Cups, glasses, clipboards, ties,
watches, backpacks — all the held items that sit on top of the NPC body —
still use the universal ink. They're not body parts; keeping them on neutral
ink preserves silhouette contrast against the new yellow/green body fills.

**Hair uses `palette.accent`.** The seven NPC hair sites (designer tuft,
Bram tuft, mother-in-law crown line + bun, spouse long-hair frame,
co-op-parent ponytail, neighbor bob) were originally painted with
`palette.ink` — too harsh / too dark against the new body colors and the
muted backgrounds. With NPC bodies now off `accent`, the warm-brown is
free to do hair duty as a complementary detail. Future hair variations
(blonde, grey) would warrant their own tokens; for v1 the single warm
brown reads as universal "hair-color-ish" without feeling like everyone
was assigned to the same head.

**Era-mood treatment.** `CareerPackProvider` runs the four new tokens through
`applyEraMood` exactly like the rest of the palette, so NPCs drain in the
pandemic era and saturate in the ai-shift era alongside the rest of the room.

**No `STATE_VERSION` bump** — palette lives in the pack manifest, not in saves.
Old saves load against the new palette transparently.

---

## 16. Init Flow

1. **Title screen** (v1.2 — see §16.0)

2. **Career picker** — **two careers playable** today (SWE + Homeschool
   Parent); three others appear in the picker as 🔒 *Coming Soon*. The
   shipped roster lives in `src/game/content/careers.ts` and is what the
   picker actually renders:
   - Software Engineering ✅
   - Homeschool Parent ✅
   - Accounting 🔒
   - Nursing 🔒
   - Security / Police Officer 🔒

   The wider 9-career roster from v2.0 (see §26) is design intent /
   namespace reservation, not what's listed in `CAREERS`. Adding a new
   row to the picker = appending to `CAREERS` and (if playable) shipping
   the pack content under `public/careers/{id}/`. The picker subtitle
   reads *"Five paths in v1 — two playable. More on the way."*

3. **Name entry**

4. **Class picker** (Novice and Skilled selectable; others 🔒 Coming Soon)

5. **Narrative intro** — the 2020 setup screen (NarrativeRoom)

6. **Game begins** at January 2020.

The title screen always appears on app mount, regardless of save state. From
the title, "Press any key" routes by what's in localStorage: resume directly
into the game if a save exists and the run isn't over, jump to the endgame
screen if `progress.gameOver` is true, otherwise start the init flow at step 2.
The HUD's "sign out / new profile" affordance is unchanged.

**v1.1 keyboard parity:** All pickers honor full keyboard navigation — ↑↓←→
cycles through playable entries (skipping locked ones), Enter/Space confirms,
mouse hover gives focus parity. First playable entry is auto-selected on mount
so keyboard users can press Enter immediately. The Class picker shows the
italic line *"Where you start. Not where you'll end up (hopefully). Play your
cards right."* below its subtitle.

### 16.0 Title screen (v1.2)

The first thing the player sees on app mount. Frames the game before any UI
loads, and gives an autoplay preview of the world so the player knows what
they're walking into.

**Purpose.** Every good game has one. Ours has a job: set the tone (bittersweet,
contemplative, slightly playful), show what NPC sprites and the palette look
like in motion, and make pressing the first key feel like a small commitment
rather than a UI accident.

**Layout (1000×600 virtual canvas, same coordinate system as rooms):**

- **Wordmark.** `PATH TO THE FUTURE` in oversized block letters, centered in
  the upper third. **Font: TBD at build time.** Candidates: Pixelify Sans
  (already loaded for NPC modals — see §15) for an SNES-marquee read;
  JetBrains Mono at heavy weight with aggressive letter-spacing for a
  cleaner block-letter read; a hand-rolled SVG wordmark for full control.
  Decide by sandboxing all three at ~100px+ during the Day 14 build. The
  wordmark is the visual signature of the project — it should feel like
  a marquee.
- **Tagline.** *"A career of choices."* In Inter, italic, palette.muted,
  centered below the wordmark. One line. No period flourish.
- **Ambient autoplay.** A horizontal palette.surface band across the lower
  third acts as a stylized floor. 3–5 NPC sprites (`InteractableSprite`
  variants reused from §23) spawn at separated x-coordinates and random-walk
  inside their own ±80px wander zones using the same motion hook as
  `DecisionRoom`'s NPCs. No player, no collision, no interaction targets.
  Their only job is to make the screen feel inhabited. Sprite mix is
  deterministic per app-mount-day so the title doesn't visibly re-roll on
  every reload.
- **Prompt.** *"Press any key to start"* at bottom-center, Inter, palette.muted,
  blinking at 1Hz (reuse `typewriter-caret-blink` or sibling keyframe).

**Behavior.**
- Mounts before `<InitFlow>` and `<Game>`. Component-local `acknowledged`
  boolean (no Redux); flips true on the first **keydown** or **pointerdown**
  anywhere in the viewport.
- On acknowledge:
  - `progress.gameOver === true` → route to `<EndgameScreen />`
  - `profile.initComplete === true` → route to `<Game />` (resume)
  - otherwise → route to `<InitFlow />` step 2 (career picker)
- The screen does not persist its own dismissal — reloading the page shows it
  again. That's intentional: it's a beat, not a gate.

**What's deliberately not here.** No menu (Continue / New Game / Options). No
version chip. No credits link. v1 keeps it to a single beat. Multi-button
menus are a later-day call if needed.

**Why ambient NPCs over a static logo.** Reuses two systems we already
shipped (`InteractableSprite` + the NPC random-walk loop) for almost no
new code, and gives the player a 5-second tell of what the game looks like
before they commit. Same pattern as Stardew's chickens, Zelda's demo loop,
classic SNES title screens.

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
| 13b | Content fill: more NPCs/objects + room-generator placement + sprite art + playability | ✅ (13b.1–13b.3) |
| 13c | Polish: art tokens, sound (?), accessibility, era mood, viewport | ✅ (v1.3.3) |
| 14  | Title screen (§16.0) — wordmark + tagline + ambient NPC autoplay | ✅ |
| 15  | Analytics (§24) — GoatCounter wrapper + slug instrumentation + GitHub Pages deploy | ⏳ (analytics ✅ v2.0.16; Pages deploy ⏳) |

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

**v1.2 Day 14:** Title screen (§16.0). Added as a new build day rather than
folded into 13c because (a) it precedes the entire init flow and is its own
discrete component, and (b) the user explicitly framed it as a v1 ship
requirement, not polish. Reuses `InteractableSprite` and the NPC random-walk
hook, so engine work is minimal — most of the day is layout, the wordmark,
and the autoplay arrangement.

---

## 18. Out of Scope (v1.0)

- The three roster careers that don't ship JSON yet (Accounting, Nursing, Security / Police) — pack architecture supports them, the picker reserves the rows, but no `public/careers/{id}/` content exists. Future packs land by writing JSON, not engine code. (Two packs ship JSON today: `software-engineering` + `homeschool-parent` per v2.0.1.)
- ~~Class entry points beyond Novice and Skilled~~ — **shipped in v2.0.11.** All 8 tiers (Novice → Oracle) now selectable in both packs via `manifest.entryClasses`. Starting XP + stats calibrated per tier; balance is unplaytested but the picker no longer gates picks.
- Backend for game state — no accounts, no cloud save (the **future public scoreboard** is captured separately in §25 as a small CF Workers + D1 service, deliberately scoped tight)
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
    │   │   ├── TypewriterText.tsx     ← v1.1 (§8b implementation)
    │   │   └── TitleScreen.tsx        ← v1.2 — title/autoplay (§16.0, Day 14)
    │   ├── minigames/                 ← v1.1 — Day 11 deliverables
    │   │   ├── Blackjack.tsx
    │   │   ├── CodeReview.tsx
    │   │   └── Stacker.tsx
    │   ├── dev/
    │   │   ├── DevPanel.tsx
    │   │   ├── DevControlsContext.ts
    │   │   ├── DevControlsProvider.tsx
    │   │   └── useDevControls.ts
    │   ├── analytics/                 ← v1.2 — GoatCounter wrapper (§24, Day 15)
    │   │   └── track.ts               ← trackPageview + trackEvent
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
when the player completes month 70 (LAST_MONTH_ID under v2.0.8; was 120) — or, theoretically, when an `endsGame: true`
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
- **Header order** (v2.0.13): `TrophyCrown` (88 px line-art SVG, palette-accent
  cup + ink strokes — Treatment A) → `Ten years done.` (small uppercase) →
  `{Name}'s Career` (h1) → tagline (italic muted, one of the lines from
  `endgame-taglines.json`, rolled per view). The tagline sits below the
  name because it's randomly selected and shouldn't occlude the
  consistently-named title above it. Trophy crowns the stack as a
  ceremonial centerpiece — SVG rather than the `🏆` emoji so the icon
  reads identically across Apple / Windows / Android / web font stacks.
- **Stats + score panels** sit inline below the header, side-by-side,
  filling the residual canvas height.
- **Career timeline lives in a dedicated full-canvas view** (#26)
  (`CareerTimelineScreen`, defined alongside `EndgameScreen`). Opened via
  the leftmost recap action (see below). Internal scroll handles the full
  60-room decision list (one row per playable monthId, minus the 10 cinematic Januaries); year grouping preserved. Each row renders the
  **decision prompt** above the **option taken** (resolved from
  `pack.decisions` by `decisionId` — falls back to option-only if a stored
  decision was removed/renamed from the pack). Without the prompt, option
  text like "Go" or "Build it" reads as a punchline with no setup; the
  prompt restores the narrative weight of the choice. Date column widened
  to 124px with `whiteSpace: nowrap` so `September 2025`-class labels
  render on one line (was 80px, which wrapped `February 2021` and visually
  collided with the option text). Keyboard: ↑/↓ scroll one step (~3 rows),
  PgUp/PgDn scroll a page, Home/End jump to top/bottom — mouse wheel also
  works. Single **Close** action; Enter/Space/Esc all close.
- Three actions on the recap, left to right: **Career Timeline** · **Credits** · **Begin again**.
  Keyboard nav: ← → cycles focus with wrap-around (three actions, not two),
  Enter/Space confirms. The hint reads
  `← → to choose · Enter / Space to confirm`.

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
  label?: string;                     // v1.2 — short display name under [E] hint
  art: string;                        // sprite token (real art in 13b)
  feature?: 'arcade';                 // v1.4 — routes E-press to a feature modal (§10.1)
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
spawn position `(200, 130)`, picked deterministically from the pack via a
seeded random (`monthId + INTERACTABLE_SEED_SALT`). Day 13b moves placement
into the room generator (multiple per room, weighted by month theme,
layout-aware).

**Motion (v1.1).** Objects are stationary. NPCs **random-walk** within a
±80px wander zone around their spawn at 25–45 virtual units/sec (≈⅕ player
speed). New heading every 1.5–3 seconds; 30% chance per direction-change
to idle for that window. NPC stops moving when the player is adjacent
(keeps the [E] hint as a stable target), when any modal is open, and after
door commit. NPCs currently walk through obstacles — collision-aware
pathing is deferred to a later day.

**Proximity + trigger.** `DecisionRoom`'s tick handler computes distance from
the player to the interactable. Within `INTERACT_PROXIMITY` (75 virtual units),
`adjacent` flips true; a dashed `palette.accent` halo + `[E] talk` label render
above the interactable. Pressing **E** (when adjacent, no other modal active,
not committed to the door) picks a random eligible dialogue and opens the
modal. Movement is paused while the modal is open, matching the decision /
event / minigame pattern.

**Sprite-anchored label (v1.2).** When the player is adjacent, two text
elements bracket the sprite: the `[E] talk` / `[E] look` hint sits
**above** the sprite (per the original v1.1 design), and the interactable's
`label` field — *"Plant", "Intern", "Boss's boss"* — sits **below** the
sprite as a caption. Splitting them top/bottom keeps the `[E]` call-to-action
prominent while giving the player a clear name for what they're looking at.
Optional schema field; the `labelFor` helper in `DecisionRoom` falls back
to a derived title-cased form of `id` (strips the `obj-` / `npc-` prefix,
hyphens → spaces) when a pack hasn't authored labels yet. SVG
`data-region="interact-hint"` and `data-region="interact-label"` attributes
identify the two text elements.

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

**Speaker header + icon (v1.2).** Two complementary anchors so the
player always knows who's talking:

- **Header** (`prompt` and `options` phases): kind-aware text above the
  typewriter. NPCs say things — `"Intern says…"`, `"Senior engineer says…"`.
  Objects don't — they get a plain-label header — `"Plant."`, `"Printer."`.
  Phrasing comes from `speakerHeaderFor()` in
  `src/game/content/interactableLabel.ts`. Small caps, palette.inkMuted,
  12px. `data-region="speaker-header"`.
- **Icon-left sprite** (all phases): the interactable's sprite rendered
  in a fixed-width column on the **left** of the dialog box. Full opacity,
  ~100px wide, vertically centered. Pure SVG, reuses `InteractableSprite`
  so the art matches what the player just walked up to. `aria-hidden` —
  purely decorative. `data-region="speaker-visual"`. The dialog box flows
  flex-row: icon column → content column (`data-region="content"`) holding
  header + prompt + options/flavor.

The header is skipped in `flavor` phase because that phase is the outcome
of the player's choice, not the speaker's voice — different register. The
icon persists across all phases so the speaker stays visible.

A watermark variant (low-opacity sprite right-aligned, text flowing over)
was sandboxed during build — see PR #38 history for the commit. Icon-left
won on legibility; watermark felt softer but harder to read at the small
placeholder-sprite scale. If real illustration art lands later and the
sprites grow more atmospheric, revisit.

The shared `labelFor()` and `speakerHeaderFor()` helpers live in
`src/game/content/interactableLabel.ts` so `DecisionRoom` (sprite caption
per §23 *Sprite-anchored label*) and `NPCModal` (this section) read from
one source.

**Door fade preserves canvas bounds.** The room SVG's border was moved to a
wrapper div so it persists through the door-commit fade. Modals land on a
visible-but-empty room outline instead of black.

### Feature-flagged interactables (v1.4)

`InteractableDef.feature` is an optional discriminator that swaps out the
modal an E-press opens. The proximity system, sprite rendering, label
caption, and adjacency halo are unchanged — only the modal routing
branches. For v1.4 the only value is `'arcade'`, which routes to
`ArcadeModal` (§10.1) instead of `NPCModal`. The `[E]` hint text reads
`[E] play` for arcade-feature interactables (vs `[E] talk` for NPCs and
`[E] look` for objects). The `dialogues` array is still authored and
required for schema parity, but it's only consulted when no feature
takes priority — for arcade entries, one short Tier-1 line is enough.

### Universal interactables layer (v1.4)

`public/universal/interactables.json` holds interactables every career
pack inherits. The loader (`src/game/content/loader.ts`) fetches it
optionally in parallel with the pack-specific file and merges into a
single `pack.interactables` list. Pack-specific entries win on `id`
collision so a pack can override or shadow a universal definition.

This is where the arcade cabinet lives (`obj-arcade-game`). The layer is
deliberately thin in v1 — one entry — but it's the right home for any
future "every workplace has one of these" interactables (water cooler
chats that aren't pack-themed, generic flavor objects). The placer
treats universal and pack-specific entries identically; the
`tags: ['universal', ...]` array is informational.

---

## 24. Analytics & Tracking (v1.2)

Added Day 15. The build is going to GitHub Pages. We want to know two things,
and only two things: how many unique people open it, and how far they get.

**Provider: GoatCounter** (cloud, free for non-commercial). No cookies, no
consent banner needed, ~3KB script, won't get blocked by mainstream ad-blockers.
Self-hosted variant exists if we ever want it.

### Privacy posture

- **No PII.** No player name, no spouse name, no decision IDs, no save
  contents — none of it leaves the device.
- **No cookies.** Analytics layer writes nothing to localStorage either.
- **Standard server-side hashing.** GoatCounter does its own daily-rotated
  IP/UA hash for unique-visitor counts; we do nothing extra.
- **Honors `navigator.doNotTrack`.** The wrapper short-circuits if DNT=1.

### Implementation pattern: virtual pageviews, URL stays at `/`

The SPA stays a SPA. The browser URL never changes during play — no router,
no `history.pushState`. We send `pageview` events with custom `path` strings
to GoatCounter on screen transitions. The dashboard sees a funnel; the player
sees one URL. The back button can't walk a player out of a bad decision.

Real routing was considered and rejected: it would let the URL drift from
the Redux save state, give players an inadvertent rewind via Back, and add
React Router weight for no analytics gain.

### Wrapper

`src/game/analytics/track.ts` exposes exactly two functions:

```ts
trackPageview(path: string): void;
trackEvent(name: string, params?: Record<string, string | number>): void;
```

Both no-op when:
- `import.meta.env.PROD` is false (dev/local builds never report)
- `window.goatcounter` is undefined (script blocked or failed to load)
- `navigator.doNotTrack === '1'`

Both swallow errors silently. **Analytics must never break the game.**

### Tracked slugs

| Slug | Fired when |
|------|------------|
| `/title` | Title screen mounts |
| `/init/career` | Career picker mounts |
| `/init/name` | Name entry mounts |
| `/init/kid-names` | Kid-names entry mounts (only fires when the active pack declares `manifest.requiresKidNames` — Homeschool today, SWE skips) |
| `/init/class` | Class picker mounts |
| `/init/intro` | Narrative intro mounts |
| `/month/{01..70}` | Each room mount (zero-padded monthId, 1–70 under v2.0.8 half-length playthrough). Fired by `RoomRenderer` because each month-typed inner room re-mounts via `key={monthId}`. |
| `/minigame/{blackjack\|code-review\|reaction-sprint\|pong\|forty-two}` | Minigame room mounts (mirrors the `MinigameVariant` union in `src/game/types/room.ts`). Replay-mode minigame mounts skip the slug so the dashboard reads as "actually played" rather than "looked at the recap." |
| `/endgame` | Endgame screen mounts |
| `/credits` | Credits screen mounts in `'browse'` mode (the standalone roll) |
| `/restart` | Credits screen mounts in `'replay'` mode (the begin-again confirm view). Fires on screen mount; the `restart_confirmed` event below pairs with the actual confirm click. |

### Custom events

| Event | Params | Fired when |
|-------|--------|------------|
| `game_started` | `career`, `class` | First month entered after init complete (not on resume) |
| `game_completed` | none | Month 70 commit (also fires the `/endgame` pageview) |
| `restart_confirmed` | none | After "Yes, begin again" — pairs with `/restart` pageview |
| `minigame_completed` | `id`, `result` ('win' \| 'partial' \| 'fail') | Each minigame finish |

Career and class are gameplay metadata, not identifiers — they tell us
"~20% of players pick Skilled" without identifying anyone.

### What we explicitly don't track

- **Per-decision events.** 70 month-decisions × N players would dwarf the rest
  of the funnel; pageview depth by month slug is enough signal for v1.
- **Stat values.** Final stats might be interesting later, but shipping
  them off-device feels off-vibe for a game this contemplative.
- **Timing.** No session duration, no time-in-room. GoatCounter gives us
  pageview timestamps; that's enough to derive what we'd want.

### Configurability

GoatCounter endpoint and the enable-flag live in `.env.production`
(committed, no secrets — the endpoint is a public URL). Dev builds never
report. A future self-hosted swap is a one-line endpoint change.

### Failure mode

Ad-blocker blocks the script → `window.goatcounter` undefined → wrapper
returns silently. Network drops mid-session → individual `count()` calls
fail silently and the next one tries again. The game does not know or care.

---

## 25. Future: Public Scoreboard (deferred, v1.2 spec)

Not in v1. Captured here because the design call has already been made —
a future "add the scoreboard" PR will be cheaper if we don't re-litigate
the trust model from zero.

### Spirit: graffiti board

If someone cheats, fine. Anyone with devtools can `fetch('/scores', {...})`
with whatever number they want, and pretending strong client-side controls
fix that is not what this project is about. The board is a record of what
people *claim*. Cheaters are part of the texture. The median submission
is probably honest. This matches the project's broader spirit (see project
memory: "not taking ourselves too seriously") — we are not building
replay-verification infrastructure to defend against an adversary who
isn't really the audience.

### Shape

One table. One row per finished run. No accounts, no auth, no session.

| Column        | Notes                                                          |
|---------------|----------------------------------------------------------------|
| `name`        | Player-chosen, sanitized + profanity-filtered server-side      |
| `score`       | Final score from `computeScore` (§21)                          |
| `class`       | Entry class (Novice / Skilled / …)                             |
| `final_month` | 70 if completed (LAST_MONTH_ID under v2.0.8); lower if soft-permadeath ends the run early |
| `run_id`      | Client-generated UUID at endgame; server uses as dedupe key    |
| `timestamp`   | Server-set on insert                                           |

### Infra

**Cloudflare Workers + D1.** One Worker, two routes:

- `POST /scores` — anon write, basic rate limit (e.g. 1/min per IP),
  server-side name validation + profanity filter, reject malformed
  payloads silently.
- `GET /scores?limit=N` — paginated read, top-N by score, JSON response,
  cacheable at the edge.

Both routes CORS-permissive (the game is a static site on a different
origin). No auth, no replay verification, no signed payloads.

### Submission flow

The Endgame screen (§21) gets a "Post your run to the board" button —
**opt-in, not automatic.** First press validates locally + fires the
POST. Success → confirmation + a "View board" link. Failure → swallow
silently with a soft "Couldn't reach the board" line; never block the
recap. The board itself opens as a new screen reachable from credits
and from the endgame action row.

### The line being crossed

Adding this turns the project from a static site on GitHub Pages into
**a service with user-generated content.** Once people are submitting,
there is a soft obligation to keep the board moderated — even minimally.
Manual moderation is fine at this scale (one person, low traffic). The
profanity filter on submit is a first line. Worth knowing this line
exists, even if we're happy to cross it when the time comes.

### When to build

No assigned build day. Revisit just before implementing — almost
certainly after v1 ships and the build plan completes. Half a day of
work at that point, given the spec above.

---

## 26. Career Packs: Beyond SWE (v2.0)

Software Engineering is the v1 pack — the one we've built, the one we've
tuned, the one whose era moods and decision pool define what a "career" feels
like in this engine. It's also the pack whose shape the rest of the engine
quietly inherited. §7's stat model has `technicalSkill` in it. §21's score
formula references that field by name. That's fine — every game ships its
first content domain coupled to the engine; pretending otherwise is bigger
project than this one wants to be. This section names what's coupled, names
what's portable, and lays out the path from one pack to many.

### Spirit: lazy-but-honest

We are not refactoring the engine for hypothetical careers. We are shipping
**Student** as the second pack under deliberately constrained terms, learning
what actually generalizes vs. what just *seemed* like it would, and only then
doing the refactor that v2.0 anticipates but doesn't perform. The cost of
flexibility you haven't validated needing is higher than the cost of a small
later refactor.

This matches §25's spirit (the scoreboard is similarly "we know we'll build
this; we're not building it yet, but we won't have to re-litigate from zero
when we do").

### What's portable today

The room engine, the decision/event schemas, the modal presentation, the
mini-games framework, the era-mood system, the room generator, save/load,
the rewind mechanic, the endgame screen's *shape* (not its copy), the
analytics — all of it. Any new career pack can use them by writing JSON,
not code. This was always the architectural intent (§3 *The North Star*).
v2.0 is the version where we *actually use* that capability for a non-SWE
pack.

### What's coupled to SWE (the honest list)

These are baked into the engine or the universal content pool today. None is
fatal; each has a documented workaround:

- **`stats.technicalSkill`** is a SWE concept. Other packs can relabel it
  via `statLabels` (Student calls it "Grades"; Nursing would call it
  "Clinical Skill"; Accounting "Technical Skill" is fine as-is) and treat
  the underlying 0–100 as a generic competence axis.
- **`stats.savings` as dollars** assumes professional-salary scales. A
  Student-pack decision granting `savings: +50` (a babysitting gig) vs. an
  SWE-pack decision granting `savings: +5000` (a bonus) both work in the
  same scalar; the *meaning* changes with context. The HUD displays the
  number; the pack chooses scale by convention. Acceptable for now.
- **The score formula in §21** references `technicalSkill` directly by
  field name in `computeScore.ts`. Score weights are SWE-tuned. For v2.0,
  packs inherit this formula — relabeled `technicalSkill` still contributes
  to the score under whatever name the HUD shows it. A future refactor
  (see *Deferred*) makes the score formula pack-aware.
- **The "universal" decision pool** is mostly SWE-flavored ("launch party
  vs. spouse birthday"). Decisions in `decisions/universal/` are reusable
  across packs *in principle*, but in practice many will need `requires`
  gates to filter out for ill-fitting packs (a student doesn't have a
  spouse). Universal decisions remain useful; calling them "universal"
  was always slightly aspirational.
- **The endgame framing copy** ("Ten years done. {Name}'s Career") is
  SWE-coded. A Student run ending at age 22 wants "Coming up." or
  similar, not "Career." Deferred for now — see *Deferred*.

### The `statLabels` mechanism (v2.0)

Optional field on the career-pack manifest:

```json
{
  "statLabels": {
    "burnout": "Stress",
    "savings": "Money",
    "network": "Friends",
    "technicalSkill": "Grades",
    "reputation": "School Rep"
  }
}
```

Rules:

- Keys are the **canonical engine stat names** from §7. Decision/event JSON
  and the `computeScore` formula keep referencing those canonical names.
- Values are the **display strings the HUD shows**. The HUD reads
  `pack.statLabels?.[key] ?? defaultLabelFor(key)`. One lookup, one
  fallback, no logic forks.
- Omitted keys default to the engine label. A pack only relabels what
  needs relabeling.
- The relabel applies everywhere the stat name is shown to the player:
  HUD bars, decision-effect chips (the `EffectChips` `aria-label` map in
  v1.3.3 reads from the same source), endgame stat panel, career timeline.
  One source of truth.

The SWE pack should ship a `statLabels` entry that's identity-mapped
(`"burnout": "Burnout"`, etc.) as part of the v2.0 plumbing work. This
proves the lookup path on existing content without behavior change before
any new pack consumes it. Pure refactor PR, easy review.

### The expanded roster

Living in `src/game/content/careers.ts`:

| `id` | Name | Status |
|---|---|---|
| `software-engineering` | Software Engineering | ✅ Playable |
| `homeschool-parent` | Homeschool Parent | ✅ Playable (v2.0.1) |
| `accounting` | Accounting | 🔒 Scaffolded (picker row, no JSON) |
| `nursing` | Nursing | 🔒 Scaffolded (picker row, no JSON) |
| `security-police` | Security / Police Officer | 🔒 Scaffolded (picker row, no JSON) |

Each appears in the Career picker (§16); the picker's `playable` flag
drives selectability. Flipping a row to `playable: true` requires the
matching pack content to exist under `public/careers/{id}/` — manifest,
months, decisions, events, optionally interactables and endgame-taglines.

**The roster was deliberately trimmed from the v2.0 nine-career
aspiration to the v2.0.2 five-row reality** so the picker reflects what's
actually scaffolded today, not what we've sketched. The wider tonal
ambition — life-stages as careers (Student, Homeschool Parent), off-grid
paths (Small Business Owner) — is preserved in the prose around this
table; it just doesn't get a picker row until the pack content lands.
Student remains the named next pack when v2.0.x picks back up. The
medical-device-sales / law-enforcement / teaching / small-business-owner
rows were dropped from `CAREERS` to keep the picker honest; their ids
remain available namespace if those packs get authored later.

The roster is deliberately wider than the original v1 list. The original
five were all "respectable middle-class trades the player works *for*
someone else." The expanded set adds **off-grid paths** (Small Business
Owner — your name is on the lease) and **life stages that aren't careers
yet** (Student, Homeschool Parent — life *is* the career). Tonal range is
part of the v2.0 thesis: the engine isn't just for jobs.

### The Student pack (the v2.0 forcing function)

Student is the second pack we'll actually build. Its constraints are what
make the v2.0 design honest — every "what about packs that don't have X"
question lands somewhere in this section because Student is what raised it.

#### Arc

10 years, January 2020 → December 2029, ages 13 → 22. Same 70-monthId
shape as SWE under v2.0.8 (was 120 months pre-refactor). The post-HS
fork at month ~39 (was 66) is the structural centerpiece — see
*Adjustments for v2.0 (#26)* below for the gating decisions still pinned
to the 120-id scale.

| Year span | Age | Phase |
|---|---|---|
| 2020 (Jan–Aug) | 13 | 7th grade ending — pandemic hits mid-year |
| 2020–21 | 13–14 | 8th grade — the remote/hybrid year |
| 2021–22 | 14–15 | 9th grade — high school starts |
| 2022–23 | 15–16 | 10th grade — driver's permit, first job possible |
| 2023–24 | 16–17 | 11th grade — SATs, college conversation begins |
| 2024–25 | 17–18 | 12th grade — applications, the big fork |
| 2025 (summer) | 18 | Launch — post-HS path decision |
| 2025–29 | 18–22 | Post-HS path plays out |
| 2029 (Dec) | 22 | Endgame |

The pandemic anchor (January 2020 as the engine's universal starting beat)
lands on **a 13-year-old in 7th grade going remote**. This is the most
narratively underexplored demographic from that period and the one the
pack should lean into hardest. The era-mood system from §15 / v1.3.3 maps
cleanly: pandemic mood owns 2020–2021; rebound 2022–2023; uncertain-future
2024–2025 (which doubles as senior-year-application-anxiety, a happy
accident); ai-shift 2026–2029 (which lands during the college/post-HS years,
where it matters most for this cohort).

#### Stat relabels (final)

```json
"statLabels": {
  "burnout": "Stress",
  "savings": "Money",
  "network": "Friends",
  "health": "Health",
  "relationship": "Dating",
  "technicalSkill": "Grades",
  "reputation": "School Rep"
}
```

Notes on the choices:

- **`burnout` → "Stress"** — teens don't have burnout; that's an adult-work
  concept. Same mechanic, native vocabulary.
- **`savings` → "Money"** — not "Allowance." "Allowance" is age-coded for
  the 13–15 window and stops fitting once the player has a job at 16+.
  "Money" works at every age.
- **`technicalSkill` → "Grades"** — not "GPA." Real GPA is 0–4.0, and
  players seeing "GPA: 73" would parse it as a percentage anyway. "Grades"
  is the native word and accepts a 0–100 scalar without explanation.
- **`reputation` → "School Rep"** — kept the "Rep" shorthand because it's
  what teens actually say.
- **`network` → "Friends"** — flat and direct. Industry-network meaning
  doesn't apply yet; the mechanic survives (more "network" still unlocks
  more options) under the renamed surface.
- **`health` → "Health"** and **`relationship` → "Dating"** — Health is
  Health at every age. Dating is the teen frame; the underlying
  null/0–100 mechanic from §7 is unchanged (null = not currently dating,
  going to 0 ends the thing).

#### New flags (additive, no STATE_VERSION bump)

Three new keys on `state.flags`:

- **`parentTrust: 0–100`** — how much rope the player's parents are
  giving them. Gates "can I borrow the car," "can I go to the party,"
  "do they pay for college." Modified by decisions (cleaned room? lied
  about where you were? brought home a B vs. a D?). High value unlocks
  options; low value narrows the decision pool. The teen equivalent of
  SWE's `reputation` in some ways — your standing with the people whose
  judgment most constrains you.
- **`hasJob: boolean`** — flips true when the player takes their first
  part-time job (typically a decision around 16). Opens a part-time-work
  decision pool, regular small `savings` increments, work-vs-school
  trade-off decisions.
- **`postHSPath: PostHSPath | null`** — null for the first ~66 months,
  then one of the values defined below.

Graceful default for old SWE saves: all three default to `null` / `false`
/ `0` and are simply never read by SWE-pack decisions. Same pattern as
`meta.tutorialDismissed` in v1.3.3 — no STATE_VERSION bump needed because
nothing the SWE pack does cares about these fields.

#### The post-HS fork (structural centerpiece)

This is what makes Student replay differently from SWE. SWE-pack runs vary
by *stat outcome* — same career, different shapes of life inside it.
Student-pack runs vary by **which life the player launched into**.

At approximately month 66 (mid-2025, post-graduation), a special
DecisionRoom presents the **post-HS fork**. Available options are gated by
the player's stat and flag state at that moment via the existing `requires`
mechanism — no new gating engine required. The decision sets the
`postHSPath` flag, which then governs which decision pool feeds months
66–120.

The seven possible values for `postHSPath`:

| Value | Requires (illustrative) | Months 66–120 decision pool |
|---|---|---|
| `college-4yr` | Grades ≥ 70, Money ≥ 5000 OR parentTrust ≥ 60 | College life — dorms, majors, internships, the campus-y stuff |
| `community-college` | Grades ≥ 40, Money ≥ 1000 | Two years CC + transfer-or-not fork at month 90 |
| `trade-school` | parentTrust ≥ 30 | Trades — electrician, plumber, HVAC, welding |
| `military` | Health ≥ 60 | Enlistment — basic, MOS, deployment cycles |
| `gap-year` | Money ≥ 2000 OR parentTrust ≥ 70 | Travel / work / figure-it-out — re-forks at month 78 (year ~19.5) |
| `work` | (none — always available) | Retail / service / entry-level — the "no plan" path |
| `drift` | (fallback if no other option qualified) | Living at home, no clear path, lower-stakes decisions |

The thresholds above are **illustrative, not final** — the actual requires
gates land during content authoring, calibrated against real Student
playthroughs. The list of seven paths *is* the design commitment;
calibration is implementation.

`drift` is the safety-net path — the pool always offers it so the fork
never returns an empty option set. It's also a real outcome a real
18-year-old might land in, so it's not a failure state, just a different
texture.

#### Endgame framing for Student

A Student run ending at age 22 should not be framed as "your career."
Tagline options need to reflect "the path you took into adulthood"
instead. Concrete deferral: see *Deferred* below. For v1 of the Student
pack, the endgame screen can either (a) use the existing copy and accept
the slight mismatch, or (b) hardcode a pack-conditional swap in
`EndgameScreen.tsx` (a single `if (pack.id === 'student')` is fine —
honest pragmatism, not architecture). We'll see how it reads when we get
there.

#### Universal-decision filtering

Most v1 universal decisions assume a working adult. Student-eligible
universals will be a strict subset — basically the ones about health,
friendship, and general life stuff. The "Vegas weekend with bonus" type
filters out via `requires: { savings: ">=1000" }` and the spouse-birthday
type via `requires: { flags.inRelationship: true }` (which Student rarely
sets). The mechanism exists; the work is curatorial.

Authoring estimate: ~25–35 Student-specific decisions for the first half
(months 1–66) plus per-post-HS-path pools of ~15–20 decisions each. The
exact volume depends on selection-window tuning (§8) — fewer decisions
means more repetition unless windows tighten.

### Deferred (v2.0 spec, not v2.0 build)

These are flagged as known-future work so v3.0 (or whenever) doesn't have
to relitigate them. Spirit matches §25 — capture the design decision now;
build later.

- **Pack-defined stat schemas (Option C).** Make `state.stats` a
  `Record<string, number>` instead of the typed seven-field shape from §7.
  Each pack declares its own stats in `manifest.stats`. Universal stats
  (`burnout`, `health`, `relationship`) remain canonical so the universal
  decision pool still works. Pack-specific stats live in the pack manifest
  (SWE adds `technicalSkill`, `network`, `reputation`, `savings`; Student
  adds `gpa`, `socialStanding`, `allowance`, `parentTrust`-as-stat
  potentially; Nursing adds `compassionFatigue`, `clinicalSkill`). The
  trigger to do this work: **after the third playable pack ships.** Two
  packs isn't enough signal — it's just "SWE and a thing that isn't SWE."
  Three packs starts to show which stats really are universal. State
  migration will need a real STATE_VERSION bump and a migration step (old
  SWE saves get their stats moved into the new shape).

- **Pack-aware score formula.** `computeScore` (§21) currently references
  `technicalSkill` by name. After Option C lands, the formula becomes
  pack-defined too — each pack declares its score formula in the manifest
  (or as a JS function the pack exports). For v2.0 we live with the
  shared formula; the relabeled `technicalSkill` still scores correctly
  under whatever name the HUD shows it, and the relative weights are
  acceptable for non-SWE packs in v1 of those packs.

- **Per-pack endgame framing.** The "Ten years done." / "{Name}'s Career"
  copy in `EndgameScreen.tsx` becomes pack-overridable via manifest fields
  (`endgameFraming.title`, `endgameFraming.subtitle`). Trivial change
  when we get there — held now because we haven't actually played a
  non-SWE endgame and don't yet know what the framing should *be* for
  Student vs. Homeschool Parent vs. Small Business Owner. Build it after
  we've felt the mismatch firsthand.

- **Per-pack starting year / arc length.** The 2020–2030 / 70-monthId
  assumption (10-year calendar, 7 slots/year per the v2.0.8 half-length
  playthrough; was 120 monthIds pre-v2.0.8) lives in the engine in a few
  places (`completeMonth(70)` triggers gameOver, month-index math
  elsewhere). For v2.0, every pack uses the same 70-monthId / 2020–2030 window — Student lands here
  naturally (ages 13–22 fits the decade), and no other pack we've
  scaffolded needs a different window. If a pack later wants a different
  arc (a "Retirement" pack starting at age 65? a "Childhood" pack at
  ages 5–13?), add `manifest.startMonth` + `manifest.totalMonths` then.
  Not now.

### When to build (Student specifically)

No assigned build day. Two prerequisite tasks land first:

1. **`statLabels` plumbing in the SWE pack** — the no-op identity-relabel
   refactor described above. Proves the HUD-lookup path. Maybe half a day.
2. **Student pack scaffold** — manifest, empty content directories,
   placeholder palette, `playable: false`. Maybe an hour. Doesn't ship
   anything but unblocks parallel content authoring.

Then the real work is content: 70 monthIds' worth of Student decisions
(under the v2.0.8 7-slot/year scheme), the post-HS fork at month ~39
(was month 66 on the 120-id scale), the seven post-HS sub-pools, era-flavored events
filtered for teens, sprite art for school/dorm/etc. interactables, the
endgame copy decision. Multi-day build; estimate after the scaffold
exists and the first 12 months are written (the SWE pack's own estimate
got tighter once Day 10 was real).

Flag for future-us: the Student pack is the one where we learn whether
the engine actually generalizes. If we're rewriting engine code while
building Student, we got something wrong in v2.0 — write down what and
fix it before pack #3.

### The Homeschool Parent pack (shipped — second playable)

Homeschool Parent landed as the second playable pack — earlier than
Student in the roster timeline because the voice register clicked on the
first batch of authored content and the user wanted to ride that. Phase 1
(PR #56) shipped the scaffold + 5 voice-anchor decisions and 5 events
that locked the register. Phase 2 (this PR) scaled to the full pool.

#### Arc

Same 10-year window as SWE (Jan 2020 → Dec 2029), now spanning 70 monthIds under v2.0.8 (1 cinematic January + 6 playable months/year). Two kids hardcoded by name in copy:

- **Hazel** — age 6 at month 1, age 16 at month 70
- **Bram** — age 3 at month 1, age 13 at month 70

The kid ages drive the arc texture: pandemic-era kindergarten/preschool
through ai-shift-era pre-teen and uncertain-future early-teen. Teen
rebellion / dating / college-prep beats were originally gated at month
≥84/≥90/≥96 on the 120-id scheme; under v2.0.8 the equivalent slot
thresholds are roughly month ≥49/≥52/≥56 (pro-rata; final values were
re-tuned during the `feat/half-length-playthrough` regen, see
`scripts/regenerate-months.mjs`). No engine work was needed for the kids — they're
content-only references. Kid-name interpolation (`{kidA}` / `{kidB}`) is
**deferred to a follow-up PR** — current copy hardcodes "Hazel" and
"Bram" everywhere they appear. Acceptable trade-off: kid names are not
player-controlled in any UI flow, and templating them now would touch
profileSlice + every JSON file with no behavior change for the player.
The follow-up is straightforward when a future pack wants a kid-name
pool.

#### Stat relabels (final)

```json
"statLabels": {
  "technicalSkill": "Teaching",
  "network": "Community",
  "reputation": "Standing"
}
```

Notes on the choices:

- **`technicalSkill` → "Teaching"** — the parent is the teacher. The
  mechanic is competence; the surface is pedagogical craft.
- **`network` → "Community"** — co-op parents, neighbor friends, the
  homeschool-collective network. Same gating mechanic; native vocabulary.
- **`reputation` → "Standing"** — how the family is regarded by extended
  family, the wider neighborhood, the not-homeschool world. The pack uses
  Standing for in-law judgment beats and the park-grade-question event
  (Phase 1's voice anchor). Range stays -100..+100 — Standing can go
  negative (the in-law-dismisses-your-choices arc).
- `burnout`, `savings`, `health`, `relationship` — kept as engine labels.
  Burnout is burnout at every age (the dry-erase-handwriting-wobble event
  trades on the word). Savings displays as dollars; the pack's scale is
  family-household (a $4,000 contract gig, a $180 boxed-curriculum spend,
  a $400 phone purchase). `relationship` is romantic-only per §7 — the
  spouse axis. Parent-child friction routes to `reputation` / `burnout` /
  `technicalSkill` (the Phase-1 pattern, kept).

#### Voice anchor (locked Phase 1, matched in Phase 2)

Bittersweet-contemplative-occasionally-dry. Honest-friend tone.
Identity-sacrifice-community axis. Parent's interior life, not the kid's
milestone. **NOT sappy / snarky / lecture-y / parenting-blog.**

Four anchor lines that defined the register:

- *"Hazel knocked on the door once and you said 'in a minute' and then
  forgot for forty. You didn't forget that you'd forgotten."*
  (`hp-contract-work-offer`)
- *"The other mom said 'cool' the way people say 'cool' when they mean
  'huh.'"* (`evt-hp-park-grade-question`)
- *"She is not asking permission so much as telling you where she's
  heading."* (`hp-eldest-wants-school`)
- *"You wrote it in the journal anyway, because someone, twenty years
  from now, might want the date."* (`evt-hp-toddler-crayon`)

Phase 2 authored against these anchors. Any new beat that drifted off
register was rewritten. The "read it as a stranger" gate applied.

#### Content counts (Phase 1 + Phase 2 + tone-pass = shipped)

Counts reflect `main` as of v2.0.2. The tone-pass (PR #65) added 4 new
content pieces — `decision-tablet`, `evt-hp-mr-nobody`, `evt-hp-research`,
`evt-hp-church-stayed-open` — plus surface rewrites; PR #69 added the
homeschool-specific class labels and the 20-icon coverage batch.

| Content | Count | Notes |
|---|---|---|
| Decisions | **32** | 5 Phase-1 + 25 Phase-2 + 2 tone-pass (snack-rebellion + tablet). Span all four eras + era-agnostic. |
| Events | **39** | 5 Phase-1 + 32 Phase-2 + 2 tone-pass (Mr-Nobody + church-stayed-open) — plus an evt-hp-research piece in the tone-pass bundle. Includes 5 stat-trigger events (low-savings, low-health, high-burnout, high-network, hazel-first-chapter), 5 era-anchored (pandemic), 3 (rebound), 5 (ai-shift), 4 (uncertain-future). |
| Interactables | **12** | 6 objects + 6 NPCs. Includes the two kid NPCs (default names `Hazel` / `Bram`, player-renameable via the v2.0.14 init-flow + ProfileModal — content uses `{kidA}` / `{kidB}` tokens) with tier-2 dialogues; co-op friend + spouse + in-law + neighbor; textbook stack, art bin, kitchen-table-as-school, fridge drawing, sick-day couch, co-op sign-up. |
| Months | **70** | 10 anchor narrative rooms (Jan 2020 / 2021 / 2022 / 2023 / 2024 / 2025 / 2026 / 2027 / 2028 / 2029) + 60 playable monthIds across Feb/Apr/Jun/Aug/Oct/Dec of each year (v2.0.8 half-length playthrough; was 120 monthIds pre-refactor). |
| `monthTransitions` | **16** | Homeschool-themed flavor lines for the post-decision blur. |
| `intro` | **4 lines** | Cinematic intro played after class pick via ScenePlayer (§16). Supports `{playerName}`. The Phase-2 8-line version was tightened in the tone pass to land sooner. |
| Endgame taglines | **12** | Pack-scoped pool at `public/careers/homeschool-parent/endgame-taglines.json`. |
| `classLabels` | **8 of 8** | All 8 tier labels overridden via the v2.0.2 mechanism (§14): Homeschooler Newbie → The Oracle. Engine playability gates unchanged. |
| Modal icons | **20 of 71 real** | After PR #69's 5+5 voice-checkpoint batch + the second 5+5 batch. Remaining 51 `hp-*` / `evt-hp-*` ids render as `PlaceholderIcon` — deferred per [`docs/research/polish-loop-scope-creep.md`](research/polish-loop-scope-creep.md). |

#### Era distribution

Decisions and events distribute across the four eras with these rough
counts (era-anchored content; era-agnostic content not double-counted):

| Era | Months (v2.0.8) | Decisions (era-anchored) | Events (era-anchored) |
|---|---|---|---|
| pandemic | 1–21 | 2 (screens-rule, spouse-furlough) | 4 (grocery-line, zoom-cohort, relatives-text, yard-friendship, mask-tantrum) |
| rebound | 15–35 | 1 (back-to-school-wave) | 3 (school-friends-return, comp-jump, spouse-layoff) |
| ai-shift | 36–49 | 1 (ai-tutor-decision) | 5 (ai-doorway, grocery-screen, essay-question, spouse-tool, evangelist-parent) |
| uncertain-future | 50–70 | 4 (teen-rebellion-late-night, teen-dating, college-prep-route, college-test-or-portfolio, late-decade-empty-room, final-year-graduation-frame, mid-career-reentry partial overlap) | 4 (college-anxiety, spouse-search, decade-photo, becoming-mentor) |

The era-agnostic decisions/events fire across the timeline based on month
requires and stat triggers.

#### New engine plumbing

Three additive changes — none bump STATE_VERSION, none require
migrations, all are graceful defaults for packs that don't use them:

1. **Pack-scoped endgame taglines** (v2.0.1). `EndgameScreen.tsx` tries
   `careers/{packId}/endgame-taglines.json` first; falls back to the
   universal `public/endgame-taglines.json` if missing or empty. SWE has
   no override and gets the universal pool unchanged.
2. **Pack-aware class labels** (v2.0.2, PR #69). New optional
   `Manifest.classLabels?: Partial<Record<ClassId, ClassLabel>>` field;
   §14 covers the mechanism. Homeschool overrides all 8 tiers; SWE
   omits the field.
3. **Dedicated sprite tokens for homeschool interactables** in
   `src/game/rooms/sprites/InteractableSprite.tsx`. The pack now has
   **12 of 12** dedicated sprites — no SWE-token reuse:
   - **Phase 2 (v2.0.1):** `textbook-stack` (three-book stack with
     bookmark), `kid-hazel` (small humanoid with a book held against
     torso), `kid-bram` (small humanoid with backpack + hair tuft).
   - **PR #69 objects (v2.0.2):** `art-bin`, `kitchen-table` (kitchen
     table as schoolroom — Treatment-A flat-color), `fridge-drawing`
     (kid's drawing taped to a fridge), `couch-blanket` (sick-day couch
     with a blanket), `coop-signup` (clipboard / sign-up sheet).
   - **PR #69 parents (v2.0.2):** `parent-in-law` (mother-in-law),
     `parent-spouse` (spouse), `parent-coop` (co-op parent),
     `parent-neighbor` (neighbor mom). All hardcoded female for v1 in
     a new `parent-*` art-token namespace separate from the SWE
     `person-*` tokens — matches the existing copy register ("another
     mom at the park", "the neighbor mom"). Easy to flip individual
     sprites or add a runtime gender-pick init phase later if a
     playthrough wants it.

   All tokens are Treatment-A flat-color, palette-pure per §15.

#### Deferred follow-ups (Homeschool Parent)

- ~~**Kid-name interpolation.**~~ **Shipped in v2.0.14** ([issue #76](https://github.com/corby-github/path-to-the-future/issues/76)).
  `profileSlice` gained `kidAName` / `kidBName` (defaults `Hazel` /
  `Bram`) + a `kidNamesSet` flag for the init-flow gate. `InitFlow` adds
  a `KidNamesEntry` phase between name and class, mounted only when
  `manifest.requiresKidNames` is set (Homeschool: `2`). `interpolate.ts`
  context grows `kidA` / `kidB`; `NarrativeRoom` / `NPCModal` /
  `labelFor` now interpolate too (previously bypassed). 74 `Hazel` /
  `Bram` occurrences across 5 JSON files retemplated to `{kidA}` /
  `{kidB}`. ProfileModal `[Edit]` buttons enabled for the kid rows.
- **Era-mood retuning.** Phase 2 left eras at the Phase-1 / SWE-mirror
  values. The bittersweet register may want a softer rebound and a
  starker uncertain-future. Held — would only retune if a playthrough
  reads off in a specific era.
- **Remaining 51 modal icons.** 20 of 71 `hp-*` + `evt-hp-*` ids have
  real art after PR #69's voice-checkpoint batches; the other 51 render
  as `PlaceholderIcon`. Deferred per
  [`docs/research/polish-loop-scope-creep.md`](research/polish-loop-scope-creep.md)
  — the polish loop ate hours faster than the running-game beat could
  absorb. Tackle in a future polish-past-v1 sprint if specific ids feel
  wrong after playtest.

The PR #56 / Phase-2 / PR #69 sprite-art reuse follow-up is **retired**:
all 12 interactables now have dedicated `parent-*` / homeschool-object
tokens.

---

*End of design document v2.0.*