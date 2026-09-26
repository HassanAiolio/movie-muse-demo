import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import logger from 'morgan';
import { appDataSource } from './datasource.js';
import actorsRouter from './routes/actors.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/authRoutes.js';
import genresRouter from './routes/genres.js';
import moviesRouter from './routes/movies.js';
import usersRouter from './routes/users.js';
import { getCatalog } from './services/catalog.js';
import { jsonErrorHandler } from './services/jsonErrorHandler.js';
import { routeNotFoundJsonHandler } from './services/routeNotFoundJsonHandler.js';
import { scheduleSync } from './services/sync.js';

const app = express();
const port = parseInt(process.env.PORT || '8000');
let dbReady = false;

// Comma-separated list of allowed frontend origins; open when unset.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── Middleware ─────────────────────────
app.set('trust proxy', 1); // Render sits behind a proxy; needed for rate limiting.
app.use(helmet());
app.use(logger(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '20kb' }));

// ── Health route ───────────────────────
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', dbConnected: dbReady })
);
app.head('/health', (req, res) => res.status(200).end());
app.get('/', (req, res) => res.json({ name: 'MovieMuse API', docs: 'https://github.com/HassanAiolio/movie-muse-demo#api' }));

// Everything below needs the database.
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ message: 'The server is starting, try again in a moment.' });
  }
  next();
});

// ── Routes ─────────────────────────────
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
app.use('/actors', actorsRouter);
app.use('/auth', authRouter);
app.use('/genres', genresRouter);
app.use('/admin', adminRouter);

// ── 404 and error handler ──────────────
app.use(routeNotFoundJsonHandler);
app.use(jsonErrorHandler);

// ── Start server immediately ───────────
app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);

// ── Initialize the database asynchronously ──
appDataSource
  .initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');
    await getCatalog(); // warm the recommender before taking traffic
    dbReady = true;
    scheduleSync();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
