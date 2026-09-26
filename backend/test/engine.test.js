import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildIndex, recommend, search, sharedTraits, similar, tokenize } from '../recommender/engine.js';

const crime = { id_genre: 80, genre_type: 'Crime' };
const drama = { id_genre: 18, genre_type: 'Drama' };
const animation = { id_genre: 16, genre_type: 'Animation' };
const family = { id_genre: 10751, genre_type: 'Family' };
const pacino = { id_actor: 1158, actor_name: 'Al Pacino' };
const deniro = { id_actor: 380, actor_name: 'Robert De Niro' };
const hanks = { id_actor: 31, actor_name: 'Tom Hanks' };

const movies = [
  {
    id_movie: 1,
    title: 'The Godfather',
    release_date: '1972-03-14',
    description: 'The aging patriarch of an organized crime dynasty transfers control to his son.',
    rating_tmdb: 8.7,
    genres: [crime, drama],
    cast: [pacino],
  },
  {
    id_movie: 2,
    title: 'Heat',
    release_date: '1995-12-15',
    description: 'A group of professional bank robbers plan a heist while a detective hunts them.',
    rating_tmdb: 7.9,
    genres: [crime, drama],
    cast: [pacino, deniro],
  },
  {
    id_movie: 3,
    title: 'Toy Story',
    release_date: '1995-11-22',
    description: 'A cowboy doll is threatened when a new spaceman toy arrives in the bedroom.',
    rating_tmdb: 8.0,
    genres: [animation, family],
    cast: [hanks],
  },
  {
    id_movie: 4,
    title: 'Casino',
    release_date: '1995-11-22',
    description: 'Greed, deception, money and murder in the Las Vegas crime underworld.',
    rating_tmdb: 8.0,
    genres: [crime, drama],
    cast: [deniro],
  },
  {
    id_movie: 5,
    title: 'Finding Nemo',
    release_date: '2003-05-30',
    description: 'A timid clownfish sets out on a journey across the ocean to bring his son home.',
    rating_tmdb: 7.8,
    genres: [animation, family],
    cast: [],
  },
];

const index = buildIndex(movies);
const ids = (results) => results.map((result) => result.movie.id_movie);

describe('tokenize', () => {
  it('stems words and drops stop words', () => {
    assert.deepEqual(tokenize('The robbers are planning a heist'), ['robber', 'plan', 'heist']);
  });

  it('handles empty input', () => {
    assert.deepEqual(tokenize(''), []);
    assert.deepEqual(tokenize(null), []);
  });
});

describe('recommend', () => {
  it('ranks films close to what the user liked first', () => {
    const results = recommend(index, [{ id_movie: 1, rate: 1 }]);
    assert.deepEqual(ids(results).slice(0, 2).sort(), [2, 4]);
    assert.ok(ids(results).indexOf(3) > 1);
  });

  it('never returns films the user already rated', () => {
    const results = recommend(index, [
      { id_movie: 1, rate: 1 },
      { id_movie: 3, rate: -1 },
    ]);
    assert.ok(!ids(results).includes(1));
    assert.ok(!ids(results).includes(3));
  });

  it('pushes films similar to dislikes down', () => {
    const results = recommend(index, [
      { id_movie: 1, rate: 1 },
      { id_movie: 3, rate: -1 },
    ]);
    assert.equal(ids(results).at(-1), 5);
  });

  it('explains each pick with the liked film it resembles', () => {
    const [top] = recommend(index, [{ id_movie: 1, rate: 1 }]);
    assert.equal(top.reason.id_movie, 1);
    assert.equal(top.reason.title, 'The Godfather');
    assert.ok(top.reason.shared.length > 0);
  });

  it('falls back to the best-rated films with no likes', () => {
    const results = recommend(index, []);
    assert.equal(results[0].movie.id_movie, 1);
    assert.equal(results[0].reason, null);
    assert.ok(results.every((result) => Number.isFinite(result.score)));
  });

  it('ignores ratings for movies that are not in the catalogue', () => {
    const results = recommend(index, [{ id_movie: 999, rate: 1 }]);
    assert.equal(results.length, movies.length);
  });

  it('respects the limit', () => {
    assert.equal(recommend(index, [{ id_movie: 1, rate: 1 }], { limit: 2 }).length, 2);
  });
});

describe('similar', () => {
  it('finds films that share cast and genres', () => {
    const results = similar(index, 2);
    assert.ok(!ids(results).includes(2));
    assert.deepEqual(ids(results).slice(0, 2).sort(), [1, 4]);
  });

  it('returns nothing for an unknown movie', () => {
    assert.deepEqual(similar(index, 999), []);
  });
});

describe('search', () => {
  it('matches an exact title first', () => {
    assert.equal(search(index, 'heat')[0].movie.id_movie, 2);
  });

  it('understands descriptive queries', () => {
    assert.equal(search(index, 'bank robbery heist')[0].movie.id_movie, 2);
    assert.equal(search(index, 'fish in the ocean')[0].movie.id_movie, 5);
  });

  it('matches cast names', () => {
    const results = ids(search(index, 'al pacino'));
    assert.deepEqual(results.slice(0, 2).sort(), [1, 2]);
  });

  it('ignores queries that are too short', () => {
    assert.deepEqual(search(index, 'a'), []);
  });
});

describe('sharedTraits', () => {
  it('lists shared actors before shared genres', () => {
    assert.deepEqual(sharedTraits(movies[1], movies[0]), ['Al Pacino', 'Crime', 'Drama']);
  });
});
