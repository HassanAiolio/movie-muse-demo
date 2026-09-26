import express from 'express';
import { route } from '../lib/http.js';
import { getCatalog } from '../services/catalog.js';

const router = express.Router();

// Only genres that actually have movies, most common first.
router.get(
  '/',
  route(async (req, res) => {
    const { movies } = await getCatalog();
    const counts = new Map();
    for (const movie of movies) {
      for (const genre of movie.genres) {
        const current = counts.get(genre.id_genre) || { ...genre, count: 0 };
        current.count += 1;
        counts.set(genre.id_genre, current);
      }
    }
    res.json([...counts.values()].sort((a, b) => b.count - a.count));
  })
);

export default router;
