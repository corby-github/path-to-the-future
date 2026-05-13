import { Blackjack } from './Blackjack';
import { CodeReview } from './CodeReview';
import { Stacker } from './Stacker';
import { Pong } from './Pong';
import { FortyTwo } from './FortyTwo';
import type { MinigameVariant } from '../types/room';

// Thin component that picks the minigame implementation for a variant.
// Shared by MinigameRoom (scheduled months 32/60/90) and ArcadeModal
// (arcade cabinet, issue #31) so the switch lives in exactly one place.
//
// `mode` and `awardRewards` are forwarded to the chosen minigame so the
// scheduled vs arcade distinction (and arcade throttle gating) is handled
// uniformly. `monthId` for arcade plays is the player's current month —
// arcade plays aren't recorded to history, but the minigame headers still
// show the month label for context.

interface Props {
  variant: MinigameVariant;
  monthId: number;
  mode?: 'scheduled' | 'arcade';
  awardRewards?: boolean;
  onComplete: () => void;
}

export function MinigameByVariant({ variant, monthId, mode, awardRewards, onComplete }: Props) {
  switch (variant) {
    case 'blackjack':
      return <Blackjack monthId={monthId} mode={mode} awardRewards={awardRewards} onComplete={onComplete} />;
    case 'code-review':
      return <CodeReview monthId={monthId} mode={mode} awardRewards={awardRewards} onComplete={onComplete} />;
    case 'reaction-sprint':
      return <Stacker monthId={monthId} mode={mode} awardRewards={awardRewards} onComplete={onComplete} />;
    case 'pong':
      return <Pong monthId={monthId} mode={mode} awardRewards={awardRewards} onComplete={onComplete} />;
    case 'forty-two':
      return <FortyTwo monthId={monthId} mode={mode} awardRewards={awardRewards} onComplete={onComplete} />;
  }
}
