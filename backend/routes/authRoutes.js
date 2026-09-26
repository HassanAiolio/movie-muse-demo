import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { appDataSource } from '../datasource.js';
import Rating from '../entities/rating.js';
import User from '../entities/user.js';
import Watchlist from '../entities/watchlist.js';
import { DEMO_EMAIL, isDemoUser, requireAuth, signToken, toPublicUser } from '../lib/auth.js';
import { route } from '../lib/http.js';

const router = express.Router();
const userRepository = appDataSource.getRepository(User);

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

// Every visit to the demo starts from a blank slate so the onboarding picker
// means something. The account is shared, so this also clears what the
// previous visitor rated.
async function resetDemo(user) {
  await appDataSource.transaction(async (manager) => {
    await manager.delete(Rating, { id_user: user.id_user });
    await manager.delete(Watchlist, { id_user: user.id_user });
  });
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
    if (isDemoUser(user)) {
      await resetDemo(user);
    }
    res.json(session(user));
  })
);

// One-click demo: signs into the shared demo account (created on first use)
// with its ratings and watchlist cleared, so the visitor lands on the picker.
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
    }
    await resetDemo(user);
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
