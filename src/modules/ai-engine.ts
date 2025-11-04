/**
 * AI Engine Module
 * Provides intelligent features like cost prediction, anomaly detection,
 * and smart suggestions using machine learning algorithms
 */

export interface PredictionResult {
  predictedCost: number;
  confidence: number;
  factors: Array<{ name: string; impact: number }>;
  recommendations: string[];
}

export interface Anomaly {
  type: 'cost' | 'timeline' | 'item_count' | 'category';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedItems: number[];
  suggestion: string;
}

export interface SmartSuggestion {
  type: 'missing_item' | 'cost_optimization' | 'category' | 'duplicate';
  title: string;
  description: string;
  action: string;
  priority: number;
}

interface MLModel {
  weights: {
    itemCount: number;
    avgItemCost: number;
    category: number;
    historical: number;
  };
}

export class AIEngine {
  private model: MLModel | null = null;

  constructor() {
    this.initializeModel();
  }

  /**
   * Initialize the ML model for predictions
   */
  private initializeModel(): void {
    // Simple linear regression model for cost prediction
    this.model = {
      weights: {
        itemCount: 0.3,
        avgItemCost: 0.4,
        category: 0.2,
        historical: 0.1,
      },
    };
  }

  /**
   * Predict project cost based on historical data and current inputs
   */
  public predictCost(items: any[], category: string, historicalEstimates: any[]): PredictionResult {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const itemCount = items.length;
    const totalCost = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const avgItemCost = itemCount > 0 ? totalCost / itemCount : 0;

    // Calculate historical average for similar projects
    const similarProjects = historicalEstimates.filter(est => est.category === category);
    const historicalAvg =
      similarProjects.length > 0
        ? similarProjects.reduce((sum, est) => sum + est.total, 0) / similarProjects.length
        : 0;

    // Apply weights
    const prediction =
      itemCount * this.model.weights.itemCount * 1000 +
      avgItemCost * this.model.weights.avgItemCost +
      historicalAvg * this.model.weights.historical;

    const confidence = Math.min(0.95, 0.5 + similarProjects.length * 0.05);

    // Identify key factors
    const factors = [
      { name: 'Количество позиций', impact: itemCount * 0.3 },
      { name: 'Средняя стоимость', impact: avgItemCost * 0.4 },
      { name: 'Исторические данные', impact: historicalAvg * 0.1 },
      { name: 'Категория проекта', impact: 0.2 },
    ].sort((a, b) => b.impact - a.impact);

    const recommendations = this.generateRecommendations(
      prediction,
      totalCost,
      items,
      historicalEstimates
    );

    return {
      predictedCost: Math.round(prediction),
      confidence,
      factors,
      recommendations,
    };
  }

