// Career meta-list per §16. As of the homeschool-parent Phase-1 starter,
// two packs ship as playable (software-engineering, homeschool-parent —
// the latter is voice-checkpoint scaffolded per §26). The remaining four
// entries are shown in the picker as "Coming Soon" and not selectable.
//
// Adding a new playable career means: (a) add the manifest/months/decisions/
// events under `public/careers/{id}/`, (b) flip `playable: true` here, and
// (c) optionally relabel stat names via `manifest.statLabels` (§26 v2.0).

export interface CareerListing {
  id: string;
  name: string;
  tagline: string;
  playable: boolean;
}

export const CAREERS: readonly CareerListing[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    tagline: 'Ship, learn, repeat.',
    playable: true,
  },
  {
    id: 'homeschool-parent',
    name: 'Homeschool Parent',
    tagline: 'Two kids, ten years, one kitchen table.',
    playable: true,
  },
  {
    id: 'cpa-personal-finance',
    name: 'CPA / Personal Finance',
    tagline: "Numbers don't lie. People do.",
    playable: false,
  },
  {
    id: 'medical-supplier',
    name: 'Medical Supplier',
    tagline: 'B2B sales meets the hospital floor.',
    playable: false,
  },
  {
    id: 'nurse',
    name: 'Nurse',
    tagline: 'Twelve-hour shifts. A lifetime of moments.',
    playable: false,
  },
  {
    id: 'security-police',
    name: 'Security / Police Officer',
    tagline: 'Sworn to serve. Always on call.',
    playable: false,
  },
] as const;
