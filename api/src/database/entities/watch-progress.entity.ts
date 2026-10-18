import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('watch_progress')
export class WatchProgress {
  @PrimaryColumn({ type: 'varchar' })
  userId!: string;

  @PrimaryColumn({ type: 'varchar' })
  titleSlug!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;

  /** Seconds watched. */
  @Column({ type: 'integer', default: 0 })
  seconds!: number;

  /** Unix seconds. */
  @Column({ type: 'integer' })
  updatedAt!: number;
}
