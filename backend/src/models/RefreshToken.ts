import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  @Index({ unique: true })
  token: string = '';

  @Column({ type: 'timestamp' })
  expiresAt: Date = new Date();

  @Column({ default: false })
  isRevoked: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null = null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  revokedByIp: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  replacedByToken: string | null = null;

  @Column({ type: 'varchar', length: 45 })
  createdByIp: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('uuid')
  userId!: string;

  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  get isActive(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}
