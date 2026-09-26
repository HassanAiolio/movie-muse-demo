import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { MovieSummary } from '@/hooks/use-movies';
import { formatRating, yearOf } from '@/lib/format';
import { Poster } from './Poster';

interface MovieCardProps {
  movie: MovieSummary;
  index?: number;
  // Short line under the title, e.g. "Because you liked Heat".
  caption?: string | null;
}

export function MovieCard({ movie, index = 0, caption }: MovieCardProps) {
  const year = yearOf(movie.release_date);
  const rating = formatRating(movie.rating_tmdb);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
    >
      <Link
        to={`/movie/${movie.id_movie}`}
        className="block group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-border/50 shadow-lg shadow-black/20">
          <Poster
            path={movie.image}
            title={movie.title}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />

          {rating && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-xs font-semibold text-primary">
              <Star className="w-3 h-3 fill-current" />
              {rating}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.slice(0, 3).map((g) => (
                  <span
                    key={g.id_genre}
                    className="px-2 py-0.5 text-[11px] rounded-full bg-white/10 text-white border border-white/10 backdrop-blur-md"
                  >
                    {g.genre_type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2.5 px-0.5">
          <h3 className="font-sans text-sm font-medium text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          {caption ? (
            <p className="mt-0.5 flex items-start gap-1 text-xs text-primary/90 leading-snug line-clamp-2">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{caption}</span>
            </p>
          ) : (
            year && <p className="mt-0.5 text-xs text-muted">{year}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
