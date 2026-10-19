import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ok } from '../../common/response';
import { Collection } from '../../database/entities/collection.entity';
import { TitlesService } from '../titles/titles.service';

@ApiTags('collections')
@Controller('api/collections')
export class CollectionsController {
  constructor(
    @InjectRepository(Collection) private readonly collections: Repository<Collection>,
    private readonly titles: TitlesService,
  ) {}

  @Get()
  async list() {
    const rows = await this.collections.find({ order: { name: 'ASC' } });
    const withSlugs = await Promise.all(
      rows.map(async (c) => {
        const titleSlugs = await this.titleSlugs(c.slug);
        return { slug: c.slug, name: c.name, description: c.description, cover: c.cover, titleSlugs, count: titleSlugs.length };
      }),
    );
    return ok(withSlugs);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const collection = await this.collections.findOne({ where: { slug } });
    if (!collection) throw new NotFoundException({ code: 'NOT_FOUND', error: 'مجموعه پیدا نشد.' });
    const slugs = await this.titleSlugs(slug);
    return ok({ collection, titles: await this.titles.bySlugs(slugs) });
  }

  private async titleSlugs(slug: string): Promise<string[]> {
    const rows: { title_slug: string }[] = await this.collections.manager.query(
      'SELECT title_slug FROM collection_titles WHERE collection_slug = $1',
      [slug],
    );
    return rows.map((r) => r.title_slug);
  }
}
