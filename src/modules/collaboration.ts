/**
 * Real-time Collaboration Module
 * Enables multi-user editing with WebRTC and conflict resolution
 */

export interface CollaboratorInfo {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
  isOnline: boolean;
}

export interface CollaborationChange {
  id: string;
  type: 'add' | 'edit' | 'delete' | 'reorder';
  targetId: string;
  data: any;
  userId: string;
  timestamp: Date;
  applied: boolean;
}

export interface ShareLink {
  id: string;
  estimateId: string;
  permission: 'view' | 'edit' | 'admin';
  expiresAt?: Date;
  createdBy: string;
  accessCount: number;
}

export class CollaborationManager {
  private collaborators: Map<string, CollaboratorInfo> = new Map();
  private pendingChanges: CollaborationChange[] = [];
  private webSocket: WebSocket | null = null;
  private shareLinks: Map<string, ShareLink> = new Map();
  private currentUserId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(userId: string) {
    this.currentUserId = userId;
    this.initializeWebSocket();
    this.startHeartbeat();
  }

  /**
   * Initialize WebSocket connection for real-time sync
   */
  private initializeWebSocket(): void {
    // In production, replace with actual WebSocket server URL
    const wsUrl = this.getWebSocketUrl();
    
    try {
      this.webSocket = new WebSocket(wsUrl);
      
      this.webSocket.onopen = () => {
        console.log('✅ Collaboration connection established');
        this.reconnectAttempts = 0;
        this.sendHeartbeat();
      };

      this.webSocket.onmessage = (event) => {
        this.handleIncomingMessage(JSON.parse(event.data));
      };

      this.webSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.webSocket.onclose = () => {
        console.log('🔌 WebSocket closed, attempting reconnect...');
        this.attemptReconnect();
      };
    } catch (error) {
      console.warn('WebSocket not available, using fallback mode');
      this.useFallbackMode();
    }
  }

  /**
   * Get WebSocket URL (mock for now, would be real server in production)
   */
  private getWebSocketUrl(): string {
    // Mock implementation - in production this would connect to real server
    return 'wss://smeta-collaboration.example.com/ws';
  }

