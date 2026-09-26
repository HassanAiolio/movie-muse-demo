// Content-based recommender. Everything here is pure: build an index once from
// the catalogue, then answer recommend / similar / search queries in memory.
//
// Each movie becomes a sparse TF-IDF vector split into blocks (genres, cast,
// synopsis words, decade). Blocks are normalised separately and then weighted,
// so a long synopsis can't drown out a shared lead actor.
import { StemmerEn, StopwordsEn } from '@nlpjs/lang-en';

const stemmer = new StemmerEn();
stemmer.stopwords = new StopwordsEn();

const BLOCK_WEIGHTS = { g: 0.4, a: 0.3, w: 0.25, d: 0.05 };
const DISLIKE_WEIGHT = 0.5;
// Small nudge towards well-rated films so ties don't fall back to id order.
const QUALITY_WEIGHT = 0.05;

export function tokenize(text) {
  if (!text) {
    return [];
  }

  return stemmer.tokenizeAndStem(String(text), false);
}

function decadeOf(releaseDate) {
  const year = parseInt(String(releaseDate || '').slice(0, 4), 10);

  return Number.isNaN(year) ? null : Math.floor(year / 10) * 10;
}

function rawFeatures(movie) {
  const features = new Map();
  const bump = (key) => features.set(key, (features.get(key) || 0) + 1);

  for (const genre of movie.genres || []) {
    bump(`g:${genre.id_genre}`);
  }
  for (const actor of movie.cast || []) {
    bump(`a:${actor.id_actor}`);
  }
  const titleStems = tokenize(movie.title);
  const stems = [...titleStems, ...tokenize(movie.description)];
  for (const stem of stems) {
    bump(`w:${stem}`);
  }
  const decade = decadeOf(movie.release_date);
  if (decade !== null) {
    bump(`d:${decade}`);
  }

  return { features, titleStems: new Set(titleStems), stems: new Set(stems) };
}

function weightVector(features, idf) {
  const blocks = {};
  for (const [key, tf] of features) {
    const block = key[0];
    const weight =
      block === 'w' ? (1 + Math.log(tf)) * idf(key) : block === 'd' ? 1 : idf(key);
    (blocks[block] ||= new Map()).set(key, weight);
  }

  const vector = new Map();
  for (const [block, entries] of Object.entries(blocks)) {
    const norm = Math.sqrt([...entries.values()].reduce((s, v) => s + v * v, 0));
    for (const [key, weight] of entries) {
      vector.set(key, (weight / norm) * BLOCK_WEIGHTS[block]);
    }
  }

  return normalize(vector);
}

function normalize(vector) {
  const norm = Math.sqrt([...vector.values()].reduce((s, v) => s + v * v, 0));
  if (norm === 0) {
    return vector;
  }
  for (const [key, value] of vector) {
    vector.set(key, value / norm);
  }

  return vector;
}

export function dot(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [key, value] of small) {
    const other = large.get(key);
    if (other !== undefined) {
      sum += value * other;
    }
  }

  return sum;
}

function quality(movie) {
  return (Number(movie.rating_tmdb) || 0) / 10;
}

export function buildIndex(movies) {
  const prepared = movies.map((movie) => ({ movie, ...rawFeatures(movie) }));

  const df = new Map();
  for (const { features } of prepared) {
    for (const key of features.keys()) {
      df.set(key, (df.get(key) || 0) + 1);
    }
  }
  const total = movies.length;
  const idf = (key) => Math.log((total + 1) / ((df.get(key) || 0) + 1)) + 1;

  const entries = new Map();
  for (const { movie, features, titleStems, stems } of prepared) {
    entries.set(movie.id_movie, {
      movie,
      vector: weightVector(features, idf),
      titleStems,
      stems,
    });
  }

  return { entries, idf };
}

// Names the concrete things two movies have in common, cast first.
export function sharedTraits(a, b, max = 3) {
  const actorIds = new Set((b.cast || []).map((actor) => actor.id_actor));
  const genreIds = new Set((b.genres || []).map((genre) => genre.id_genre));
  const actors = (a.cast || [])
    .filter((actor) => actorIds.has(actor.id_actor))
    .map((actor) => actor.actor_name);
  const genres = (a.genres || [])
    .filter((genre) => genreIds.has(genre.id_genre))
    .map((genre) => genre.genre_type);

  return [...actors, ...genres].slice(0, max);
}

