import { Alert, Share, Linking } from 'react-native';
// import DeviceInfo from 'react-native-device-info'; // TODO: Add this dependency later
import { 
  generateReferralLinkCallable, 
  processReferralRewardCallable, 
  getReferralStatsCallable,
  auth
} from '../config/firebase.config';

export interface ReferralLink {
  url: string;
  referralId: string;
}

export interface ReferralStats {
  totalInvites: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralHistory: ReferralHistoryItem[];
}

export interface ReferralHistoryItem {
  id: string;
  refereeEmail: string;
  status: 'pending' | 'completed' | 'expired';
  invitedAt: any;
  completedAt?: any;
  rewardGranted: boolean;
}

// Type definitions for Firebase Functions responses
interface FirebaseFunctionResponse {
  data: {
    success: boolean;
    message?: string;
    referralLink?: string;
    referralId?: string;
    stats?: ReferralStats;
    newEndDate?: string;
    reasons?: string[];
  };
}

class ReferralService {
  private static instance: ReferralService;
  private currentReferralLink: ReferralLink | null = null;

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  /**
   * Generate a new referral link for the current user
   */
  async generateReferralLink(): Promise<ReferralLink> {
    try {
      // Validate Firebase Auth token
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Моля, влезте отново в профила си.');
      }
      await currentUser.getIdToken(true); // Force refresh token

      const result = await generateReferralLinkCallable() as FirebaseFunctionResponse;
      
      if (result.data.success && result.data.referralLink && result.data.referralId) {
        this.currentReferralLink = {
          url: result.data.referralLink,
          referralId: result.data.referralId,
        };
        return this.currentReferralLink;
      } else {
        throw new Error('Failed to generate referral link');
      }
    } catch (error: any) {
      console.error('Error generating referral link:', error);
      throw new Error(error.message || 'Възникна грешка при генериране на линка');
    }
  }

  /**
   * Share referral link via native share dialog
   */
  async shareReferralLink(referralLink: string): Promise<void> {
    try {
      const message = `
🎉 Покани се към FinTrack! 

Управлявай лесно личните си финанси с най-добрата българска апликация. 

📱 Изтегли сега: ${referralLink}

Ако се абонираш, и двамата получаваме 1 месец безплатно! 💰
      `.trim();

      const result = await Share.share({
        message,
        url: referralLink,
        title: 'Покани към FinTrack',
      });

      if (result.action === Share.sharedAction) {
        console.log('Referral link shared successfully');
      }
    } catch (error: any) {
      console.error('Error sharing referral link:', error);
      Alert.alert('Грешка', 'Възникна грешка при споделяне на линка');
    }
  }

  /**
   * Copy referral link to clipboard
   */
  async copyReferralLink(referralLink: string): Promise<void> {
    try {
      // Note: We'll need to install @react-native-clipboard/clipboard
      // For now, we'll show an alert with the link
      Alert.alert(
        'Referral Link', 
        referralLink,
        [
          { text: 'Затвори', style: 'cancel' },
          { 
            text: 'Копирай', 
            onPress: () => {
              // TODO: Implement clipboard copy
              Alert.alert('Копирано!', 'Линкът е копиран в clipboard');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error copying referral link:', error);
      Alert.alert('Грешка', 'Възникна грешка при копиране на линка');
    }
  }

  /**
   * Process referral when a new user subscribes
   */
  async processReferralReward(referrerId: string): Promise<void> {
    try {
      // Validate Firebase Auth token
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Моля, влезте отново в профила си.');
      }
      await currentUser.getIdToken(true); // Force refresh token

      // Get device info for anti-fraud checks
      const deviceId = await this.getDeviceId();
      const ipAddress = await this.getDeviceIP();

      const result = await processReferralRewardCallable({
        referrerId,
        deviceId,
        ipAddress,
      }) as FirebaseFunctionResponse;

      if (result.data.success) {
        Alert.alert(
          '🎉 Успех!', 
          result.data.message || 'Наградата е успешно предоставена!',
          [{ text: 'Супер!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Внимание', 
          result.data.message || 'Възникна проблем с обработка на наградата',
          [{ text: 'Разбрах', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Error processing referral reward:', error);
      Alert.alert('Грешка', error.message || 'Възникна грешка при обработка на наградата');
    }
  }

  /**
   * Get referral statistics for dashboard
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      // Validate Firebase Auth token
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Моля, влезте отново в профила си.');
      }
      await currentUser.getIdToken(true); // Force refresh token

      const result = await getReferralStatsCallable() as FirebaseFunctionResponse;
      
      if (result.data.success && result.data.stats) {
        return result.data.stats;
      } else {
        throw new Error('Failed to get referral stats');
      }
    } catch (error: any) {
      console.error('Error getting referral stats:', error);
      throw new Error(error.message || 'Възникна грешка при зареждане на статистиките');
    }
  }

  /**
   * Handle deep link when app is opened from referral
   */
  async handleReferralDeepLink(url: string): Promise<string | null> {
    try {
      const urlObj = new URL(url);
      const referrerId = urlObj.searchParams.get('ref');
      
      if (referrerId) {
        // Store referrer ID for later use when user subscribes
        // We can use AsyncStorage for this
        console.log('Referral detected:', referrerId);
        return referrerId;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error handling referral deep link:', error);
      return null;
    }
  }

  /**
   * Send WhatsApp message with referral link
   */
  async shareViaWhatsApp(referralLink: string): Promise<void> {
    try {
      const message = encodeURIComponent(`
🎉 Покани се към FinTrack! 

Управлявай лесно личните си финанси с най-добрата българска апликация. 

📱 Изтегли сега: ${referralLink}

Ако се абонираш, и двамата получаваме 1 месец безплатно! 💰
      `.trim());
      
      const whatsappUrl = `whatsapp://send?text=${message}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Грешка', 'WhatsApp не е инсталиран на устройството');
      }
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error);
      Alert.alert('Грешка', 'Възникна грешка при споделяне в WhatsApp');
    }
  }

  /**
   * Send email with referral link
   */
  async shareViaEmail(referralLink: string): Promise<void> {
    try {
      const subject = encodeURIComponent('Покани към FinTrack - Спечели 1 месец безплатно!');
      const body = encodeURIComponent(`
Здравей!

Искам да те поканя да изпробваш FinTrack - най-добрата българска апликация за управление на лични финанси! 

🎯 Защо FinTrack?
• Лесно проследяване на разходи и приходи
• Интелигентни бюджети и цели
• Красиви визуални отчети
• Пълна поддръжка на български език

📱 Изтегли сега: ${referralLink}

🎁 Бонус: Ако се абонираш, и двамата получаваме 1 месец безплатно!

Благодаря!
      `.trim());
      
      const emailUrl = `mailto:?subject=${subject}&body=${body}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Грешка', 'Няма настроен email клиент');
      }
    } catch (error: any) {
      console.error('Error sharing via email:', error);
      Alert.alert('Грешка', 'Възникна грешка при споделяне на email');
    }
  }

  /**
   * Get device ID (simplified implementation)
   */
  private async getDeviceId(): Promise<string> {
    try {
      // TODO: Implement proper device ID when react-native-device-info is added
      // For now, generate a simple random ID
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      return 'unknown_device';
    }
  }

  /**
   * Get device IP address (simplified implementation)
   */
  private async getDeviceIP(): Promise<string> {
    try {
      // In a real implementation, you might want to use a service to get the external IP
      // For now, we'll return a placeholder
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clear cached referral link
   */
  clearCache(): void {
    this.currentReferralLink = null;
  }
}

export default ReferralService.getInstance(); 