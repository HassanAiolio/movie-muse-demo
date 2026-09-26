// Pulls fresh movies from TMDB (now playing, popular, trending) and upserts
// them with their genres and cast. Runs on boot when the last sync is older
// than a day, from `npm run sync`, and from POST /admin/sync.
import { appDataSource } from '../datasource.js';
import Actor from '../entities/actor.js';
import AppMeta from '../entities/appMeta.js';
import Genre from '../entities/genres.js';
import Movie from '../entities/movies.js';
import { invalidateCatalog } from './catalog.js';
import { hasTmdbKey, tmdb } from './tmdb.js';

const DAILY_LISTS = [
  { path: '/movie/now_playing', pages: 3 },
  { path: '/movie/popular', pages: 5 },
  { path: '/trending/movie/week', pages: 2 },
];
// The original seed: only needed to rebuild a catalogue from scratch.
const FULL_LISTS = [{ path: '/movie/top_rated', pages: 20 }];

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MIN_VOTES = 10;
const CAST_SIZE = 5;
const CONCURRENCY = 6;
const LAST_SYNC_KEY = 'last_tmdb_sync';

let running = null;

async function mapLimit(items, limit, fn) {
  const results = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      results.push(await fn(item));
    }
  });
  await Promise.all(workers);

  return results;
}

async function collectIds(lists) {
  const ids = new Set();
  for (const { path, pages } of lists) {
    for (let page = 1; page <= pages; page++) {
      const data = await tmdb(path, { page, region: 'FR' });
      for (const movie of data.results || []) {
        ids.add(movie.id);
      }
    }
  }

  return [...ids];
}

function pickTrailer(videos) {
  const youtube = (videos?.results || []).filter((v) => v.site === 'YouTube');
  const trailer =
    youtube.find((v) => v.type === 'Trailer' && v.official) ||
    youtube.find((v) => v.type === 'Trailer') ||
    youtube[0];

  return trailer ? trailer.key : null;
}

async function fetchMovie(id) {
  try {
    const data = await tmdb(`/movie/${id}`, { append_to_response: 'videos,credits' });
    const cast = (data.credits?.cast || [])
      .filter((actor) => actor.profile_path)
      .slice(0, CAST_SIZE)
      .map((actor) => ({
        id_actor: actor.id,
        actor_name: actor.name,
        image: actor.profile_path,
      }));
    const usable =
      data.poster_path &&
      data.overview &&
      data.release_date &&
      data.vote_count >= MIN_VOTES &&
      cast.length > 0;
    if (!usable) {
      return null;
    }

    return {
      movie: {
        id_movie: data.id,
        title: data.title,
        release_date: data.release_date,
        description: data.overview,
        tagline: data.tagline || null,
        trailer: pickTrailer(data.videos),
        image: data.poster_path,
        backdrop: data.backdrop_path || null,
        rating_tmdb: String(data.vote_average),
        vote_count: data.vote_count,
        popularity: data.popularity,
        runtime: data.runtime || null,
      },
      genres: (data.genres || []).map((g) => ({ id_genre: g.id, genre_type: g.name })),
      cast,
    };
  } catch (err) {
    console.warn(`Skipping TMDB movie ${id}: ${err.message}`);

    return null;
  }
}

async function runSync({ full = false } = {}) {
  const started = Date.now();
  const ids = await collectIds(full ? [...DAILY_LISTS, ...FULL_LISTS] : DAILY_LISTS);
  const fetched = (await mapLimit(ids, CONCURRENCY, fetchMovie)).filter(Boolean);

  const genres = new Map();
  const actors = new Map();
  for (const { genres: movieGenres, cast } of fetched) {
    movieGenres.forEach((g) => genres.set(g.id_genre, g));
    cast.forEach((a) => actors.set(a.id_actor, a));
  }
  await appDataSource.getRepository(Genre).save([...genres.values()]);
  await appDataSource.getRepository(Actor).save([...actors.values()], { chunk: 200 });

  const movieRepository = appDataSource.getRepository(Movie);
  for (const { movie, genres: movieGenres, cast } of fetched) {
    await movieRepository.save({
      ...movie,
      movie_genre: movieGenres.map((g) => ({ id_genre: g.id_genre })),
      actors: cast.map((a) => ({ id_actor: a.id_actor })),
    });
  }

  await appDataSource
    .getRepository(AppMeta)
    .save({ key: LAST_SYNC_KEY, value: new Date().toISOString() });
  invalidateCatalog();

  const summary = { listed: ids.length, saved: fetched.length, ms: Date.now() - started };
  console.log('TMDB sync done', summary);

  return summary;
}

export function syncCatalog(options) {
  if (!running) {
    running = runSync(options).finally(() => {
      running = null;
    });
  }

  return running;
}

export async function lastSyncAt() {
  const row = await appDataSource.getRepository(AppMeta).findOneBy({ key: LAST_SYNC_KEY });

  return row ? new Date(row.value) : null;
}

export async function syncIfStale() {
  if (!hasTmdbKey()) {
    console.warn('TMDB_API_KEY is not set: skipping the catalogue sync.');

    return;
  }
  const last = await lastSyncAt();
  if (!last || Date.now() - last.getTime() > SYNC_INTERVAL_MS) {
    await syncCatalog();
  }
}

// Render's free tier sleeps when idle, so the boot-time check does most of the
// work; the interval covers instances that stay awake.
export function scheduleSync() {
  const tick = () => syncIfStale().catch((err) => console.error('TMDB sync failed:', err));
  tick();
  setInterval(tick, 6 * 60 * 60 * 1000).unref();
}
