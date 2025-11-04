/**
 * State management module with reactive updates
 */

import type { Estimate, StateSnapshot, AppState } from '../types/index';

export class StateManager {
  private state: AppState;
  private listeners: Set<(state: AppState) => void>;
  private readonly MAX_UNDO_STACK = 50;

  constructor() {
    this.state = this.loadInitialState();
    this.listeners = new Set();
  }

  private loadInitialState(): AppState {
    const savedEstimates = localStorage.getItem('estimates');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';

    return {
      estimates: savedEstimates ? JSON.parse(savedEstimates) : [],
      currentEstimate: null,
      editingIndex: -1,
      undoStack: [],
      redoStack: [],
      selectedForBulk: [],
      selectedForComparison: [],
      theme: savedTheme,
    };
  }

  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  updateEstimates(estimates: Estimate[]): void {
    this.state.estimates = estimates;
    localStorage.setItem('estimates', JSON.stringify(estimates));
    this.notify();
  }

  setCurrentEstimate(estimate: Estimate | null): void {
    this.state.currentEstimate = estimate;
    this.notify();
  }

  saveToUndo(): void {
    if (!this.state.currentEstimate) return;

    const snapshot: StateSnapshot = {
      estimate: JSON.parse(JSON.stringify(this.state.currentEstimate)),
      timestamp: Date.now(),
    };

    this.state.undoStack.push(snapshot);

    if (this.state.undoStack.length > this.MAX_UNDO_STACK) {
      this.state.undoStack.shift();
    }

    this.state.redoStack = [];
    this.notify();
  }

  undo(): boolean {
    if (this.state.undoStack.length === 0) return false;

    const currentState: StateSnapshot = {
      estimate: JSON.parse(JSON.stringify(this.state.currentEstimate!)),
      timestamp: Date.now(),
    };

    this.state.redoStack.push(currentState);
    const previousState = this.state.undoStack.pop()!;
    this.state.currentEstimate = previousState.estimate;

    this.notify();
    return true;
  }

  redo(): boolean {
    if (this.state.redoStack.length === 0) return false;

    const currentState: StateSnapshot = {
      estimate: JSON.parse(JSON.stringify(this.state.currentEstimate!)),
      timestamp: Date.now(),
    };

    this.state.undoStack.push(currentState);
    const nextState = this.state.redoStack.pop()!;
    this.state.currentEstimate = nextState.estimate;

    this.notify();
    return true;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  toggleBulkSelection(index: number): void {
    const idx = this.state.selectedForBulk.indexOf(index);
    if (idx > -1) {
      this.state.selectedForBulk.splice(idx, 1);
    } else {
      this.state.selectedForBulk.push(index);
    }
    this.notify();
  }

  selectAll(): void {
    this.state.selectedForBulk = this.state.estimates.map((_, i) => i);
    this.notify();
  }

  deselectAll(): void {
    this.state.selectedForBulk = [];
    this.notify();
  }
}

// Export singleton instance
export const stateManager = new StateManager();
