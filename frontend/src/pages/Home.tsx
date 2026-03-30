import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { GenrePill } from '@/components/GenrePill';
import { useMovies } from '@/hooks/use-movies';
import { useGenres } from '@/hooks/use-genres';

const ITEMS_PER_PAGE = 36;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const genreScrollRef = useRef<HTMLDivElement>(null);

  const { data: movies, isLoading: isMoviesLoading } = useMovies();
  const { data: genres } = useGenres();

  const scrollGenres = (direction: 'left' | 'right') => {
    if (!genreScrollRef.current) return;
    genreScrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenres = selectedGenres.length === 0 || selectedGenres.every(genreId =>
        movie.movie_genre?.some(mg => Number(mg.id_genre) === Number(genreId))
      );
      return matchesSearch && matchesGenres;
    });
  }, [movies, searchQuery, selectedGenres]);

  const visibleMovies = filteredMovies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMovies.length;

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Section */}
        <div className="space-y-6 mb-10">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm shadow-black/5"
              placeholder="Search films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Genre strip with arrows */}
          {genres && genres.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollGenres('left')}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted hover:text-foreground hover:border-primary transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={genreScrollRef}
                className="flex gap-2 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {genres.map(genre => (
                  <GenrePill
                    key={genre.id_genre}
                    name={genre.genre_type || genre.name || ''}
                    isActive={selectedGenres.includes(Number(genre.id_genre))}
                    onClick={() => toggleGenre(Number(genre.id_genre))}
                  />
                ))}
              </div>

              <button
                onClick={() => scrollGenres('right')}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted hover:text-foreground hover:border-primary transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Loading status label */}
        {isMoviesLoading && (
          <motion.div
            className="flex items-center gap-3 text-muted text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="inline-flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Fetching your archive…
          </motion.div>
        )}

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isMoviesLoading ? (
            Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            visibleMovies.map((movie, idx) => (
              <MovieCard key={movie.id_movie} movie={movie} index={idx} />
            ))
          )}
        </div>

        {/* Empty State */}
        {!isMoviesLoading && filteredMovies.length === 0 && (
          <div className="py-20 text-center">
            <h3 className="text-xl font-display text-muted">No films found matching your criteria.</h3>
            <button
              onClick={() => { setSearchQuery(''); setSelectedGenres([]); }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
              className="px-8 py-3 bg-secondary text-foreground rounded-full border border-border hover:border-primary hover:text-primary transition-all duration-300 font-medium"
            >
              Load More Films
            </button>
          </div>
        )}
      </main>
    </motion.div>
  );
}