  /**
   * Detect anomalies in estimate data
   */
  public detectAnomalies(estimate: any, historicalData: any[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for unusual cost patterns
    const avgCost = historicalData.reduce((sum, e) => sum + e.total, 0) / historicalData.length;
    const stdDev = this.calculateStdDev(
      historicalData.map(e => e.total),
      avgCost
    );

    if (estimate.total > avgCost + 2 * stdDev) {
      anomalies.push({
        type: 'cost',
        severity: 'high',
        description: `Общая стоимость (${estimate.total}) значительно выше среднего (${Math.round(avgCost)})`,
        affectedItems: [],
        suggestion: 'Проверьте расчеты и убедитесь в корректности цен',
      });
    }

    // Check for duplicate items
    const itemNames = estimate.items.map((item: any) => item.name.toLowerCase());
    const duplicates: number[] = [];
    itemNames.forEach((name: string, index: number) => {
      if (itemNames.indexOf(name) !== index && !duplicates.includes(index)) {
        duplicates.push(index);
      }
    });

    if (duplicates.length > 0) {
      anomalies.push({
        type: 'item_count',
        severity: 'medium',
        description: `Обнаружены возможные дубликаты позиций (${duplicates.length})`,
        affectedItems: duplicates,
        suggestion: 'Проверьте позиции на дублирование и объедините при необходимости',
      });
    }

    // Check for unusual item counts
    const avgItemCount =
      historicalData.reduce((sum, e) => sum + e.items.length, 0) / historicalData.length;
    if (estimate.items.length > avgItemCount * 2) {
      anomalies.push({
        type: 'item_count',
        severity: 'low',
        description: `Необычно большое количество позиций (${estimate.items.length} vs ${Math.round(avgItemCount)} в среднем)`,
        affectedItems: [],
        suggestion: 'Рассмотрите возможность группировки похожих позиций',
      });
    }

    return anomalies;
  }

  /**
   * Generate smart suggestions based on estimate content
   */
  public generateSuggestions(estimate: any, historicalEstimates: any[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Suggest missing common items
    const commonItems = this.findCommonItems(historicalEstimates);
    const currentItemNames = estimate.items.map((item: any) => item.name.toLowerCase());

    commonItems.forEach(commonItem => {
      if (
        !currentItemNames.some(
          (name: string) => this.similarityScore(name, commonItem.name.toLowerCase()) > 0.8
        )
      ) {
        suggestions.push({
          type: 'missing_item',
          title: `Возможно, забыли: ${commonItem.name}`,
          description: `Этот элемент присутствует в ${commonItem.frequency}% похожих смет`,
          action: `add_item:${commonItem.name}`,
          priority: commonItem.frequency,
        });
      }
    });

    // Cost optimization suggestions
    const expensiveItems = estimate.items
      .filter((item: any) => item.totalPrice > estimate.total * 0.15)
      .sort((a: any, b: any) => b.totalPrice - a.totalPrice);

    if (expensiveItems.length > 0) {
      suggestions.push({
        type: 'cost_optimization',
        title: 'Оптимизация затрат',
        description: `${expensiveItems.length} позиций составляют основную долю бюджета`,
        action: 'review_expensive_items',
        priority: 80,
      });
    }

    // Category suggestions
    if (!estimate.category || estimate.category === '') {
      const suggestedCategory = this.suggestCategory(estimate.items, historicalEstimates);
      if (suggestedCategory) {
        suggestions.push({
          type: 'category',
          title: `Рекомендуемая категория: ${suggestedCategory}`,
          description: 'На основе анализа содержимого сметы',
          action: `set_category:${suggestedCategory}`,
          priority: 60,
        });
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analyze spending patterns over time
   */
  public analyzeSpendingPatterns(estimates: any[]): {
    trends: Array<{ month: string; amount: number; change: number }>;
    seasonality: { high: string[]; low: string[] };
    forecast: Array<{ month: string; predicted: number }>;
  } {
    const monthlyData = this.groupByMonth(estimates);
    const trends = this.calculateTrends(monthlyData);
    const seasonality = this.detectSeasonality(monthlyData);
    const forecast = this.forecastSpending(trends, 6);

    return { trends, seasonality, forecast };
  }

  /**
   * Natural language query processing
   */
  public processNaturalQuery(query: string, estimates: any[]): any[] {
    const lowerQuery = query.toLowerCase();

    // Parse intent
    if (lowerQuery.includes('дорог') || lowerQuery.includes('больше')) {
      const threshold = this.extractNumber(query) || 100000;
      return estimates.filter(e => e.total > threshold);
    }

    if (lowerQuery.includes('последн') || lowerQuery.includes('недавн')) {
      const days = this.extractNumber(query) || 7;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return estimates.filter(e => new Date(e.date) >= cutoff);
    }

    if (lowerQuery.includes('клиент')) {
      const clientName = this.extractClientName(query);
      return estimates.filter(e => e.client?.toLowerCase().includes(clientName));
    }

    // Default: full text search
    return estimates.filter(
      e =>
        e.title.toLowerCase().includes(lowerQuery) ||
        e.client?.toLowerCase().includes(lowerQuery) ||
        e.project?.toLowerCase().includes(lowerQuery)
    );
  }

  // Helper methods

  private calculateStdDev(values: number[], mean: number): number {
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private generateRecommendations(
    predicted: number,
    actual: number,
    items: any[],
    historical: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (predicted > actual * 1.2) {
      recommendations.push(
        'Прогноз выше текущей стоимости. Проверьте, не упущены ли важные позиции.'
      );
    }

    if (items.length < 5) {
      recommendations.push('Малое количество позиций. Убедитесь, что смета полная.');
    }

    if (historical.length > 10) {
      recommendations.push(
        'Достаточно данных для точного прогноза. Используйте исторические данные для планирования.'
      );
    }

    return recommendations;
  }

  private findCommonItems(estimates: any[]): Array<{ name: string; frequency: number }> {
    const itemCounts = new Map<string, number>();
    const totalEstimates = estimates.length;

    estimates.forEach(estimate => {
      const uniqueNames = new Set<string>(estimate.items.map((item: any) => item.name.toLowerCase()));
      uniqueNames.forEach((name: string) => {
        itemCounts.set(name, (itemCounts.get(name) || 0) + 1);
      });
    });

    return Array.from(itemCounts.entries())
      .map(([name, count]) => ({
        name,
        frequency: Math.round((count / totalEstimates) * 100),
      }))
      .filter(item => item.frequency > 30)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private similarityScore(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private suggestCategory(items: any[], historical: any[]): string | null {
    const keywords = items.map((item: any) => item.name.toLowerCase()).join(' ');

    const categoryScores = new Map<string, number>();
    historical.forEach(estimate => {
      if (!estimate.category) return;

      const estimateKeywords = estimate.items.map((item: any) => item.name.toLowerCase()).join(' ');

      const similarity = this.textSimilarity(keywords, estimateKeywords);
      categoryScores.set(
        estimate.category,
        (categoryScores.get(estimate.category) || 0) + similarity
      );
    });

    if (categoryScores.size === 0) return null;

    const topCategory = Array.from(categoryScores.entries()).sort((a, b) => b[1] - a[1])[0];

    return topCategory[1] > 0.3 ? topCategory[0] : null;
  }

  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private groupByMonth(estimates: any[]): Map<string, number> {
    const monthlyData = new Map<string, number>();

    estimates.forEach(estimate => {
      const date = new Date(estimate.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + estimate.total);
    });

    return monthlyData;
  }

  private calculateTrends(
    monthlyData: Map<string, number>
  ): Array<{ month: string; amount: number; change: number }> {
    const sorted = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return sorted.map((entry, index) => {
      const change =
        index > 0 ? ((entry[1] - sorted[index - 1][1]) / sorted[index - 1][1]) * 100 : 0;

      return {
        month: entry[0],
        amount: entry[1],
        change: Math.round(change * 10) / 10,
      };
    });
  }

  private detectSeasonality(monthlyData: Map<string, number>): { high: string[]; low: string[] } {
    const months = Array.from(monthlyData.entries());
    const avg = months.reduce((sum, m) => sum + m[1], 0) / months.length;

    const high = months
      .filter(m => m[1] > avg * 1.2)
      .map(m => m[0])
      .slice(0, 3);

    const low = months
      .filter(m => m[1] < avg * 0.8)
      .map(m => m[0])
      .slice(0, 3);

    return { high, low };
  }

  private forecastSpending(
    trends: Array<{ month: string; amount: number; change: number }>,
    months: number
  ): Array<{ month: string; predicted: number }> {
    if (trends.length < 3) return [];

    const avgChange = trends.slice(-6).reduce((sum, t) => sum + t.change, 0) / 6;
    const lastAmount = trends[trends.length - 1].amount;
    const lastDate = new Date(trends[trends.length - 1].month + '-01');

    const forecast: Array<{ month: string; predicted: number }> = [];
    let predicted = lastAmount;

    for (let i = 1; i <= months; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i);

      predicted = predicted * (1 + avgChange / 100);

      forecast.push({
        month: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`,
        predicted: Math.round(predicted),
      });
    }

    return forecast;
  }

  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  private extractClientName(query: string): string {
    const words = query.split(/\s+/);
    const clientIndex = words.findIndex(w => w.includes('клиент') || w.includes('заказчик'));

    if (clientIndex >= 0 && clientIndex < words.length - 1) {
      return words[clientIndex + 1].toLowerCase();
    }

    return '';
  }
}

// Export singleton instance
export const aiEngine = new AIEngine();
