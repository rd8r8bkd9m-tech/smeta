import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

export type NormType = 'FER' | 'GESN' | 'TER';

@Entity('norms')
@Index(['code', 'type'], { unique: true })
export class Norm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  code: string;

  @Column()
  type: NormType;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  basePrice: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ type: 'jsonb', nullable: true })
  materials: Array<{
    name: string;
    unit: string;
    quantity: number;
    coefficient?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  labor: {
    hours: number;
    category: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  equipment: Array<{
    name: string;
    hours: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  coefficients: Record<string, number>;

  @Column({ nullable: true })
  region: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validTo: Date;
}
