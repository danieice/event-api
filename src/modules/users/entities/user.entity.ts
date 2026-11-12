import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Registration } from '../../registrations/entities/registration.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  // never returned by a query unless explicitly selected
  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @OneToMany(() => Event, (event) => event.owner)
  events!: Event[];

  @OneToMany(() => Registration, (registration) => registration.user)
  registrations!: Registration[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}