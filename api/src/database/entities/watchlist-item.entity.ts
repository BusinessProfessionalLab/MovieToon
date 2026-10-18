import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('watchlist_items')
export class WatchlistItem {
  @PrimaryColumn({ type: 'varchar' })
  userId!: string;

  @PrimaryColumn({ type: 'varchar' })
  titleSlug!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;

  @Column({ type: 'integer' })
  createdAt!: number;
}
