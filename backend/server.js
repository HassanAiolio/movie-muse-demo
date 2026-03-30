import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import moviesRouter from './routes/movies.js';
import actorsRouter from './routes/actors.js';
import authRouter from './routes/authRoutes.js';
import genresRouter from './routes/genres.js';
import { routeNotFoundJsonHandler } from './services/routeNotFoundJsonHandler.js';
import { jsonErrorHandler } from './services/jsonErrorHandler.js';
import { appDataSource } from './datasource.js';

const app = express();
const port = parseInt(process.env.PORT || '8000');
let dbReady = false;

// ── Middleware ─────────────────────────
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes ─────────────────────────────
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
app.use('/actors', actorsRouter);
app.use('/auth', authRouter);
app.use('/genres', genresRouter);

// ── Health route ───────────────────────
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', dbConnected: dbReady })
);
app.head('/health', (req, res) => res.status(200).end());

// ── 404 and error handler ──────────────
app.use(routeNotFoundJsonHandler);
app.use(jsonErrorHandler);

// ── Start server immediately ───────────
app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);

// ── Initialize Neon DB asynchronously ──
appDataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    dbReady = true;
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

// ── Optional: fail requests if DB not ready
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'DB not ready' });
  }
  next();
});
