import type { InteractableDef } from '../types/careerPack';
import { interpolate } from './interpolate';

// Display label for an interactable. Prefers the authored `label` field
// from the career pack; falls back to a derivation that strips the `obj-` /
// `npc-` prefix and Title-cases the first letter (so packs that haven't
// authored labels yet still render something readable).
//
// Used by DecisionRoom for the `[E]` sprite caption (#27) and NPCModal for
// the speaker header (#28). Optional `vars` (issue #76) lets packs author
// `label: "{kidA}"` and have it resolve to the live profile value at
// render time. When `vars` is omitted, tokens render literal (back-compat).
export function labelFor(def: InteractableDef, vars?: Record<string, string | undefined>): string {
  if (def.label) return vars ? interpolate(def.label, vars) : def.label;
  const stripped = def.id.replace(/^(obj-|npc-)/, '').replace(/-/g, ' ');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// Speaker-header phrasing for the NPC dialog box (#28). NPCs say things;
// objects don't — they get plain-label headers.
export function speakerHeaderFor(def: InteractableDef, vars?: Record<string, string | undefined>): string {
  const name = labelFor(def, vars);
  return def.kind === 'npc' ? `${name} says…` : `${name}.`;
}
