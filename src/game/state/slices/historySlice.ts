import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

export interface HistoryState {
  decisions: DecisionRecord[];
  events: EventRecord[];
}

const initialState: HistoryState = {
  decisions: [],
  events: [],
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
    resetHistory() {
      return initialState;
    },
  },
});

export const { recordDecision, recordEvent, resetHistory } = historySlice.actions;
export default historySlice.reducer;
