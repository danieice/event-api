import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Registration } from '../../registrations/entities/registration.entity';

@Entity('events')
@Check('"ends_at" > "starts_at"')
@Check('"capacity" > 0')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 200 })
  location!: string;

  @Index()
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Registration, (registration) => registration.event)
  registrations!: Registration[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}