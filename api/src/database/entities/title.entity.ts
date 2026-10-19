import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from 'typeorm';
import { Actor } from './actor.entity';
import { Episode } from './episode.entity';
import { TitleComment } from './comment.entity';

export type TitleType = 'movie' | 'series' | 'animation';

@Entity('titles')
export class Title {
  @PrimaryColumn({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  type!: TitleType;

  @Column({ type: 'varchar' })
  titleFa!: string;

  @Column({ type: 'varchar', default: '' })
  titleEn!: string;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer' })
  jalaliYear!: number;

  @Column({ type: 'integer', nullable: true })
  runtimeMin!: number | null;

  @Column({ type: 'integer', nullable: true })
  seasonsCount!: number | null;

  @Column({ type: 'integer', nullable: true })
  episodesCount!: number | null;

  @Column({ type: 'jsonb', default: '[]' })
  countries!: string[];

  /** Genre display names (Persian), same semantics as the frontend mock data. */
  @Column({ type: 'jsonb', default: '[]' })
  genres!: string[];

  @Column({ type: 'varchar', default: '' })
  director!: string;

  @Column({ type: 'jsonb', default: '[]' })
  cast!: string[];

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'real', default: 0 })
  imdb!: number;

  @Column({ type: 'real', default: 0 })
  siteScore!: number;

  @Column({ type: 'varchar', default: '' })
  ageRating!: string;

  @Column({ type: 'varchar', default: '' })
  quality!: string;

  @Column({ type: 'boolean', default: false })
  dubbed!: boolean;

  @Column({ type: 'boolean', default: true })
  subtitled!: boolean;

  @Column({ type: 'varchar', default: '' })
  poster!: string;

  @Column({ type: 'varchar', default: '' })
  backdrop!: string;

  @Column({ type: 'integer', default: 0 })
  views!: number;

  /** ISO date string (yyyy-mm-dd). */
  @Column({ type: 'varchar' })
  addedAt!: string;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ type: 'integer', nullable: true })
  top10Rank!: number | null;

  @Column({ type: 'varchar', nullable: true })
  ageGroup!: string | null;

  @Column({ type: 'varchar', default: 'فارسی' })
  language!: string;

  @ManyToMany(() => Actor, { cascade: false })
  @JoinTable({
    name: 'title_actors',
    joinColumn: { name: 'title_slug', referencedColumnName: 'slug' },
    inverseJoinColumn: { name: 'actor_slug', referencedColumnName: 'slug' },
  })
  actors!: Actor[];

  @OneToMany(() => Episode, (e) => e.title)
  episodes!: Episode[];

  @OneToMany(() => TitleComment, (c) => c.title)
  comments!: TitleComment[];
}
