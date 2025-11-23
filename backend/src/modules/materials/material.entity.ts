import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  code: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ default: 'RUB' })
  currency: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  priceDate: Date;
}
