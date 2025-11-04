/**
 * Type definitions for the Smeta application
 */

export interface EstimateItem {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  name?: string;
  totalPrice?: number;
}

export interface Estimate {
  id?: string;
  title: string;
  date: string;
  client?: string;
  project?: string;
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

// Advanced feature types
export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: Estimate;
  timestamp: number;
  retries: number;
}

export interface Attachment {
  id: string;
  estimateId: string;
  name: string;
  type: string;
  data: Blob;
  size: number;
  uploadedAt: string;
}

export interface Change {
  type: 'create' | 'edit' | 'delete';
  targetId: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export interface ComplianceReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  totalActions: number;
  actionsByType: Record<string, number>;
  failedActions: number;
  userActivity: Record<string, number>;
  criticalChanges: AuditLogEntry[];
}

export interface CostPrediction {
  predictedCost: number;
  confidence: number;
  factors: string[];
  range: { min: number; max: number };
}

export interface Anomaly {
  type: 'high_cost' | 'duplicate' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

export interface SpendingAnalysis {
  trends: Array<{ month: string; value: number; change: number }>;
  seasonality: string[];
  forecast: Array<{ month: string; predicted: number; confidence: number }>;
}
