/**
 * AsyncStorage Wrapper with fallback for when native module is null
 * This prevents crashes when AsyncStorage is not properly initialized
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback storage
const memoryStorage: { [key: string]: string } = {};

class AsyncStorageWrapper {
  private async isNativeAvailable(): Promise<boolean> {
    try {
      // Test if native AsyncStorage is working
      await AsyncStorage.getItem('__test__');
      return true;
    } catch (error) {
      console.warn('[AsyncStorageWrapper] Native AsyncStorage not available, using memory fallback');
      return false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (await this.isNativeAvailable()) {
        return await AsyncStorage.getItem(key);
      } else {
        return memoryStorage[key] || null;
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] getItem error:', error);
      return memoryStorage[key] || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (await this.isNativeAvailable()) {
        await AsyncStorage.setItem(key, value);
      } else {
        memoryStorage[key] = value;
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] setItem error:', error);
      memoryStorage[key] = value;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (await this.isNativeAvailable()) {
        await AsyncStorage.removeItem(key);
      } else {
        delete memoryStorage[key];
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] removeItem error:', error);
      delete memoryStorage[key];
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (await this.isNativeAvailable()) {
        await AsyncStorage.multiRemove(keys);
      } else {
        keys.forEach(key => delete memoryStorage[key]);
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] multiRemove error:', error);
      keys.forEach(key => delete memoryStorage[key]);
    }
  }

  async getAllKeys(): Promise<readonly string[]> {
    try {
      if (await this.isNativeAvailable()) {
        return await AsyncStorage.getAllKeys();
      } else {
        return Object.keys(memoryStorage);
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] getAllKeys error:', error);
      return Object.keys(memoryStorage);
    }
  }

  async clear(): Promise<void> {
    try {
      if (await this.isNativeAvailable()) {
        await AsyncStorage.clear();
      } else {
        Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
      }
    } catch (error) {
      console.error('[AsyncStorageWrapper] clear error:', error);
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
    }
  }
}

// Export singleton instance
export default new AsyncStorageWrapper(); 