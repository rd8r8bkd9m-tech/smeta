/**
 * Tests for advanced search module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedSearch } from '../modules/search';
import type { Estimate } from '../types/index';

describe('AdvancedSearch', () => {
  let search: AdvancedSearch;
  let sampleEstimates: Estimate[];

  beforeEach(() => {
    search = new AdvancedSearch();
    sampleEstimates = [
      {
        id: '1',
        title: 'Office Renovation',
        date: '2025-01-15',
        client: 'Tech Corp',
        project: 'Office 2025',
        category: 'Commercial',
        tags: ['renovation', 'office'],
        items: [{ description: 'Flooring', quantity: 100, unit: 'm²', price: 50 }],
        total: 100000,
      },
      {
        id: '2',
        title: 'House Construction',
        date: '2025-02-20',
        client: 'John Doe',
        project: 'Dream House',
        category: 'Residential',
        tags: ['construction', 'house'],
        items: [{ description: 'Foundation', quantity: 50, unit: 'm³', price: 200 }],
        total: 500000,
      },
      {
        id: '3',
        title: 'Apartment Repair',
        date: '2025-03-10',
        client: 'Jane Smith',
        project: 'Home Sweet Home',
        category: 'Residential',
        tags: ['repair', 'apartment'],
        items: [{ description: 'Painting', quantity: 80, unit: 'm²', price: 30 }],
        total: 75000,
      },
    ];
  });

  describe('text search', () => {
    it('should find estimates by title', () => {
      const results = search.search(sampleEstimates, { query: 'office' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Office Renovation');
    });

    it('should find estimates by client', () => {
      const results = search.search(sampleEstimates, { query: 'john' });
      expect(results.length).toBe(1);
      expect(results[0].client).toBe('John Doe');
    });

    it('should find estimates by item description', () => {
      const results = search.search(sampleEstimates, { query: 'flooring' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Office Renovation');
    });

    it('should be case-insensitive', () => {
      const results = search.search(sampleEstimates, { query: 'HOUSE' });
      expect(results.length).toBe(1);
    });
  });

  describe('date range filter', () => {
    it('should filter by date from', () => {
      const results = search.search(sampleEstimates, { dateFrom: '2025-02-01' });
      expect(results.length).toBe(2);
    });

    it('should filter by date to', () => {
      const results = search.search(sampleEstimates, { dateTo: '2025-02-01' });
      expect(results.length).toBe(1);
    });

    it('should filter by date range', () => {
      const results = search.search(sampleEstimates, {
        dateFrom: '2025-02-01',
        dateTo: '2025-03-01',
      });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('House Construction');
    });
  });

  describe('value range filter', () => {
    it('should filter by minimum value', () => {
      const results = search.search(sampleEstimates, { minValue: 100000 });
      expect(results.length).toBe(2);
    });

    it('should filter by maximum value', () => {
      const results = search.search(sampleEstimates, { maxValue: 100000 });
      expect(results.length).toBe(2);
    });

    it('should filter by value range', () => {
      const results = search.search(sampleEstimates, {
        minValue: 75000,
        maxValue: 100000,
      });
      expect(results.length).toBe(2);
    });
  });

  describe('category filter', () => {
    it('should filter by single category', () => {
      const results = search.search(sampleEstimates, {
        categories: ['Commercial'],
      });
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('Commercial');
    });

    it('should filter by multiple categories', () => {
      const results = search.search(sampleEstimates, {
        categories: ['Commercial', 'Residential'],
      });
      expect(results.length).toBe(3);
    });
  });

  describe('tag filter', () => {
    it('should filter by single tag', () => {
      const results = search.search(sampleEstimates, { tags: ['renovation'] });
      expect(results.length).toBe(1);
    });

    it('should filter by multiple tags', () => {
      const results = search.search(sampleEstimates, {
        tags: ['renovation', 'construction'],
      });
      expect(results.length).toBe(2);
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters simultaneously', () => {
      const results = search.search(sampleEstimates, {
        query: 'house',
        categories: ['Residential'],
        minValue: 50000,
      });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('House Construction');
    });
  });

  describe('extractFacets', () => {
    it('should extract all categories', () => {
      const facets = search.extractFacets(sampleEstimates);
      expect(facets.categories).toContain('Commercial');
      expect(facets.categories).toContain('Residential');
      expect(facets.categories.length).toBe(2);
    });

    it('should extract all tags', () => {
      const facets = search.extractFacets(sampleEstimates);
      expect(facets.tags.length).toBe(6);
      expect(facets.tags).toContain('renovation');
    });

    it('should extract date range', () => {
      const facets = search.extractFacets(sampleEstimates);
      expect(facets.dateRange.min).toBe('2025-01-15');
      expect(facets.dateRange.max).toBe('2025-03-10');
    });

    it('should extract value range', () => {
      const facets = search.extractFacets(sampleEstimates);
      expect(facets.valueRange.min).toBe(75000);
      expect(facets.valueRange.max).toBe(500000);
    });
  });

  describe('highlightMatches', () => {
    it('should wrap matches in mark tags', () => {
      const result = search.highlightMatches('Office Renovation Project', 'office');
      expect(result).toContain('<mark>Office</mark>');
    });

    it('should be case-insensitive', () => {
      const result = search.highlightMatches('Office Renovation', 'OFFICE');
      expect(result).toContain('<mark>Office</mark>');
    });

    it('should return original text if no query', () => {
      const result = search.highlightMatches('Test', '');
      expect(result).toBe('Test');
    });
  });
});
