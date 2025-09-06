import type { RootState } from '../store';

export interface BackupMetadata {
  timestamp: string;
  name: string;
  size: number;
}

const BACKUP_PREFIX = 'cochonnet-backup-';
const MAX_BACKUPS = 3;

/**
 * Generate a timestamp string in format YYYY-MM-DD-hh-mm-sss
 */
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

/**
 * Save Redux state to localStorage with timestamp-based naming
 */
export function saveBackup(state: RootState): boolean {
  try {
    const timestamp = generateTimestamp();
    const backupKey = `${BACKUP_PREFIX}${timestamp}`;
    const serializedState = JSON.stringify(state);
    
    // Save the backup
    localStorage.setItem(backupKey, serializedState);
    
    // Clean up old backups if we exceed the limit
    cleanupOldBackups();
    
    console.log(`Backup saved: ${backupKey}`);
    return true;
  } catch (error) {
    console.error('Failed to save backup:', error);
    return false;
  }
}

/**
 * Get all available backups sorted by timestamp (newest first)
 */
export function getAvailableBackups(): BackupMetadata[] {
  try {
    const backups: BackupMetadata[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BACKUP_PREFIX)) {
        const timestamp = key.substring(BACKUP_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          backups.push({
            timestamp,
            name: key,
            size: data.length
          });
        }
      }
    }
    
    // Sort by timestamp (newest first)
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error('Failed to get available backups:', error);
    return [];
  }
}

/**
 * Load a specific backup from localStorage
 */
export function loadBackup(backupName: string): RootState | null {
  try {
    const data = localStorage.getItem(backupName);
    if (!data) {
      console.error(`Backup not found: ${backupName}`);
      return null;
    }
    
    const parsedState = JSON.parse(data) as RootState;
    console.log(`Backup loaded: ${backupName}`);
    return parsedState;
  } catch (error) {
    console.error(`Failed to load backup ${backupName}:`, error);
    return null;
  }
}

/**
 * Delete old backups to maintain the maximum limit
 */
function cleanupOldBackups(): void {
  try {
    const backups = getAvailableBackups();
    
    // Remove backups beyond the limit
    if (backups.length > MAX_BACKUPS) {
      const backupsToDelete = backups.slice(MAX_BACKUPS);
      backupsToDelete.forEach(backup => {
        localStorage.removeItem(backup.name);
        console.log(`Old backup deleted: ${backup.name}`);
      });
    }
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
}

/**
 * Delete a specific backup
 */
export function deleteBackup(backupName: string): boolean {
  try {
    localStorage.removeItem(backupName);
    console.log(`Backup deleted: ${backupName}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete backup ${backupName}:`, error);
    return false;
  }
}

/**
 * Get the most recent backup for auto-restoration
 */
export function getMostRecentBackup(): BackupMetadata | null {
  const backups = getAvailableBackups();
  return backups.length > 0 ? backups[0] : null;
}

/**
 * Format backup timestamp for display
 */
export function formatBackupTimestamp(timestamp: string): string {
  try {
    // Parse YYYY-MM-DD-hh-mm-sss format
    const parts = timestamp.split('-');
    if (parts.length !== 6) return timestamp;
    
    const [year, month, day, hours, minutes, seconds] = parts;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds.padEnd(3, '0').substring(0, 3))
    );
    
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}