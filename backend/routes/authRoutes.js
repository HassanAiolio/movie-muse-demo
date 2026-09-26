import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { appDataSource } from '../datasource.js';
import Rating from '../entities/rating.js';
import User from '../entities/user.js';
import { requireAuth, signToken, toPublicUser } from '../lib/auth.js';
import { route } from '../lib/http.js';
import { getCatalog } from '../services/catalog.js';

const router = express.Router();
const userRepository = appDataSource.getRepository(User);

export const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@moviemuse.app';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again in a few minutes.' },
  })
);

function session(user) {
  return { token: signToken(user.id_user), user: toPublicUser(user) };
}

function findByEmail(email) {
  // Older accounts may have been stored with capitals, so try both.
  return userRepository.findOne({
    where: [{ email }, { email: email.toLowerCase() }],
  });
}

router.post(
  '/signup',
  route(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const firstname = String(req.body.firstname || '').trim();
    const lastname = String(req.body.lastname || '').trim();
    const password = String(req.body.password || '');

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!firstname || !lastname || firstname.length > 50 || lastname.length > 50) {
      return res.status(400).json({ message: 'Please enter your first and last name.' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (await findByEmail(email)) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await userRepository.save(
      userRepository.create({
        email,
        firstname,
        lastname,
        password: await bcrypt.hash(password, 10),
      })
    );
    res.status(201).json(session(user));
  })
);

router.post(
  '/login',
  route(async (req, res) => {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const user = email ? await findByEmail(email) : null;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.json(session(user));
  })
);

// One-click demo: logs into the shared demo account, creating it (with a few
// likes so recommendations aren't empty) if it doesn't exist yet.
router.post(
  '/demo',
  route(async (req, res) => {
    let user = await findByEmail(DEMO_EMAIL);
    if (!user) {
      user = await userRepository.save(
        userRepository.create({
          email: DEMO_EMAIL,
          firstname: 'Demo',
          lastname: 'Viewer',
          password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        })
      );
      const { movies } = await getCatalog();
      const favourites = [...movies]
        .sort((a, b) => b.rating_tmdb - a.rating_tmdb)
        .slice(0, 6)
        .map((movie) => ({
          id_user: user.id_user,
          id_movie: movie.id_movie,
          rate: '1',
          user_rate: { id_user: user.id_user },
          Movie_rate: { id_movie: movie.id_movie },
        }));
      await appDataSource.getRepository(Rating).save(favourites);
    }
    res.json(session(user));
  })
);

router.get(
  '/me',
  requireAuth,
  route(async (req, res) => {
    const user = await userRepository.findOneBy({ id_user: req.userId });
    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
