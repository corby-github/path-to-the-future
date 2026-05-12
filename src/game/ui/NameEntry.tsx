import { useState, type CSSProperties, type FormEvent } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';

// Name entry per §13. Strips HTML and caps at 24 chars. The submitted name is
// trimmed; an all-whitespace input is treated as empty.
//
// Calls `onSubmit(name)` when the user clicks Continue or hits Enter.

const MAX_NAME_LENGTH = 24;

interface Props {
  onSubmit: (name: string) => void;
}

export function NameEntry({ onSubmit }: Props) {
  const { palette } = useCareerPack();
  const [raw, setRaw] = useState('');

  const sanitized = sanitizeName(raw);
  const canSubmit = sanitized.length > 0;

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (canSubmit) onSubmit(sanitized);
  };

  // Outer = canvas frame, matching TitleScreen / EndgameScreen / the
  // other init phases. Dark page wrapper comes from App.tsx's <PageFrame>.
  const screenStyle: CSSProperties = {
    width: 'var(--canvas-display-width)',
    aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.surface}`,
    borderRadius: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    overflow: 'hidden',
  };

  // Inner card — width-constrained content column. Outer canvas frame
  // is the only visible border now.
  const cardStyle: CSSProperties = {
    background: 'transparent',
    padding: 0,
    maxWidth: 480,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.01em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    color: palette.inkMuted,
    margin: 0,
  };

  const inputStyle: CSSProperties = {
    fontSize: 18,
    padding: '12px 14px',
    border: `1.5px solid ${palette.surface}`,
    borderRadius: 4,
    background: palette.background,
    color: palette.ink,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const counterStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    alignSelf: 'flex-end',
    letterSpacing: '0.04em',
  };

  const buttonStyle: CSSProperties = {
    alignSelf: 'flex-end',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 22px',
    border: 'none',
    borderRadius: 4,
    background: canSubmit ? palette.ink : palette.surface,
    color: canSubmit ? palette.background : palette.inkMuted,
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    letterSpacing: '0.02em',
    transition: 'background 120ms ease',
  };

  return (
    <div data-component="NameEntry" style={screenStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h1 style={titleStyle}>Your name</h1>
        <p style={subtitleStyle}>
          What does the world call you? You'll see it in the story.
        </p>

        <input
          type="text"
          data-field="player-name"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          maxLength={MAX_NAME_LENGTH * 2 /* allow paste; we sanitize after */}
          autoFocus
          style={inputStyle}
          placeholder="Maya"
          aria-label="Your name"
        />
        <span style={counterStyle} aria-live="polite" aria-atomic="true">
          {sanitized.length}/{MAX_NAME_LENGTH}
        </span>

        <button
          type="submit"
          data-action="continue"
          style={buttonStyle}
          disabled={!canSubmit}
        >
          Continue
        </button>
      </form>
    </div>
  );
}

// §13: "Sanitized (HTML stripped, length capped at 24 chars)."
// Strip anything that looks like an HTML tag, collapse whitespace, then cap.
function sanitizeName(raw: string): string {
  const noTags = raw.replace(/<[^>]*>/g, '');
  const collapsed = noTags.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, MAX_NAME_LENGTH);
}
