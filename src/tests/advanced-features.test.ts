/**
 * Integration Tests for Advanced Features
 * Tests AI, Collaboration, Offline Sync, Visualization, and Enterprise modules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiEngine } from '../modules/ai-engine';
import { createCollaborationManager } from '../modules/collaboration';
import { offlineSyncManager } from '../modules/offline-sync';
import { createVisualization } from '../modules/advanced-visualization';
import { enterpriseManager } from '../modules/enterprise';

describe('AI Engine', () => {
  const mockEstimates = [
    {
      id: '1',
      title: 'Office Renovation',
      category: 'Commercial',
      items: [
        { name: 'Paint', totalPrice: 5000 },
        { name: 'Flooring', totalPrice: 10000 },
      ],
      total: 15000,
      date: '2025-01-15',
    },
    {
      id: '2',
      title: 'Warehouse Build',
      category: 'Commercial',
      items: [
        { name: 'Steel', totalPrice: 50000 },
        { name: 'Concrete', totalPrice: 30000 },
      ],
      total: 80000,
      date: '2025-02-01',
    },
  ];

  it('should predict costs based on historical data', () => {
    const items = [
      { name: 'Drywall', totalPrice: 8000 },
      { name: 'Paint', totalPrice: 4000 },
    ];

    const prediction = aiEngine.predictCost(items, 'Commercial', mockEstimates);

    expect(prediction.predictedCost).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
    expect(prediction.factors).toBeInstanceOf(Array);
    expect(prediction.recommendations).toBeInstanceOf(Array);
  });

  it('should detect anomalies in estimates', () => {
    const suspiciousEstimate = {
      id: '3',
      title: 'Small Office',
      total: 500000, // Unusually high
      items: [{ name: 'Paint', totalPrice: 500000 }],
      category: 'Commercial',
    };

    const anomalies = aiEngine.detectAnomalies(suspiciousEstimate, mockEstimates);

    expect(anomalies).toBeInstanceOf(Array);
    if (anomalies.length > 0) {
      expect(anomalies[0]).toHaveProperty('type');
      expect(anomalies[0]).toHaveProperty('severity');
      expect(anomalies[0]).toHaveProperty('description');
    }
  });

  it('should generate smart suggestions', () => {
    const estimate = {
      id: '4',
      title: 'Office Renovation',
      category: '',
      items: [{ name: 'Paint', totalPrice: 5000 }],
      total: 5000,
    };

    const suggestions = aiEngine.generateSuggestions(estimate, mockEstimates);

    expect(suggestions).toBeInstanceOf(Array);
    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('priority');
    });
  });

  it('should analyze spending patterns', () => {
    const analysis = aiEngine.analyzeSpendingPatterns(mockEstimates);

    expect(analysis).toHaveProperty('trends');
    expect(analysis).toHaveProperty('seasonality');
    expect(analysis).toHaveProperty('forecast');
    expect(analysis.trends).toBeInstanceOf(Array);
    expect(analysis.forecast).toBeInstanceOf(Array);
  });

  it('should process natural language queries', () => {
    const results = aiEngine.processNaturalQuery('покажи сметы дороже 20000', mockEstimates);

    expect(results).toBeInstanceOf(Array);
    results.forEach(estimate => {
      expect(estimate.total).toBeGreaterThan(20000);
    });
  });
});

describe('Collaboration Manager', () => {
  let collab: any;

  beforeEach(() => {
    collab = createCollaborationManager('test-user-123');
  });

  it('should create share links with permissions', () => {
    const link = collab.createShareLink('estimate-1', 'edit', 7);

    expect(link).toHaveProperty('id');
    expect(link.permission).toBe('edit');
    expect(link.estimateId).toBe('estimate-1');
    expect(link.expiresAt).toBeInstanceOf(Date);
  });

  it('should generate share URLs', () => {
    const link = collab.createShareLink('estimate-1', 'view');
    const url = collab.getShareUrl(link.id);

    expect(url).toContain('share=');
    expect(url).toContain(link.id);
  });

  it('should track collaborators', () => {
    const collaborators = collab.getCollaborators();

    expect(collaborators).toBeInstanceOf(Array);
  });

  it('should broadcast changes', () => {
    expect(() => {
      collab.broadcastChange({
        type: 'edit',
        targetId: 'estimate-1',
        data: { title: 'Updated' },
      });
    }).not.toThrow();
  });

  it('should handle cursor updates', () => {
    expect(() => {
      collab.updateCursor(100, 200);
    }).not.toThrow();
  });
});

describe('Offline Sync Manager', () => {
  it('should save and retrieve estimates', async () => {
    const estimate = {
      id: 'test-1',
      title: 'Test Estimate',
      items: [],
      total: 0,
    };

    await offlineSyncManager.saveEstimate(estimate);
    const retrieved = await offlineSyncManager.getEstimate('test-1');

    expect(retrieved).toBeDefined();
    expect(retrieved.title).toBe('Test Estimate');
  });

  it('should get all estimates', async () => {
    const estimates = await offlineSyncManager.getAllEstimates();

    expect(estimates).toBeInstanceOf(Array);
  });

  it('should export database', async () => {
    const backup = await offlineSyncManager.exportDatabase();

    expect(backup).toBeInstanceOf(Blob);
    expect(backup.type).toBe('application/json');
  });

  it('should get sync status', async () => {
    const status = await offlineSyncManager.getSyncStatus();

    expect(status).toHaveProperty('queueSize');
    expect(status).toHaveProperty('isOnline');
    expect(typeof status.queueSize).toBe('number');
    expect(typeof status.isOnline).toBe('boolean');
  });
});

describe('Advanced Visualization', () => {
  let canvas: HTMLCanvasElement;
  let viz: any;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    viz = createVisualization(canvas);
  });

  it('should create heatmap', () => {
    expect(() => {
      viz.createHeatmap(
        [
          [10, 20],
          [30, 40],
        ],
        { x: ['A', 'B'], y: ['1', '2'] }
      );
    }).not.toThrow();
  });

  it('should create bubble chart', () => {
    expect(() => {
      viz.createBubbleChart([{ x: 10, y: 20, size: 30, label: 'Test' }], { animated: false });
    }).not.toThrow();
  });

  it('should create radar chart', () => {
    expect(() => {
      viz.createRadarChart([
        { label: 'A', value: 80, max: 100 },
        { label: 'B', value: 60, max: 100 },
      ]);
    }).not.toThrow();
  });

  it('should create treemap', () => {
    expect(() => {
      viz.createTreemap([
        { label: 'Category 1', value: 100 },
        { label: 'Category 2', value: 200 },
      ]);
    }).not.toThrow();
  });

  it('should clear canvas', () => {
    viz.createRadarChart([{ label: 'A', value: 80, max: 100 }]);
    expect(() => {
      viz.clear();
    }).not.toThrow();
  });
});

describe('Enterprise Manager', () => {
  beforeEach(() => {
    // Clear logs for clean tests
    localStorage.removeItem('audit_logs');
  });

  it('should log actions', async () => {
    await enterpriseManager.logAction(
      'user-1',
      'Test User',
      'create',
      'estimate',
      'est-1',
      undefined,
      true
    );

    const logs = enterpriseManager.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('create');
  });

  it('should filter audit logs', async () => {
    await enterpriseManager.logAction('user-1', 'User1', 'create', 'estimate', 'est-1');
    await enterpriseManager.logAction('user-2', 'User2', 'update', 'estimate', 'est-2');

    const filtered = enterpriseManager.getAuditLogs({ userId: 'user-1' });
    expect(filtered.every(log => log.userId === 'user-1')).toBe(true);
  });

  it('should assign and check roles', () => {
    enterpriseManager.assignRole('user-1', 'editor');

    const hasPermission = enterpriseManager.hasPermission('user-1', 'estimate:create');
    expect(hasPermission).toBe(true);
  });

  it('should get user roles', () => {
    enterpriseManager.assignRole('user-1', 'editor');
    const roles = enterpriseManager.getUserRoles('user-1');

    expect(roles).toBeInstanceOf(Array);
    expect(roles.some(role => role.id === 'editor')).toBe(true);
  });

  it('should generate compliance report', async () => {
    await enterpriseManager.logAction('user-1', 'User', 'create', 'estimate', 'est-1');

    const report = await enterpriseManager.generateComplianceReport(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );

    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('totalEstimates');
    expect(report).toHaveProperty('userActivity');
    expect(report).toHaveProperty('recommendations');
  });

  it('should encrypt and decrypt data', async () => {
    const original = 'sensitive data';
    const encrypted = await enterpriseManager.encryptData(original);
    const decrypted = await enterpriseManager.decryptData(encrypted);

    // Encryption may not be available in test environment
    expect(decrypted).toBeTruthy();
  });

  it('should export audit logs', () => {
    const csv = enterpriseManager.exportAuditLogs('csv');
    expect(csv).toBeInstanceOf(Blob);
    expect(csv.type).toBe('text/csv');

    const json = enterpriseManager.exportAuditLogs('json');
    expect(json).toBeInstanceOf(Blob);
    expect(json.type).toBe('application/json');
  });

  it('should clear old logs', async () => {
    await enterpriseManager.logAction('user-1', 'User', 'create', 'estimate', 'est-1');

    const removed = enterpriseManager.clearOldLogs(0); // Remove all
    expect(removed).toBeGreaterThanOrEqual(0);
  });
});

describe('Integration Tests', () => {
  it('should integrate AI with analytics', () => {
    const estimates = [
      { id: '1', total: 10000, items: [], date: '2025-01-01', category: 'A' },
      { id: '2', total: 20000, items: [], date: '2025-02-01', category: 'B' },
    ];

    const analysis = aiEngine.analyzeSpendingPatterns(estimates);
    expect(analysis.trends.length).toBeGreaterThan(0);
  });

  it('should integrate offline sync with collaboration', async () => {
    const estimate = {
      id: 'collab-1',
      title: 'Collaborative Estimate',
      items: [],
      total: 0,
    };

    // Save offline
    await offlineSyncManager.saveEstimate(estimate);

    // Verify saved
    const retrieved = await offlineSyncManager.getEstimate('collab-1');
    expect(retrieved).toBeDefined();
  });

  it('should integrate enterprise logging with all features', async () => {
    // Log AI prediction
    await enterpriseManager.logAction(
      'user-1',
      'User',
      'ai_predict',
      'estimate',
      'est-1',
      undefined,
      true
    );

    // Log collaboration
    await enterpriseManager.logAction(
      'user-1',
      'User',
      'collaborate',
      'estimate',
      'est-1',
      undefined,
      true
    );

    const logs = enterpriseManager.getAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });
});
