import { useRoomTransition } from '../engine/useRoomTransition';
import { useTrackPageview } from '../analytics/track';
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
  // Per §24: every room mount fires `/month/{nn}` (zero-padded 2-digit
  // monthId, 1–70 under v2.0.8). MinigameRoom additionally fires its
  // own `/minigame/{variant}` slug from inside the component.
  useTrackPageview(`/month/${String(config.monthId).padStart(2, '0')}`);

  // key on monthId forces an unmount/remount on every month change so
  // per-room state (triggered refs, player position) doesn't leak between
  // consecutive rooms of the same type — most notably decision → decision,
  // where React would otherwise reuse the component instance.
  let inner: React.ReactNode;
  switch (config.roomType) {
    case 'decision':
      inner = <DecisionRoom key={config.monthId} config={config} onExit={exitRoom} />;
      break;
    case 'narrative':
      inner = <NarrativeRoom key={config.monthId} config={config} onContinue={exitRoom} />;
      break;
    case 'minigame':
      inner = <MinigameRoom key={config.monthId} config={config} onComplete={exitRoom} />;
      break;
    case 'consequence':
      inner = <ConsequenceRoom key={config.monthId} config={config} onContinue={exitRoom} />;
      break;
  }

  return (
    <div
      data-component="RoomRenderer"
      data-room-type={config.roomType}
      data-month-id={config.monthId}
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease`,
      }}
    >
      {inner}
    </div>
  );
}
