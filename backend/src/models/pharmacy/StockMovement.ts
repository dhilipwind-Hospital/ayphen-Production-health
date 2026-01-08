import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medicine } from './Medicine';
import { User } from '../User';
import { Organization } from '../Organization';

export enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
  TRANSFER = 'transfer'
}

@Entity({ name: 'stock_movements' })
export class StockMovement {
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
    enum: MovementType
  })
  movementType!: MovementType;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'integer' })
  previousStock!: number;

  @Column({ type: 'integer' })
  newStock!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performedBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
