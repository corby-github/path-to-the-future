export type RoomType = 'decision' | 'minigame' | 'narrative' | 'consequence';

export type MinigameVariant = 'blackjack' | 'code-review' | 'reaction-sprint';

interface BaseRoomConfig {
  monthId: number;
  roomType: RoomType;
}

export interface DecisionRoomConfig extends BaseRoomConfig {
  roomType: 'decision';
}

export interface NarrativeRoomConfig extends BaseRoomConfig {
  roomType: 'narrative';
  title: string;
  body: string;
  continueLabel?: string;
}

export interface MinigameRoomConfig extends BaseRoomConfig {
  roomType: 'minigame';
  variant: MinigameVariant;
}

export interface ConsequenceRoomConfig extends BaseRoomConfig {
  roomType: 'consequence';
  title: string;
  body: string;
}

export type RoomConfig =
  | DecisionRoomConfig
  | NarrativeRoomConfig
  | MinigameRoomConfig
  | ConsequenceRoomConfig;
