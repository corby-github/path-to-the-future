import { useState, type CSSProperties, type FormEvent } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { MAX_NAME_LENGTH, sanitizeName } from '../content/nameSanitize';

// Name entry per §13. Strips HTML and caps at 24 chars. The submitted name is
// trimmed; an all-whitespace input is treated as empty.
//
// Calls `onSubmit(name)` when the user clicks Continue or hits Enter.

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
    // Matches EndgameScreen / TitleScreen / CareerPicker.
    letterSpacing: '0.02em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    color: palette.inkMuted,
    margin: 0,
  };

  // Input now uses an ink border (matches the modal-button border weight
  // + color). Was a 1.5px surface border which read as chrome rather
  // than "of-the-game."
  const inputStyle: CSSProperties = {
    fontSize: 18,
    padding: '12px 14px',
    border: `1px solid ${palette.ink}`,
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

  // Outlined modal-button style — matches DecisionModal Continue,
  // CreditsScreen Close, EndgameScreen actions. Centered.
  const buttonStyle: CSSProperties = {
    alignSelf: 'center',
    padding: '12px 32px',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    opacity: canSubmit ? 1 : 0.4,
    transition: 'background 120ms, opacity 120ms',
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

