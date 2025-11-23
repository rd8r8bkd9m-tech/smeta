import { Injectable } from '@nestjs/common';
import { NormsService } from './norms.service';
import { Norm } from './norm.entity';

interface WorkDescription {
  text: string;
  quantity?: number;
  unit?: string;
}

@Injectable()
export class NormMatchingService {
  constructor(private normsService: NormsService) {}

  /**
   * AI-powered automatic norm selection based on work description
   */
  async matchNormToWork(description: WorkDescription): Promise<Norm[]> {
    // Extract key terms from description
    const keywords = this.extractKeywords(description.text);

    // Search for matching norms
    const candidates = await this.normsService.findSimilar(
      keywords.join(' '),
      20,
    );

    // Rank candidates by relevance
    const ranked = this.rankNorms(candidates, keywords, description);

    return ranked.slice(0, 5);
  }

  /**
   * Extract meaningful keywords from work description
   */
  private extractKeywords(text: string): string[] {
    const stopWords = [
      'и',
      'в',
      'на',
      'с',
      'по',
      'для',
      'из',
      'к',
      'за',
      'о',
      'от',
      'до',
      'при',
    ];

    return text
      .toLowerCase()
      .replace(/[^\wа-яё\s]/gi, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Rank norms by relevance score
   */
  private rankNorms(
    norms: Norm[],
    keywords: string[],
    description: WorkDescription,
  ): Norm[] {
    // Calculate scores with indices for efficient sorting
    const scored = norms.map((norm, index) => ({
      index,
      score: this.calculateRelevanceScore(norm, keywords, description),
    }));
    
    // Sort by score and map back to norms
    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => norms[item.index]);
  }

  /**
   * Calculate relevance score for a norm
   */
  private calculateRelevanceScore(
    norm: Norm,
    keywords: string[],
    description: WorkDescription,
  ): number {
    let score = 0;

    const normText = `${norm.name} ${norm.description}`.toLowerCase();

    // Keyword matching
    keywords.forEach((keyword) => {
      if (normText.includes(keyword)) {
        score += 10;
      }
    });

    // Unit matching
    if (description.unit && norm.unit === description.unit) {
      score += 20;
    }

    // Exact code match
    if (keywords.some((k) => k === norm.code.toLowerCase())) {
      score += 100;
    }

    return score;
  }

  /**
   * Generate estimate from text description using AI matching
   */
  async generateEstimateFromText(text: string): Promise<any[]> {
    // Split text into work items
    const workItems = this.parseWorkItems(text);

    // Match each work item to norms
    const matchedItems = await Promise.all(
      workItems.map(async (item) => {
        const matchedNorms = await this.matchNormToWork(item);
        return {
          description: item.text,
          quantity: item.quantity || 1,
          unit: item.unit || 'шт',
          suggestedNorms: matchedNorms,
          bestMatch: matchedNorms[0],
        };
      }),
    );

    return matchedItems;
  }

  /**
   * Parse text into individual work items
   */
  private parseWorkItems(text: string): WorkDescription[] {
    // Simple parsing - in production, use NLP
    const lines = text.split(/[.\n]/);
    return lines
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        text: line.trim(),
      }));
  }
}
