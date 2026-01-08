import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('visit_counters')
export class VisitCounter {
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @PrimaryColumn({ name: 'date_key', type: 'char', length: 8 })
  dateKey!: string;

  @Column({ name: 'next_visit_seq', type: 'int', default: 1 })
  nextVisitSeq!: number;

  @Column({ name: 'next_token_seq', type: 'int', default: 1 })
  nextTokenSeq!: number;
}
