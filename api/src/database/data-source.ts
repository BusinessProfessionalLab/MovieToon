import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { InitSchema1793000000000 } from './migrations/1793000000000-init-schema';
import { SnakeNamingStrategy } from './naming.strategy';

/**
 * CLI entry for TypeORM (`npm run db:migrate`).
 * Reads the same DB_* env vars as the app.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'movietoon',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'movietoon',
  entities: ENTITIES,
  migrations: [InitSchema1793000000000],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
