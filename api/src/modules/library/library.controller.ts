import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUserId } from '../../common/current-user.decorator';
import { ok } from '../../common/response';
import { Favorite } from '../../database/entities/favorite.entity';
import { WatchProgress } from '../../database/entities/watch-progress.entity';
import { WatchlistItem } from '../../database/entities/watchlist-item.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressDto, SlugListDto } from './dto/library.dto';

@ApiTags('library')
@UseGuards(JwtAuthGuard)
@Controller('api/users/me')
export class LibraryController {
  constructor(
    @InjectRepository(Favorite) private readonly favorites: Repository<Favorite>,
    @InjectRepository(WatchlistItem) private readonly watchlist: Repository<WatchlistItem>,
    @InjectRepository(WatchProgress) private readonly progress: Repository<WatchProgress>,
  ) {}

  private now() {
    return Math.floor(Date.now() / 1000);
  }

  @Get('favorites')
  async getFavorites(@CurrentUserId() userId: string) {
    const rows = await this.favorites.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return ok(rows.map((r) => r.titleSlug));
  }

  @Put('favorites')
  async setFavorites(@CurrentUserId() userId: string, @Body() dto: SlugListDto) {
    await this.favorites.manager.transaction(async (tx) => {
      await tx.delete(Favorite, { userId });
      if (dto.slugs.length > 0) {
        await tx.insert(Favorite, dto.slugs.map((slug) => ({ userId, titleSlug: slug, createdAt: this.now() })));
      }
    });
    return ok(dto.slugs);
  }

  @Get('watchlist')
  async getWatchlist(@CurrentUserId() userId: string) {
    const rows = await this.watchlist.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return ok(rows.map((r) => r.titleSlug));
  }

  @Put('watchlist')
  async setWatchlist(@CurrentUserId() userId: string, @Body() dto: SlugListDto) {
    await this.watchlist.manager.transaction(async (tx) => {
      await tx.delete(WatchlistItem, { userId });
      if (dto.slugs.length > 0) {
        await tx.insert(WatchlistItem, dto.slugs.map((slug) => ({ userId, titleSlug: slug, createdAt: this.now() })));
      }
    });
    return ok(dto.slugs);
  }

  @Get('progress')
  async getProgress(@CurrentUserId() userId: string) {
    const rows = await this.progress.find({ where: { userId } });
    const map: Record<string, number> = {};
    for (const r of rows) map[r.titleSlug] = r.seconds;
    return ok(map);
  }

  @Put('progress')
  async setProgress(@CurrentUserId() userId: string, @Body() dto: ProgressDto) {
    await this.progress.upsert({ userId, titleSlug: dto.slug, seconds: dto.seconds, updatedAt: this.now() }, ['userId', 'titleSlug']);
    return ok({ slug: dto.slug, seconds: dto.seconds });
  }
}
