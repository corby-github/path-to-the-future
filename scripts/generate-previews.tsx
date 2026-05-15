// Preview generator for voice-and-icon review.
//
// Reads a career pack from public/careers/<id>/ and emits two self-contained
// HTML files:
//
//   docs/text-previews/<short>.html   — every player-facing word in the pack
//                                       in earliest-month order, banded by
//                                       era. The thing we read aloud to
//                                       sanity-check voice.
//   docs/icons-previews/<short>.html  — every registered modal icon, grouped
//                                       by category, with id + description.
//                                       A "Missing icons" footer flags any
//                                       decision/event id without a registry
//                                       entry.
//
// React icon components are rendered to static SVG via react-dom/server. The
// SSR pass receives the pack's own palette so the preview reflects what the
// player sees in-game.
//
// Run: npm run gen:previews          (defaults to software-engineering)
//      npm run gen:previews -- --all (loops every pack in public/careers/)
//      npm run gen:previews -- --pack=homeschool-parent

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { Manifest, MonthEntry, DecisionDef, EventDef, Palette } from '../src/game/types/careerPack';
import { DECISION_ICONS, EVENT_ICONS } from '../src/game/ui/icons/modalIconRegistryData';
import * as Icons from '../src/game/ui/icons/modalIcons';
import { ICON_DESCRIPTIONS, ICON_CATEGORIES } from './icon-descriptions';

// ---------------------------------------------------------------------------
// Path setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const CAREERS_DIR = resolve(REPO_ROOT, 'public', 'careers');
const TEXT_OUT_DIR = resolve(REPO_ROOT, 'docs', 'text-previews');
const ICON_OUT_DIR = resolve(REPO_ROOT, 'docs', 'icons-previews');

// Pack id → short filename slug. Pack ids are long-form for clarity inside
// the codebase; the review files use short slugs because that's what we
// reference in conversation.
const PACK_SHORT_NAME: Record<string, string> = {
  'software-engineering': 'swe',
  'homeschool-parent': 'homeschool',
};

// ---------------------------------------------------------------------------
// Era ordering
// ---------------------------------------------------------------------------

const ERA_ORDER = ['pandemic', 'rebound', 'ai-shift', 'uncertain-future'] as const;
type EraId = typeof ERA_ORDER[number];

const ERA_LABEL: Record<EraId, string> = {
  'pandemic':         'Pandemic (2020 – 2022)',
  'rebound':          'Rebound (2023 – 2024)',
  'ai-shift':         'AI-Shift (2025 – 2026)',
  'uncertain-future': 'Uncertain Future (2027 – 2029)',
};

