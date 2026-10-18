/**
 * Idempotent seed: loads the frontend mock data (../../src/data) into SQLite.
 * Single source of truth stays the frontend mock; run with `npm run db:seed`.
 * Safe to re-run (INSERT OR IGNORE + episode/comment rebuild per title).
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { actors, collections, comments, genres, titles } from '../../src/data';

const dbPath = process.env.DATABASE_PATH ?? './dev.sqlite';

async function main() {
  const ds = new DataSource({ type: 'better-sqlite3', database: dbPath });
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
    await qr.query('INSERT OR IGNORE INTO genres (slug, name, description) VALUES (?, ?, ?)', [
      g.slug,
      g.name,
      g.description,
    ]);
  }
  for (const a of actors) {
    await qr.query(
      'INSERT OR IGNORE INTO actors (slug, name, latin_name, photo, birth_year, birth_place, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [a.slug, a.name, a.latinName, a.photo, a.birthYear, a.birthPlace, a.bio],
    );
  }
  for (const t of titles) {
    await qr.query(
      `INSERT OR REPLACE INTO titles
        (slug, type, title_fa, title_en, year, jalali_year, runtime_min, seasons_count, episodes_count, countries, genres, director, "cast", description, imdb, site_score, age_rating, quality, dubbed, subtitled, poster, backdrop, views, added_at, featured, top10_rank, age_group, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        t.dubbed ? 1 : 0,
        t.subtitled ? 1 : 0,
        t.poster,
        t.backdrop,
        t.views,
        t.addedAt,
        t.featured ? 1 : 0,
        t.top10Rank ?? null,
        t.ageGroup ?? null,
        t.language,
      ],
    );
    for (const name of t.cast) {
      const slug = nameToSlug.get(name);
      if (slug) await qr.query('INSERT OR IGNORE INTO title_actors (title_slug, actor_slug) VALUES (?, ?)', [t.slug, slug]);
    }
    if (t.seasons) {
      for (const s of t.seasons) {
        for (const e of s.episodes) {
          await qr.query(
            'INSERT INTO episodes (title_slug, season, number, title_fa, duration_min, thumbnail, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [t.slug, e.season, e.number, e.title, e.durationMin, e.thumbnail, e.description],
          );
        }
      }
    }
    // Keep FTS in sync (triggers only fire on INSERT into titles).
    await qr.query('DELETE FROM titles_fts WHERE slug = ?', [t.slug]);
    await qr.query('INSERT INTO titles_fts (slug, title_fa, title_en) VALUES (?, ?, ?)', [t.slug, t.titleFa, t.titleEn ?? '']);
  }
  for (const c of collections) {
    await qr.query('INSERT OR IGNORE INTO collections (slug, name, description, cover) VALUES (?, ?, ?, ?)', [
      c.slug,
      c.name,
      c.description,
      c.cover,
    ]);
    await qr.query('DELETE FROM collection_titles WHERE collection_slug = ?', [c.slug]);
    for (const slug of c.titleSlugs) {
      if (knownSlugs.has(slug)) {
        await qr.query('INSERT OR IGNORE INTO collection_titles (collection_slug, title_slug) VALUES (?, ?)', [c.slug, slug]);
      }
    }
  }
  for (const c of comments) {
    await qr.query(
      'INSERT INTO comments (title_slug, author, avatar, date, rating, text, likes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.titleSlug, c.author, c.avatar, c.date, c.rating, c.text, c.likes],
    );
  }

  // Demo account for local development (password: movietoon123).
  const demoHash = await bcrypt.hash('movietoon123', 10);
  await qr.query(
    `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, created_at)
     VALUES ('00000000-0000-4000-8000-000000000001', 'demo@movietoon.example.ir', 'کاربر نمایشی', ?, 'user', ?)`,
    [demoHash, Math.floor(Date.now() / 1000)],
  );

  const counts = await qr.query(
    `SELECT (SELECT COUNT(*) FROM titles) AS titles, (SELECT COUNT(*) FROM episodes) AS episodes,
            (SELECT COUNT(*) FROM comments) AS comments, (SELECT COUNT(*) FROM genres) AS genres,
            (SELECT COUNT(*) FROM actors) AS actors, (SELECT COUNT(*) FROM collections) AS collections`,
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
