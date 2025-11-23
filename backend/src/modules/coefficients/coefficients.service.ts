import { Injectable } from '@nestjs/common';

interface CoefficientRule {
  name: string;
  code: string;
  value: number;
  category?: string;
  conditions?: Record<string, any>;
}

@Injectable()
export class CoefficientsService {
  private readonly coefficients: Map<string, CoefficientRule> = new Map();

  constructor() {
    this.initializeDefaultCoefficients();
  }

  private initializeDefaultCoefficients() {
    // Regional coefficients for Russia
    const regionalCoefficients: CoefficientRule[] = [
      { name: 'Москва', code: 'REG_MSK', value: 1.0 },
      { name: 'Санкт-Петербург', code: 'REG_SPB', value: 0.95 },
      { name: 'Екатеринбург', code: 'REG_EKB', value: 0.85 },
      { name: 'Новосибирск', code: 'REG_NSK', value: 0.87 },
      { name: 'Казань', code: 'REG_KZN', value: 0.82 },
      { name: 'Нижний Новгород', code: 'REG_NNV', value: 0.83 },
      { name: 'Краснодар', code: 'REG_KRD', value: 0.88 },
      { name: 'Владивосток', code: 'REG_VVO', value: 1.15 },
    ];

    regionalCoefficients.forEach((coef) => {
      this.coefficients.set(coef.code, { ...coef, category: 'regional' });
    });

    // Difficulty coefficients
    const difficultyCoefficients: CoefficientRule[] = [
      {
        name: 'Стандартные условия',
        code: 'DIFF_STANDARD',
        value: 1.0,
        category: 'difficulty',
      },
      {
        name: 'Сложные условия',
        code: 'DIFF_HARD',
        value: 1.15,
        category: 'difficulty',
      },
      {
        name: 'Особо сложные условия',
        code: 'DIFF_VHARD',
        value: 1.3,
        category: 'difficulty',
      },
    ];

    difficultyCoefficients.forEach((coef) => {
      this.coefficients.set(coef.code, coef);
    });

    // Season coefficients
    const seasonCoefficients: CoefficientRule[] = [
      {
        name: 'Зима',
        code: 'SEASON_WINTER',
        value: 1.1,
        category: 'season',
      },
      {
        name: 'Лето',
        code: 'SEASON_SUMMER',
        value: 1.0,
        category: 'season',
      },
    ];

    seasonCoefficients.forEach((coef) => {
      this.coefficients.set(coef.code, coef);
    });
  }

  getCoefficient(code: string): CoefficientRule | undefined {
    return this.coefficients.get(code);
  }

  getAllCoefficients(category?: string): CoefficientRule[] {
    const all = Array.from(this.coefficients.values());
    if (category) {
      return all.filter((c) => c.category === category);
    }
    return all;
  }

  applyCoefficients(
    baseValue: number,
    coefficientCodes: string[],
  ): { value: number; applied: CoefficientRule[] } {
    let value = baseValue;
    const applied: CoefficientRule[] = [];

    coefficientCodes.forEach((code) => {
      const coef = this.getCoefficient(code);
      if (coef) {
        value *= coef.value;
        applied.push(coef);
      }
    });

    return { value: Math.round(value * 100) / 100, applied };
  }
}
