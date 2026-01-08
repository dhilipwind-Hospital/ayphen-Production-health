import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ward } from './Ward';
import { Bed } from './Bed';
import { Organization } from '../Organization';

export enum RoomType {
  GENERAL = 'general',
  SEMI_PRIVATE = 'semi_private',
  PRIVATE = 'private',
  DELUXE = 'deluxe',
  ICU = 'icu',
  NICU = 'nicu',
  PICU = 'picu',
  ISOLATION = 'isolation',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  roomNumber!: string;

  @ManyToOne(() => Ward, ward => ward.rooms)
  @JoinColumn({ name: 'ward_id' })
  ward!: Ward;

  @Column({ name: 'ward_id', type: 'uuid' })
  wardId!: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.GENERAL,
  })
  roomType!: RoomType;

  @Column('int')
  capacity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  dailyRate!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  features?: string;

  @OneToMany(() => Bed, bed => bed.room)
  beds!: Bed[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
