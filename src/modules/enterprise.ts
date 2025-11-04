/**
 * Enterprise Features Module
 * Advanced security, audit logs, role-based access, and compliance
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  description: string;
}

export type Permission =
  | 'estimate:create'
  | 'estimate:read'
  | 'estimate:update'
  | 'estimate:delete'
  | 'estimate:export'
  | 'template:manage'
  | 'user:manage'
  | 'audit:read'
  | 'settings:manage';

export interface ComplianceReport {
  generatedAt: Date;
  period: { from: Date; to: Date };
  totalEstimates: number;
  totalValue: number;
  userActivity: Array<{ userId: string; actionCount: number }>;
  securityEvents: Array<{ type: string; count: number }>;
  dataRetention: { totalRecords: number; oldestRecord: Date };
  recommendations: string[];
}

export class EnterpriseManager {
  private auditLogs: AuditLogEntry[] = [];
  private roles: Map<string, UserRole> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.initializeRoles();
    this.loadAuditLogs();
    this.setupEncryption();
  }

  /**
   * Initialize default roles
   */
  private initializeRoles(): void {
    const adminRole: UserRole = {
      id: 'admin',
      name: 'Администратор',
      permissions: [
        'estimate:create',
        'estimate:read',
        'estimate:update',
        'estimate:delete',
        'estimate:export',
        'template:manage',
        'user:manage',
        'audit:read',
        'settings:manage'
      ],
      description: 'Полный доступ ко всем функциям'
    };

    const editorRole: UserRole = {
      id: 'editor',
      name: 'Редактор',
      permissions: [
        'estimate:create',
        'estimate:read',
        'estimate:update',
        'estimate:export'
      ],
      description: 'Создание и редактирование смет'
    };

    const viewerRole: UserRole = {
      id: 'viewer',
      name: 'Наблюдатель',
      permissions: ['estimate:read', 'estimate:export'],
      description: 'Только просмотр и экспорт'
    };

    this.roles.set('admin', adminRole);
    this.roles.set('editor', editorRole);
    this.roles.set('viewer', viewerRole);
  }

  /**
   * Log an action for audit trail
   */
  public async logAction(
    userId: string,
    userName: string,
    action: string,
    resource: string,
    resourceId: string,
    changes?: any[],
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId,
      userName,
      action,
      resource,
      resourceId,
      changes,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      success,
      errorMessage
    };

    this.auditLogs.push(entry);
    this.saveAuditLogs();

    // Trigger event for real-time monitoring
    window.dispatchEvent(new CustomEvent('enterprise:audit', {
      detail: { entry }
    }));
  }

  /**
   * Get audit logs with filtering
   */
  public getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    dateFrom?: Date;
    dateTo?: Date;
    successOnly?: boolean;
  }): AuditLogEntry[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.dateFrom) {
        logs = logs.filter(log => log.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        logs = logs.filter(log => log.timestamp <= filters.dateTo!);
      }
      if (filters.successOnly) {
        logs = logs.filter(log => log.success);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if user has permission
   */
  public hasPermission(userId: string, permission: Permission): boolean {
    const userRoleIds = this.userRoles.get(userId) || [];
    
    for (const roleId of userRoleIds) {
      const role = this.roles.get(roleId);
      if (role && role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Assign role to user
   */
  public assignRole(userId: string, roleId: string): void {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    const userRoleIds = this.userRoles.get(userId) || [];
    if (!userRoleIds.includes(roleId)) {
      userRoleIds.push(roleId);
      this.userRoles.set(userId, userRoleIds);
      this.saveUserRoles();
    }
  }

  /**
   * Remove role from user
   */
  public revokeRole(userId: string, roleId: string): void {
    const userRoleIds = this.userRoles.get(userId) || [];
    const index = userRoleIds.indexOf(roleId);
    
    if (index > -1) {
      userRoleIds.splice(index, 1);
      this.userRoles.set(userId, userRoleIds);
      this.saveUserRoles();
    }
  }

  /**
   * Get user's roles
   */
  public getUserRoles(userId: string): UserRole[] {
    const roleIds = this.userRoles.get(userId) || [];
    return roleIds
      .map(id => this.roles.get(id))
      .filter((role): role is UserRole => role !== undefined);
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    dateFrom: Date,
    dateTo: Date
  ): Promise<ComplianceReport> {
    const logs = this.getAuditLogs({ dateFrom, dateTo });

    // Calculate metrics
    const estimateActions = logs.filter(log => log.resource === 'estimate');
    const totalEstimates = new Set(estimateActions.map(log => log.resourceId)).size;
    
    // User activity
    const userActivity = new Map<string, number>();
    logs.forEach(log => {
      userActivity.set(log.userId, (userActivity.get(log.userId) || 0) + 1);
    });

    // Security events
    const securityEvents = new Map<string, number>();
    logs.filter(log => !log.success).forEach(log => {
      const type = log.errorMessage || 'Unknown error';
      securityEvents.set(type, (securityEvents.get(type) || 0) + 1);
    });

    // Data retention
    const oldestLog = logs.length > 0
      ? logs.reduce((oldest, log) => 
          log.timestamp < oldest.timestamp ? log : oldest
        )
      : null;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (logs.filter(log => !log.success).length > logs.length * 0.1) {
      recommendations.push('Высокий процент неудачных операций. Проверьте права доступа.');
    }
    
    if (oldestLog && (new Date().getTime() - oldestLog.timestamp.getTime()) > 90 * 24 * 60 * 60 * 1000) {
      recommendations.push('Рекомендуется архивировать логи старше 90 дней.');
    }

    return {
      generatedAt: new Date(),
      period: { from: dateFrom, to: dateTo },
      totalEstimates,
      totalValue: 0, // Would calculate from estimates
      userActivity: Array.from(userActivity.entries()).map(([userId, actionCount]) => ({
        userId,
        actionCount
      })),
      securityEvents: Array.from(securityEvents.entries()).map(([type, count]) => ({
        type,
        count
      })),
      dataRetention: {
        totalRecords: logs.length,
        oldestRecord: oldestLog?.timestamp || new Date()
      },
      recommendations
    };
  }

  /**
   * Setup encryption for sensitive data
   */
  private async setupEncryption(): Promise<void> {
    if (crypto.subtle) {
      try {
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.error('Failed to setup encryption:', error);
      }
    }
  }

  /**
   * Encrypt sensitive data
   */
  public async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      return data; // Fallback: return unencrypted
    }

    try {
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encoder.encode(data)
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypt sensitive data
   */
  public async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      return encryptedData; // Fallback
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * Export audit logs
   */
  public exportAuditLogs(format: 'csv' | 'json' = 'csv'): Blob {
    if (format === 'json') {
      return new Blob([JSON.stringify(this.auditLogs, null, 2)], {
        type: 'application/json'
      });
    }

    // CSV format
    const headers = [
      'Timestamp',
      'User ID',
      'User Name',
      'Action',
      'Resource',
      'Resource ID',
      'Success',
      'IP Address',
      'User Agent'
    ];

    const rows = this.auditLogs.map(log => [
      log.timestamp.toISOString(),
      log.userId,
      log.userName,
      log.action,
      log.resource,
      log.resourceId,
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      log.userAgent || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Clear old audit logs (data retention)
   */
  public clearOldLogs(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(
      log => log.timestamp >= cutoffDate
    );
    const removedCount = initialCount - this.auditLogs.length;

    if (removedCount > 0) {
      this.saveAuditLogs();
    }

    return removedCount;
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Save audit logs to storage
   */
  private saveAuditLogs(): void {
    try {
      localStorage.setItem('audit_logs', JSON.stringify(this.auditLogs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  /**
   * Load audit logs from storage
   */
  private loadAuditLogs(): void {
    try {
      const stored = localStorage.getItem('audit_logs');
      if (stored) {
        this.auditLogs = JSON.parse(stored, (key, value) => {
          if (key === 'timestamp' || key === 'lastSeen') {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  /**
   * Save user roles to storage
   */
  private saveUserRoles(): void {
    const rolesArray = Array.from(this.userRoles.entries());
    localStorage.setItem('user_roles', JSON.stringify(rolesArray));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const enterpriseManager = new EnterpriseManager();
