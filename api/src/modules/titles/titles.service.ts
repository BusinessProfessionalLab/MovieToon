import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clampPageSize, pageMeta } from '../../common/response';
import { TitleComment } from '../../database/entities/comment.entity';
import { Title } from '../../database/entities/title.entity';
import { ListTitlesQuery } from './dto/list-titles.query';

@Injectable()
export class TitlesService {
  constructor(@InjectRepository(Title) private readonly titles: Repository<Title>) {}

  private summary(t: Title) {
    return {
      slug: t.slug,
      type: t.type,
      titleFa: t.titleFa,
      titleEn: t.titleEn,
      year: t.year,
      jalaliYear: t.jalaliYear,
      rating: t.imdb,
      poster: t.poster,
      backdrop: t.backdrop,
      description: t.description,
      genres: t.genres,
      director: t.director,
      durationMin: t.runtimeMin,
      seasons: t.seasonsCount,
      dubbed: t.dubbed,
      quality: t.quality,
      createdAt: t.addedAt,
      featured: t.featured,
      views: t.views,
      top10Rank: t.top10Rank,
      ageGroup: t.ageGroup,
    };
  }

  async list(query: ListTitlesQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = clampPageSize(query.pageSize ?? 12);
    const qb = this.titles.createQueryBuilder('t');
    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.year) qb.andWhere('t.year = :year', { year: query.year });
    if (query.genre) {
      qb.andWhere(`EXISTS (SELECT 1 FROM json_each(t.genres) WHERE value = :genre)`, { genre: query.genre });
    }
    if (query.country) {
      qb.andWhere(`EXISTS (SELECT 1 FROM json_each(t.countries) WHERE value = :country)`, { country: query.country });
    }
    if (query.minRating !== undefined) {
      qb.andWhere('t.imdb >= :minRating', { minRating: query.minRating });
    }
    if (query.ageGroup) {
      qb.andWhere('t.ageGroup = :ageGroup', { ageGroup: query.ageGroup });
    }
    if (query.featured !== undefined) {
      qb.andWhere('t.featured = :featured', { featured: query.featured ? 1 : 0 });
    }
    if (query.q?.trim()) {
      const like = `%${query.q.trim()}%`;
      qb.andWhere('(t.titleFa LIKE :q OR t.titleEn LIKE :q OR t.director LIKE :q)', { q: like });
    }
    const sort = query.sort ?? 'newest';
    if (sort === 'rating') qb.orderBy('t.imdb', 'DESC');
    else if (sort === 'year') qb.orderBy('t.year', 'DESC');
    else if (sort === 'views') qb.orderBy('t.views', 'DESC');
    else qb.orderBy('t.addedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((t) => this.summary(t)), meta: pageMeta(total, page, pageSize) };
  }

