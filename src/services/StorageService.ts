import AsyncStorageWrapper from '../utils/AsyncStorageWrapper';

// Константи за ключове
const STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions',
  BUDGETS: 'fintrack_budgets',
  USER_PROFILE: 'fintrack_user_profile',
  SETTINGS: 'fintrack_settings',
  THEME: 'fintrack_theme',
  GAMIFICATION: 'fintrack_gamification',
  LAST_BACKUP: 'fintrack_last_backup',
};

// Helper функция за проверка на AsyncStorage
const isAsyncStorageAvailable = (): boolean => {
  try {
    return AsyncStorageWrapper !== null && AsyncStorageWrapper !== undefined;
  } catch (error) {
    console.warn('[StorageService] AsyncStorage check failed:', error);
    return false;
  }
};

// Интерфейси за данните
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  monthlyIncome?: number;
  financialGoals?: string;
}

interface AppSettings {
  currency: string;
  language: string;
  dateFormat: string;
  startOfWeek: number;
  notifications: {
    budgetAlerts: boolean;
    dailyReminders: boolean;
    monthlyReports: boolean;
    achievements: boolean;
  };
  security: {
    pinEnabled: boolean;
    biometricEnabled: boolean;
    autoLockTime: number; // в минути
    hideBalance: boolean;
  };
}

interface BackupData {
  transactions: any[];
  budgets: any[];
  userProfile: UserProfile;
  gamification: any;
  settings: AppSettings;
  timestamp: string;
  version: string;
}

class StorageService {
  // Общи методи за съхранение
  private async setItem(key: string, value: any): Promise<void> {
    try {
      if (!isAsyncStorageAvailable()) {
        console.warn(`[StorageService] AsyncStorage not available, skipping save for ${key}`);
        return;
      }
      
      const jsonValue = JSON.stringify(value);
      await AsyncStorageWrapper.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (!isAsyncStorageAvailable()) {
        console.warn(`[StorageService] AsyncStorage not available, returning default for ${key}`);
        return defaultValue;
      }
      
      const jsonValue = await AsyncStorageWrapper.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      if (!isAsyncStorageAvailable()) {
        console.warn(`[StorageService] AsyncStorage not available, skipping remove for ${key}`);
        return;
      }
      
      await AsyncStorageWrapper.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // Транзакции
  async saveTransactions(transactions: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  async loadTransactions(): Promise<any[]> {
    return await this.getItem(STORAGE_KEYS.TRANSACTIONS, []);
  }

  // Бюджети
  async saveBudgets(budgets: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.BUDGETS, budgets);
  }

  async loadBudgets(): Promise<any[]> {
    return await this.getItem(STORAGE_KEYS.BUDGETS, []);
  }

  // Потребителски профил
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    return await this.getItem(STORAGE_KEYS.USER_PROFILE, null);
  }

  // Гамификация
  async saveGamification(gamificationData: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.GAMIFICATION, gamificationData);
  }

  async loadGamification(): Promise<any | null> {
    return await this.getItem(STORAGE_KEYS.GAMIFICATION, null);
  }

  // Настройки
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  async loadSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      currency: 'лв.',
      language: 'bg',
      dateFormat: 'dd.mm.yyyy',
      startOfWeek: 1, // Понеделник
      notifications: {
        budgetAlerts: true,
        dailyReminders: true,
        monthlyReports: true,
        achievements: true,
      },
      security: {
        pinEnabled: false,
        biometricEnabled: false,
        autoLockTime: 5,
        hideBalance: false,
      },
    };
    return await this.getItem(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  // Тема
  async saveTheme(theme: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME, theme);
  }

  async loadTheme(): Promise<string> {
    return await this.getItem(STORAGE_KEYS.THEME, 'system');
  }

  // Backup и възстановяване
  async createBackup(): Promise<BackupData> {
    try {
      const [transactions, budgets, userProfile, gamification, settings] = await Promise.all([
        this.loadTransactions(),
        this.loadBudgets(),
        this.loadUserProfile(),
        this.loadGamification(),
        this.loadSettings(),
      ]);

      const backupData: BackupData = {
        transactions,
        budgets,
        userProfile: userProfile || {
          name: '',
          email: '',
          avatar: '',
          joinDate: new Date().toISOString(),
        },
        gamification,
        settings,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      // Запазваме последния backup
      await this.setItem(STORAGE_KEYS.LAST_BACKUP, backupData);
      
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupData: BackupData): Promise<void> {
    try {
      await Promise.all([
        this.saveTransactions(backupData.transactions || []),
        this.saveBudgets(backupData.budgets || []),
        this.saveUserProfile(backupData.userProfile),
        this.saveGamification(backupData.gamification),
        this.saveSettings(backupData.settings),
      ]);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  async getLastBackup(): Promise<BackupData | null> {
    return await this.getItem(STORAGE_KEYS.LAST_BACKUP, null);
  }

  // Изчистване на данни
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.removeItem(STORAGE_KEYS.TRANSACTIONS),
        this.removeItem(STORAGE_KEYS.BUDGETS),
        this.removeItem(STORAGE_KEYS.USER_PROFILE),
        this.removeItem(STORAGE_KEYS.GAMIFICATION),
        this.removeItem(STORAGE_KEYS.SETTINGS),
        this.removeItem(STORAGE_KEYS.LAST_BACKUP),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Статистики за съхранение
  async getStorageStats(): Promise<{
    totalKeys: number;
    estimatedSize: string;
    lastBackup: string | null;
  }> {
    try {
      if (!isAsyncStorageAvailable()) {
        console.warn('[StorageService] AsyncStorage not available for stats');
        return {
          totalKeys: 0,
          estimatedSize: '0 B',
          lastBackup: null,
        };
      }

      const keys = await AsyncStorageWrapper.getAllKeys();
      const fintrackKeys = keys.filter(key => key.startsWith('fintrack_'));
      
      // Приблизителен размер (не е точен, но дава представа)
      let totalSize = 0;
      for (const key of fintrackKeys) {
        const value = await AsyncStorageWrapper.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      const lastBackup = await this.getItem<BackupData | null>(STORAGE_KEYS.LAST_BACKUP, null);
      
      return {
        totalKeys: fintrackKeys.length,
        estimatedSize: this.formatBytes(totalSize),
        lastBackup: lastBackup?.timestamp || null,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalKeys: 0,
        estimatedSize: '0 B',
        lastBackup: null,
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Автоматично backup (може да се извиква периодично)
  async autoBackup(): Promise<void> {
    try {
      const lastBackup = await this.getLastBackup();
      const now = new Date();
      
      // Правим backup само ако последният е преди повече от 24 часа
      if (!lastBackup || 
          (now.getTime() - new Date(lastBackup.timestamp).getTime()) > 24 * 60 * 60 * 1000) {
        await this.createBackup();
        console.log('Auto backup completed');
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  // Миграция на данни (за бъдещи версии)
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    // Тук ще добавяме логика за миграция при промени в структурата на данните
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
  }
}

// Експортираме singleton инстанция
const storageService = new StorageService();
export default storageService; 