import typeorm from 'typeorm';

const Watchlist = new typeorm.EntitySchema({
  name: 'Watchlist',
  tableName: 'watchlist',
  columns: {
    id_user: { primary: true, type: Number },
    id_movie: { primary: true, type: Number },
    added_at: { type: 'timestamptz', createDate: true },
  },
});

export default Watchlist;