// First month of each era — derived dynamically from months.json at runtime;
// these are fallback values used when an event's era doesn't map to any
// month (shouldn't happen in practice but keeps the sort total-order safe).
const ERA_FALLBACK_FIRST_MONTH: Record<EraId, number> = {
  'pandemic': 1,
  'rebound': 37,
  'ai-shift': 61,
  'uncertain-future': 85,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PackContent {
  manifest: Manifest;
  months: MonthEntry[];
  decisions: DecisionDef[];
  events: EventDef[];
  spouseNames: string[];
  endgameTaglines: string[];
}

interface ScoredItem {
  kind: 'decision' | 'event' | 'finale';
  earliestMonth: number;
  era: EraId;
  payload: DecisionDef | EventDef | FinaleDecision;
}

interface FinaleDecision {
  id: string;
  prompt: string;
  options: Array<{ label: string; flavor: string }>;
}

// Hardcoded FINALE_DECISION mirrors src/game/rooms/DecisionRoom.tsx so the
// review includes the month-120 closer. If that ever changes upstream, this
// must be updated in lockstep. (id is `finale-month` since v2.0.8 — the
// month-120 wording is a UI copy artifact, not the registry id.)
const FINALE: FinaleDecision = {
  id: 'finale-month',
  prompt: 'Ten years. Did any of that stick?',
  options: [
    { label: "Bits did. Most didn't.",                 flavor: 'Sounds about right.' },
    { label: "Not really. I'll leave it here.",         flavor: "Fair. The door's right there." },
    { label: 'Hard to say. It mostly felt like a Tuesday.', flavor: 'Tuesdays do most of the work.' },
  ],
};

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { packs: string[] } {
  const args = argv.slice(2);
  if (args.includes('--all')) {
    const all = readdirSync(CAREERS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    return { packs: all };
  }
  const packArg = args.find((a) => a.startsWith('--pack='));
  if (packArg) return { packs: [packArg.slice('--pack='.length)] };
  const positional = args.filter((a) => !a.startsWith('--'));
  if (positional.length > 0) return { packs: positional };
  // Default: SWE only. Homeschool icon coverage isn't complete yet, so we
  // don't generate it by default — opt in with --pack=homeschool-parent.
  return { packs: ['software-engineering'] };
}

// ---------------------------------------------------------------------------
// Pack loading
// ---------------------------------------------------------------------------

function loadPack(packId: string): PackContent {
  const dir = resolve(CAREERS_DIR, packId);
  const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8')) as Manifest;
  const monthsRaw = JSON.parse(readFileSync(resolve(dir, 'months.json'), 'utf8')) as { months: MonthEntry[] };
  const decisionsRaw = JSON.parse(readFileSync(resolve(dir, 'decisions.json'), 'utf8')) as { decisions: DecisionDef[] };
  const eventsRaw = JSON.parse(readFileSync(resolve(dir, 'events.json'), 'utf8')) as { events: EventDef[] };
  let spouseNames: string[] = [];
  const spousePath = resolve(dir, 'spouse-names.json');
  if (existsSync(spousePath)) {
    spouseNames = (JSON.parse(readFileSync(spousePath, 'utf8')) as { names: string[] }).names;
  }
  let endgameTaglines: string[] = [];
  const taglinePath = resolve(dir, 'endgame-taglines.json');
  if (existsSync(taglinePath)) {
    const tagRaw = JSON.parse(readFileSync(taglinePath, 'utf8')) as { taglines?: string[] };
    endgameTaglines = tagRaw.taglines ?? [];
  }
  return {
    manifest,
    months: monthsRaw.months,
    decisions: decisionsRaw.decisions,
    events: eventsRaw.events,
    spouseNames,
    endgameTaglines,
  };
}

// ---------------------------------------------------------------------------
// Earliest-month computation
// ---------------------------------------------------------------------------

const RE_GTE = /^>=\s*(\d+)$/;
const RE_GT = /^>\s*(\d+)$/;

function parseMonthLowerBound(expr: string | undefined): number {
  if (!expr) return 1;
  const trimmed = expr.trim();
  let m = RE_GTE.exec(trimmed);
  if (m) return Math.max(1, parseInt(m[1], 10));
  m = RE_GT.exec(trimmed);
  if (m) return Math.max(1, parseInt(m[1], 10) + 1);
  // Other operators (==, <, !=) — fall back to month 1 for ordering.
  return 1;
}

function earliestMonthForDecision(d: DecisionDef, months: MonthEntry[]): { month: number; era: EraId } {
  const reqMonth = (d.requires as Record<string, string> | undefined)?.month;
  const m = parseMonthLowerBound(reqMonth);
  const era = eraForMonth(m, months);
  return { month: m, era };
}

function earliestMonthForEvent(e: EventDef, months: MonthEntry[]): { month: number; era: EraId } {
  const reqMonth = (e.trigger as Record<string, string> | undefined)?.month;
  const fromMonth = parseMonthLowerBound(reqMonth);
  const eras = (e.era ?? ['any']) as string[];
  // Era constraint: pick the earliest month whose era is in the event's
  // era list. "any" matches all months.
  if (eras.length === 0 || eras.includes('any')) {
    return { month: fromMonth, era: eraForMonth(fromMonth, months) };
  }
  // Find the first month >= fromMonth whose era is in `eras`.
  const eligible = months.find((mn) => mn.id >= fromMonth && eras.includes(mn.era ?? 'default'));
  if (eligible) return { month: eligible.id, era: (eligible.era ?? 'pandemic') as EraId };
  // Fallback: just use trigger month and look up era.
  return { month: fromMonth, era: eraForMonth(fromMonth, months) };
}

function eraForMonth(monthId: number, months: MonthEntry[]): EraId {
  const m = months.find((mn) => mn.id === monthId);
  if (m && m.era && ERA_ORDER.includes(m.era as EraId)) return m.era as EraId;
  // Find nearest month >= monthId
  const nearest = months.find((mn) => mn.id >= monthId);
  if (nearest && nearest.era && ERA_ORDER.includes(nearest.era as EraId)) return nearest.era as EraId;
  // Default fallback.
  for (const era of ERA_ORDER) {
    if (monthId >= ERA_FALLBACK_FIRST_MONTH[era]) {
      // walk forward to find tightest band
    }
  }
  return 'pandemic';
}

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Effects rendering — turns {"burnout":"+5","reputation":"+3"} into a chip row
// ---------------------------------------------------------------------------

function renderEffects(effects: Record<string, string> | undefined): string {
  if (!effects || Object.keys(effects).length === 0) return '';
  const chips = Object.entries(effects)
    .map(([k, v]) => `<span class="effect-chip" data-key="${esc(k)}" data-delta="${esc(v)}">${esc(k)} ${esc(v)}</span>`)
    .join(' ');
  return `<div class="effects">${chips}</div>`;
}

// ---------------------------------------------------------------------------
// Pack-specific stat labels (Phase-1 plumbing)
// ---------------------------------------------------------------------------

function statLabelFor(manifest: Manifest, key: string): string {
  const labels = (manifest as Manifest & { statLabels?: Record<string, string> }).statLabels;
  if (labels && labels[key]) return labels[key];
  return key;
}

// ---------------------------------------------------------------------------
// Render a decision card
// ---------------------------------------------------------------------------

function renderDecision(d: DecisionDef, earliestMonth: number, manifest: Manifest): string {
  const tagChips = (d.tags ?? [])
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join(' ');
  const requiresLine = d.requires
    ? `<div class="requires"><strong>requires:</strong> ${
        Object.entries(d.requires as Record<string, string>)
          .map(([k, v]) => `<code>${esc(statLabelFor(manifest, k))} ${esc(v)}</code>`)
          .join(', ')
      }</div>`
    : '';
  const optionsHtml = (d.options ?? [])
    .map((opt) => {
      const sceneHtml = opt.scene && opt.scene.length > 0
        ? `<ul class="scene">${opt.scene.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`
        : '';
      const flavorHtml = opt.flavor ? `<p class="flavor">${esc(opt.flavor)}</p>` : '';
      return `
        <div class="option">
          <div class="option-label">${esc(opt.label)}</div>
          ${sceneHtml}
          ${renderEffects(opt.effects)}
          ${flavorHtml}
        </div>`;
    })
    .join('');
  return `
    <article class="card decision" id="${esc(d.id)}">
      <header class="card-header">
        <span class="kind-badge decision-badge">DECISION</span>
        <span class="month-badge">m${earliestMonth}+</span>
        <span class="pool-badge">${esc(d.pool ?? '')}</span>
        <code class="id">${esc(d.id)}</code>
        ${tagChips}
      </header>
      ${requiresLine}
      <p class="prompt">${esc(d.prompt)}</p>
      <div class="options">${optionsHtml}</div>
    </article>`;
}

// ---------------------------------------------------------------------------
// Render an event card
// ---------------------------------------------------------------------------

function renderEvent(e: EventDef, earliestMonth: number, manifest: Manifest): string {
  const tagChips = (e.tags ?? [])
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join(' ');
  const eraChips = ((e.era ?? ['any']) as string[])
    .map((era) => `<span class="era-chip">${esc(era)}</span>`)
    .join(' ');
  const triggerLine = e.trigger
    ? `<div class="requires"><strong>trigger:</strong> ${
        Object.entries(e.trigger as Record<string, string>)
          .map(([k, v]) => `<code>${esc(statLabelFor(manifest, k))} ${esc(v)}</code>`)
          .join(', ')
      }</div>`
    : '';
  const sceneHtml = e.scene && e.scene.length > 0
    ? `<ul class="scene">${e.scene.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`
    : '';
  return `
    <article class="card event" id="${esc(e.id)}">
      <header class="card-header">
        <span class="kind-badge event-badge">EVENT</span>
        <span class="month-badge">m${earliestMonth}+</span>
        <span class="pool-badge">${esc(e.pool ?? '')}</span>
        <code class="id">${esc(e.id)}</code>
        ${eraChips}
        ${tagChips}
      </header>
      ${triggerLine}
      <h3 class="event-title">${esc(e.title)}</h3>
      <p class="body">${esc(e.body)}</p>
      ${sceneHtml}
      ${renderEffects(e.effects)}
    </article>`;
}

// ---------------------------------------------------------------------------
// Render finale card
// ---------------------------------------------------------------------------

function renderFinale(f: FinaleDecision): string {
  const optionsHtml = f.options
    .map((opt) => `
      <div class="option">
        <div class="option-label">${esc(opt.label)}</div>
        <p class="flavor">${esc(opt.flavor)}</p>
      </div>`)
    .join('');
  return `
    <article class="card decision finale" id="${esc(f.id)}">
      <header class="card-header">
        <span class="kind-badge decision-badge">FINALE</span>
        <span class="month-badge">m120</span>
        <code class="id">${esc(f.id)}</code>
        <span class="tag">hardcoded in DecisionRoom.tsx</span>
      </header>
      <p class="prompt">${esc(f.prompt)}</p>
      <div class="options">${optionsHtml}</div>
    </article>`;
}

// ---------------------------------------------------------------------------
// Render a month-narrative card (months.json with title/body/roomType)
// ---------------------------------------------------------------------------

function renderMonthNarrative(m: MonthEntry): string {
  const bits: string[] = [];
  if (m.title) bits.push(`<h3 class="narrative-title">${esc(m.title)}</h3>`);
  if (m.body) bits.push(`<p class="narrative-body">${esc(m.body)}</p>`);
  if (m.continueLabel) bits.push(`<p class="continue-label"><em>${esc(m.continueLabel)}</em></p>`);
  if (m.variant) bits.push(`<p class="minigame-note"><em>minigame variant: <code>${esc(m.variant)}</code></em></p>`);
  if (bits.length === 0) return '';
  return `
    <article class="card narrative" id="month-${m.id}">
      <header class="card-header">
        <span class="kind-badge narrative-badge">NARRATIVE</span>
        <span class="month-badge">month ${m.id}</span>
        <span class="pool-badge">${esc(m.year + '-' + String(m.monthNum).padStart(2, '0'))}</span>
        ${m.roomType ? `<span class="tag">roomType: ${esc(m.roomType)}</span>` : ''}
        ${m.theme ? `<span class="tag">${esc(m.theme)}</span>` : ''}
      </header>
      ${bits.join('\n')}
    </article>`;
}

// ---------------------------------------------------------------------------
// Build the text preview HTML
// ---------------------------------------------------------------------------

function buildTextHtml(pack: PackContent, packId: string): string {
  const { manifest, months, decisions, events, spouseNames, endgameTaglines } = pack;

  // 1. Score every decision + event with earliestMonth + era
  const scored: ScoredItem[] = [];
  for (const d of decisions) {
    const { month, era } = earliestMonthForDecision(d, months);
    scored.push({ kind: 'decision', earliestMonth: month, era, payload: d });
  }
  for (const e of events) {
    const { month, era } = earliestMonthForEvent(e, months);
    scored.push({ kind: 'event', earliestMonth: month, era, payload: e });
  }
  scored.push({ kind: 'finale', earliestMonth: 120, era: 'uncertain-future', payload: FINALE });

  // 2. Sort by earliestMonth, then decisions before events, then by id
  scored.sort((a, b) => {
    if (a.earliestMonth !== b.earliestMonth) return a.earliestMonth - b.earliestMonth;
    const kindOrder: Record<string, number> = { decision: 0, event: 1, finale: 2 };
    if (kindOrder[a.kind] !== kindOrder[b.kind]) return kindOrder[a.kind] - kindOrder[b.kind];
    const idA = (a.payload as { id?: string }).id ?? '';
    const idB = (b.payload as { id?: string }).id ?? '';
    return idA.localeCompare(idB);
  });

  // 3. Bucket scored items by era for visual banding
  const buckets: Record<EraId, ScoredItem[]> = {
    'pandemic': [],
    'rebound': [],
    'ai-shift': [],
    'uncertain-future': [],
  };
  for (const item of scored) buckets[item.era].push(item);

  // 4. Build month-narrative buckets per era too, so they interleave at the
  //    top of each era band.
  const narrativeByEra: Record<EraId, MonthEntry[]> = {
    'pandemic': [],
    'rebound': [],
    'ai-shift': [],
    'uncertain-future': [],
  };
  for (const m of months) {
    if (!m.title && !m.body && !m.variant) continue;
    const era = (m.era ?? 'pandemic') as EraId;
    if (ERA_ORDER.includes(era)) narrativeByEra[era].push(m);
  }

  // 5. Render each era band
  const bandHtml = ERA_ORDER
    .map((era) => {
      const narratives = narrativeByEra[era]
        .sort((a, b) => a.id - b.id)
        .map((m) => renderMonthNarrative(m))
        .filter((s) => s.length > 0)
        .join('\n');
      const items = buckets[era]
        .map((item) => {
          if (item.kind === 'decision') return renderDecision(item.payload as DecisionDef, item.earliestMonth, manifest);
          if (item.kind === 'finale')   return renderFinale(item.payload as FinaleDecision);
          return renderEvent(item.payload as EventDef, item.earliestMonth, manifest);
        })
        .join('\n');
      return `
        <section class="era-band" id="era-${era}" data-era="${era}">
          <header class="era-header">
            <h2>${esc(ERA_LABEL[era])}</h2>
            <span class="band-count">${buckets[era].length} cards · ${narrativeByEra[era].length} narrative beats</span>
          </header>
          ${narratives}
          ${items}
        </section>`;
    })
    .join('\n');

  // 6. Intro + spouse names + endgame taglines
  const introHtml = manifest.intro && manifest.intro.length > 0
    ? `<section class="frontmatter">
         <h2>Intro</h2>
         <ul class="intro-lines">
           ${manifest.intro.map((line) => `<li>${esc(line)}</li>`).join('')}
         </ul>
       </section>`
    : '';

  const spouseHtml = spouseNames.length > 0
    ? `<section class="frontmatter">
         <h2>Spouse names (random pool)</h2>
         <p class="muted">Used by the dating-app match decision; one is picked at random when the choice fires.</p>
         <p class="name-list">${spouseNames.map(esc).join(' · ')}</p>
       </section>`
    : '';

  const taglinesHtml = endgameTaglines.length > 0
    ? `<section class="frontmatter">
         <h2>Endgame taglines</h2>
         <ul class="tagline-list">
           ${endgameTaglines.map((t) => `<li>${esc(t)}</li>`).join('')}
         </ul>
       </section>`
    : '';

  const monthTransitionsHtml = manifest.monthTransitions && manifest.monthTransitions.length > 0
    ? `<section class="frontmatter">
         <h2>Month transitions</h2>
         <p class="muted">One is picked at random between months that have no narrative beat.</p>
         <ul class="transition-list">
           ${manifest.monthTransitions.map((t) => `<li>${esc(t)}</li>`).join('')}
         </ul>
       </section>`
    : '';

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const counts = {
    decisions: decisions.length,
    events: events.length,
    monthsWithNarrative: months.filter((m) => m.title || m.body).length,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(manifest.name)} — text preview</title>
<style>${TEXT_CSS}</style>
</head>
<body>
<header class="page-header">
  <h1>${esc(manifest.name)} <span class="subtitle">— text preview</span></h1>
  <p class="meta">pack id: <code>${esc(packId)}</code> · generated ${esc(stamp)} UTC</p>
  <p class="meta">${counts.decisions} decisions · ${counts.events} events · ${counts.monthsWithNarrative} month narratives · sorted by earliest playable month, banded by era.</p>
  <nav class="era-nav">
    ${ERA_ORDER.map((era) => `<a href="#era-${era}">${esc(ERA_LABEL[era])}</a>`).join(' · ')}
  </nav>
</header>
<main>
  ${introHtml}
  ${bandHtml}
  ${monthTransitionsHtml}
  ${spouseHtml}
  ${taglinesHtml}
</main>
<footer class="page-footer">
  <p>Voice review surface. Every line here is something the player will read in-game. If a flavor / scene / prompt sounds off, flag the card id back to the author.</p>
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Render an icon component to a static SVG string
// ---------------------------------------------------------------------------

type IconComponent = (props: { palette: Palette; size?: number }) => unknown;

function renderIcon(component: IconComponent, palette: Palette, size = 80): string {
  return renderToStaticMarkup(
    createElement(component as never, { palette, size }) as never
  );
}

// ---------------------------------------------------------------------------
// Build the icons preview HTML
// ---------------------------------------------------------------------------

function buildIconsHtml(pack: PackContent, packId: string): string {
  const { manifest, decisions, events } = pack;
  const palette = manifest.palette;

  // 1. Collect every id we care about: from decisions.json, events.json, and
  //    the registries themselves (in case registry has entries the content
  //    doesn't reference yet — e.g., finale-month which lives in code).
  const contentIds = new Set<string>([
    ...decisions.map((d) => d.id),
    ...events.map((e) => e.id),
    'finale-month',
  ]);
  const registeredDecisionIds = new Set(Object.keys(DECISION_ICONS));
  const registeredEventIds = new Set(Object.keys(EVENT_ICONS));

  // 2. Build flat list of { id, kind, componentName, svg } for every
  //    REGISTERED icon. Group by ICON_CATEGORIES below.
  interface IconRow {
    id: string;
    kind: 'decision' | 'event';
    componentName: string;
    description: string;
    svg: string;
  }
  const rows: IconRow[] = [];
  for (const [id, Comp] of Object.entries(DECISION_ICONS)) {
    const name = (Comp as { name?: string }).name ?? '?';
    rows.push({
      id, kind: 'decision', componentName: name,
      description: ICON_DESCRIPTIONS[name] ?? '(no description authored — add to scripts/icon-descriptions.ts)',
      svg: renderIcon(Comp as IconComponent, palette, 80),
    });
  }
  for (const [id, Comp] of Object.entries(EVENT_ICONS)) {
    const name = (Comp as { name?: string }).name ?? '?';
    rows.push({
      id, kind: 'event', componentName: name,
      description: ICON_DESCRIPTIONS[name] ?? '(no description authored — add to scripts/icon-descriptions.ts)',
      svg: renderIcon(Comp as IconComponent, palette, 80),
    });
  }

  // 3. Bucket rows by category.
  const buckets: Record<string, IconRow[]> = {};
  for (const cat of ICON_CATEGORIES) buckets[cat.key] = [];
  const unbucketed: IconRow[] = [];
  for (const r of rows) {
    let placed = false;
    for (const cat of ICON_CATEGORIES) {
      if (cat.match(r.id)) {
        buckets[cat.key].push(r);
        placed = true;
        break;
      }
    }
    if (!placed) unbucketed.push(r);
  }

  // 4. Render the registered-icon sections.
  const categorySections = ICON_CATEGORIES
    .map((cat) => {
      const items = buckets[cat.key];
      if (items.length === 0) return '';
      items.sort((a, b) => a.id.localeCompare(b.id));
      const cards = items.map((r) => `
        <div class="icon-card" data-id="${esc(r.id)}">
          <div class="icon-frame">${r.svg}</div>
          <div class="icon-meta">
            <code class="id">${esc(r.id)}</code>
            <code class="comp">${esc(r.componentName)}</code>
            <p class="desc">${esc(r.description)}</p>
          </div>
        </div>`).join('');
      return `
        <section class="icon-section" id="cat-${cat.key}">
          <header class="cat-header"><h2>${esc(cat.label)}</h2><span class="cat-count">${items.length}</span></header>
          <div class="icon-grid">${cards}</div>
        </section>`;
    })
    .join('\n');

  // 5. Render unregistered minigame icons (exported but not in either registry).
  const minigameNames = ['IconCards', 'IconCheckmark', 'IconLightning', 'IconPaddles', 'IconFortyTwo'];
  const minigameRows = minigameNames
    .map((name) => {
      const Comp = (Icons as unknown as Record<string, IconComponent | undefined>)[name];
      if (!Comp) return null;
      return {
        name,
        description: ICON_DESCRIPTIONS[name] ?? '(no description authored)',
        svg: renderIcon(Comp, palette, 80),
      };
    })
    .filter((x): x is { name: string; description: string; svg: string } => x !== null);
  const minigameSection = minigameRows.length === 0 ? '' : `
    <section class="icon-section" id="cat-minigames">
      <header class="cat-header"><h2>Minigame icons (exported, not yet registered)</h2><span class="cat-count">${minigameRows.length}</span></header>
      <p class="muted">These ship from <code>modalIcons.tsx</code> but aren't in <code>DECISION_ICONS</code> or <code>EVENT_ICONS</code> yet. They'll feed a future <code>MinigameIcon</code> registry consumed by <code>MinigameReplayCard</code>.</p>
      <div class="icon-grid">
        ${minigameRows.map((r) => `
          <div class="icon-card">
            <div class="icon-frame">${r.svg}</div>
            <div class="icon-meta">
              <code class="comp">${esc(r.name)}</code>
              <p class="desc">${esc(r.description)}</p>
            </div>
          </div>`).join('')}
      </div>
    </section>`;

  // 6. Placeholder card.
  const placeholderSvg = renderIcon(Icons.PlaceholderIcon as unknown as IconComponent, palette, 80);
  const placeholderSection = `
    <section class="icon-section" id="cat-placeholder">
      <header class="cat-header"><h2>Placeholder fallback</h2><span class="cat-count">1</span></header>
      <p class="muted">Rendered for any id not in either registry. Real art swaps in by replacing the registry entry.</p>
      <div class="icon-grid">
        <div class="icon-card">
          <div class="icon-frame">${placeholderSvg}</div>
          <div class="icon-meta">
            <code class="comp">PlaceholderIcon</code>
            <p class="desc">${esc(ICON_DESCRIPTIONS.PlaceholderIcon)}</p>
          </div>
        </div>
      </div>
    </section>`;

  // 7. Missing icons: content ids without a registry entry. This is the
  //    coverage gauge — should be empty for a fully-covered pack.
  const missingDecisions = decisions
    .map((d) => d.id)
    .filter((id) => !registeredDecisionIds.has(id))
    .sort();
  const missingEvents = events
    .map((e) => e.id)
    .filter((id) => !registeredEventIds.has(id))
    .sort();
  const missingFinale = !registeredDecisionIds.has('finale-month') && contentIds.has('finale-month')
    ? ['finale-month']
    : [];

  const missingHtml = (missingDecisions.length + missingEvents.length + missingFinale.length) === 0
    ? `<p class="all-covered">✓ Every decision and event id in this pack has a registered icon.</p>`
    : `
      <div class="missing-grid">
        ${[...missingDecisions, ...missingFinale].length > 0 ? `
          <div>
            <h3>Decisions without icons (${missingDecisions.length + missingFinale.length})</h3>
            <ul>${[...missingDecisions, ...missingFinale].map((id) => `<li><code>${esc(id)}</code></li>`).join('')}</ul>
          </div>` : ''}
        ${missingEvents.length > 0 ? `
          <div>
            <h3>Events without icons (${missingEvents.length})</h3>
            <ul>${missingEvents.map((id) => `<li><code>${esc(id)}</code></li>`).join('')}</ul>
          </div>` : ''}
      </div>`;

  const missingSection = `
    <section class="icon-section missing" id="cat-missing">
      <header class="cat-header"><h2>Missing icons</h2></header>
      ${missingHtml}
    </section>`;

  // 8. Unbucketed (shouldn't happen, but flag it visibly).
  const unbucketedSection = unbucketed.length === 0 ? '' : `
    <section class="icon-section warn" id="cat-unbucketed">
      <header class="cat-header"><h2>Unbucketed icons (categorization bug — fix scripts/icon-descriptions.ts)</h2></header>
      <ul>${unbucketed.map((r) => `<li><code>${esc(r.id)}</code> → <code>${esc(r.componentName)}</code></li>`).join('')}</ul>
    </section>`;

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const totalRegistered = rows.length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(manifest.name)} — icons preview</title>
<style>${ICONS_CSS}</style>
</head>
<body style="background:${esc(palette.background)};color:${esc(palette.ink)}">
<header class="page-header">
  <h1>${esc(manifest.name)} <span class="subtitle">— icons preview</span></h1>
  <p class="meta">pack id: <code>${esc(packId)}</code> · generated ${esc(stamp)} UTC</p>
  <p class="meta">${totalRegistered} registered icons · ${decisions.length} decisions + ${events.length} events in pack · rendered with the pack's own palette.</p>
  <nav class="cat-nav">
    ${ICON_CATEGORIES.map((c) => buckets[c.key].length > 0 ? `<a href="#cat-${c.key}">${esc(c.label)}</a>` : '').filter(Boolean).join(' · ')}
    · <a href="#cat-minigames">Minigames</a> · <a href="#cat-placeholder">Placeholder</a> · <a href="#cat-missing">Missing</a>
  </nav>
</header>
<main>
  ${categorySections}
  ${minigameSection}
  ${placeholderSection}
  ${missingSection}
  ${unbucketedSection}
</main>
<footer class="page-footer">
  <p>Icon-review surface. Each SVG is rendered via <code>react-dom/server</code> with the pack's palette — what you see here is what ships in the modal. Flag the id to swap art.</p>
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// CSS — inline; the HTML is self-contained so reviewers can drag-drop into
// a browser without any build step.
// ---------------------------------------------------------------------------

const TEXT_CSS = `
  :root {
    --bg: #f5f1e8;
    --ink: #2c2c2c;
    --ink-muted: #888;
    --surface: #cfc8b6;
    --accent: #8b6240;
    --positive: #7a8f5c;
    --decision: #4a90e2;
    --event: #b07a3a;
    --narrative: #6b6b6b;
  }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--ink); font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; margin: 0; padding: 0; }
  main { max-width: 860px; margin: 0 auto; padding: 0 24px 64px; }
  .page-header { max-width: 860px; margin: 0 auto; padding: 32px 24px 16px; }
  .page-header h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -0.01em; }
  .page-header .subtitle { color: var(--ink-muted); font-weight: 400; }
  .page-header .meta { color: var(--ink-muted); font-size: 13px; margin: 4px 0; }
  .page-header code { background: var(--surface); padding: 1px 6px; border-radius: 3px; font-size: 12px; }
  .era-nav { font-size: 13px; color: var(--ink-muted); margin-top: 8px; }
  .era-nav a { color: var(--accent); text-decoration: none; }
  .era-nav a:hover { text-decoration: underline; }
  .era-band { margin: 32px 0; }
  .era-header { border-top: 2px solid var(--accent); padding: 12px 0; display: flex; align-items: baseline; justify-content: space-between; }
  .era-header h2 { margin: 0; font-size: 20px; }
  .band-count { color: var(--ink-muted); font-size: 12px; }
  .card { background: rgba(255,255,255,0.5); border: 1px solid var(--surface); border-radius: 6px; padding: 16px; margin: 12px 0; }
  .card-header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; font-size: 12px; }
  .kind-badge { padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10px; letter-spacing: 0.05em; color: white; }
  .decision-badge { background: var(--decision); }
  .event-badge { background: var(--event); }
  .narrative-badge { background: var(--narrative); }
  .month-badge { padding: 2px 6px; border-radius: 3px; background: var(--surface); font-family: ui-monospace, monospace; font-size: 11px; }
  .pool-badge { padding: 2px 6px; border-radius: 3px; background: var(--bg); border: 1px solid var(--surface); font-family: ui-monospace, monospace; font-size: 11px; }
  .tag { padding: 1px 6px; border-radius: 3px; background: var(--bg); color: var(--ink-muted); font-size: 11px; }
  .era-chip { padding: 1px 6px; border-radius: 3px; background: var(--surface); font-size: 11px; }
  .id { color: var(--ink-muted); font-family: ui-monospace, monospace; font-size: 11px; }
  .requires { color: var(--ink-muted); font-size: 12px; margin: 4px 0; }
  .requires code { background: var(--bg); padding: 1px 4px; font-size: 11px; }
  .prompt { margin: 8px 0 12px; font-size: 16px; line-height: 1.45; }
  .options { display: flex; flex-direction: column; gap: 10px; }
  .option { padding: 10px 12px; background: rgba(255,255,255,0.6); border-left: 3px solid var(--decision); border-radius: 0 4px 4px 0; }
  .option-label { font-weight: 600; margin-bottom: 4px; }
  .scene { margin: 4px 0; padding-left: 18px; }
  .scene li { font-style: italic; color: var(--ink); opacity: 0.75; font-size: 14px; }
  .flavor { font-style: italic; color: var(--ink); opacity: 0.85; margin: 6px 0 0; font-size: 14px; }
  .effects { display: flex; gap: 4px; flex-wrap: wrap; margin: 6px 0; }
  .effect-chip { padding: 1px 6px; border-radius: 3px; background: var(--surface); font-family: ui-monospace, monospace; font-size: 11px; }
  .event .card-header { /* same as decision but different accent */ }
  .event-title { margin: 4px 0 6px; font-size: 17px; }
  .body { margin: 4px 0 8px; font-size: 15px; line-height: 1.45; }
  .narrative { background: rgba(255,255,255,0.4); border-left: 3px solid var(--narrative); }
  .narrative-title { font-size: 17px; margin: 4px 0 4px; }
  .narrative-body { font-style: italic; }
  .finale { border-left: 4px solid var(--accent); }
  .frontmatter { margin: 32px 0; padding: 16px; background: rgba(255,255,255,0.4); border-radius: 6px; }
  .frontmatter h2 { margin: 0 0 8px; font-size: 18px; }
  .frontmatter .muted { color: var(--ink-muted); font-size: 13px; margin: 0 0 8px; }
  .intro-lines, .tagline-list, .transition-list { margin: 0; padding-left: 20px; }
  .intro-lines li, .tagline-list li, .transition-list li { font-style: italic; line-height: 1.5; margin: 2px 0; }
  .name-list { font-family: ui-monospace, monospace; font-size: 13px; color: var(--ink); }
  .continue-label, .minigame-note { font-size: 13px; color: var(--ink-muted); margin: 4px 0 0; }
  .page-footer { max-width: 860px; margin: 32px auto; padding: 16px 24px; color: var(--ink-muted); font-size: 13px; border-top: 1px solid var(--surface); }
`;

const ICONS_CSS = `
  :root {
    --ink-muted: #888;
    --surface: #cfc8b6;
    --accent: #8b6240;
  }
  * { box-sizing: border-box; }
  body { font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; margin: 0; padding: 0; }
  main { max-width: 1200px; margin: 0 auto; padding: 0 24px 64px; }
  .page-header { max-width: 1200px; margin: 0 auto; padding: 32px 24px 16px; }
  .page-header h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -0.01em; }
  .page-header .subtitle { color: var(--ink-muted); font-weight: 400; }
  .page-header .meta { color: var(--ink-muted); font-size: 13px; margin: 4px 0; }
  .page-header code { background: var(--surface); padding: 1px 6px; border-radius: 3px; font-size: 12px; }
  .cat-nav { font-size: 13px; color: var(--ink-muted); margin-top: 8px; }
  .cat-nav a { color: var(--accent); text-decoration: none; }
  .cat-nav a:hover { text-decoration: underline; }
  .icon-section { margin: 32px 0; }
  .cat-header { border-top: 2px solid var(--accent); padding: 12px 0; display: flex; align-items: baseline; justify-content: space-between; }
  .cat-header h2 { margin: 0; font-size: 20px; }
  .cat-count { color: var(--ink-muted); font-size: 12px; }
  .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-top: 12px; }
  .icon-card { display: flex; gap: 12px; padding: 12px; background: rgba(255,255,255,0.5); border: 1px solid var(--surface); border-radius: 6px; align-items: flex-start; }
  .icon-frame { flex-shrink: 0; }
  .icon-frame svg { display: block; }
  .icon-meta { flex: 1; min-width: 0; }
  .icon-meta code.id { display: block; font-family: ui-monospace, monospace; font-size: 11px; color: var(--ink-muted); }
  .icon-meta code.comp { display: block; font-family: ui-monospace, monospace; font-size: 12px; font-weight: 600; margin: 2px 0; }
  .icon-meta .desc { margin: 4px 0 0; font-size: 13px; line-height: 1.4; }
  .missing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .missing h3 { font-size: 15px; margin: 8px 0; }
  .missing ul { margin: 0; padding-left: 18px; font-family: ui-monospace, monospace; font-size: 12px; }
  .all-covered { padding: 12px; background: rgba(122,143,92,0.15); border: 1px solid #7a8f5c; border-radius: 4px; }
  .warn { background: rgba(220,150,50,0.15); border: 1px solid var(--accent); border-radius: 4px; padding: 12px; }
  .muted { color: var(--ink-muted); font-size: 13px; }
  .page-footer { max-width: 1200px; margin: 32px auto; padding: 16px 24px; color: var(--ink-muted); font-size: 13px; border-top: 1px solid var(--surface); }
`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const { packs } = parseArgs(process.argv);

  ensureDir(TEXT_OUT_DIR);
  ensureDir(ICON_OUT_DIR);

  for (const packId of packs) {
    const packDir = resolve(CAREERS_DIR, packId);
    if (!existsSync(packDir)) {
      console.error(`✗ pack not found: ${packId} (no dir at ${packDir})`);
      continue;
    }
    const shortName = PACK_SHORT_NAME[packId] ?? packId;
    console.log(`→ ${packId} (output: ${shortName}.html)`);

    const pack = loadPack(packId);
    const textHtml = buildTextHtml(pack, packId);
    const iconsHtml = buildIconsHtml(pack, packId);

    const textPath = resolve(TEXT_OUT_DIR, `${shortName}.html`);
    const iconPath = resolve(ICON_OUT_DIR, `${shortName}.html`);
    writeFileSync(textPath, textHtml, 'utf8');
    writeFileSync(iconPath, iconsHtml, 'utf8');

    console.log(`  ✓ ${textPath}`);
    console.log(`  ✓ ${iconPath}`);
  }

  console.log('\ndone.');
}

main();
