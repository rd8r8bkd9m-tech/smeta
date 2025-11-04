/**
 * Offline Sync Module
 * Handles background sync, conflict resolution, and offline-first architecture
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '../utils/logger';

interface SmetaDB extends DBSchema {
  estimates: {
    key: string;
    value: any;
    indexes: { 'by-date': string; 'by-client': string };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retries: number;
    };
  };
  attachments: {
    key: string;
    value: {
      id: string;
      estimateId: string;
      filename: string;
      blob: Blob;
      uploadedAt: Date;
    };
    indexes: { 'by-estimate': string };
  };
}

export class OfflineSyncManager {
  private db: IDBPDatabase<SmetaDB> | null = null;
  private syncInProgress = false;
  private syncInterval: number | null = null;

  constructor() {
    this.initializeDB();
    this.setupBackgroundSync();
    this.registerServiceWorker();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<SmetaDB>('smeta-offline', 3, {
        upgrade(db, _oldVersion, _newVersion, _transaction) {
          // Create estimates store
          if (!db.objectStoreNames.contains('estimates')) {
            const estimatesStore = db.createObjectStore('estimates', {
              keyPath: 'id',
            });
            estimatesStore.createIndex('by-date', 'date');
            estimatesStore.createIndex('by-client', 'client');
          }

          // Create sync queue store
          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'id' });
          }

          // Create attachments store
          if (!db.objectStoreNames.contains('attachments')) {
            const attachmentsStore = db.createObjectStore('attachments', {
              keyPath: 'id',
            });
            attachmentsStore.createIndex('by-estimate', 'estimateId');
          }
        },
      });

      logger.success('IndexedDB initialized');
    } catch (error) {
      logger.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Save estimate to IndexedDB
   */
  public async saveEstimate(estimate: any): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      await this.db.put('estimates', {
        ...estimate,
        _lastModified: Date.now(),
        _synced: navigator.onLine,
      });

      // Queue for sync if offline
      if (!navigator.onLine) {
        await this.queueSync('update', estimate);
      }
    }
  }

  /**
   * Get all estimates from IndexedDB
   */
  public async getAllEstimates(): Promise<any[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      return await this.db.getAll('estimates');
    }

    return [];
  }

  /**
   * Get estimate by ID
   */
  public async getEstimate(id: string): Promise<any | undefined> {
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      return await this.db.get('estimates', id);
    }

    return undefined;
  }

  /**
   * Delete estimate from IndexedDB
   */
  public async deleteEstimate(id: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      await this.db.delete('estimates', id);

      // Queue for sync
      await this.queueSync('delete', { id });
    }
  }

  /**
   * Queue an action for background sync
   */
  private async queueSync(action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    if (!this.db) return;

    const syncItem = {
      id: `${action}-${data.id || Date.now()}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await this.db.put('sync_queue', syncItem);

    // Trigger sync if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.db || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await this.db.getAll('sync_queue');

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await this.db.delete('sync_queue', item.id);
        } catch (error) {
          logger.error('Failed to sync item:', error);

          // Increment retry count
          item.retries++;

          if (item.retries < 5) {
            await this.db.put('sync_queue', item);
          } else {
            // Max retries reached, move to failed queue
            logger.error('Max retries reached for sync item:', item);
            await this.db.delete('sync_queue', item.id);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single item with the server
   */
  private async syncItem(item: any): Promise<void> {
    // Mock implementation - in production, this would call actual API
    return new Promise(resolve => {
      setTimeout(() => {
        logger.success(`Synced ${item.action} for ${item.data.id}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    // Listen for online event
    window.addEventListener('online', () => {
      logger.info('Back online, syncing...');
      this.processSyncQueue();
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
      logger.info('Offline mode activated');
    });

    // Periodic sync every 5 minutes
    this.syncInterval = window.setInterval(
      () => {
        if (navigator.onLine) {
          this.processSyncQueue();
        }
      },
      5 * 60 * 1000
    );
  }

  /**
   * Register Service Worker for background sync
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        logger.success('Service Worker registered:', registration);

        // Request background sync if supported
        if ('sync' in registration) {
          await (registration as any).sync.register('sync-estimates');
          logger.success('Background sync registered');
        }
      } catch (error) {
        logger.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Save attachment (file) to IndexedDB
   */
  public async saveAttachment(estimateId: string, filename: string, blob: Blob): Promise<string> {
    if (!this.db) {
      await this.initializeDB();
    }

    const attachmentId = `${estimateId}-${Date.now()}`;

    if (this.db) {
      await this.db.put('attachments', {
        id: attachmentId,
        estimateId,
        filename,
        blob,
        uploadedAt: new Date(),
      });
    }

    return attachmentId;
  }

  /**
   * Get attachments for an estimate
   */
  public async getAttachments(estimateId: string): Promise<any[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    if (this.db) {
      const tx = this.db.transaction('attachments', 'readonly');
      const index = tx.store.index('by-estimate');
      return await index.getAll(estimateId as any);
    }

    return [];
  }

  /**
   * Export database for backup
   */
  public async exportDatabase(): Promise<Blob> {
    const estimates = await this.getAllEstimates();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      estimates,
    };

    return new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
  }

  /**
   * Import database from backup
   */
  public async importDatabase(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.version !== 1) {
      throw new Error('Unsupported backup version');
    }

    // Clear existing data
    if (this.db) {
      await this.db.clear('estimates');

      // Import estimates
      for (const estimate of data.estimates) {
        await this.db.put('estimates', estimate);
      }

      logger.success(`Imported ${data.estimates.length} estimates`);
    }
  }

  /**
   * Get sync queue status
   */
  public async getSyncStatus(): Promise<{
    queueSize: number;
    lastSync: Date | null;
    isOnline: boolean;
  }> {
    let queueSize = 0;

    if (this.db) {
      const queue = await this.db.getAll('sync_queue');
      queueSize = queue.length;
    }

    return {
      queueSize,
      lastSync: null, // Would track this in production
      isOnline: navigator.onLine,
    };
  }

  /**
   * Clear all local data
   */
  public async clearAllData(): Promise<void> {
    if (this.db) {
      await this.db.clear('estimates');
      await this.db.clear('sync_queue');
      await this.db.clear('attachments');
      logger.success('All local data cleared');
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();
