import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Movie } from '@/hooks/use-movies';

interface MovieCardProps {
  movie: Movie;
  index: number;
}

export function MovieCard({ movie, index }: MovieCardProps) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/movieDetails/${movie.id_movie}`} className="block group">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-border/50 shadow-lg shadow-black/20">
          {/* Poster Image */}
          <img
            src={movie.image || `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=750&fit=crop&q=80`}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-display text-xl text-white leading-tight mb-1 line-clamp-2">
                {movie.title}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-white/80 mb-3">
                {year && <span>{year}</span>}
                {movie.rating_tmdb && (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{Number(movie.rating_tmdb).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {movie.movie_genre && movie.movie_genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.movie_genre.slice(0, 3).map(g => (
                    <span key={g.id_genre} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white border border-white/10 backdrop-blur-md">
                      {g.genre_type || g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
