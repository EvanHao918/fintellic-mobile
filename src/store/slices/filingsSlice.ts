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
  lastRefreshTime: number | null; // 追踪最后刷新时间
}

const initialState: FilingsState = {
  filings: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  error: null,
  currentPage: 1,
  lastRefreshTime: null,
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
      state.lastRefreshTime = Date.now();
    },
    clearFilings: (state) => {
      state.filings = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.lastRefreshTime = null;
    },
    // 更新单个 filing 的投票数据（用于所有页面）
    updateFilingVote: (state, action: PayloadAction<{
      filingId: number;
      vote_counts: { bullish: number; neutral: number; bearish: number };
      user_vote: VoteType;
    }>) => {
      const { filingId, vote_counts, user_vote } = action.payload;
      // 更新所有匹配的 filing（可能在多个地方存在）
      state.filings = state.filings.map(filing => {
        if (filing.id === filingId) {
          return {
            ...filing,
            vote_counts,
            user_vote
          };
        }
        return filing;
      });
    },
    // 添加或更新单个 filing（用于详情页）
    upsertFiling: (state, action: PayloadAction<Filing>) => {
      const filing = action.payload;
      const existingIndex = state.filings.findIndex(f => f.id === filing.id);
      
      if (existingIndex >= 0) {
        // 更新现有的 filing
        state.filings[existingIndex] = filing;
      } else {
        // 添加新的 filing（如果需要的话）
        // 在生产环境中，我们通常不添加单个 filing 到列表
        // 除非它确实属于当前的查询结果
      }
    },
    // 检查是否需要刷新（超过5分钟）
    checkRefreshNeeded: (state) => {
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;
      
      if (!state.lastRefreshTime || (now - state.lastRefreshTime) > FIVE_MINUTES) {
        state.filings = [];
        state.currentPage = 1;
        state.hasMore = true;
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
          state.lastRefreshTime = Date.now();
        } else {
          // 避免重复数据
          const existingIds = new Set(state.filings.map(f => f.id));
          const newFilings = filings.filter(f => !existingIds.has(f.id));
          state.filings = [...state.filings, ...newFilings];
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
      // Vote on filing
      .addCase(voteFiling.fulfilled, (state, action) => {
        const { filingId, vote_counts, user_vote } = action.payload;
        // 使用 updateFilingVote 逻辑
        state.filings = state.filings.map(filing => {
          if (filing.id.toString() === filingId) {
            return {
              ...filing,
              vote_counts,
              user_vote
            };
          }
          return filing;
        });
      });
  },
});

// Selectors
export const selectFilingById = (state: { filings: FilingsState }, filingId: number) => 
  state.filings.filings.find(f => f.id === filingId);

export const selectShouldRefresh = (state: { filings: FilingsState }) => {
  const { lastRefreshTime } = state.filings;
  if (!lastRefreshTime) return true;
  
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - lastRefreshTime > FIVE_MINUTES;
};

// 导出 actions
export const { 
  setFilings, 
  clearFilings, 
  updateFilingVote, 
  upsertFiling,
  checkRefreshNeeded 
} = filingsSlice.actions;

export default filingsSlice.reducer;