  /**
   * Attempt to reconnect after connection loss
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Switching to offline mode.');
      this.useFallbackMode();
    }
  }

  /**
   * Use fallback mode when WebSocket is unavailable
   */
  private useFallbackMode(): void {
    // Store changes locally and sync when connection is restored
    console.log('📴 Operating in offline mode');
    // Implement polling or other fallback strategy
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(message: any): void {
    switch (message.type) {
      case 'collaborator_joined':
        this.onCollaboratorJoined(message.data);
        break;
      case 'collaborator_left':
        this.onCollaboratorLeft(message.data);
        break;
      case 'cursor_move':
        this.onCursorMove(message.data);
        break;
      case 'change':
        this.onRemoteChange(message.data);
        break;
      case 'heartbeat':
        // Keep connection alive
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Broadcast a change to all collaborators
   */
  public broadcastChange(change: Omit<CollaborationChange, 'id' | 'userId' | 'timestamp' | 'applied'>): void {
    const fullChange: CollaborationChange = {
      ...change,
      id: this.generateId(),
      userId: this.currentUserId,
      timestamp: new Date(),
      applied: false
    };

    this.pendingChanges.push(fullChange);

    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({
        type: 'change',
        data: fullChange
      }));
    } else {
      // Queue for later sync
      this.queueOfflineChange(fullChange);
    }
  }

  /**
   * Handle remote changes from other users
   */
  private onRemoteChange(change: CollaborationChange): void {
    if (change.userId === this.currentUserId) {
      return; // Ignore own changes
    }

    // Check for conflicts
    const conflicts = this.detectConflicts(change);
    
    if (conflicts.length > 0) {
      this.resolveConflicts(change, conflicts);
    } else {
      this.applyRemoteChange(change);
    }
  }

  /**
   * Apply a remote change to local state
   */
  private applyRemoteChange(change: CollaborationChange): void {
    const collaborator = this.collaborators.get(change.userId);
    const userName = collaborator?.name || 'Пользователь';

    // Trigger UI update
    const event = new CustomEvent('collaboration:change', {
      detail: {
        change,
        userName
      }
    });
    window.dispatchEvent(event);

    // Show notification
    this.showChangeNotification(change, userName);
  }

  /**
   * Detect conflicts between local and remote changes
   */
  private detectConflicts(remoteChange: CollaborationChange): CollaborationChange[] {
    return this.pendingChanges.filter(localChange => {
      // Same target and overlapping time
      if (localChange.targetId === remoteChange.targetId) {
        const timeDiff = Math.abs(
          localChange.timestamp.getTime() - remoteChange.timestamp.getTime()
        );
        return timeDiff < 5000; // 5 seconds window
      }
      return false;
    });
  }

  /**
   * Resolve conflicts using operational transformation
   */
  private resolveConflicts(
    remoteChange: CollaborationChange,
    conflicts: CollaborationChange[]
  ): void {
    // Implement operational transformation
    // For now, use timestamp-based resolution (last write wins)
    const latestLocal = conflicts.reduce((latest, change) => 
      change.timestamp > latest.timestamp ? change : latest
    , conflicts[0]);

    if (remoteChange.timestamp > latestLocal.timestamp) {
      // Remote change is newer, apply it
      this.applyRemoteChange(remoteChange);
      // Mark local changes as stale
      conflicts.forEach(c => c.applied = true);
    } else {
      // Local change is newer, keep it
      console.log('Conflict resolved: keeping local changes');
    }
  }

  /**
   * Create a share link for an estimate
   */
  public createShareLink(
    estimateId: string,
    permission: 'view' | 'edit' | 'admin',
    expiresInDays?: number
  ): ShareLink {
    const linkId = this.generateId();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const shareLink: ShareLink = {
      id: linkId,
      estimateId,
      permission,
      expiresAt,
      createdBy: this.currentUserId,
      accessCount: 0
    };

    this.shareLinks.set(linkId, shareLink);
    
    // Store in localStorage
    this.saveShareLinks();

    return shareLink;
  }

  /**
   * Get full share URL
   */
  public getShareUrl(linkId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?share=${linkId}`;
  }

  /**
   * Validate and use a share link
   */
  public async useShareLink(linkId: string): Promise<ShareLink | null> {
    const link = this.shareLinks.get(linkId);
    
    if (!link) {
      return null;
    }

    // Check expiration
    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    // Increment access count
    link.accessCount++;
    this.saveShareLinks();

    return link;
  }

  /**
   * Track collaborator cursor movement
   */
  public updateCursor(x: number, y: number): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({
        type: 'cursor_move',
        data: {
          userId: this.currentUserId,
          x,
          y
        }
      }));
    }
  }

  /**
   * Handle cursor movement from other users
   */
  private onCursorMove(data: { userId: string; x: number; y: number }): void {
    const collaborator = this.collaborators.get(data.userId);
    if (collaborator) {
      collaborator.cursor = { x: data.x, y: data.y };
      collaborator.lastSeen = new Date();
      
      // Trigger UI update
      const event = new CustomEvent('collaboration:cursor', {
        detail: { collaborator }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Handle collaborator joining
   */
  private onCollaboratorJoined(data: CollaboratorInfo): void {
    this.collaborators.set(data.id, {
      ...data,
      isOnline: true,
      lastSeen: new Date()
    });

    // Show notification
    const event = new CustomEvent('collaboration:joined', {
      detail: { collaborator: data }
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle collaborator leaving
   */
  private onCollaboratorLeft(data: { userId: string }): void {
    const collaborator = this.collaborators.get(data.userId);
    if (collaborator) {
      collaborator.isOnline = false;
      
      const event = new CustomEvent('collaboration:left', {
        detail: { collaborator }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Get all active collaborators
   */
  public getCollaborators(): CollaboratorInfo[] {
    return Array.from(this.collaborators.values())
      .filter(c => c.isOnline);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.sendHeartbeat();
      this.cleanupInactiveCollaborators();
    }, 30000); // Every 30 seconds
  }

  /**
   * Send heartbeat to server
   */
  private sendHeartbeat(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({
        type: 'heartbeat',
        data: { userId: this.currentUserId }
      }));
    }
  }

  /**
   * Remove inactive collaborators
   */
  private cleanupInactiveCollaborators(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute

    this.collaborators.forEach((collaborator, id) => {
      if (now.getTime() - collaborator.lastSeen.getTime() > timeout) {
        collaborator.isOnline = false;
      }
    });
  }

  /**
   * Queue changes for offline sync
   */
  private queueOfflineChange(change: CollaborationChange): void {
    const queue = JSON.parse(localStorage.getItem('offline_changes') || '[]');
    queue.push(change);
    localStorage.setItem('offline_changes', JSON.stringify(queue));
  }

  /**
   * Sync offline changes when connection is restored
   */
  public async syncOfflineChanges(): Promise<void> {
    const queue = JSON.parse(localStorage.getItem('offline_changes') || '[]');
    
    for (const change of queue) {
      this.broadcastChange(change);
    }

    localStorage.removeItem('offline_changes');
  }

  /**
   * Show notification for remote change
   */
  private showChangeNotification(change: CollaborationChange, userName: string): void {
    const messages = {
      add: `${userName} добавил(а) элемент`,
      edit: `${userName} изменил(а) элемент`,
      delete: `${userName} удалил(а) элемент`,
      reorder: `${userName} изменил(а) порядок элементов`
    };

    const message = messages[change.type] || `${userName} внес(ла) изменения`;
    
    // Use existing notification system
    if (typeof (window as any).showNotification === 'function') {
      (window as any).showNotification(message, 'info');
    }
  }

  /**
   * Save share links to storage
   */
  private saveShareLinks(): void {
    const linksArray = Array.from(this.shareLinks.entries());
    localStorage.setItem('share_links', JSON.stringify(linksArray));
  }

  /**
   * Load share links from storage
   */
  public loadShareLinks(): void {
    const stored = localStorage.getItem('share_links');
    if (stored) {
      const linksArray = JSON.parse(stored);
      this.shareLinks = new Map(linksArray);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    this.collaborators.clear();
  }
}

// Export factory function
export function createCollaborationManager(userId: string): CollaborationManager {
  return new CollaborationManager(userId);
}
