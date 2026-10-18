import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Title } from './title.entity';

@Entity('episodes')
export class Episode {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Title, (t) => t.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_slug', referencedColumnName: 'slug' })
  title!: Title;

  @Column({ type: 'varchar' })
  titleSlug!: string;

  @Column({ type: 'integer' })
  season!: number;

  @Column({ type: 'integer' })
  number!: number;

  @Column({ type: 'varchar' })
  titleFa!: string;

  @Column({ type: 'integer' })
  durationMin!: number;

  @Column({ type: 'varchar', default: '' })
  thumbnail!: string;

  @Column({ type: 'text', default: '' })
  description!: string;
}
