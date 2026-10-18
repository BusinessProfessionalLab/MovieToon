import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from '../../database/entities/favorite.entity';
import { WatchProgress } from '../../database/entities/watch-progress.entity';
import { WatchlistItem } from '../../database/entities/watchlist-item.entity';
import { AuthModule } from '../auth/auth.module';
import { LibraryController } from './library.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, WatchlistItem, WatchProgress]), AuthModule],
  controllers: [LibraryController],
})
export class LibraryModule {}
