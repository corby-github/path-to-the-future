import type { CSSProperties } from 'react';
import type { Palette } from '../types/careerPack';

// Keyboard-controls illustration (issues #89 + #92). Two cross/diamond
// clusters — arrows on the left, WASD on the right — rendered as small
// bordered cells in the cream/ink dialog idiom. Mounted in two surfaces:
// the first-run TutorialOverlay and the canvas misclick prompt.
//
// Stateless. All visual config flows through props so callers can scale
// (tutorial bubble vs centered overlay) and animate (double-tap pulse for
// the sprint tutorial step in issue #92).
//
//   ┌───┐                ┌───┐
//   │ ↑ │                │ W │
// ┌─┴───┴─┐ ┌───┐ ┌─┴───┴─┐ ┌───┐
// │ ← │ ↓ │ │ → │  │ A │ S │ │ D │
// └─┴───┴─┘ └───┘ └─┴───┴─┘ └───┘
//
// Layout uses CSS grid for the cross; each key is a bordered square cell.

export type SprintPulseDirection = 'up' | 'down' | 'left' | 'right' | null;

interface Props {
  palette: Palette;
  // Pixel size of each key cell. Default 36 matches the tutorial bubble
  // scale; larger sizes (48–56) suit the canvas-centered misclick prompt.
  size?: number;
  // Optional caption rendered below both clusters. Tutorial steps pass
  // copy like "Move with the keyboard"; the misclick prompt may pass
  // nothing and rely on the surrounding overlay copy.
  caption?: string;
  // Issue #92 sprint tutorial: highlights one arrow + the matching WASD
  // glyph with a CSS pulse keyframe ("tap twice and hold"). `null`
  // suppresses the pulse — baseline tutorial + misclick prompt should
  // not animate.
  pulseDirection?: SprintPulseDirection;
}

export function KeysWidget({
  palette,
  size = 36,
  caption,
  pulseDirection = null,
}: Props) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  };

  const clustersRowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  };

  const captionStyle: CSSProperties = {
    margin: 0,
    fontSize: 12,
    color: palette.inkMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.85,
  };

  return (
    <div
      data-component="KeysWidget"
      data-pulse={pulseDirection ?? 'none'}
      style={containerStyle}
    >
      <div style={clustersRowStyle}>
        <KeyCross
          palette={palette}
          size={size}
          glyphs={{ up: '↑', left: '←', down: '↓', right: '→' }}
          pulseDirection={pulseDirection}
        />
        <KeyCross
          palette={palette}
          size={size}
          glyphs={{ up: 'W', left: 'A', down: 'S', right: 'D' }}
          pulseDirection={pulseDirection}
        />
      </div>
      {caption && <p style={captionStyle}>{caption}</p>}
    </div>
  );
}

interface KeyCrossProps {
  palette: Palette;
  size: number;
  glyphs: { up: string; left: string; down: string; right: string };
  pulseDirection: SprintPulseDirection;
}

function KeyCross({ palette, size, glyphs, pulseDirection }: KeyCrossProps) {
  // 3×2 CSS grid: row 1 is just the top key centered; row 2 holds
  // left/down/right side-by-side. Gaps between cells match the size/9
  // ratio used in the modal-icon house-style (light visual breathing).
  const gap = Math.max(4, Math.round(size / 9));

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `${size}px ${size}px ${size}px`,
    gridTemplateRows: `${size}px ${size}px`,
    gap,
    justifyContent: 'center',
  };

  return (
    <div style={gridStyle}>
      <span /> {/* row1 col1 — empty */}
      <Key
        palette={palette}
        size={size}
        glyph={glyphs.up}
        pulse={pulseDirection === 'up'}
      />
      <span /> {/* row1 col3 — empty */}
      <Key
        palette={palette}
        size={size}
        glyph={glyphs.left}
        pulse={pulseDirection === 'left'}
      />
      <Key
        palette={palette}
        size={size}
        glyph={glyphs.down}
        pulse={pulseDirection === 'down'}
      />
      <Key
        palette={palette}
        size={size}
        glyph={glyphs.right}
        pulse={pulseDirection === 'right'}
      />
    </div>
  );
}

interface KeyProps {
  palette: Palette;
  size: number;
  glyph: string;
  pulse: boolean;
}

function Key({ palette, size, glyph, pulse }: KeyProps) {
  const fontSize = Math.round(size * 0.45);
  const style: CSSProperties = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.background,
    color: palette.ink,
    border: `2px solid ${palette.ink}`,
    borderRadius: 4,
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize,
    lineHeight: 1,
    // Issue #92 sprint tutorial — pulse the named glyph to read as
    // "double-tap." Other glyphs render statically. Keyframe lives in
    // global.css alongside `decision-modal-dialog-pop`.
    animation: pulse ? 'keys-widget-pulse 900ms ease-in-out infinite' : undefined,
  };
  return <span style={style}>{glyph}</span>;
}
