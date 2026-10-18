import { MigrationInterface, QueryRunner } from 'typeorm';

/** 0001 — full initial schema: catalog, comments, reports, auth, user lists. */
export class InitSchema1792000000000 implements MigrationInterface {
  name = 'InitSchema1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "genres" (
      "slug" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" text
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "actors" (
      "slug" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "latin_name" varchar NOT NULL,
      "photo" varchar NOT NULL DEFAULT (''),
      "birth_year" integer NOT NULL,
      "birth_place" varchar NOT NULL DEFAULT (''),
      "bio" text NOT NULL DEFAULT ('')
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "titles" (
      "slug" varchar PRIMARY KEY NOT NULL,
      "type" varchar NOT NULL,
      "title_fa" varchar NOT NULL,
      "title_en" varchar NOT NULL DEFAULT (''),
      "year" integer NOT NULL,
      "jalali_year" integer NOT NULL,
      "runtime_min" integer,
      "seasons_count" integer,
      "episodes_count" integer,
      "countries" text NOT NULL DEFAULT ('[]'),
      "genres" text NOT NULL DEFAULT ('[]'),
      "director" varchar NOT NULL DEFAULT (''),
      "cast" text NOT NULL DEFAULT ('[]'),
      "description" text NOT NULL DEFAULT (''),
      "imdb" real NOT NULL DEFAULT (0),
      "site_score" real NOT NULL DEFAULT (0),
      "age_rating" varchar NOT NULL DEFAULT (''),
      "quality" varchar NOT NULL DEFAULT (''),
      "dubbed" boolean NOT NULL DEFAULT (0),
      "subtitled" boolean NOT NULL DEFAULT (1),
      "poster" varchar NOT NULL DEFAULT (''),
      "backdrop" varchar NOT NULL DEFAULT (''),
      "views" integer NOT NULL DEFAULT (0),
      "added_at" varchar NOT NULL,
      "featured" boolean NOT NULL DEFAULT (0),
      "top10_rank" integer,
      "age_group" varchar,
      "language" varchar NOT NULL DEFAULT ('فارسی')
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_titles_type" ON "titles" ("type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_titles_year" ON "titles" ("year")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_titles_rating" ON "titles" ("imdb" DESC)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "title_actors" (
      "title_slug" varchar NOT NULL,
      "actor_slug" varchar NOT NULL,
      PRIMARY KEY ("title_slug", "actor_slug"),
      FOREIGN KEY ("title_slug") REFERENCES "titles"("slug") ON DELETE CASCADE,
      FOREIGN KEY ("actor_slug") REFERENCES "actors"("slug") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_title_actors_actor" ON "title_actors" ("actor_slug")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "collections" (
      "slug" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" text NOT NULL DEFAULT (''),
      "cover" varchar NOT NULL DEFAULT ('')
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "collection_titles" (
      "collection_slug" varchar NOT NULL,
      "title_slug" varchar NOT NULL,
      PRIMARY KEY ("collection_slug", "title_slug"),
      FOREIGN KEY ("collection_slug") REFERENCES "collections"("slug") ON DELETE CASCADE,
      FOREIGN KEY ("title_slug") REFERENCES "titles"("slug") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "episodes" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "title_slug" varchar NOT NULL,
      "season" integer NOT NULL,
      "number" integer NOT NULL,
      "title_fa" varchar NOT NULL,
      "duration_min" integer NOT NULL,
      "thumbnail" varchar NOT NULL DEFAULT (''),
      "description" text NOT NULL DEFAULT (''),
      FOREIGN KEY ("title_slug") REFERENCES "titles"("slug") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_episodes_title" ON "episodes" ("title_slug")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "comments" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "title_slug" varchar NOT NULL,
      "author" varchar NOT NULL,
      "avatar" varchar NOT NULL DEFAULT (''),
      "date" varchar NOT NULL,
      "rating" real NOT NULL DEFAULT (0),
      "text" text NOT NULL,
      "likes" integer NOT NULL DEFAULT (0),
      FOREIGN KEY ("title_slug") REFERENCES "titles"("slug") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_title" ON "comments" ("title_slug")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "contact_messages" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "subject" varchar NOT NULL DEFAULT (''),
      "message" text NOT NULL,
      "created_at" varchar NOT NULL
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "reports" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "link" varchar NOT NULL DEFAULT (''),
      "type" varchar NOT NULL,
      "description" text NOT NULL,
      "created_at" varchar NOT NULL
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" (
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL UNIQUE,
      "name" varchar NOT NULL,
      "password_hash" varchar NOT NULL,
      "role" varchar NOT NULL DEFAULT ('user'),
      "created_at" integer NOT NULL
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "refresh_tokens" (
      "jti" varchar PRIMARY KEY NOT NULL,
      "user_id" varchar NOT NULL,
      "family_id" varchar NOT NULL,
      "token_hash" varchar NOT NULL UNIQUE,
      "expires_at" integer NOT NULL,
      "consumed_at" integer,
      "revoked_at" integer,
      "replaced_by" varchar,
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_refresh_hash" ON "refresh_tokens" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_user" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_family" ON "refresh_tokens" ("family_id")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "favorites" (
      "user_id" varchar NOT NULL,
      "title_slug" varchar NOT NULL,
      "created_at" integer NOT NULL,
      PRIMARY KEY ("user_id", "title_slug"),
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "watchlist_items" (
      "user_id" varchar NOT NULL,
      "title_slug" varchar NOT NULL,
      "created_at" integer NOT NULL,
      PRIMARY KEY ("user_id", "title_slug"),
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "watch_progress" (
      "user_id" varchar NOT NULL,
      "title_slug" varchar NOT NULL,
      "seconds" integer NOT NULL DEFAULT (0),
      "updated_at" integer NOT NULL,
      PRIMARY KEY ("user_id", "title_slug"),
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    // Full-text search over Persian + latin titles.
    await queryRunner.query(`CREATE VIRTUAL TABLE IF NOT EXISTS "titles_fts" USING fts5(slug UNINDEXED, title_fa, title_en)`);
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS "trg_titles_fts_insert" AFTER INSERT ON "titles" BEGIN
      INSERT INTO "titles_fts" (slug, title_fa, title_en) VALUES (NEW."slug", NEW."title_fa", COALESCE(NEW."title_en", ''));
    END`);
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS "trg_titles_fts_delete" AFTER DELETE ON "titles" BEGIN
      DELETE FROM "titles_fts" WHERE slug = OLD."slug";
    END`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_titles_fts_delete"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_titles_fts_insert"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "titles_fts"`);
    for (const t of [
      'watch_progress',
      'watchlist_items',
      'favorites',
      'refresh_tokens',
      'users',
      'reports',
      'contact_messages',
      'comments',
      'episodes',
      'collection_titles',
      'collections',
      'title_actors',
      'titles',
      'actors',
      'genres',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${t}"`);
    }
  }
}
