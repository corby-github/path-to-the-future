import { useRoomTransition } from '../engine/useRoomTransition';
import { DecisionRoom } from './DecisionRoom';
import { NarrativeRoom } from './NarrativeRoom';
import { MinigameRoom } from './MinigameRoom';
import { ConsequenceRoom } from './ConsequenceRoom';
import type { RoomConfig } from '../types/room';

interface Props {
  config: RoomConfig;
}

export function RoomRenderer({ config }: Props) {
  const { fading, fadeMs, exitRoom } = useRoomTransition();

  let inner: React.ReactNode;
  switch (config.roomType) {
    case 'decision':
      inner = <DecisionRoom config={config} onExit={exitRoom} />;
      break;
    case 'narrative':
      inner = <NarrativeRoom config={config} onContinue={exitRoom} />;
      break;
    case 'minigame':
      inner = <MinigameRoom config={config} onComplete={exitRoom} />;
      break;
    case 'consequence':
      inner = <ConsequenceRoom config={config} onContinue={exitRoom} />;
      break;
  }

  return (
    <div
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease`,
      }}
    >
      {inner}
    </div>
  );
}
