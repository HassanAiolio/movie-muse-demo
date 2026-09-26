const BASE_URL = 'https://api.themoviedb.org/3';

export function hasTmdbKey() {
  return Boolean(process.env.TMDB_API_KEY);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Accepts either a v4 read access token (starts with "eyJ") or a v3 API key.
export async function tmdb(path, params = {}) {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error('TMDB_API_KEY is not set');
  }
  const url = new URL(BASE_URL + path);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }
  const headers = { Accept: 'application/json' };
  if (key.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set('api_key', key);
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, { headers });
    if (response.status === 429) {
      await sleep(1000 * attempt);
      continue;
    }
    if (!response.ok) {
      throw new Error(`TMDB ${path} responded ${response.status}`);
    }

    return response.json();
  }
  throw new Error(`TMDB ${path} kept rate-limiting us`);
}
