import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medicine } from './Medicine';
import { Organization } from '../Organization';

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  NEAR_EXPIRY = 'near_expiry',
  EXPIRED = 'expired',
  CRITICAL_LOW = 'critical_low'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved'
}

@Entity({ name: 'stock_alerts' })
export class StockAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Medicine)
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({
    type: 'enum',
    enum: AlertType
  })
  alertType!: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status!: AlertStatus;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'integer', nullable: true })
  currentStock?: number;

  @Column({ type: 'integer', nullable: true })
  reorderLevel?: number;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'integer', nullable: true })
  daysUntilExpiry?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
