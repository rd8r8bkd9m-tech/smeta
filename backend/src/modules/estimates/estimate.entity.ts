import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { EstimateItem } from './estimate-item.entity';

@Entity('estimates')
export class Estimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  client: string;

  @Column({ nullable: true })
  project: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ default: 'RUB' })
  currency: string;

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 'draft' })
  status: string;

  @OneToMany(() => EstimateItem, (item) => item.estimate, { cascade: true })
  items: EstimateItem[];

  @ManyToOne(() => User, (user) => user.estimates)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;
}
