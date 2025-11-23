import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Norm, NormType } from './norm.entity';

@Injectable()
export class NormsService {
  constructor(
    @InjectRepository(Norm)
    private normRepository: Repository<Norm>,
  ) {}

  async create(createNormDto: any): Promise<Norm> {
    const norm = this.normRepository.create(createNormDto);
    return this.normRepository.save(norm);
  }

  async findAll(filters?: {
    type?: NormType;
    category?: string;
    search?: string;
    region?: string;
  }): Promise<Norm[]> {
    const query = this.normRepository.createQueryBuilder('norm');

    if (filters?.type) {
      query.andWhere('norm.type = :type', { type: filters.type });
    }

    if (filters?.category) {
      query.andWhere('norm.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(norm.code ILIKE :search OR norm.name ILIKE :search OR norm.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.region) {
      query.andWhere('(norm.region = :region OR norm.region IS NULL)', {
        region: filters.region,
      });
    }

    query.andWhere('norm.isActive = :isActive', { isActive: true });

    return query.getMany();
  }

  async findByCode(code: string, type: NormType): Promise<Norm | null> {
    return this.normRepository.findOne({
      where: { code, type, isActive: true },
    });
  }

  async findSimilar(description: string, limit: number = 10): Promise<Norm[]> {
    // Simple text search - in production, use full-text search or vector similarity
    const words = description.toLowerCase().split(' ');
    const query = this.normRepository.createQueryBuilder('norm');

    words.forEach((word, index) => {
      if (word.length > 3) {
        // Skip short words
        const paramName = `word${index}`;
        if (index === 0) {
          query.where(`norm.name ILIKE :${paramName}`, {
            [paramName]: `%${word}%`,
          });
        } else {
          query.orWhere(`norm.name ILIKE :${paramName}`, {
            [paramName]: `%${word}%`,
          });
        }
      }
    });

    query.andWhere('norm.isActive = :isActive', { isActive: true });
    query.limit(limit);

    return query.getMany();
  }

  async bulkImport(norms: any[]): Promise<void> {
    const entities = norms.map((norm) => this.normRepository.create(norm));
    // Save in chunks to avoid memory issues
    for (let i = 0; i < entities.length; i += 1000) {
      const chunk = entities.slice(i, i + 1000);
      await this.normRepository.save(chunk);
    }
  }
}
