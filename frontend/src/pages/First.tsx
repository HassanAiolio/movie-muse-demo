import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Film, Loader2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Movie } from '@/hooks/use-movies';
import { useGenres } from '@/hooks/use-genres';

const MIN_SELECTIONS = 3;

export default function First() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const { data: genres } = useGenres();

  useEffect(() => {
    api.get('/movies/')
      .then(({ data }) => setMovies(data || []))
      .catch(() => setMovies([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch =
        searchQuery === '' || movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenres =
        selectedGenres.length === 0 ||
        selectedGenres.every(genreId =>
          movie.movie_genre?.some(mg => Number(mg.id_genre) === Number(genreId))
        );
      return matchesSearch && matchesGenres;
    });
  }, [movies, searchQuery, selectedGenres]);

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async () => {
    const userId = localStorage.getItem('user_id');
    setIsSaving(true);

    if (userId && selected.size > 0) {
      const calls = Array.from(selected).map(id_movie =>
        api.post('/users/ratings', { id_user: Number(userId), id_movie, rate: 1 })
          .catch(() => {})
      );
      await Promise.allSettled(calls);
    }

    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/6 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Film className="w-5 h-5 text-background" />
          </div>
          <span className="font-display text-2xl text-foreground">MovieMuse</span>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Hero text */}
      <motion.div
        className="relative z-10 text-center px-6 pt-4 pb-6 shrink-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight mb-3">
          Which films <span className="text-primary italic">speak to you?</span>
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-lg mx-auto">
          Select at least {MIN_SELECTIONS} posters — we'll use them to personalise your recommendations.
        </p>
      </motion.div>

      {/* Search + Genre filters */}
      <div className="relative z-10 px-4 sm:px-8 pb-4 shrink-0 space-y-3">
        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Genre pills */}
        {genres && genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {genres.map(genre => {
              const isActive = selectedGenres.includes(Number(genre.id_genre));
              return (
                <motion.button
                  key={genre.id_genre}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleGenre(Number(genre.id_genre))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-primary text-background border-primary'
                      : 'bg-transparent text-foreground border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {genre.genre_type || genre.name}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Poster grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 pb-36">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-secondary relative overflow-hidden shimmer" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>No movies match your search</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {filteredMovies.map((movie, idx) => {
              const isActive = selected.has(movie.id_movie);

              return (
                <motion.button
                  key={movie.id_movie}
                  onClick={() => toggle(movie.id_movie)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.015, 0.5) }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer
                    border-2 transition-all duration-300
                    ${isActive
                      ? 'border-primary shadow-lg shadow-primary/30 scale-[1.03]'
                      : 'border-transparent hover:border-white/20'
                    }
                  `}
                >
                  <img
                    src={movie.image || `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop&q=70`}
                    alt={movie.title}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      isActive ? 'grayscale-0 brightness-100' : 'grayscale brightness-75 hover:grayscale-0 hover:brightness-100'
                    }`}
                  />

                  <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                    isActive ? 'opacity-0' : 'opacity-30'
                  }`} />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute top-2 right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md shadow-black/40"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-4 h-4 text-background" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <p className="text-white text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">
                      {movie.title}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Sticky CTA footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-6 pb-8 pt-10 bg-gradient-to-t from-background via-background/95 to-transparent flex flex-col items-center gap-3">
        <div className="text-sm">
          {selected.size === 0 ? (
            <span className="text-muted">Select at least {MIN_SELECTIONS} films to continue</span>
          ) : selected.size < MIN_SELECTIONS ? (
            <span className="text-muted">
              <span className="text-foreground font-semibold">{MIN_SELECTIONS - selected.size}</span> more to go
            </span>
          ) : (
            <motion.span
              className="text-primary font-medium"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {selected.size} films selected — looking great!
            </motion.span>
          )}
        </div>

        <motion.button
          onClick={handleStart}
          disabled={selected.size < MIN_SELECTIONS || isSaving}
          className={`
            flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg
            transition-all duration-300 shadow-xl
            ${selected.size >= MIN_SELECTIONS
              ? 'bg-primary text-background hover:bg-primary/90 shadow-primary/30'
              : 'bg-card text-muted border border-border cursor-not-allowed'
            }
          `}
          whileHover={selected.size >= MIN_SELECTIONS ? { scale: 1.03 } : {}}
          whileTap={selected.size >= MIN_SELECTIONS ? { scale: 0.97 } : {}}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Start Exploring
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}