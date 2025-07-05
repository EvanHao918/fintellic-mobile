import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Filing, VoteType } from '../../types';
import * as filingsAPI from '../../api/filings';

interface FilingsState {
  filings: Filing[];
  currentFiling: Filing | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  totalCount: number;
  isRefreshing: boolean;
}

const initialState: FilingsState = {
  filings: [],
  currentFiling: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  totalCount: 0,
  isRefreshing: false,
};

// Async thunks
export const fetchFilings = createAsyncThunk(
  'filings/fetchFilings',
  async ({ page, isRefresh }: { page: number; isRefresh?: boolean }) => {
    const response = await filingsAPI.getFilings(page);
    // Fix API response format - backend returns 'data' not 'items'
    const normalizedResponse = {
      items: response.data || [],
      total: response.total,
      page: page,
      pages: Math.ceil(response.total / 20),
    };
    return { ...normalizedResponse, isRefresh };
  }
);

export const fetchFilingById = createAsyncThunk(
  'filings/fetchFilingById',
  async (id: string) => {
    const filing = await filingsAPI.getFilingById(id);
    return filing;
  }
);

export const voteFiling = createAsyncThunk(
  'filings/vote',
  async ({ filingId, voteType }: { filingId: string; voteType: VoteType }) => {
    const response = await filingsAPI.voteOnFiling(filingId, voteType);
    return { filingId, ...response };
  }
);

const filingsSlice = createSlice({
  name: 'filings',
  initialState,
  reducers: {
    resetFilings: (state) => {
      state.filings = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    setCurrentFiling: (state, action: PayloadAction<Filing | null>) => {
      state.currentFiling = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch filings
    builder
      .addCase(fetchFilings.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        if (action.meta.arg.isRefresh) {
          state.isRefreshing = true;
        }
      })
      .addCase(fetchFilings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.totalCount = action.payload.total;
        
        if (action.payload.isRefresh) {
          state.filings = action.payload.items;
          state.page = 1;
        } else {
          // Remove duplicates when paginating
          const existingIds = new Set(state.filings.map(f => f.id));
          const newFilings = action.payload.items.filter(f => !existingIds.has(f.id));
          state.filings = [...state.filings, ...newFilings];
        }
        
        state.hasMore = action.payload.page < action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchFilings.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.error.message || 'Failed to fetch filings';
      });

    // Fetch single filing
    builder
      .addCase(fetchFilingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFilingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFiling = action.payload;
        
        // Update filing in list if exists
        const index = state.filings.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.filings[index] = action.payload;
        }
      })
      .addCase(fetchFilingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch filing';
      });

    // Vote on filing
    builder
      .addCase(voteFiling.fulfilled, (state, action) => {
        const { filingId, vote_counts, user_vote } = action.payload;
        
        // Update filing in list
        const filing = state.filings.find(f => f.id === filingId);
        if (filing) {
          filing.vote_counts = vote_counts;
          filing.user_vote = user_vote;
        }
        
        // Update current filing if it's the same
        if (state.currentFiling?.id === filingId) {
          state.currentFiling.vote_counts = vote_counts;
          state.currentFiling.user_vote = user_vote;
        }
      });
  },
});

export const { resetFilings, setCurrentFiling } = filingsSlice.actions;
export default filingsSlice.reducer;