import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities';
import { InitSchema1792000000000 } from './migrations/1792000000000-init-schema';
import { SnakeNamingStrategy } from './naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DATABASE_PATH', './dev.sqlite'),
        entities: ENTITIES,
        migrations: [InitSchema1792000000000],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
