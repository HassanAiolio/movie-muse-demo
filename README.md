# MovieMuse

A movie recommendation app. Rate a few films and MovieMuse picks what to watch next, and tells you why ("Because you liked *Heat*: Al Pacino, Crime").

**Live demo:** [movie-muse-demo.vercel.app](https://movie-muse-demo.vercel.app/). Hit **Try the demo** on the login page, no sign-up needed.

---

## Features

- **Explainable recommendations**: every pick names the film you liked that it resembles, and what they share.
- **Free-text search** over titles, synopses, cast and genres: "Tom Hanks", "heist with a twist", "space".
- **Fresh catalogue**: a daily TMDB sync adds now-playing, popular and trending films.
- **Movie pages** with trailer, cast, "More like this", and where to stream, rent or buy in France (via JustWatch).
- **Watchlist**, **actor pages**, and a **taste profile** (favourite genres, decades and actors).
- One-click demo account, onboarding picker, account deletion.

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Framer Motion
**Backend:** Node.js, Express, TypeORM, PostgreSQL
**Auth:** JWT (7-day sessions) + bcrypt, rate-limited auth routes, helmet
**Data:** TMDB API

## How the recommender works

`backend/recommender/engine.js` is a small content-based recommender with no dependencies beyond a stemmer:

1. Each film becomes a sparse **TF-IDF vector** in four blocks: genres, cast, synopsis words (stemmed, stop words removed) and decade. Each block is normalised separately and then weighted (genres 0.4, cast 0.3, words 0.25, decade 0.05), so a long synopsis can't drown out a shared lead actor.
2. Your **taste profile** is the sum of the films you liked, minus half of the ones you disliked.
3. Candidates are ranked by **cosine similarity** to the profile, with a small nudge towards well-rated films.
4. For each pick, the liked film it's closest to becomes the explanation.

The whole catalogue and its index live in memory and are rebuilt after each sync. A recommendation takes about 15 ms for 2,000 films. The previous version rebuilt everything from the database on every request and took about 60 s.

## Local setup

```bash
git clone https://github.com/HassanAiolio/movie-muse-demo.git
cd movie-muse-demo
cd backend && npm install && cp .env.example .env
cd ../frontend && npm install && cp .env.example .env
```

Fill in `backend/.env`: a Postgres `DATABASE_URL`, a `JWT_SECRET`, and a [TMDB](https://www.themoviedb.org/settings/api) `TMDB_API_KEY`. Then fill the catalogue and start both servers:

```bash
cd backend
npm run sync -- --full   # first time: ~400 top-rated films plus current releases
npm run dev              # http://localhost:8000

cd ../frontend
npm run dev              # http://localhost:5173
```

After that, the backend refreshes the catalogue by itself whenever the last sync is more than a day old.

### Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm test` | Recommender unit tests (`node --test`) |
| backend | `npm run sync` | Pull now-playing, popular and trending films from TMDB (`-- --full` adds the top-rated list) |
| frontend | `npm run typecheck` | TypeScript check |
| frontend | `npm run build` | Production build |

## API

Routes marked with a lock need `Authorization: Bearer <token>`; they always act on the signed-in user.

| Method | Route | |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/demo` | Returns `{ token, user }` |
| GET | `/movies`, `/movies/:id`, `/movies/:id/similar`, `/movies/:id/providers?region=FR` | Catalogue |
| GET | `/movies/search?q=` | Free-text search |
| GET 🔒 | `/movies/recommend` | Personal picks with reasons |
| GET | `/genres`, `/actors/:id` | |
| GET/PUT/DELETE 🔒 | `/users/me/ratings/:movieId` | Body `{ rate: 1 \| -1 }` |
| GET/PUT/DELETE 🔒 | `/users/me/watchlist/:movieId` | |
| GET 🔒 | `/users/me/stats` | Taste profile |
| DELETE 🔒 | `/users/me` | Deletes the account and its data |
| POST | `/admin/sync` | TMDB sync, needs the `X-Sync-Secret` header |

## Deployment

- **Backend** on [Render](https://render.com) with a Postgres database. Environment: `DATABASE_URL`, `JWT_SECRET`, `TMDB_API_KEY`, `SYNC_SECRET`, and optionally `CORS_ORIGIN=https://movie-muse-demo.vercel.app`.
- **Frontend** on [Vercel](https://vercel.com) with `VITE_BACKEND_URL` pointing at the backend. `vercel.json` rewrites every path to `index.html` so deep links work.
- **Daily sync**: add `BACKEND_URL` and `SYNC_SECRET` as GitHub repository secrets and `.github/workflows/sync.yml` triggers a sync every morning.
- **CI**: `.github/workflows/ci.yml` runs the backend tests, the frontend type check and the build on every push.

## Credits

Originally built as a school project during EI week. Since rebuilt: new frontend, TypeScript, PostgreSQL, a rewritten recommender, TMDB sync, and deployment pipeline.

Film data and images from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability by JustWatch.
