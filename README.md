# MovieMuse

A movie recommendation web app built with React, TypeScript, and Node.js. Recommends films based on user ratings using cosine similarity.

**Live demo:** [movie-muse-demo.vercel.app](https://movie-muse-demo.vercel.app/)  

---

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, TanStack Query  
**Backend:** Node.js, Express, TypeORM, PostgreSQL (SQLite for local dev)  
**Auth:** JWT + bcrypt  
**Data:** TMDB API

---

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/HassanAiolio/movie-muse-demo.git
cd movie-muse-demo
```

### 2. Install dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configure environment variables

In `backend/`, create a `.env` file based on `.env.example`:
```
NODE_ENV=development
DATABASE_NAME=database.sqlite3
JWT_SECRET=any_random_string
TMDB_API_KEY=your_tmdb_api_key
```

In `frontend/`, create a `.env` file based on `.env.example`:
```
VITE_BACKEND_URL=http://localhost:8000
```

### 4. Seed the database
```bash
cd backend
node -r dotenv/config seedMovies.js
node -r dotenv/config seedDemoUser.js
```

This fetches movies from TMDB and populates the database. Wait for it to complete before running the app.

### 5. Run the app

In one terminal:
```bash
cd backend && npm run dev
```

In another terminal:
```bash
cd frontend && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## How it works

1. Sign up and select films you like on the onboarding screen
2. Rate movies with thumbs up/down on any movie detail page
3. The recommendation engine uses cosine similarity on your rating history to surface films you're likely to enjoy
4. The more you rate, the better the recommendations

---

## Deployment

Backend is deployed on [Render](https://render.com) with a PostgreSQL database.  
Frontend is deployed on [Vercel](https://vercel.com).

To deploy your own instance:
- Create a PostgreSQL database on Render and set `DATABASE_URL` as an env var on your backend service
- Seed the remote database by pointing `DATABASE_URL` in your local `.env` to the external Render DB URL and running `seedMovies.js`
- Deploy the frontend on Vercel with `VITE_BACKEND_URL` pointing to your Render backend URL

---

## Credits

Originally developed during EI week. Rebuilt and extended with a new frontend, TypeScript migration, PostgreSQL support, and deployment pipeline.