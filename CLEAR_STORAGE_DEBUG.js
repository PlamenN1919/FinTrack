/**
 * TEMPORARY DEBUG SCRIPT
 * 
 * Add this code to App.tsx temporarily to clear AsyncStorage on startup
 * This will help us see if the problem is stale data in AsyncStorage
 * 
 * REMOVE AFTER TESTING!
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this at the start of App.tsx useEffect:
useEffect(() => {
  const clearStorageForDebug = async () => {
    try {
      console.log('🗑️ [DEBUG] Clearing AsyncStorage...');
      await AsyncStorage.multiRemove([
        '@fintrack_user',
        '@fintrack_subscription',
        '@fintrack_auth_state',
      ]);
      console.log('✅ [DEBUG] AsyncStorage cleared!');
    } catch (error) {
      console.error('❌ [DEBUG] Failed to clear storage:', error);
    }
  };
  
  // Uncomment to clear storage on app start
  // clearStorageForDebug();
}, []);
