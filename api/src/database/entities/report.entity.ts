import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', default: '' })
  link!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar' })
  createdAt!: string;
}
