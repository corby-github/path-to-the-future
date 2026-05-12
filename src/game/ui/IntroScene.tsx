import { type CSSProperties } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { useCareerPack } from '../content/useCareerPack';
import { useAppSelector } from '../state/hooks';
import { ScenePlayer } from './ScenePlayer';

// Pre-game narrative per §16 step 4. Reads `manifest.intro` from the loaded
// career pack and plays it via the existing ScenePlayer. Interpolates
// {playerName} from the persisted profile.
//
// If the pack has no intro defined, this component skips itself immediately
// (calling onComplete on first render via a guard in the parent orchestrator
// — this component only renders when intro lines exist).

interface Props {
  onComplete: () => void;
}

export function IntroScene({ onComplete }: Props) {
  const { pack, palette } = useCareerPack();
  const profile = useAppSelector((s) => s.profile);

  const lines = pack.manifest.intro ?? [];

  // Outer = canvas frame. The narrative scene plays inside the same
  // bounded 1000×600 envelope as the rest of the app. Dark page
  // wrapper comes from App.tsx's <PageFrame>.
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

  // ScenePlayer guards on `scene[index] === undefined`. If lines is empty,
  // it renders null — the parent orchestrator should advance past this
  // component in that case, but as a safety net we fire onComplete on mount.
  if (lines.length === 0) {
    queueMicrotask(onComplete);
    return null;
  }

  return (
    <div data-component="IntroScene" style={screenStyle}>
      <ScenePlayer
        scene={lines}
        vars={{ playerName: profile.name }}
        onComplete={onComplete}
        lineMs={3500}
      />
    </div>
  );
}
