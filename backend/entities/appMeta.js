import typeorm from 'typeorm';

// Tiny key/value store for app state such as the last TMDB sync time.
const AppMeta = new typeorm.EntitySchema({
  name: 'AppMeta',
  tableName: 'app_meta',
  columns: {
    key: { primary: true, type: String },
    value: { type: String },
  },
});

export default AppMeta;
