import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('genres')
export class Genre {
  @PrimaryColumn({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
