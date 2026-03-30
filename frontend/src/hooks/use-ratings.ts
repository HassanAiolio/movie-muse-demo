import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RatingResponse {
  rate: 1 | -1 | null;
}

export const useUserRating = (movieId: string | undefined) => {
  const userId = localStorage.getItem('user_id');
  
  return useQuery({
    queryKey: ['rating', movieId, userId],
    queryFn: async (): Promise<RatingResponse> => {
      try {
        const { data } = await api.get(`/users/rating/movie?id_movie=${movieId}&id_user=${userId}`);
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return { rate: null };
        throw err;
      }
    },
    enabled: !!movieId && !!userId
  });
};

export const useRateMovie = () => {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id');

  return useMutation({
    mutationFn: async ({ movieId, rate }: { movieId: number, rate: 1 | -1 }) => {
      const { data } = await api.post(`/users/ratings`, { id_user: userId, id_movie: movieId, rate });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['rating', variables.movieId.toString(), userId],
        { rate: variables.rate }
      );
    }
  });
};

export const useRemoveRating = () => {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id');

  return useMutation({
    mutationFn: async ({ movieId }: { movieId: number }) => {
      const { data } = await api.delete(`/users/ratings`, {
        data: { id_user: userId, id_movie: movieId }
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['rating', variables.movieId.toString(), userId],
        { rate: null }
      );
    }
  });
};
