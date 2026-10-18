import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clampPageSize, ok } from '../../common/response';
import { Genre } from '../../database/entities/genre.entity';
import { TitlesService } from '../titles/titles.service';

@ApiTags('genres')
@Controller('api/genres')
export class GenresController {
  constructor(
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    private readonly titles: TitlesService,
  ) {}

  @Get()
  async list() {
    return ok(await this.genres.find({ order: { name: 'ASC' } }));
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string, @Query('page') page = '1', @Query('pageSize') pageSize = '12') {
    const genre = await this.genres.findOne({ where: { slug } });
    if (!genre) throw new NotFoundException({ code: 'NOT_FOUND', error: 'ژانر پیدا نشد.' });
    const p = Math.max(1, Number(page) || 1);
    const size = clampPageSize(Number(pageSize) || 12);
    const result = await this.titles.list({ genre: genre.name, page: p, pageSize: size, sort: 'newest' });
    return ok({ genre, titles: result.data, meta: result.meta });
  }
}
