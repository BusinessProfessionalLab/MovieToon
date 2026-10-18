import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../../common/response';
import { TitlesService } from './titles.service';
import { ListTitlesQuery } from './dto/list-titles.query';

@ApiTags('titles')
@Controller('api/titles')
export class TitlesController {
  constructor(private readonly titles: TitlesService) {}

  @Get()
  async list(@Query() query: ListTitlesQuery) {
    const { data, meta } = await this.titles.list(query);
    return ok(data, undefined, meta);
  }

  @Get('top')
  async top10() {
    return ok(await this.titles.top10());
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const t = await this.titles.detail(slug);
    return ok({ ...t, collectionSlugs: await this.titles.collectionSlugsOf(slug) });
  }

  @Get(':slug/related')
  async related(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 6;
    return ok(await this.titles.related(slug, Number.isFinite(n) ? n : 6));
  }

  @Get(':slug/comments')
  async comments(@Param('slug') slug: string) {
    return ok(await this.titles.commentsOf(slug));
  }
}
