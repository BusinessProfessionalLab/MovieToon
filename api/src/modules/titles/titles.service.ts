import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clampPageSize, pageMeta } from '../../common/response';
import { TitleComment } from '../../database/entities/comment.entity';
import { DownloadLink } from '../../database/entities/download-link.entity';
import { Title } from '../../database/entities/title.entity';
import { ListTitlesQuery } from './dto/list-titles.query';

@Injectable()
export class TitlesService {
  constructor(
    @InjectRepository(Title) private readonly titles: Repository<Title>,
    @InjectRepository(DownloadLink) private readonly links: Repository<DownloadLink>,
  ) {}

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
      countries: t.countries,
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
      qb.andWhere(`t.genres ? :genre`, { genre: query.genre });
    }
    if (query.country) {
      qb.andWhere(`t.countries ? :country`, { country: query.country });
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
    if (query.homeAnimation !== undefined) {
      qb.andWhere('t.homeAnimation = :homeAnimation', { homeAnimation: query.homeAnimation ? 1 : 0 });
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
      'SELECT collection_slug FROM collection_titles WHERE title_slug = $1',
      [slug],
    );
    const collectionSlugs = collRows.map((r) => r.collection_slug);
    const actorRows = await this.titles.manager.query(
      'SELECT a.slug AS slug, a.name AS name, a.photo AS photo FROM title_actors ta JOIN actors a ON a.slug = ta.actor_slug WHERE ta.title_slug = $1',
      [slug],
    );
    const actors = (actorRows as { slug: string; name: string; photo: string }[]).map((a) => ({ slug: a.slug, name: a.name, photo: a.photo ?? '' }));
    const flatEpisodes = (t.episodes ?? [])
      .sort((a, b) => a.season - b.season || a.number - b.number)
      .map((e) => ({ id: e.id, season: e.season, number: e.number, title: e.titleFa, durationMin: e.durationMin, thumbnail: e.thumbnail ?? '', description: e.description ?? '', externalId: e.externalId ?? null }));
    const seasonNumbers = [...new Set(flatEpisodes.map((e) => e.season))];
    const seasons = seasonNumbers.map((season) => ({
      number: season,
      episodes: flatEpisodes
        .filter((e) => e.season === season)
        .map((e) => ({
          id: `${slug}-s${e.season}e${e.number}`,
          episodeId: e.id,
          season: e.season,
          number: e.number,
          title: e.title,
          durationMin: e.durationMin,
          thumbnail: e.thumbnail,
          description: e.description,
        })),
    }));
    const castNames = actors.map((a) => a.name);    if (Array.isArray(t.cast)) {
      for (const n of t.cast as unknown[]) {
        if (typeof n === 'string' && !castNames.includes(n)) castNames.push(n);
      }
    }
    const downloadLinks = (await this.links.find({ where: { titleSlug: slug } as never, order: { id: 'ASC' } })).map((l) => ({
      id: l.id,
      episodeId: l.episodeId,
      type: l.linkType,
      url: l.url,
      quality: l.quality,
      size: l.size,
      label: l.label,
    }));
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
      downloadLinks,
      collectionSlugs,
    };
  }

  async related(slug: string, limit = 6) {
    const base = await this.titles.findOne({ where: { slug } });
    if (!base) throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    const peers = (await this.titles.manager.query(
      `SELECT t.slug AS "slug", t.type AS "type", t.title_fa AS "titleFa", t.title_en AS "titleEn",
              t.year AS "year", t.jalali_year AS "jalaliYear", t.imdb AS "rating", t.poster AS "poster",
              t.genres AS "genres", t.added_at AS "createdAt" FROM titles t
       WHERE t.slug != $1 AND t.genres ?| $2
       ORDER BY t.imdb DESC LIMIT $3`,
      [slug, base.genres, Math.min(Math.max(1, limit), 20)],
    )) as Record<string, unknown>[];
    return peers.map((t) =>
      this.summary({
        ...(t as object),
        genres: Array.isArray(t['genres']) ? (t['genres'] as string[]) : [],
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

  /** Download/playback links imported from seeko getaffiliatelinks. */
  async linksOf(slug: string, episodeId?: number) {
    const exists = await this.titles.exist({ where: { slug } });
    if (!exists) throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    const where: Record<string, unknown> = { titleSlug: slug };
    if (episodeId !== undefined) where.episodeId = episodeId;
    return this.links.find({ where: where as never, order: { id: 'ASC' } });
  }

  async collectionSlugsOf(slug: string): Promise<string[]> {
    const rows: { collection_slug: string }[] = await this.titles.manager.query(
      'SELECT collection_slug FROM collection_titles WHERE title_slug = $1',
      [slug],
    );
    return rows.map((r) => r.collection_slug);
  }

  /** Full replace of the Hero set: checked slugs become featured, everything else is cleared. */
  async setFeatured(slugs: string[]): Promise<{ count: number }> {
    const unique = [...new Set(slugs.filter((s) => typeof s === 'string' && s.length > 0))];
    await this.titles.manager.transaction(async (tx) => {
      await tx.query('UPDATE titles SET featured = false WHERE featured = true');
      if (unique.length > 0) {
        await tx.query('UPDATE titles SET featured = true WHERE slug = ANY($1)', [unique]);
      }
    });
    return { count: unique.length };
  }

  /** Full replace of the Top10: rank = selection order (1-based). */
  async setTop10(slugs: string[]): Promise<{ count: number }> {
    const unique = [...new Set(slugs.filter((s) => typeof s === 'string' && s.length > 0))].slice(0, 10);
    await this.titles.manager.transaction(async (tx) => {
      await tx.query('UPDATE titles SET top10_rank = NULL WHERE top10_rank IS NOT NULL');
      for (let i = 0; i < unique.length; i++) {
        await tx.query('UPDATE titles SET top10_rank = $2 WHERE slug = $1', [unique[i], i + 1]);
      }
    });
    return { count: unique.length };
  }

  /** Full replace of the homepage "popular animations" set. */
  async setHomeAnimation(slugs: string[]): Promise<{ count: number }> {
    const unique = [...new Set(slugs.filter((s) => typeof s === 'string' && s.length > 0))];
    await this.titles.manager.transaction(async (tx) => {
      await tx.query('UPDATE titles SET home_animation = false WHERE home_animation = true');
      if (unique.length > 0) {
        await tx.query('UPDATE titles SET home_animation = true WHERE slug = ANY($1)', [unique]);
      }
    });
    return { count: unique.length };
  }
}
