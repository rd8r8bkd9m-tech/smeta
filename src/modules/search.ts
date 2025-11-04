/**
 * Advanced search and filtering module
 */

import type { Estimate } from '../types/index';

export interface SearchOptions {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
  categories?: string[];
  tags?: string[];
  clients?: string[];
}

export class AdvancedSearch {
  search(estimates: Estimate[], options: SearchOptions): Estimate[] {
    let results = [...estimates];

    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(
        est =>
          est.title.toLowerCase().includes(query) ||
          est.client?.toLowerCase().includes(query) ||
          est.project?.toLowerCase().includes(query) ||
          est.category?.toLowerCase().includes(query) ||
          est.items.some(item => item.description.toLowerCase().includes(query))
      );
    }

    // Date range filter
    if (options.dateFrom) {
      const fromDate = new Date(options.dateFrom);
      results = results.filter(est => new Date(est.date) >= fromDate);
    }

    if (options.dateTo) {
      const toDate = new Date(options.dateTo);
      results = results.filter(est => new Date(est.date) <= toDate);
    }

    // Value range filter
    if (options.minValue !== undefined) {
      results = results.filter(est => est.total >= options.minValue!);
    }

    if (options.maxValue !== undefined) {
      results = results.filter(est => est.total <= options.maxValue!);
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      results = results.filter(
        est => est.category && options.categories!.includes(est.category)
      );
    }

    // Tag filter
    if (options.tags && options.tags.length > 0) {
      results = results.filter(
        est =>
          est.tags &&
          est.tags.some(tag => options.tags!.includes(tag))
      );
    }

    // Client filter
    if (options.clients && options.clients.length > 0) {
      results = results.filter(
        est => est.client && options.clients!.includes(est.client)
      );
    }

    return results;
  }

  extractFacets(estimates: Estimate[]): {
    categories: string[];
    tags: string[];
    clients: string[];
    dateRange: { min: string; max: string };
    valueRange: { min: number; max: number };
  } {
    const categories = new Set<string>();
    const tags = new Set<string>();
    const clients = new Set<string>();
    const dates: Date[] = [];
    const values: number[] = [];

    estimates.forEach(est => {
      if (est.category) categories.add(est.category);
      if (est.client) clients.add(est.client);
      if (est.tags) est.tags.forEach(tag => tags.add(tag));
      dates.push(new Date(est.date));
      values.push(est.total);
    });

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const sortedValues = values.sort((a, b) => a - b);

    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      clients: Array.from(clients).sort(),
      dateRange: {
        min: sortedDates[0]?.toISOString().split('T')[0] || '',
        max: sortedDates[sortedDates.length - 1]?.toISOString().split('T')[0] || '',
      },
      valueRange: {
        min: sortedValues[0] || 0,
        max: sortedValues[sortedValues.length - 1] || 0,
      },
    };
  }

  highlightMatches(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export const advancedSearch = new AdvancedSearch();
