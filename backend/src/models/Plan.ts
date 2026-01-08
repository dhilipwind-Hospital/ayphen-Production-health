import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  insurer!: string;

  @Column({ default: 'Standard' })
  coverageLevel!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceMonthly!: number;

  @Column({ default: '12 weeks' })
  waitingPeriod!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  benefits!: string[];

  // ISO 3166-1 alpha-2 country code (e.g., IE, US, IN)
  @Column({ length: 2, default: 'IE' })
  country!: string;

  @Column({ default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
