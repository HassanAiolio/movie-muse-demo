import { appDataSource } from '../datasource.js';
import Movie from '../entities/movies.js';
import { buildIndex } from '../recommender/engine.js';

// The whole catalogue (a few thousand rows at most) lives in memory with its
// recommender index. It's rebuilt lazily after a TMDB sync invalidates it.
let cache = null;
let pending = null;
let generation = 0;

export function invalidateCatalog() {
  generation += 1;
  cache = null;
}

export async function getCatalog() {
  if (cache) {
    return cache;
  }
  if (!pending) {
    const started = generation;
    pending = loadCatalog()
      .then((catalog) => {
        if (started === generation) {
          cache = catalog;
        }

        return catalog;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}

function normalizeMovie(row) {
  return {
    id_movie: row.id_movie,
    title: row.title,
    release_date: row.release_date,
    description: row.description,
    tagline: row.tagline || null,
    trailer: row.trailer || null,
    image: row.image,
    backdrop: row.backdrop || null,
    rating_tmdb: Number(row.rating_tmdb) || 0,
    vote_count: row.vote_count ?? null,
    popularity: row.popularity ?? null,
    runtime: row.runtime ?? null,
    genres: (row.movie_genre || [])
      .map((g) => ({ id_genre: g.id_genre, genre_type: g.genre_type }))
      .sort((a, b) => a.genre_type.localeCompare(b.genre_type)),
    cast: (row.actors || []).map((a) => ({
      id_actor: a.id_actor,
      actor_name: a.actor_name,
      image: a.image,
    })),
  };
}

async function loadCatalog() {
  const started = Date.now();
  const rows = await appDataSource
    .getRepository(Movie)
    .find({ relations: ['movie_genre', 'actors'] });
  const movies = rows.map(normalizeMovie);

  const byId = new Map(movies.map((movie) => [movie.id_movie, movie]));
  const actors = new Map();
  for (const movie of movies) {
    for (const actor of movie.cast) {
      if (!actors.has(actor.id_actor)) {
        actors.set(actor.id_actor, { ...actor, movieIds: [] });
      }
      actors.get(actor.id_actor).movieIds.push(movie.id_movie);
    }
  }

  const index = buildIndex(movies);
  console.log(`Catalogue loaded: ${movies.length} movies in ${Date.now() - started} ms`);

  return { movies, byId, actors, index };
}

// Compact shape for grids and rows: no synopsis, no cast.
export function toListItem(movie, extra = {}) {
  return {
    id_movie: movie.id_movie,
    title: movie.title,
    release_date: movie.release_date,
    image: movie.image,
    backdrop: movie.backdrop,
    rating_tmdb: movie.rating_tmdb,
    popularity: movie.popularity,
    genres: movie.genres,
    ...extra,
  };
}
