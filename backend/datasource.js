import { DataSource } from 'typeorm';

export const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  ssl: { rejectUnauthorized: false },
  schema: 'public',
  entities: ['entities/*.js'],
});
