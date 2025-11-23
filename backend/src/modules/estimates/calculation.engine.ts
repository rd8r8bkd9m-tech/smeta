import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculationEngine {
  /**
   * Calculate total price for an estimate item with coefficients
   */
  calculateItemTotal(
    quantity: number,
    unitPrice: number,
    coefficients?: Record<string, number>,
  ): number {
    let total = quantity * unitPrice;

    if (coefficients) {
      // Apply all coefficients multiplicatively
      Object.values(coefficients).forEach((coef) => {
        total *= coef;
      });
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Calculate total cost of all items in estimate
   */
  calculateEstimateTotal(items: Array<{ totalPrice: number }>): number {
    return items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  }

  /**
   * Apply regional coefficient to price
   */
  applyRegionalCoefficient(price: number, region: string): number {
    const regionalCoefficients: Record<string, number> = {
      moscow: 1.0,
      spb: 0.95,
      yekaterinburg: 0.85,
      novosibirsk: 0.87,
      vladivostok: 1.15,
      // Add more regions
    };

    const coefficient = regionalCoefficients[region.toLowerCase()] || 1.0;
    return Math.round(price * coefficient * 100) / 100;
  }

  /**
   * Calculate material quantity with waste coefficient
   */
  calculateMaterialWithWaste(
    quantity: number,
    wasteCoefficient: number = 1.05,
  ): number {
    return Math.round(quantity * wasteCoefficient * 100) / 100;
  }

  /**
   * Calculate labor hours for work
   */
  calculateLaborHours(
    quantity: number,
    normHours: number,
    difficultyCoef: number = 1.0,
  ): number {
    return Math.round(quantity * normHours * difficultyCoef * 100) / 100;
  }

  /**
   * Apply index recalculation for price adjustment
   */
  applyPriceIndex(
    basePrice: number,
    baseYear: number,
    targetYear: number,
  ): number {
    // Simple inflation model - should be replaced with real indices
    const yearlyInflation = 1.07; // 7% per year
    const years = targetYear - baseYear;
    return Math.round(basePrice * Math.pow(yearlyInflation, years) * 100) / 100;
  }
}
