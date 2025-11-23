import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: any): Promise<Material> {
    const material = this.materialRepository.create(createMaterialDto);
    return this.materialRepository.save(material);
  }

  async findAll(filters?: {
    category?: string;
    search?: string;
    region?: string;
  }): Promise<Material[]> {
    const query = this.materialRepository.createQueryBuilder('material');

    if (filters?.category) {
      query.andWhere('material.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(material.code ILIKE :search OR material.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.region) {
      query.andWhere('(material.region = :region OR material.region IS NULL)', {
        region: filters.region,
      });
    }

    query.andWhere('material.isAvailable = :isAvailable', {
      isAvailable: true,
    });

    return query.getMany();
  }

  async findByCode(code: string): Promise<Material> {
    return this.materialRepository.findOne({
      where: { code, isAvailable: true },
    });
  }

  async updatePrice(
    id: string,
    price: number,
    priceDate: Date,
  ): Promise<Material> {
    await this.materialRepository.update(id, { price, priceDate });
    return this.materialRepository.findOne({ where: { id } });
  }
}
