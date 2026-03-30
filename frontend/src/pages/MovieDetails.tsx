import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, ThumbsUp, ThumbsDown, Star, Calendar } from 'lucide-react';
import { 
  useMovieDetails, 
  useMovieGenres, 
  useMovieCast, 
  useRecommendations 
} from '@/hooks/use-movies';
import { useUserRating, useRateMovie, useRemoveRating } from '@/hooks/use-ratings';
import { ActorCard } from '@/components/ActorCard';
import { MovieCard } from '@/components/MovieCard';

export default function MovieDetails() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  // Parallel fetches
  const { data: movie, isLoading: isMovieLoading } = useMovieDetails(movieId);
  const { data: genres } = useMovieGenres(movieId);
  const { data: cast } = useMovieCast(movieId);
  const { data: ratingData } = useUserRating(movieId);
  const { data: recommendations } = useRecommendations(userId);

  const rateMutation = useRateMovie();
  const removeRatingMutation = useRemoveRating();

  const handleRate = async (value: 1 | -1) => {
    if (!movieId) return;
    const currentRate = ratingData?.rate;

    if (currentRate === value) {
      // Toggle off
      removeRatingMutation.mutate({ movieId: parseInt(movieId) });
    } else {
      if (currentRate !== null && currentRate !== undefined) {
        // Switch rating — delete first, then post
        await removeRatingMutation.mutateAsync({ movieId: parseInt(movieId) });
      }
      rateMutation.mutate({ movieId: parseInt(movieId), rate: value });
    }
  };

  if (isMovieLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <h2 className="text-2xl font-display mb-4">Film not found</h2>
        <button onClick={() => navigate('/home')} className="text-primary hover:underline">
          Return to Archive
        </button>
      </div>
    );
  }

  const currentRating = ratingData?.rate;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <motion.div 
      className="min-h-screen bg-background pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <div className="relative h-[55vh] min-h-[400px] w-full">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <img 
          src={movie.image || `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop`} 
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-top blur-[4px]"
        />

        {/* Back Button */}
        <button 
          onClick={() => navigate('/home')}
          className="absolute top-8 left-4 sm:left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full glass text-white/80 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Archive</span>
        </button>

        {/* Title Block */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4 sm:p-8 max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10"
          >
            {/* Poster Overlay */}
            <img 
              src={movie.image} 
              alt="Poster" 
              className="w-32 md:w-48 rounded-lg shadow-2xl shadow-black/50 border border-white/10 hidden sm:block" 
            />
            
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display text-white mb-4 leading-tight shadow-black drop-shadow-lg">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm sm:text-base font-medium mb-4">
                {year && (
                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{year}</span>
                  </div>
                )}
                {movie.rating_tmdb && (
                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span>{Number(movie.rating_tmdb).toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              {genres && genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <span key={g.id_genre} className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs sm:text-sm backdrop-blur-md">
                      {g.genre_type || g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Col: Details */}
          <div className="flex-1 space-y-12">
            <section>
              <h3 className="text-2xl font-display text-foreground mb-4 border-b border-border pb-2">Synopsis</h3>
              <p className="text-muted leading-relaxed text-lg">
                {movie.description || "No synopsis available for this film."}
              </p>
            </section>

            {/* Cast Row */}
            {cast && cast.length > 0 && (
              <section>
                <h3 className="text-2xl font-display text-foreground mb-6 border-b border-border pb-2">Cast</h3>
                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                  {cast.map((actor, idx) => (
                    <ActorCard key={actor.id_actor ?? idx} actor={actor} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Col: Actions */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm uppercase tracking-wider text-muted font-bold mb-4">Your Rating</h4>
              
              <div className="flex gap-4">
                <button
                  onClick={() => handleRate(1)}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-300 ${
                    currentRating === 1
                      ? 'bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/20'
                      : 'bg-secondary border-border text-muted hover:border-green-500/50 hover:text-green-400'
                  }`}
                >
                  <ThumbsUp className={`w-8 h-8 ${currentRating === 1 ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">Like</span>
                </button>

                <button
                  onClick={() => handleRate(-1)}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-300 ${
                    currentRating === -1
                      ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/20'
                      : 'bg-secondary border-border text-muted hover:border-red-500/50 hover:text-red-400'
                  }`}
                >
                  <ThumbsDown className={`w-8 h-8 ${currentRating === -1 ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">Dislike</span>
                </button>
              </div>
            </div>

            {movie.trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailer}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 py-4 bg-foreground text-background font-bold rounded-2xl hover:bg-primary transition-colors shadow-lg"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <section className="mt-20 pt-10 border-t border-border">
            <h3 className="text-2xl font-display text-foreground mb-8">Recommended for You</h3>
            <div className="flex overflow-x-auto gap-5 pb-6 no-scrollbar">
              {recommendations.slice(0, 8).map((rec, idx) => (
                <div key={rec.id_movie} className="w-44 shrink-0">
                  <MovieCard movie={rec} index={idx} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
