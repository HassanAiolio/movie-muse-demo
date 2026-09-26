import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MovieSummary } from './use-movies';

export interface CountItem {
  id: number;
  label: string;
  count: number;
  image?: string | null;
}

export interface TasteStats {
  likes: number;
  dislikes: number;
  watchlist: number;
  genres: CountItem[];
  actors: CountItem[];
  decades: CountItem[];
}

export const useStats = () =>
  useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<TasteStats> => (await api.get('/users/me/stats')).data,
  });

export const useMyRatings = () =>
  useQuery({
    queryKey: ['my-ratings'],
    queryFn: async (): Promise<MovieSummary[]> => (await api.get('/users/me/ratings')).data,
  });

export const useDeleteAccount = () =>
  useMutation({
    mutationFn: async () => {
      await api.delete('/users/me');
    },
  });
