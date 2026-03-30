import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Genre } from './use-movies';

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async (): Promise<Genre[]> => {
      const { data } = await api.get('/genres/');
      return data;
    }
  });
};
