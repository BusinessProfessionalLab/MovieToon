import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  /** JWT jti. */
  @PrimaryColumn({ type: 'varchar' })
  jti!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  familyId!: string;

  /** SHA-256 hex of the raw token. The raw value is never stored. */
  @Column({ type: 'varchar', unique: true })
  tokenHash!: string;

  /** Unix seconds. */
  @Column({ type: 'integer' })
  expiresAt!: number;

  @Column({ type: 'integer', nullable: true })
  consumedAt!: number | null;

  @Column({ type: 'integer', nullable: true })
  revokedAt!: number | null;

  @Column({ type: 'varchar', nullable: true })
  replacedBy!: string | null;
}
