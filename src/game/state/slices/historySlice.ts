import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface DecisionRecord {
  monthId: number;
  decisionId: string;
  optionTaken: string;
  timestamp: number;
}

export interface HistoryState {
  decisions: DecisionRecord[];
}

const initialState: HistoryState = {
  decisions: [],
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    recordDecision(state, action: PayloadAction<DecisionRecord>) {
      state.decisions.push(action.payload);
    },
    resetHistory() {
      return initialState;
    },
  },
});

export const { recordDecision, resetHistory } = historySlice.actions;
export default historySlice.reducer;
