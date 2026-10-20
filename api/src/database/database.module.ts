import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities';
import { InitSchema1793000000000 } from './migrations/1793000000000-init-schema';
import { SeekoImport1793100000000 } from './migrations/1793100000000-seeko-import';
import { HomepagePicks1793200000000 } from './migrations/1793200000000-homepage-picks';
import { SnakeNamingStrategy } from './naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'movietoon'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'movietoon'),
        // Managed providers (Neon) need TLS.
        ssl: config.get<boolean>('DB_SSL', false) ? { rejectUnauthorized: false } : undefined,
        entities: ENTITIES,
        migrations: [InitSchema1793000000000, SeekoImport1793100000000, HomepagePicks1793200000000],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
