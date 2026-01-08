import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { ConsultationNote } from './ConsultationNote';
import { Organization } from './Organization';

export enum TemperatureUnit {
  CELSIUS = 'C',
  FAHRENHEIT = 'F'
}

export enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs'
}

export enum HeightUnit {
  CM = 'cm',
  IN = 'in'
}

@Entity({ name: 'vital_signs' })
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => ConsultationNote, { nullable: true })
  @JoinColumn({ name: 'consultation_id' })
  consultation?: ConsultationNote;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy!: User;

  @Column({ type: 'integer', nullable: true })
  systolicBp?: number;

  @Column({ type: 'integer', nullable: true })
  diastolicBp?: number;

  @Column({ type: 'integer', nullable: true })
  heartRate?: number;

  @Column({ type: 'integer', nullable: true })
  respiratoryRate?: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature?: number;

  @Column({
    type: 'enum',
    enum: TemperatureUnit,
    default: TemperatureUnit.CELSIUS
  })
  temperatureUnit!: TemperatureUnit;

  @Column({ type: 'integer', nullable: true })
  oxygenSaturation?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number;

  @Column({
    type: 'enum',
    enum: WeightUnit,
    default: WeightUnit.KG
  })
  weightUnit!: WeightUnit;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height?: number;

  @Column({
    type: 'enum',
    enum: HeightUnit,
    default: HeightUnit.CM
  })
  heightUnit!: HeightUnit;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  bmi?: number;

  @Column({ type: 'integer', nullable: true })
  painScale?: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt!: Date;
}
