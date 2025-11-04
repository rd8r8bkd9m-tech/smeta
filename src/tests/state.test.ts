/**
 * Modern testing setup for Smeta PWA
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../modules/state';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    localStorage.clear();
    stateManager = new StateManager();
  });

  it('should initialize with empty state', () => {
    const state = stateManager.getState();
    expect(state.estimates).toEqual([]);
    expect(state.currentEstimate).toBeNull();
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
  });

  it('should save and restore theme preference', () => {
    stateManager.setTheme('dark');
    expect(stateManager.getState().theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should handle undo/redo operations', () => {
    const estimate = {
      id: '1',
      title: 'Test',
      date: '2025-01-01',
      client: 'Client',
      project: 'Project',
      items: [],
      total: 0,
    };

    stateManager.setCurrentEstimate(estimate);
    stateManager.saveToUndo();

    const modified = { ...estimate, title: 'Modified' };
    stateManager.setCurrentEstimate(modified);

    const undoResult = stateManager.undo();
    expect(undoResult).toBe(true);
    expect(stateManager.getState().currentEstimate?.title).toBe('Test');

    const redoResult = stateManager.redo();
    expect(redoResult).toBe(true);
    expect(stateManager.getState().currentEstimate?.title).toBe('Modified');
  });

  it('should handle bulk selection', () => {
    const estimates = [
      { id: '1', title: 'A', date: '2025-01-01', client: '', project: '', items: [], total: 0 },
      { id: '2', title: 'B', date: '2025-01-02', client: '', project: '', items: [], total: 0 },
    ];

    stateManager.updateEstimates(estimates);
    stateManager.selectAll();

    const state = stateManager.getState();
    expect(state.selectedForBulk).toHaveLength(2);

    stateManager.deselectAll();
    expect(stateManager.getState().selectedForBulk).toHaveLength(0);
  });
});
