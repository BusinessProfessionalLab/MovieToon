import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ok } from '../../common/response';
import { Actor } from '../../database/entities/actor.entity';
import { TitlesService } from '../titles/titles.service';

@ApiTags('actors')
@Controller('api/actors')
export class ActorsController {
  constructor(
    @InjectRepository(Actor) private readonly actors: Repository<Actor>,
    private readonly titles: TitlesService,
  ) {}

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const actor = await this.actors.findOne({ where: { slug } });
    if (!actor) throw new NotFoundException({ code: 'NOT_FOUND', error: 'بازیگر پیدا نشد.' });
    const rows: { title_slug: string }[] = await this.actors.manager.query(
      'SELECT title_slug FROM title_actors WHERE actor_slug = ?',
      [slug],
    );
    const titles = await this.titles.bySlugs(rows.map((r) => r.title_slug));
    return ok({ actor, titles });
  }
}
