import { DataSource } from 'typeorm';

// TODO: replace `synchronize` with migrations once the schema settles; for now
// it only ever adds the new nullable columns and tables.
export const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  schema: 'public',
  entities: ['entities/*.js'],
});
