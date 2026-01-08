import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admission } from './Admission';
import { User } from '../User';
import { Organization } from '../Organization';

export enum NursingNoteType {
  ROUTINE = 'routine',
  MEDICATION = 'medication',
  PROCEDURE = 'procedure',
  ASSESSMENT = 'assessment',
  OTHER = 'other',
}

@Entity('nursing_notes')
export class NursingNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Admission, admission => admission.nursingNotes)
  @JoinColumn({ name: 'admission_id' })
  admission!: Admission;

  @Column({ name: 'admission_id', type: 'uuid' })
  admissionId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'nurse_id' })
  nurse!: User;

  @Column({ name: 'nurse_id', type: 'uuid' })
  nurseId!: string;

  @Column({ type: 'timestamp' })
  noteDateTime!: Date;

  @Column({ type: 'text' })
  notes!: string;

  @Column({
    type: 'enum',
    enum: NursingNoteType,
    default: NursingNoteType.ROUTINE,
  })
  noteType!: NursingNoteType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
