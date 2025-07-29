// src/hooks/useFilingVote.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../types';
import { voteOnFiling } from '../api/filings';
import { updateFilingVote } from '../store/slices/filingsSlice';
import { updateFilingVoteGlobal } from '../store/slices/globalFilingsSlice';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useFilingVote = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth || {});

  const handleVote = useCallback(async (
    filingId: number, 
    voteType: 'bullish' | 'neutral' | 'bearish'
  ) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    try {
      // 调用 API
      const response = await voteOnFiling(filingId.toString(), voteType);
      
      // 更新两个 store：主页的 filings 和全局的 globalFilings
      const voteData = {
        filingId,
        vote_counts: response.vote_counts,
        user_vote: response.user_vote
      };
      
      // 更新主页 Redux store
      dispatch(updateFilingVote(voteData));
      
      // 更新全局 store
      dispatch(updateFilingVoteGlobal(voteData));
      
      return response;
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  }, [isAuthenticated, navigation, dispatch]);

  return { handleVote, isAuthenticated };
};