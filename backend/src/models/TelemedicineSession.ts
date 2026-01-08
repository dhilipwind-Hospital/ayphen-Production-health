import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export type TelemedicineStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
export type SessionType = 'Video' | 'Audio' | 'Chat';

@Entity('telemedicine_sessions')
export class TelemedicineSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', unique: true })
  sessionId!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ name: 'patient_name' })
  patientName!: string;

  @Column({ name: 'patient_avatar', nullable: true })
  patientAvatar?: string;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @Column({ name: 'doctor_name' })
  doctorName!: string;

  @Column({ name: 'doctor_avatar', nullable: true })
  doctorAvatar?: string;

  @Column({ name: 'appointment_date' })
  appointmentDate!: string;

  @Column({ name: 'appointment_time' })
  appointmentTime!: string;

  @Column({ default: 30 })
  duration: number = 30;

  @Column({
    type: 'enum',
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled'
  })
  status: TelemedicineStatus = 'Scheduled';

  @Column({
    type: 'enum',
    enum: ['Video', 'Audio', 'Chat'],
    default: 'Video'
  })
  sessionType: SessionType = 'Video';

  @Column('text')
  reason!: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  prescriptions?: string[];

  @Column({ name: 'follow_up_required', default: false })
  followUpRequired: boolean = false;

  @Column({ name: 'recording_available', default: false })
  recordingAvailable: boolean = false;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateSessionId() {
    if (!this.sessionId) {
      this.sessionId = `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    if (!this.patientAvatar) {
      this.patientAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.patientName}`;
    }
    if (!this.doctorAvatar) {
      this.doctorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.doctorName}`;
    }
  }

  // Static method for backward compatibility
  static async count(): Promise<number> {
    // This should be implemented with proper repository pattern
    return 0;
  }
}

export default TelemedicineSession;
