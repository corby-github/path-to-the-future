import type { MonthEntry } from '../types/careerPack';
import type { RoomConfig, MinigameVariant } from '../types/room';

export function roomConfigForMonth(month: MonthEntry): RoomConfig {
  const type = month.roomType ?? 'decision';
  switch (type) {
    case 'narrative':
      return {
        monthId: month.id,
        roomType: 'narrative',
        title: month.title ?? 'A moment of pause',
        body: month.body ?? '',
        continueLabel: month.continueLabel,
      };
    case 'minigame':
      return {
        monthId: month.id,
        roomType: 'minigame',
        variant: (month.variant as MinigameVariant) ?? 'code-review',
      };
    case 'consequence':
      return {
        monthId: month.id,
        roomType: 'consequence',
        title: month.title ?? 'A turning point',
        body: month.body ?? '',
      };
    case 'decision':
    default:
      return { monthId: month.id, roomType: 'decision' };
  }
}
