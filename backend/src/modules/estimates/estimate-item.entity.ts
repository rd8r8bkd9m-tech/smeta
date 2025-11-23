import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Estimate } from './estimate.entity';

@Entity('estimate_items')
export class EstimateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalPrice: number;

  @Column({ default: 'work' })
  type: string; // 'work' or 'material'

  @Column({ nullable: true })
  normCode: string; // FER/GESN/TER code

  @Column({ type: 'jsonb', nullable: true })
  coefficients: Record<string, number>;

  @Column({ type: 'int' })
  order: number;

  @ManyToOne(() => Estimate, estimate => estimate.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'estimateId' })
  estimate: Estimate;

  @Column()
  estimateId: string;
}
