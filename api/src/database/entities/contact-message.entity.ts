import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', default: '' })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar' })
  createdAt!: string;
}
