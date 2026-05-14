// Name sanitization shared between the init-flow `NameEntry` (§16) and
// the mid-game `ProfileModal` (§13 v2.0.7). Both apply identical rules so
// a name that was valid at init can be re-entered at edit time without
// surprises.

export const MAX_NAME_LENGTH = 24;

// §13: "Sanitized (HTML stripped, length capped at 24 chars)."
// Strip anything that looks like an HTML tag, collapse whitespace, then cap.
export function sanitizeName(raw: string): string {
  const noTags = raw.replace(/<[^>]*>/g, '');
  const collapsed = noTags.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, MAX_NAME_LENGTH);
}
