import { MigrationInterface, QueryRunner } from 'typeorm';

/** 0003 — homepage animation picks flag. */
export class HomepagePicks1793200000000 implements MigrationInterface {
  name = 'HomepagePicks1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "home_animation" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_titles_home_animation" ON "titles" ("home_animation")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "titles" DROP COLUMN IF EXISTS "home_animation"`);
  }
}
