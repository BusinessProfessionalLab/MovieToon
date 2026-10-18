import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { clampPageSize, ok, pageMeta } from '../../common/response';

@ApiTags('search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    const query = (q ?? '').trim();
    if (!query) return ok([], undefined, pageMeta(0, 1, clampPageSize(Number(pageSize))));
    const p = Math.max(1, Number(page) || 1);
    const size = clampPageSize(Number(pageSize) || 12);
    const allowedType = type === 'movie' || type === 'series' || type === 'animation' ? type : null;

    // FTS5 first, LIKE fallback if the virtual table is unavailable.
    let slugs: string[] | null = null;
    try {
      const rows: { slug: string }[] = await this.dataSource.query(
        'SELECT slug FROM titles_fts WHERE titles_fts MATCH ? LIMIT 200',
        [query],
      );
      slugs = rows.map((r) => r.slug);
    } catch {
      slugs = null;
    }

    let where = '';
    const params: unknown[] = [];
    if (slugs !== null) {
      if (slugs.length === 0) return ok([], undefined, pageMeta(0, p, size));
      where = `slug IN (${slugs.map(() => '?').join(',')})`;
      params.push(...slugs);
    } else {
      where = `(title_fa LIKE ? OR COALESCE(title_en, '') LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }
    if (allowedType) {
      where += ' AND type = ?';
      params.push(allowedType);
    }
    const totalRows = (await this.dataSource.query(`SELECT COUNT(*) AS n FROM titles WHERE ${where}`, params)) as { n: number }[];
    const rows = (await this.dataSource.query(
      `SELECT slug, type, title_fa AS "titleFa", title_en AS "titleEn", jalali_year AS "year", imdb AS rating, poster FROM titles WHERE ${where} ORDER BY imdb DESC LIMIT ? OFFSET ?`,
      [...params, size, (p - 1) * size],
    )) as Record<string, unknown>[];
    return ok(rows, undefined, pageMeta(Number(totalRows[0]?.n ?? 0), p, size));
  }
}
