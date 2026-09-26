import express from 'express';
import { appDataSource } from '../datasource.js';
import Rating from '../entities/rating.js';
import User from '../entities/user.js';
import Watchlist from '../entities/watchlist.js';
import { isDemoUser, requireAuth, toPublicUser } from '../lib/auth.js';
import { parseId, route } from '../lib/http.js';
import { getCatalog, toListItem } from '../services/catalog.js';

const router = express.Router();
const userRepository = appDataSource.getRepository(User);
const ratingRepository = appDataSource.getRepository(Rating);
const watchlistRepository = appDataSource.getRepository(Watchlist);

// Every route here acts on the signed-in user only.
router.use(requireAuth);

// `rate` is stored as text ("1" / "-1"); the API always speaks numbers.
export async function ratingsOf(userId) {
  const rows = await ratingRepository.find({ where: { id_user: userId } });

  return rows.map((row) => ({ id_movie: row.id_movie, rate: Number(row.rate) }));
}

router.get(
  '/me',
  route(async (req, res) => {
    const user = await userRepository.findOneBy({ id_user: req.userId });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ user: toPublicUser(user) });
  })
);

router.delete(
  '/me',
  route(async (req, res) => {
    const user = await userRepository.findOneBy({ id_user: req.userId });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (isDemoUser(user)) {
      return res.status(403).json({ message: "The shared demo account can't be deleted." });
    }
    await appDataSource.transaction(async (manager) => {
      await manager.delete(Rating, { id_user: req.userId });
      await manager.delete(Watchlist, { id_user: req.userId });
      await manager.delete(User, { id_user: req.userId });
    });
    res.status(204).end();
  })
);

// ── Ratings ────────────────────────────

router.get(
  '/me/ratings',
  route(async (req, res) => {
    const { byId } = await getCatalog();
    const ratings = await ratingsOf(req.userId);
    res.json(
      ratings
        .filter((rating) => byId.has(rating.id_movie))
        .map((rating) => toListItem(byId.get(rating.id_movie), { rate: rating.rate }))
    );
  })
);

router.get(
  '/me/ratings/:movieId',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    if (!movieId) {
      return res.status(400).json({ message: 'Invalid movie id' });
    }
    const row = await ratingRepository.findOneBy({ id_user: req.userId, id_movie: movieId });
    res.json({ rate: row ? Number(row.rate) : null });
  })
);

router.put(
  '/me/ratings/:movieId',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    const rate = Number(req.body.rate);
    if (!movieId || (rate !== 1 && rate !== -1)) {
      return res.status(400).json({ message: 'Expected a movie id and a rate of 1 or -1' });
    }
    const { byId } = await getCatalog();
    if (!byId.has(movieId)) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    await ratingRepository.save({
      id_user: req.userId,
      id_movie: movieId,
      rate: String(rate),
      user_rate: { id_user: req.userId },
      Movie_rate: { id_movie: movieId },
    });
    res.json({ id_movie: movieId, rate });
  })
);

router.delete(
  '/me/ratings/:movieId',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    if (!movieId) {
      return res.status(400).json({ message: 'Invalid movie id' });
    }
    await ratingRepository.delete({ id_user: req.userId, id_movie: movieId });
    res.status(204).end();
  })
);

// ── Watchlist ──────────────────────────

router.get(
  '/me/watchlist',
  route(async (req, res) => {
    const { byId } = await getCatalog();
    const rows = await watchlistRepository.find({
      where: { id_user: req.userId },
      order: { added_at: 'DESC' },
    });
    res.json(
      rows
        .filter((row) => byId.has(row.id_movie))
        .map((row) => toListItem(byId.get(row.id_movie), { added_at: row.added_at }))
    );
  })
);

router.put(
  '/me/watchlist/:movieId',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    const { byId } = await getCatalog();
    if (!movieId || !byId.has(movieId)) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    const existing = await watchlistRepository.findOneBy({
      id_user: req.userId,
      id_movie: movieId,
    });
    if (!existing) {
      await watchlistRepository.insert({ id_user: req.userId, id_movie: movieId });
    }
    res.status(existing ? 200 : 201).json({ id_movie: movieId, inWatchlist: true });
  })
);

router.delete(
  '/me/watchlist/:movieId',
  route(async (req, res) => {
    const movieId = parseId(req.params.movieId);
    if (!movieId) {
      return res.status(400).json({ message: 'Invalid movie id' });
    }
    await watchlistRepository.delete({ id_user: req.userId, id_movie: movieId });
    res.status(204).end();
  })
);

// ── Taste profile ──────────────────────

function topCounts(items, limit) {
  const counts = new Map();
  for (const { key, label, image } of items) {
    const current = counts.get(key) || { label, image, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }

  return [...counts.entries()]
    .map(([key, value]) => ({ id: key, ...value }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

router.get(
  '/me/stats',
  route(async (req, res) => {
    const { byId } = await getCatalog();
    const ratings = await ratingsOf(req.userId);
    const liked = ratings
      .filter((rating) => rating.rate > 0 && byId.has(rating.id_movie))
      .map((rating) => byId.get(rating.id_movie));
    const watchlistCount = await watchlistRepository.countBy({ id_user: req.userId });

    const genres = topCounts(
      liked.flatMap((movie) =>
        movie.genres.map((g) => ({ key: g.id_genre, label: g.genre_type }))
      ),
      8
    );
    const actors = topCounts(
      liked.flatMap((movie) =>
        movie.cast.map((a) => ({ key: a.id_actor, label: a.actor_name, image: a.image }))
      ),
      6
    ).filter((actor) => actor.count > 1);
    const decades = topCounts(
      liked
        .map((movie) => parseInt(movie.release_date.slice(0, 4), 10))
        .filter((year) => !Number.isNaN(year))
        .map((year) => {
          const decade = Math.floor(year / 10) * 10;

          return { key: decade, label: `${decade}s` };
        }),
      10
    ).sort((a, b) => a.id - b.id);

    res.json({
      likes: liked.length,
      dislikes: ratings.filter((rating) => rating.rate < 0).length,
      watchlist: watchlistCount,
      genres,
      actors,
      decades,
    });
  })
);

export default router;
