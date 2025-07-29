// src/store/slices/filingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Filing, VoteType } from '../../types';
import { getFilings, voteOnFiling } from '../../api/filings';

interface FilingsState {
  filings: Filing[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
}

const initialState: FilingsState = {
  filings: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  error: null,
  currentPage: 1,
};

// Fetch filings
export const fetchFilings = createAsyncThunk(
  'filings/fetchFilings',
  async ({ page, isRefresh }: { page: number; isRefresh: boolean }) => {
    const response = await getFilings(page);
    return { 
      filings: response.data, 
      isRefresh, 
      hasMore: response.data.length === 20 
    };
  }
);

// Vote on filing
export const voteFiling = createAsyncThunk(
  'filings/vote',
  async ({ filingId, voteType }: { filingId: string; voteType: VoteType }) => {
    const response = await voteOnFiling(filingId, voteType);
    return { filingId, ...response };
  }
);

const filingsSlice = createSlice({
  name: 'filings',
  initialState,
  reducers: {
    setFilings: (state, action: PayloadAction<Filing[]>) => {
      state.filings = action.payload;
    },
    clearFilings: (state) => {
      state.filings = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    // 新增：更新单个 filing 的投票数据
    updateFilingVote: (state, action: PayloadAction<{
      filingId: number;
      vote_counts: { bullish: number; neutral: number; bearish: number };
      user_vote: VoteType;
    }>) => {
      const { filingId, vote_counts, user_vote } = action.payload;
      const filing = state.filings.find(f => f.id === filingId);
      if (filing) {
        filing.vote_counts = vote_counts;
        filing.user_vote = user_vote;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch filings
      .addCase(fetchFilings.pending, (state, action) => {
        if (action.meta.arg.isRefresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchFilings.fulfilled, (state, action) => {
        const { filings, isRefresh, hasMore } = action.payload;
        
        if (isRefresh) {
          state.filings = filings;
          state.currentPage = 1;
        } else {
          state.filings = [...state.filings, ...filings];
          state.currentPage += 1;
        }
        
        state.hasMore = hasMore;
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = null;
      })
      .addCase(fetchFilings.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.error.message || 'Failed to load filings';
      })
      // Vote on filing - 修复类型问题
      .addCase(voteFiling.fulfilled, (state, action) => {
        const { filingId, vote_counts, user_vote } = action.payload;
        // 注意：filingId 是 string，但 filing.id 是 number，需要转换
        const filing = state.filings.find(f => f.id.toString() === filingId);
        if (filing) {
          filing.vote_counts = vote_counts;
          filing.user_vote = user_vote;
        }
      });
  },
});

// 导出 actions - 包含新增的 updateFilingVote
export const { setFilings, clearFilings, updateFilingVote } = filingsSlice.actions;
export default filingsSlice.reducer;