  async detail(slug: string) {
    const t = await this.titles.findOne({ where: { slug }, relations: { actors: true, episodes: true } });
    if (!t) {
      throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    }
    const collRows: { collection_slug: string }[] = await this.titles.manager.query(
      'SELECT collection_slug FROM collection_titles WHERE title_slug = ?',
      [slug],
    );
    const collectionSlugs = collRows.map((r) => r.collection_slug);
    const actorRows = await this.titles.manager.query(
      'SELECT a.slug AS slug, a.name AS name, a.photo AS photo FROM title_actors ta JOIN actors a ON a.slug = ta.actor_slug WHERE ta.title_slug = ?',
      [slug],
    );
    const actors = (actorRows as { slug: string; name: string; photo: string }[]).map((a) => ({ slug: a.slug, name: a.name, photo: a.photo ?? '' }));
    const flatEpisodes = (t.episodes ?? [])
      .sort((a, b) => a.season - b.season || a.number - b.number)
      .map((e) => ({ season: e.season, number: e.number, title: e.titleFa, durationMin: e.durationMin }));
    const seasonNumbers = [...new Set(flatEpisodes.map((e) => e.season))];
    const seasons = seasonNumbers.map((season) => ({
      number: season,
      episodes: flatEpisodes
        .filter((e) => e.season === season)
        .map((e) => ({
          id: `${slug}-s${e.season}e${e.number}`,
          season: e.season,
          number: e.number,
          title: e.title,
          durationMin: e.durationMin,
          thumbnail: '',
          description: '',
        })),
    }));
    const castNames = actors.map((a) => a.name);    if (Array.isArray(t.cast)) {
      for (const n of t.cast as unknown[]) {
        if (typeof n === 'string' && !castNames.includes(n)) castNames.push(n);
      }
    }
    return {
      slug: t.slug,
      type: t.type,
      titleFa: t.titleFa,
      titleEn: t.titleEn,
      year: t.year,
      jalaliYear: t.jalaliYear,
      runtimeMin: t.runtimeMin,
      seasonsCount: t.seasonsCount ?? (seasons.length || null),
      episodesCount: t.episodesCount ?? flatEpisodes.length,
      countries: t.countries,
      genres: t.genres,
      director: t.director,
      cast: castNames,
      description: t.description,
      imdb: t.imdb,
      siteScore: t.siteScore,
      ageRating: t.ageRating,
      quality: t.quality,
      dubbed: !!t.dubbed,
      subtitled: t.subtitled !== false,
      poster: t.poster,
      backdrop: t.backdrop,
      views: t.views,
      addedAt: t.addedAt,
      featured: !!t.featured,
      top10Rank: t.top10Rank ?? undefined,
      ageGroup: t.ageGroup ?? undefined,
      language: t.language,
      actors,
      seasons,
      collectionSlugs,
    };
  }

  async related(slug: string, limit = 6) {
    const base = await this.titles.findOne({ where: { slug } });
    if (!base) throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    const peers = (await this.titles.manager.query(
      `SELECT DISTINCT t.slug AS "slug", t.type AS "type", t.title_fa AS "titleFa", t.title_en AS "titleEn",
              t.year AS "year", t.jalali_year AS "jalaliYear", t.imdb AS "rating", t.poster AS "poster",
              t.genres AS "genres", t.added_at AS "createdAt" FROM titles t, json_each(t.genres) g
       WHERE g.value IN (${base.genres.map(() => '?').join(',') || "'__none__'"}) AND t.slug != ?
       ORDER BY t.imdb DESC LIMIT ?`,
      [...base.genres, slug, Math.min(Math.max(1, limit), 20)],
    )) as Record<string, unknown>[];
    return peers.map((t) =>
      this.summary({
        ...(t as object),
        genres: typeof t['genres'] === 'string' ? (JSON.parse(t['genres'] as string) as string[]) : [],
      } as Title),
    );
  }

  async top10() {
    const rows = await this.titles.createQueryBuilder('t')
      .where('t.top10Rank IS NOT NULL')
      .orderBy('t.top10Rank', 'ASC')
      .take(10)
      .getMany();
    return rows.map((t) => this.summary(t));
  }

  async bySlugs(slugs: string[]) {    if (slugs.length === 0) return [];
    const rows = await this.titles.find({ where: slugs.map((slug) => ({ slug })) });
    const order = new Map(slugs.map((s, i) => [s, i]));
    return rows
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
      .map((t) => this.summary(t));
  }

  async commentsOf(slug: string) {
    const exists = await this.titles.exist({ where: { slug } });
    if (!exists) throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    const rows = await this.titles.manager.getRepository(TitleComment).find({ where: { titleSlug: slug }, order: { id: 'DESC' } });
    return rows;
  }

  async collectionSlugsOf(slug: string): Promise<string[]> {
    const rows: { collection_slug: string }[] = await this.titles.manager.query(
      'SELECT collection_slug FROM collection_titles WHERE title_slug = ?',
      [slug],
    );
    return rows.map((r) => r.collection_slug);
  }
}
