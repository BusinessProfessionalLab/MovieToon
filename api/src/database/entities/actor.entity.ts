import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('actors')
export class Actor {
  @PrimaryColumn({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  latinName!: string;

  @Column({ type: 'varchar', default: '' })
  photo!: string;

  @Column({ type: 'integer' })
  birthYear!: number;

  @Column({ type: 'varchar', default: '' })
  birthPlace!: string;

  @Column({ type: 'text', default: '' })
  bio!: string;
}
