import typeorm from 'typeorm';

const Movie = new typeorm.EntitySchema({
  name: 'Movie',
  columns: {
    id_movie: {
      primary: true,
      type: Number,
    },
    title: {
      type: String,
    },
    release_date: {
      type: String,
    },
    description: {
      type: String,
    },
    trailer: {
      type: String,
      nullable: true,
    },
    image: {
      type: String,
    },
    rating_tmdb: {
      type: String,
    },
    // Added by the TMDB sync; nullable so existing rows stay valid.
    backdrop: { type: String, nullable: true },
    tagline: { type: String, nullable: true },
    runtime: { type: 'int', nullable: true },
    popularity: { type: 'double precision', nullable: true },
    vote_count: { type: 'int', nullable: true },
  },
  relations: {
    movie_genre: {
      type: 'many-to-many',
      target: 'Genre',
      joinTable: {
        name: 'movie_genre', // Name of the join table
        joinColumn: { name: 'id_movie', referencedColumnName: 'id_movie' },
        inverseJoinColumn: {
          name: 'id_genre',
          referencedColumnName: 'id_genre',
        },
      },
    },
    actors: {
      type: 'many-to-many',
      target: 'Actor',
      joinTable: {
        name: 'cast', // Name of the join table
        joinColumn: { name: 'id_movie', referencedColumnName: 'id_movie' },
        inverseJoinColumn: {
          name: 'id_actor',
          referencedColumnName: 'id_actor',
        },
      },
    },
    movies_rates: {
      type: 'one-to-many',
      target: 'rating',
      inverseSide: 'Movie_rate',
    },
  },
});

export default Movie;
