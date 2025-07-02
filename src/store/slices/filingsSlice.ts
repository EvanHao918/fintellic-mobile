import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Filing } from '../../types';
import { api } from '../../api/endpoints';

interface FilingsState {
  filings: Filing[];
  currentFiling: Filing | null;
  popularFilings: Filing[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

const initialState: FilingsState = {
  filings: [],
  currentFiling: null,
  popularFilings: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 0,
};

// Async thunks
export const fetchFilings = createAsyncThunk(
  'filings/fetchList',
  async (params?: { 
    limit?: number; 
    offset?: number; 
    filing_type?: string;
    company_id?: string;
  }) => {
    const response = await api.filings.getList(params);
    return response;
  }
);

export const fetchFilingById = createAsyncThunk(
  'filings/fetchById',
  async (id: string) => {
    const response = await api.filings.getById(id);
    return response;
  }
);

export const fetchPopularFilings = createAsyncThunk(
  'filings/fetchPopular',
  async (period: 'day' | 'week' | 'month' = 'week') => {
    const response = await api.filings.getPopular(period);
    return response;
  }
);

export const voteFiling = createAsyncThunk(
  'filings/vote',
  async ({ filingId, voteType }: { filingId: string; voteType: 'bullish' | 'bearish' }) => {
    await api.filings.vote(filingId, voteType);
    return { filingId, voteType };
  }
);

// Slice
const filingsSlice = createSlice({
  name: 'filings',
  initialState,
  reducers: {
    clearFilings: (state) => {
      state.filings = [];
      state.currentPage = 0;
      state.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch filings list
    builder
      .addCase(fetchFilings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFilings.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // If it's the first page, replace the list
        if (state.currentPage === 0) {
          state.filings = action.payload;
        } else {
          // Otherwise, append to the list
          state.filings = [...state.filings, ...action.payload];
        }
        
        // Update pagination
        state.currentPage += 1;
        state.hasMore = action.payload.length === 20; // Assuming page size is 20
      })
      .addCase(fetchFilings.rejected, (state, action) => {
        state.isLoading = false;
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
      })
      .addCase(fetchFilingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch filing';
      });
    
    // Fetch popular filings
    builder
      .addCase(fetchPopularFilings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPopularFilings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularFilings = action.payload;
      })
      .addCase(fetchPopularFilings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch popular filings';
      });
    
    // Vote on filing
    builder
      .addCase(voteFiling.fulfilled, (state, action) => {
        // Update the vote in the local state if needed
        // This is a simplified version - you might want to update vote counts
        const { filingId, voteType } = action.payload;
        // TODO: Update filing vote state
      });
  },
});

export const { clearFilings, clearError } = filingsSlice.actions;
export default filingsSlice.reducer;