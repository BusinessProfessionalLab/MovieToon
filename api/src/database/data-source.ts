import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { InitSchema1793000000000 } from './migrations/1793000000000-init-schema';
import { SeekoImport1793100000000 } from './migrations/1793100000000-seeko-import';
import { HomepagePicks1793200000000 } from './migrations/1793200000000-homepage-picks';
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
  // Neon and other managed providers need TLS (DB_SSL=true).
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: ENTITIES,
  migrations: [InitSchema1793000000000, SeekoImport1793100000000, HomepagePicks1793200000000],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
