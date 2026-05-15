import { useState, type CSSProperties, type FormEvent } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { MAX_NAME_LENGTH, sanitizeName } from '../content/nameSanitize';

// Kid-names entry (issue #76). Mounted only when the active pack manifest
// declares `requiresKidNames`. Two stacked inputs prefilled with the
// current defaults (`Hazel` / `Bram`); the player can edit, accept as-is,
// or rename. Both names must sanitize to non-empty before Continue enables
// — mirrors NameEntry's rule.
//
// `kidA` = older sibling, `kidB` = younger. Tokens in pack content
// (`{kidA}` / `{kidB}`) interpolate against these.

interface Props {
  initialKidAName: string;
  initialKidBName: string;
  onSubmit: (kidAName: string, kidBName: string) => void;
}

export function KidNamesEntry({ initialKidAName, initialKidBName, onSubmit }: Props) {
  const { palette } = useCareerPack();
  const [rawA, setRawA] = useState(initialKidAName);
  const [rawB, setRawB] = useState(initialKidBName);

  const sanitizedA = sanitizeName(rawA);
  const sanitizedB = sanitizeName(rawB);
  const canSubmit = sanitizedA.length > 0 && sanitizedB.length > 0;

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (canSubmit) onSubmit(sanitizedA, sanitizedB);
  };

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
    letterSpacing: '0.02em',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    color: palette.inkMuted,
    margin: 0,
  };

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

  const fieldLabelStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 4,
  };

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const counterStyle: CSSProperties = {
    fontSize: 11,
    color: palette.inkMuted,
    alignSelf: 'flex-end',
    letterSpacing: '0.04em',
  };

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
    <div data-component="KidNamesEntry" style={screenStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h1 style={titleStyle}>Your kids</h1>
        <p style={subtitleStyle}>
          The two you'll spend the next ten years with. Names can be changed later from the profile chip.
        </p>

        <div style={fieldStyle}>
          <span style={fieldLabelStyle}>Older</span>
          <input
            type="text"
            data-field="kid-a-name"
            value={rawA}
            onChange={(e) => setRawA(e.target.value)}
            maxLength={MAX_NAME_LENGTH * 2}
            autoFocus
            style={inputStyle}
            placeholder="Hazel"
            aria-label="Older child's name"
          />
          <span style={counterStyle} aria-live="polite" aria-atomic="true">
            {sanitizedA.length}/{MAX_NAME_LENGTH}
          </span>
        </div>

        <div style={fieldStyle}>
          <span style={fieldLabelStyle}>Younger</span>
          <input
            type="text"
            data-field="kid-b-name"
            value={rawB}
            onChange={(e) => setRawB(e.target.value)}
            maxLength={MAX_NAME_LENGTH * 2}
            style={inputStyle}
            placeholder="Bram"
            aria-label="Younger child's name"
          />
          <span style={counterStyle} aria-live="polite" aria-atomic="true">
            {sanitizedB.length}/{MAX_NAME_LENGTH}
          </span>
        </div>

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
