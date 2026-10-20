import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../../common/response';
import { AdminGuard } from '../auth/admin.guard';
import { TitlesService } from './titles.service';
import { ListTitlesQuery } from './dto/list-titles.query';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { SetHomeAnimationDto } from './dto/set-home-animation.dto';
import { SetTop10Dto } from './dto/set-top10.dto';

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

  @Put('featured')
  @UseGuards(AdminGuard)
  async setFeatured(@Body() dto: SetFeaturedDto) {
    return ok(await this.titles.setFeatured(dto.slugs));
  }

  @Put('top10')
  @UseGuards(AdminGuard)
  async setTop10(@Body() dto: SetTop10Dto) {
    return ok(await this.titles.setTop10(dto.slugs));
  }

  @Put('home-animation')
  @UseGuards(AdminGuard)
  async setHomeAnimation(@Body() dto: SetHomeAnimationDto) {
    return ok(await this.titles.setHomeAnimation(dto.slugs));
  }

  @Get(':slug/links')
  async links(@Param('slug') slug: string, @Query('episodeId') episodeId?: string) {
    const ep = episodeId !== undefined && episodeId !== '' ? Number(episodeId) : undefined;
    return ok(await this.titles.linksOf(slug, Number.isFinite(ep as number) ? (ep as number) : undefined));
  }
}
