import { type CSSProperties } from 'react';
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

  const screenStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: palette.background,
    color: palette.ink,
    fontFamily:
      "inherit",
    padding: 32,
  };

  // ScenePlayer guards on `scene[index] === undefined`. If lines is empty,
  // it renders null — the parent orchestrator should advance past this
  // component in that case, but as a safety net we fire onComplete on mount.
  if (lines.length === 0) {
    queueMicrotask(onComplete);
    return null;
  }

  return (
    <div style={screenStyle}>
      <ScenePlayer
        scene={lines}
        vars={{ playerName: profile.name }}
        onComplete={onComplete}
        lineMs={3500}
      />
    </div>
  );
}
