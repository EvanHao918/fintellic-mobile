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
      // Vote on filing
      .addCase(voteFiling.fulfilled, (state, action) => {
        const { filingId, vote_counts, user_vote } = action.payload;
        const filing = state.filings.find(f => f.id === filingId);
        if (filing) {
          filing.vote_counts = vote_counts;
          filing.user_vote = user_vote;
        }
      });
  },
});

export const { setFilings, clearFilings } = filingsSlice.actions;
export default filingsSlice.reducer;