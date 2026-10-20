import { MigrationInterface, QueryRunner } from 'typeorm';

/** 0002 — seeko import support: external ids + download links. */
export class SeekoImport1793100000000 implements MigrationInterface {
  name = 'SeekoImport1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "external_id" varchar`);
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "imdb_id" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "upera_id" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "source_type" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "persian" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_titles_external_id') THEN ALTER TABLE "titles" ADD CONSTRAINT "UQ_titles_external_id" UNIQUE ("external_id"); END IF; END $$;`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_titles_external" ON "titles" ("external_id")`);

    await queryRunner.query(`ALTER TABLE "episodes" ADD COLUMN IF NOT EXISTS "external_id" varchar`);
    await queryRunner.query(`ALTER TABLE "episodes" ADD COLUMN IF NOT EXISTS "external_series_id" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "episodes" ADD COLUMN IF NOT EXISTS "upera_id" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "episodes" ADD COLUMN IF NOT EXISTS "master_file" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_episodes_external_id') THEN ALTER TABLE "episodes" ADD CONSTRAINT "UQ_episodes_external_id" UNIQUE ("external_id"); END IF; END $$;`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_episodes_external" ON "episodes" ("external_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_episodes_series" ON "episodes" ("external_series_id")`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "download_links" (
      "id" SERIAL PRIMARY KEY NOT NULL,
      "title_slug" varchar NOT NULL,
      "episode_id" integer,
      "external_id" varchar NOT NULL DEFAULT '',
      "link_type" varchar NOT NULL DEFAULT '',
      "url" text NOT NULL DEFAULT '',
      "quality" varchar NOT NULL DEFAULT '',
      "size" varchar NOT NULL DEFAULT '',
      "label" varchar NOT NULL DEFAULT '',
      FOREIGN KEY ("title_slug") REFERENCES "titles"("slug") ON DELETE CASCADE,
      FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_links_title" ON "download_links" ("title_slug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_links_episode" ON "download_links" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_links_external" ON "download_links" ("external_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "download_links" CASCADE`);
    await queryRunner.query(`ALTER TABLE "episodes" DROP COLUMN IF EXISTS "master_file"`);
    await queryRunner.query(`ALTER TABLE "episodes" DROP COLUMN IF EXISTS "upera_id"`);
    await queryRunner.query(`ALTER TABLE "episodes" DROP COLUMN IF EXISTS "external_series_id"`);
    await queryRunner.query(`ALTER TABLE "episodes" DROP CONSTRAINT IF EXISTS "UQ_episodes_external_id"`);
    await queryRunner.query(`ALTER TABLE "episodes" DROP COLUMN IF EXISTS "external_id"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "persian"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "source_type"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "upera_id"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "imdb_id"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP CONSTRAINT IF EXISTS "UQ_titles_external_id"`);
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "external_id"`);
  }
}
