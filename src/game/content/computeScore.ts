import type { StatsState } from '../state/slices/statsSlice';
import type { ProgressState } from '../state/slices/progressSlice';
import type { HistoryState } from '../state/slices/historySlice';

export interface ScoreBreakdown {
  experience: number;
  savings: number;
  wellbeing: number;
  burnoutPenalty: number;
  relationshipBonus: number;
  decisions: number;
  total: number;
}

// Endgame score per design doc §7. Not surfaced during play; derived at endgame
// from final stat state, XP, and decision history. Weights are tunable —
// keep them interpretable so the player can see which dimensions paid off.
export function computeScore(
  stats: StatsState,
  progress: ProgressState,
  history: HistoryState,
): ScoreBreakdown {
  const experience = progress.xp;
  const savings = Math.floor(stats.savings / 10);
  const wellbeing =
    (stats.network + stats.health + stats.technicalSkill + Math.max(0, stats.reputation)) * 25;
  const burnoutPenalty = -stats.burnout * 15;
  const relationshipBonus = stats.relationship !== null ? stats.relationship * 20 : 0;
  const decisions = history.decisions.length * 25;

  const total =
    experience + savings + wellbeing + burnoutPenalty + relationshipBonus + decisions;

  return {
    experience,
    savings,
    wellbeing,
    burnoutPenalty,
    relationshipBonus,
    decisions,
    total,
  };
}
