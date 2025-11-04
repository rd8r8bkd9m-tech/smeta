/**
 * Type definitions for the Smeta application
 */

export interface EstimateItem {
  description: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Estimate {
  id?: string;
  title: string;
  date: string;
  client: string;
  project: string;
  category?: string;
  tags?: string[];
  items: EstimateItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  items: EstimateItem[];
}

export interface AppState {
  estimates: Estimate[];
  currentEstimate: Estimate | null;
  editingIndex: number;
  undoStack: StateSnapshot[];
  redoStack: StateSnapshot[];
  selectedForBulk: number[];
  selectedForComparison: string[];
  theme: 'light' | 'dark';
}

export interface StateSnapshot {
  estimate: Estimate;
  timestamp: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json';
  includeMetadata?: boolean;
}
