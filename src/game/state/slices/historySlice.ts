import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MinigameVariant } from '../../types/room';

export interface DecisionRecord {
  monthId: number;
  decisionId: string;
  optionTaken: string;
  timestamp: number;
}

export interface EventRecord {
  monthId: number;
  eventId: string;
  timestamp: number;
}

// Issue #33 — one record per minigame played. Used to render the frozen
// result screen when the player walks back into a minigame month via the
// backward door. `result` matches the minigame's own outcome semantics:
// blackjack uses 'win' | 'lose' | 'push'; code-review and stacker use
// 'win' | 'partial' | 'fail'. `detail` carries variant-specific summary
// info (e.g. final hand totals for blackjack, stacks count for stacker)
// so the replay screen can recreate the moment.

export interface MinigameRecord {
  monthId: number;
  variant: MinigameVariant;
  result: string;
  detail?: string;
  timestamp: number;
}

export interface HistoryState {
  decisions: DecisionRecord[];
  events: EventRecord[];
  minigames: MinigameRecord[];
}

const initialState: HistoryState = {
  decisions: [],
  events: [],
  minigames: [],
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    recordDecision(state, action: PayloadAction<DecisionRecord>) {
      state.decisions.push(action.payload);
    },
    recordEvent(state, action: PayloadAction<EventRecord>) {
      state.events.push(action.payload);
    },
    recordMinigame(state, action: PayloadAction<MinigameRecord>) {
      state.minigames.push(action.payload);
    },
    resetHistory() {
      return initialState;
    },
  },
});

export const {
  recordDecision,
  recordEvent,
  recordMinigame,
  resetHistory,
} = historySlice.actions;
export default historySlice.reducer;
