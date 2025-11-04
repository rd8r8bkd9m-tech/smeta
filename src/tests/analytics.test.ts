/**
 * Tests for analytics module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Analytics } from '../modules/analytics';
import type { Estimate } from '../types/index';

describe('Analytics', () => {
  let analytics: Analytics;
  let sampleEstimates: Estimate[];

  beforeEach(() => {
    analytics = new Analytics();
    sampleEstimates = [
      {
        id: '1',
        title: 'Estimate 1',
        date: '2025-01-15',
        client: 'Client A',
        project: 'Project X',
        category: 'Residential',
        items: [],
        total: 100000,
      },
      {
        id: '2',
        title: 'Estimate 2',
        date: '2025-01-20',
        client: 'Client B',
        project: 'Project Y',
        category: 'Commercial',
        items: [],
        total: 250000,
      },
      {
        id: '3',
        title: 'Estimate 3',
        date: '2025-02-10',
        client: 'Client A',
        project: 'Project Z',
        category: 'Residential',
        items: [],
        total: 150000,
      },
    ];
  });

  describe('calculateStats', () => {
    it('should calculate total estimates correctly', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.totalEstimates).toBe(3);
    });

    it('should calculate total value correctly', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.totalValue).toBe(500000);
    });

    it('should calculate average value correctly', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.averageValue).toBeCloseTo(166666.67, 2);
    });

    it('should handle empty estimates array', () => {
      const stats = analytics.calculateStats([]);
      expect(stats.totalEstimates).toBe(0);
      expect(stats.totalValue).toBe(0);
      expect(stats.averageValue).toBe(0);
    });
  });

  describe('getMonthlyTrends', () => {
    it('should group estimates by month', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.monthlyTrends.length).toBe(2);
      expect(stats.monthlyTrends[0].month).toBe('2025-01');
      expect(stats.monthlyTrends[0].count).toBe(2);
      expect(stats.monthlyTrends[0].value).toBe(350000);
    });

    it('should sort months chronologically', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      const months = stats.monthlyTrends.map(t => t.month);
      expect(months).toEqual(['2025-01', '2025-02']);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should group estimates by category', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.categoryBreakdown.length).toBe(2);

      const residential = stats.categoryBreakdown.find(c => c.category === 'Residential');
      expect(residential?.count).toBe(2);
      expect(residential?.value).toBe(250000);
    });

    it('should sort categories by value descending', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.categoryBreakdown[0].value).toBeGreaterThan(
        stats.categoryBreakdown[1].value
      );
    });
  });

  describe('getTopClients', () => {
    it('should group estimates by client', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      const clientA = stats.topClients.find(c => c.client === 'Client A');
      expect(clientA?.count).toBe(2);
      expect(clientA?.value).toBe(250000);
    });

    it('should sort clients by value descending', () => {
      const stats = analytics.calculateStats(sampleEstimates);
      expect(stats.topClients[0].value).toBeGreaterThanOrEqual(
        stats.topClients[1].value
      );
    });

    it('should limit to top 10 clients', () => {
      // Create 15 clients
      const manyEstimates = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        title: `Estimate ${i}`,
        date: '2025-01-01',
        client: `Client ${i}`,
        project: 'Project',
        items: [],
        total: 10000 * (i + 1),
      }));

      const stats = analytics.calculateStats(manyEstimates);
      expect(stats.topClients.length).toBe(10);
    });
  });
});
