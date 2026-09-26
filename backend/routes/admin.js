import crypto from 'crypto';
import express from 'express';
import { route } from '../lib/http.js';
import { lastSyncAt, syncCatalog } from '../services/sync.js';

const router = express.Router();

// Protected by a shared secret so a scheduled job (see
// .github/workflows/sync.yml) can trigger a TMDB sync.
function requireSyncSecret(req, res, next) {
  const expected = process.env.SYNC_SECRET;
  const given = req.get('X-Sync-Secret') || '';
  const valid =
    expected &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

router.use(requireSyncSecret);

router.get(
  '/sync',
  route(async (req, res) => {
    res.json({ lastSyncAt: await lastSyncAt() });
  })
);

// Answers right away; the sync keeps running in the background.
router.post('/sync', (req, res) => {
  syncCatalog({ full: req.query.full === 'true' }).catch((err) =>
    console.error('TMDB sync failed:', err)
  );
  res.status(202).json({ message: 'Sync started' });
});

export default router;
