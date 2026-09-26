import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { parseId, route } from '../lib/http.js';
import { recommend, search, similar } from '../recommender/engine.js';
import { getCatalog, toListItem } from '../services/catalog.js';
import { hasTmdbKey, tmdb } from '../services/tmdb.js';
import { ratingsOf } from './users.js';

const router = express.Router();

function clampLimit(value, fallback, max) {
  const limit = parseInt(value, 10);

  return Number.isNaN(limit) ? fallback : Math.min(Math.max(limit, 1), max);
}

router.get(
  '/',
  route(async (req, res) => {
    const { movies } = await getCatalog();
    res.json(movies.map((movie) => toListItem(movie)));
  })
);

router.get(
  '/search',
  route(async (req, res) => {
    const { index } = await getCatalog();
    const results = search(index, req.query.q, { limit: clampLimit(req.query.limit, 40, 100) });
    res.json(results.map(({ movie }) => toListItem(movie)));
  })
);

router.get(
  '/recommend',
  requireAuth,
  route(async (req, res) => {
    const { index } = await getCatalog();
    const ratings = await ratingsOf(req.userId);
    const results = recommend(index, ratings, { limit: clampLimit(req.query.limit, 40, 200) });
    res.json(results.map(({ movie, reason }) => toListItem(movie, { reason })));
  })
);

router.get(
  '/:movieId',
  route(async (req, res) => {
    const { byId } = await getCatalog();
    const movie = byId.get(parseId(req.params.movieId));
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  })
);

router.get(
  '/:movieId/similar',
  route(async (req, res) => {
    const { index } = await getCatalog();
    const results = similar(index, parseId(req.params.movieId), {
      limit: clampLimit(req.query.limit, 12, 40),
    });
    res.json(results.map(({ movie, shared }) => toListItem(movie, { shared })));
  })
);

// Where to watch, from TMDB (data by JustWatch). Cached for a day per movie
// and region to stay far below TMDB's rate limits.
const PROVIDER_TTL_MS = 24 * 60 * 60 * 1000;
const providerCache = new Map();

router.get(
  '/:movieId/providers',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    const region = /^[A-Z]{2}$/.test(String(req.query.region)) ? req.query.region : 'FR';
    if (!movieId) {
      return res.status(400).json({ message: 'Invalid movie id' });
    }
    if (!hasTmdbKey()) {
      return res.json({ region, configured: false, link: null, flatrate: [], rent: [], buy: [] });
    }

    const cacheKey = `${movieId}:${region}`;
    const cached = providerCache.get(cacheKey);
    if (cached && Date.now() - cached.at < PROVIDER_TTL_MS) {
      return res.json(cached.data);
    }
    const data = await tmdb(`/movie/${movieId}/watch/providers`);
    const local = data.results?.[region] || {};
    const pick = (list) =>
      (list || []).map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path,
      }));
    const result = {
      region,
      link: local.link || null,
      flatrate: pick(local.flatrate),
      rent: pick(local.rent),
      buy: pick(local.buy),
    };
    providerCache.set(cacheKey, { at: Date.now(), data: result });
    res.json(result);
  })
);

export default router;
