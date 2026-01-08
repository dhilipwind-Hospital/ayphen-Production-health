import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum ArticleCategory {
  GENERAL_HEALTH = 'general_health',
  NUTRITION = 'nutrition',
  EXERCISE = 'exercise',
  MENTAL_HEALTH = 'mental_health',
  CHRONIC_DISEASE = 'chronic_disease',
  PREVENTIVE_CARE = 'preventive_care',
  WOMENS_HEALTH = 'womens_health',
  MENS_HEALTH = 'mens_health',
  PEDIATRICS = 'pediatrics',
  SENIOR_CARE = 'senior_care'
}

@Entity({ name: 'health_articles' })
export class HealthArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: ArticleCategory
  })
  category!: ArticleCategory;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'integer', default: 0 })
  viewCount!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
