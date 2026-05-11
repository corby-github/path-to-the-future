import { Blackjack } from '../minigames/Blackjack';
import { CodeReview } from '../minigames/CodeReview';
import { Stacker } from '../minigames/Stacker';
import type { MinigameRoomConfig } from '../types/room';

interface Props {
  config: MinigameRoomConfig;
  onComplete: () => void;
}

export function MinigameRoom({ config, onComplete }: Props) {
  switch (config.variant) {
    case 'blackjack':
      return <Blackjack monthId={config.monthId} onComplete={onComplete} />;
    case 'code-review':
      return <CodeReview monthId={config.monthId} onComplete={onComplete} />;
    case 'reaction-sprint':
      return <Stacker monthId={config.monthId} onComplete={onComplete} />;
  }
}
