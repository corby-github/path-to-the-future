import { Blackjack } from '../minigames/Blackjack';
import { CodeReview } from '../minigames/CodeReview';
import { Stacker } from '../minigames/Stacker';
import { MinigameReplayCard } from './MinigameReplayCard';
import { useCareerPack } from '../content/useCareerPack';
import type { MinigameRoomConfig } from '../types/room';

interface Props {
  config: MinigameRoomConfig;
  onComplete: () => void;
}

export function MinigameRoom({ config, onComplete }: Props) {
  const { isReplay } = useCareerPack();

  // Backward replay (#33): don't replay the game — show the frozen result
  // from history.minigames so the player sees what happened the first
  // time without re-earning XP or stats.
  if (isReplay) {
    return <MinigameReplayCard monthId={config.monthId} variant={config.variant} />;
  }

  switch (config.variant) {
    case 'blackjack':
      return <Blackjack monthId={config.monthId} onComplete={onComplete} />;
    case 'code-review':
      return <CodeReview monthId={config.monthId} onComplete={onComplete} />;
    case 'reaction-sprint':
      return <Stacker monthId={config.monthId} onComplete={onComplete} />;
  }
}
