// src/store/slices/votesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VoteType } from '../../types';

interface VoteData {
  vote_counts: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  user_vote: VoteType | null;
}

interface VotesState {
  // 存储所有 filing 的投票数据，key 是 filingId
  votes: Record<string, VoteData>;
}

const initialState: VotesState = {
  votes: {},
};

const votesSlice = createSlice({
  name: 'votes',
  initialState,
  reducers: {
    // 更新投票数据
    updateVote: (state, action: PayloadAction<{
      filingId: number;
      vote_counts: { bullish: number; neutral: number; bearish: number };
      user_vote: VoteType;
    }>) => {
      const { filingId, vote_counts, user_vote } = action.payload;
      state.votes[filingId.toString()] = {
        vote_counts,
        user_vote,
      };
    },
    // 批量设置投票数据（从 filings 列表中提取）
    setVotesFromFilings: (state, action: PayloadAction<Array<{
      id: number;
      vote_counts?: { bullish: number; neutral: number; bearish: number };
      user_vote?: VoteType | null;
    }>>) => {
      action.payload.forEach(filing => {
        if (filing.vote_counts) {
          state.votes[filing.id.toString()] = {
            vote_counts: filing.vote_counts,
            user_vote: filing.user_vote || null,
          };
        }
      });
    },
    // 清除所有投票数据
    clearVotes: (state) => {
      state.votes = {};
    },
  },
});

// Selectors
export const selectVoteByFilingId = (state: { votes: VotesState }, filingId: number) => 
  state.votes.votes[filingId.toString()];

export const { updateVote, setVotesFromFilings, clearVotes } = votesSlice.actions;
export default votesSlice.reducer;