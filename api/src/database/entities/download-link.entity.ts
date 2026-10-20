import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Episode } from './episode.entity';
import { Title } from './title.entity';

/** Download/playback links from seeko getaffiliatelinks (per movie or per episode). */
@Entity('download_links')
export class DownloadLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Title, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_slug', referencedColumnName: 'slug' })
  title!: Title;

  @Column({ type: 'varchar' })
  titleSlug!: string;

  @ManyToOne(() => Episode, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'episode_id', referencedColumnName: 'id' })
  episode!: Episode | null;

  @Column({ type: 'integer', nullable: true })
  episodeId!: number | null;

  /** seeko external id (movie id or episode id) used for the affiliate request. */
  @Column({ type: 'varchar', default: '' })
  externalId!: string;

  @Column({ type: 'varchar', default: '' })
  linkType!: string;

  @Column({ type: 'text', default: '' })
  url!: string;

  @Column({ type: 'varchar', default: '' })
  quality!: string;

  @Column({ type: 'varchar', default: '' })
  size!: string;

  @Column({ type: 'varchar', default: '' })
  label!: string;
}
