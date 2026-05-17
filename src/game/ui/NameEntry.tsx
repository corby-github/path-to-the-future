import { useState, type CSSProperties, type FormEvent } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useTrackPageview } from '../analytics/track';
import { MAX_NAME_LENGTH, sanitizeName } from '../content/nameSanitize';

// Name entry per §13. Strips HTML and caps at 24 chars. The submitted name is
// trimmed; an all-whitespace input is treated as empty.
//
// Calls `onSubmit(name)` when the user clicks Continue or hits Enter.

interface Props {
  onSubmit: (name: string) => void;
}

export function NameEntry({ onSubmit }: Props) {
  useTrackPageview('/init/name');
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
  // aspectRatio is a *minimum*, not a lock — at very short viewports
  // the title/input/counter/button can't fit inside 0.6× canvas width,
  // so we let the frame grow taller and let the page scroll instead of
  // clipping the header + Continue button. `containerType: inline-size`
  // lets paddings / gaps / fonts size off canvas width via `cqw`.
  const screenStyle: CSSProperties = {
    width: 'var(--canvas-display-width)',
    minHeight: `calc(var(--canvas-display-width) * ${ROOM_VIEWBOX.height} / ${ROOM_VIEWBOX.width})`,
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
    padding: 'clamp(12px, 3.2cqw, 32px)',
    overflow: 'visible',
    containerType: 'inline-size',
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
    gap: 'clamp(10px, 2.4cqw, 24px)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'clamp(14px, 2.2cqw, 22px)',
    fontWeight: 600,
    margin: 0,
    // Matches EndgameScreen / TitleScreen / CareerPicker.
    letterSpacing: '0.02em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'clamp(10px, 1.3cqw, 13px)',
    color: palette.inkMuted,
    margin: 0,
  };

  // Input now uses an ink border (matches the modal-button border weight
  // + color). Was a 1.5px surface border which read as chrome rather
  // than "of-the-game."
  const inputStyle: CSSProperties = {
    fontSize: 'clamp(13px, 1.8cqw, 18px)',
    padding: 'clamp(8px, 1.2cqw, 12px) clamp(10px, 1.4cqw, 14px)',
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
    fontSize: 'clamp(9px, 1.1cqw, 11px)',
    color: palette.inkMuted,
    alignSelf: 'flex-end',
    letterSpacing: '0.04em',
  };

  // Outlined modal-button style — matches DecisionModal Continue,
  // CreditsScreen Close, EndgameScreen actions. Centered.
  const buttonStyle: CSSProperties = {
    alignSelf: 'center',
    padding: 'clamp(8px, 1.2cqw, 12px) clamp(20px, 3.2cqw, 32px)',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 'clamp(11px, 1.3cqw, 13px)',
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

