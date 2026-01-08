"use client";

import { exportUserData } from "./data-export";
import { logger } from "@/utils/logger";

/**
 * Automated Backup Service
 * Automatically backs up user data
 */
class AutomatedBackupService {
  private backupInterval: NodeJS.Timeout | null = null;
  private lastBackup: number = 0;

  /**
   * Start automated backups
   */
  startAutomatedBackups(userId: string, intervalHours: number = 24): void {
    if (this.backupInterval) {
      logger.warn('AutoBackup', 'Already running');
      return;
    }

    // Check if backup is due
    const checkAndBackup = async () => {
      const now = Date.now();
      const hoursSinceLastBackup = (now - this.lastBackup) / (1000 * 60 * 60);

      if (hoursSinceLastBackup >= intervalHours) {
        await this.performBackup(userId);
      }
    };

    // Initial check
    checkAndBackup();

    // Schedule periodic checks (every hour)
    this.backupInterval = setInterval(checkAndBackup, 60 * 60 * 1000);

    logger.log('AutoBackup', `Started automated backups (every ${intervalHours} hours)`);
  }

  /**
   * Stop automated backups
   */
  stopAutomatedBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      logger.log('AutoBackup', 'Stopped automated backups');
    }
  }

  /**
   * Perform backup
   */
  private async performBackup(userId: string): Promise<void> {
    try {
      logger.log('AutoBackup', 'Starting backup...');

      const data = await exportUserData(userId);
      
      if (!data) {
        logger.error('AutoBackup', 'Failed to export data');
        return;
      }

      // Save to IndexedDB as backup
      const db = await this.openBackupDB();
      await db.put('backups', {
        userId,
        data,
        timestamp: Date.now(),
      });

      this.lastBackup = Date.now();
      
      logger.log('AutoBackup', 'Backup completed successfully');
    } catch (error) {
      logger.error('AutoBackup', 'Backup failed:', error);
    }
  }

  /**
   * Open backup database
   */
  private async openBackupDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('echo-backups', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'userId' });
        }
      };
    });
  }

  /**
   * Get last backup time
   */
  getLastBackupTime(): number {
    return this.lastBackup;
  }

  /**
   * Manually trigger backup
   */
  async manualBackup(userId: string): Promise<void> {
    await this.performBackup(userId);
  }
}

export const automatedBackup = new AutomatedBackupService();