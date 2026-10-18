import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { InitSchema1792000000000 } from './migrations/1792000000000-init-schema';
import { SnakeNamingStrategy } from './naming.strategy';

/**
 * CLI entry for TypeORM (`npm run db:migrate`).
 * Reads the same env vars as the app.
 */
export default new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH ?? './dev.sqlite',
  entities: ENTITIES,
  migrations: [InitSchema1792000000000],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
