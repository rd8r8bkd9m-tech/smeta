import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estimate } from './estimate.entity';
import { EstimateItem } from './estimate-item.entity';
import { CalculationEngine } from './calculation.engine';

@Injectable()
export class EstimatesService {
  constructor(
    @InjectRepository(Estimate)
    private estimateRepository: Repository<Estimate>,
    @InjectRepository(EstimateItem)
    private itemRepository: Repository<EstimateItem>,
    private calculationEngine: CalculationEngine,
  ) {}

  async create(createEstimateDto: any, userId: string): Promise<Estimate> {
    const estimate = this.estimateRepository.create({
      ...createEstimateDto,
      user: { id: userId },
    });

    // Calculate item totals
    if (estimate.items) {
      estimate.items = estimate.items.map((item) => ({
        ...item,
        totalPrice: this.calculationEngine.calculateItemTotal(
          item.quantity,
          item.unitPrice,
          item.coefficients,
        ),
      }));

      estimate.totalCost = this.calculationEngine.calculateEstimateTotal(
        estimate.items,
      );
    }

    return this.estimateRepository.save(estimate);
  }

  async findAll(userId: string, filters?: any): Promise<Estimate[]> {
    const query = this.estimateRepository
      .createQueryBuilder('estimate')
      .leftJoinAndSelect('estimate.items', 'items')
      .where('estimate.userId = :userId', { userId })
      .orderBy('estimate.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('estimate.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      query.andWhere(
        '(estimate.title ILIKE :search OR estimate.client ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Estimate> {
    return this.estimateRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['items'],
    });
  }

  async update(
    id: string,
    updateEstimateDto: any,
    userId: string,
  ): Promise<Estimate> {
    const estimate = await this.findOne(id, userId);
    
    Object.assign(estimate, updateEstimateDto);
    estimate.version += 1;

    if (estimate.items) {
      estimate.items = estimate.items.map((item) => ({
        ...item,
        totalPrice: this.calculationEngine.calculateItemTotal(
          item.quantity,
          item.unitPrice,
          item.coefficients,
        ),
      }));

      estimate.totalCost = this.calculationEngine.calculateEstimateTotal(
        estimate.items,
      );
    }

    return this.estimateRepository.save(estimate);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.estimateRepository.delete({ id, user: { id: userId } });
  }

  async duplicate(id: string, userId: string): Promise<Estimate> {
    const original = await this.findOne(id, userId);
    const { id: _, ...estimateData } = original;

    const duplicate = this.estimateRepository.create({
      ...estimateData,
      title: `${original.title} (копия)`,
      status: 'draft',
      version: 1,
      user: { id: userId },
    });

    return this.estimateRepository.save(duplicate);
  }
}
