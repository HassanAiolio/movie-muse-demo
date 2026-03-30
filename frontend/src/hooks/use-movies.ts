import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Genre {
  id_genre: number;
  genre_type: string;
  name?: string; // alias for compatibility
}

export interface Movie {
  id_movie: number;
  title: string;
  release_date: string;
  description: string;
  trailer?: string;
  image: string;
  rating_tmdb: string | number;
  movie_genre?: Genre[];
}

export interface Actor {
  id_actor?: number;
  actor_name: string;
  image: string;
}

export const useMovies = () => {
  const userId = localStorage.getItem('user_id');
  
  return useQuery({
    queryKey: ['movies', 'home', userId],
    queryFn: async (): Promise<Movie[]> => {
      try {
        if (userId) {
          const { data } = await api.get(`/movies/recommend?id_user=${userId}`);
          if (data && data.length > 0) return data;
        }
      } catch (err) {
        console.warn('Recommendation failed, falling back to all movies', err);
      }
      const { data } = await api.get('/movies/');
      return data;
    }
  });
};

export const useMovieDetails = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movie', movieId],
    queryFn: async (): Promise<Movie> => {
      const { data } = await api.get(`/movies/movie/?id_movie=${movieId}`);
      return data;
    },
    enabled: !!movieId
  });
};

export const useMovieGenres = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movie_genres', movieId],
    queryFn: async (): Promise<Genre[]> => {
      const { data } = await api.get(`/movies/genre/?id_movie=${movieId}`);
      return data;
    },
    enabled: !!movieId
  });
};

export const useMovieCast = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movie_cast', movieId],
    queryFn: async (): Promise<Actor[]> => {
      const { data } = await api.get(`/movies/cast/?id_movie=${movieId}`);
      return data;
    },
    enabled: !!movieId
  });
};

export const useRecommendations = (userId: string | null) => {
  return useQuery({
    queryKey: ['movies', 'recommend', userId],
    queryFn: async (): Promise<Movie[]> => {
      if (!userId) return [];
      const { data } = await api.get(`/movies/recommend?id_user=${userId}`);
      return data;
    },
    enabled: !!userId
  });
};
