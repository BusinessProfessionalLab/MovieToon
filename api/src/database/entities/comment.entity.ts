import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Title } from './title.entity';

@Entity('comments')
export class TitleComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Title, (t) => t.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_slug', referencedColumnName: 'slug' })
  title!: Title;

  @Column({ type: 'varchar' })
  titleSlug!: string;

  @Column({ type: 'varchar' })
  author!: string;

  @Column({ type: 'varchar', default: '' })
  avatar!: string;

  @Column({ type: 'varchar' })
  date!: string;

  @Column({ type: 'real', default: 0 })
  rating!: number;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'integer', default: 0 })
  likes!: number;
}
