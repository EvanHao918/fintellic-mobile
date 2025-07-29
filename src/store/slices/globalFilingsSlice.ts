// src/store/slices/globalFilingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filing, VoteType } from '../../types';

interface GlobalFilingsState {
  // 存储所有已加载的 filings，以 id 为 key
  filingsById: Record<string, Filing>;
}

const initialState: GlobalFilingsState = {
  filingsById: {},
};

const globalFilingsSlice = createSlice({
  name: 'globalFilings',
  initialState,
  reducers: {
    // 添加或更新 filings
    updateFilings: (state, action: PayloadAction<Filing[]>) => {
      action.payload.forEach(filing => {
        state.filingsById[filing.id.toString()] = filing;
      });
    },
    // 更新单个 filing
    updateFiling: (state, action: PayloadAction<Filing>) => {
      const filing = action.payload;
      state.filingsById[filing.id.toString()] = filing;
    },
    // 更新投票
    updateFilingVoteGlobal: (state, action: PayloadAction<{
      filingId: number;
      vote_counts: { bullish: number; neutral: number; bearish: number };
      user_vote: VoteType;
    }>) => {
      const { filingId, vote_counts, user_vote } = action.payload;
      const filing = state.filingsById[filingId.toString()];
      if (filing) {
        filing.vote_counts = vote_counts;
        filing.user_vote = user_vote;
      }
    },
    // 清除所有数据
    clearGlobalFilings: (state) => {
      state.filingsById = {};
    },
  },
});

export const { 
  updateFilings, 
  updateFiling, 
  updateFilingVoteGlobal, 
  clearGlobalFilings 
} = globalFilingsSlice.actions;

// Selectors
export const selectFilingById = (state: any, filingId: number | string) => 
  state.globalFilings.filingsById[filingId.toString()];

export const selectAllFilings = (state: any) => 
  Object.values(state.globalFilings.filingsById);

export default globalFilingsSlice.reducer;