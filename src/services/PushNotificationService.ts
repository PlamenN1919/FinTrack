import { Platform, Alert, PermissionsAndroid } from 'react-native';

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   * TODO: Implement full Firebase messaging integration
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing push notifications...');
      
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Push notification permission denied');
        return;
      }

      this.isInitialized = true;
      console.log('✅ Push notifications initialized (basic version)');
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs permission to send notifications',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Android notification permission denied');
            return false;
          }
        }
      }

      // For iOS, we'll assume permission is granted for now
      // TODO: Implement proper iOS permission request with Firebase messaging
      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Send a local test notification (for testing purposes)
   */
  async sendTestNotification(): Promise<void> {
    try {
      Alert.alert(
        '🎉 Test Notification',
        'This is a test notification from FinTrack referral system!',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Simulate a referral reward notification
   */
  async showReferralRewardNotification(): Promise<void> {
    try {
      Alert.alert(
        '🎉 Успешен реферрал!',
        'Вашият приятел се абонира! Получавате 1 месец безплатно 🎁',
        [
          { text: 'Супер!', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Error showing referral reward notification:', error);
    }
  }

  /**
   * Simulate a referral reminder notification
   */
  async showReferralReminderNotification(): Promise<void> {
    try {
      Alert.alert(
        '💸 Покани приятел',
        'Спечели 1 месец безплатно! Покани приятел да използва FinTrack.',
        [
          { text: 'По-късно', style: 'cancel' },
          { 
            text: 'Покани сега', 
            style: 'default',
            onPress: () => {
              console.log('User wants to open referral screen');
              // TODO: Navigate to referral screen
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing referral reminder notification:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isNotificationEnabled(): Promise<boolean> {
    try {
      // For now, return true if initialized
      // TODO: Implement proper permission checking with Firebase messaging
      return this.isInitialized;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    return {
      isInitialized: this.isInitialized,
      platform: Platform.OS,
      version: Platform.Version,
    };
  }

  /**
   * Cleanup and unregister
   */
  async cleanup(): Promise<void> {
    try {
      this.isInitialized = false;
      console.log('✅ Push notification service cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

export default PushNotificationService.getInstance(); 