function explain(entry, likedEntries) {
  let best = null;
  let bestScore = 0;
  for (const liked of likedEntries) {
    const score = dot(entry.vector, liked.vector);
    if (score > bestScore) {
      best = liked;
      bestScore = score;
    }
  }
  if (!best) {
    return null;
  }

  return {
    id_movie: best.movie.id_movie,
    title: best.movie.title,
    shared: sharedTraits(entry.movie, best.movie),
  };
}

// ratings: [{ id_movie, rate }] with rate 1 (like) or -1 (dislike).
export function recommend(index, ratings, { limit = 40, exclude = [] } = {}) {
  const skip = new Set([...exclude, ...ratings.map((r) => r.id_movie)]);
  const rated = ratings
    .map((r) => ({ rate: r.rate, entry: index.entries.get(r.id_movie) }))
    .filter((r) => r.entry);
  const likedEntries = rated.filter((r) => r.rate > 0).map((r) => r.entry);
  const candidates = [...index.entries.values()].filter(
    (entry) => !skip.has(entry.movie.id_movie)
  );

  // Cold start: nothing liked yet, so best-rated first.
  if (likedEntries.length === 0) {
    return candidates
      .sort((a, b) => quality(b.movie) - quality(a.movie))
      .slice(0, limit)
      .map((entry) => ({ movie: entry.movie, score: quality(entry.movie), reason: null }));
  }

  const profile = new Map();
  for (const { rate, entry } of rated) {
    const weight = rate > 0 ? 1 : -DISLIKE_WEIGHT;
    for (const [key, value] of entry.vector) {
      profile.set(key, (profile.get(key) || 0) + weight * value);
    }
  }
  normalize(profile);

  return candidates
    .map((entry) => ({
      entry,
      score: dot(profile, entry.vector) + QUALITY_WEIGHT * quality(entry.movie),
    }))
    .sort((a, b) => b.score - a.score || a.entry.movie.id_movie - b.entry.movie.id_movie)
    .slice(0, limit)
    .map(({ entry, score }) => ({
      movie: entry.movie,
      score,
      reason: explain(entry, likedEntries),
    }));
}

export function similar(index, movieId, { limit = 12 } = {}) {
  const source = index.entries.get(movieId);
  if (!source) {
    return [];
  }

  return [...index.entries.values()]
    .filter((entry) => entry.movie.id_movie !== movieId)
    .map((entry) => ({ entry, score: dot(source.vector, entry.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry, score }) => ({
      movie: entry.movie,
      score,
      shared: sharedTraits(entry.movie, source.movie),
    }));
}

// Free-text search over titles, synopses, cast and genres, e.g.
// "heist with a twist" or "al pacino crime".
export function search(index, query, { limit = 40 } = {}) {
  const phrase = String(query || '').trim().toLowerCase();
  if (phrase.length < 2) {
    return [];
  }
  const stems = [...new Set(tokenize(phrase))];
  const words = phrase.split(/\s+/).filter((word) => word.length >= 3);

  const results = [];
  for (const entry of index.entries.values()) {
    const { movie } = entry;
    let score = 0;

    const title = movie.title.toLowerCase();
    if (title === phrase) {
      score += 100;
    } else if (title.includes(phrase)) {
      score += 25;
    }
    for (const stem of stems) {
      const weight = index.idf(`w:${stem}`);
      if (entry.titleStems.has(stem)) {
        score += 3 * weight;
      } else if (entry.stems.has(stem)) {
        score += weight;
      }
    }
    for (const actor of movie.cast || []) {
      const name = actor.actor_name.toLowerCase();
      if (phrase.includes(name) || (phrase.length >= 4 && name.includes(phrase))) {
        score += 20;
      } else if (words.some((word) => name.split(' ').includes(word))) {
        score += 4;
      }
    }
    for (const genre of movie.genres || []) {
      if (phrase.includes(genre.genre_type.toLowerCase())) {
        score += 5;
      }
    }

    if (score > 0) {
      results.push({ movie, score: score + quality(movie) });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
