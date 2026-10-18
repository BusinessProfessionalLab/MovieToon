import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ActorsModule } from './modules/actors/actors.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ContactModule } from './modules/contact/contact.module';
import { GenresModule } from './modules/genres/genres.module';
import { HealthModule } from './modules/health/health.module';
import { LibraryModule } from './modules/library/library.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SearchModule } from './modules/search/search.module';
import { TitlesModule } from './modules/titles/titles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    TitlesModule,
    GenresModule,
    CollectionsModule,
    ActorsModule,
    SearchModule,
    CommentsModule,
    ContactModule,
    ReportsModule,
    LibraryModule,
  ],
})
export class AppModule {}
