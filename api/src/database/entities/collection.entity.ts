import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Title } from './title.entity';

@Entity('collections')
export class Collection {
  @PrimaryColumn({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', default: '' })
  cover!: string;

  @ManyToMany(() => Title, { cascade: false })
  @JoinTable({
    name: 'collection_titles',
    joinColumn: { name: 'collection_slug', referencedColumnName: 'slug' },
    inverseJoinColumn: { name: 'title_slug', referencedColumnName: 'slug' },
  })
  titles!: Title[];
}
