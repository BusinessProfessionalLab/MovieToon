/**
 * Idempotent seed: loads the frontend mock data (../../src/data) into Postgres.
 * Single source of truth stays the frontend mock; run with `npm run db:seed`.
 * Safe to re-run (ON CONFLICT DO NOTHING + episode/comment rebuild per title).
 * Reads the same DB_* env vars as the app.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { actors, collections, comments, genres, titles } from '../../src/data';

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'movietoon',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'movietoon',
  });
  await ds.initialize();
  const qr = ds.createQueryRunner();
  await qr.connect();

  const nameToSlug = new Map(actors.map((a) => [a.name, a.slug] as const));
  const knownSlugs = new Set(titles.map((t) => t.slug));

  await qr.query('DELETE FROM title_actors');
  await qr.query('DELETE FROM collection_titles');
  await qr.query('DELETE FROM episodes');
  await qr.query('DELETE FROM comments');

  for (const g of genres) {
    await qr.query('INSERT INTO genres (slug, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
      g.slug,
      g.name,
      g.description,
    ]);
  }
  for (const a of actors) {
    await qr.query(
      'INSERT INTO actors (slug, name, latin_name, photo, birth_year, birth_place, bio) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
      [a.slug, a.name, a.latinName, a.photo, a.birthYear, a.birthPlace, a.bio],
    );
  }
  for (const t of titles) {
    await qr.query(
      `INSERT INTO titles
        (slug, type, title_fa, title_en, year, jalali_year, runtime_min, seasons_count, episodes_count, countries, genres, director, "cast", description, imdb, site_score, age_rating, quality, dubbed, subtitled, poster, backdrop, views, added_at, featured, top10_rank, age_group, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
       ON CONFLICT (slug) DO UPDATE SET
        type=EXCLUDED.type, title_fa=EXCLUDED.title_fa, title_en=EXCLUDED.title_en, year=EXCLUDED.year,
        jalali_year=EXCLUDED.jalali_year, runtime_min=EXCLUDED.runtime_min, seasons_count=EXCLUDED.seasons_count,
        episodes_count=EXCLUDED.episodes_count, countries=EXCLUDED.countries, genres=EXCLUDED.genres,
        director=EXCLUDED.director, "cast"=EXCLUDED."cast", description=EXCLUDED.description, imdb=EXCLUDED.imdb,
        site_score=EXCLUDED.site_score, age_rating=EXCLUDED.age_rating, quality=EXCLUDED.quality,
        dubbed=EXCLUDED.dubbed, subtitled=EXCLUDED.subtitled, poster=EXCLUDED.poster, backdrop=EXCLUDED.backdrop,
        views=EXCLUDED.views, added_at=EXCLUDED.added_at, featured=EXCLUDED.featured, top10_rank=EXCLUDED.top10_rank,
        age_group=EXCLUDED.age_group, language=EXCLUDED.language`,
      [
        t.slug,
        t.type,
        t.titleFa,
        t.titleEn,
        t.year,
        t.jalaliYear,
        t.runtimeMin,
        t.seasonsCount,
        t.episodesCount,
        JSON.stringify(t.countries),
        JSON.stringify(t.genres),
        t.director,
        JSON.stringify(t.cast),
        t.description,
        t.imdb,
        t.siteScore,
        t.ageRating,
        t.quality,
        t.dubbed,
        t.subtitled,
        t.poster,
        t.backdrop,
        t.views,
        t.addedAt,
        t.featured,
        t.top10Rank ?? null,
        t.ageGroup ?? null,
        t.language,
      ],
    );
    for (const name of t.cast) {
      const slug = nameToSlug.get(name);
      if (slug) await qr.query('INSERT INTO title_actors (title_slug, actor_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING', [t.slug, slug]);
    }
    if (t.seasons) {
      for (const s of t.seasons) {
        for (const e of s.episodes) {
          await qr.query(
            'INSERT INTO episodes (title_slug, season, number, title_fa, duration_min, thumbnail, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [t.slug, e.season, e.number, e.title, e.durationMin, e.thumbnail, e.description],
          );
        }
      }
    }
  }
  for (const c of collections) {
    await qr.query('INSERT INTO collections (slug, name, description, cover) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [
      c.slug,
      c.name,
      c.description,
      c.cover,
    ]);
    await qr.query('DELETE FROM collection_titles WHERE collection_slug = $1', [c.slug]);
    for (const slug of c.titleSlugs) {
      if (knownSlugs.has(slug)) {
        await qr.query('INSERT INTO collection_titles (collection_slug, title_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING', [c.slug, slug]);
      }
    }
  }
  for (const c of comments) {
    await qr.query(
      'INSERT INTO comments (title_slug, author, avatar, date, rating, text, likes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [c.titleSlug, c.author, c.avatar, c.date, c.rating, c.text, c.likes],
    );
  }

  // Demo account for local development (password: movietoon123).
  const demoHash = await bcrypt.hash('movietoon123', 10);
  await qr.query(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES ('00000000-0000-4000-8000-000000000001', 'demo@movietoon.example.ir', 'کاربر نمایشی', $1, 'user', $2)
     ON CONFLICT DO NOTHING`,
    [demoHash, Math.floor(Date.now() / 1000)],
  );

  const counts = await qr.query(
    `SELECT (SELECT COUNT(*)::int FROM titles) AS titles, (SELECT COUNT(*)::int FROM episodes) AS episodes,
            (SELECT COUNT(*)::int FROM comments) AS comments, (SELECT COUNT(*)::int FROM genres) AS genres,
            (SELECT COUNT(*)::int FROM actors) AS actors, (SELECT COUNT(*)::int FROM collections) AS collections`,
  );
  // eslint-disable-next-line no-console
  console.log('seed complete:', counts[0]);
  await qr.release();
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
