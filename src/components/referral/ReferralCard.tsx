import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import ReferralService, { ReferralLink } from '../../services/ReferralService';

interface ReferralCardProps {
  onPress: () => void;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);

  const handleGenerateAndShare = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Generate referral link
      const link = await ReferralService.generateReferralLink();
      setReferralLink(link);
      
      // Show sharing options
      Alert.alert(
        '🎉 Твоят Referral Link е готов!',
        'Избери как искаш да го споделиш:',
        [
          { text: 'Отказ', style: 'cancel' },
          { 
            text: '📱 Споделяне', 
            onPress: () => ReferralService.shareReferralLink(link.url)
          },
          { 
            text: '💬 WhatsApp', 
            onPress: () => ReferralService.shareViaWhatsApp(link.url)
          },
          { 
            text: '📧 Email', 
            onPress: () => ReferralService.shareViaEmail(link.url)
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Грешка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
        {/* Reward Banner */}
        <View style={styles.rewardBanner}>
          <LinearGradient
            colors={theme.colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardBannerGradient}
          >
            <Text style={styles.rewardEmoji}>🎁</Text>
            <View style={styles.rewardText}>
              <Text style={styles.rewardTitle}>Покани приятел</Text>
              <Text style={styles.rewardSubtitle}>Спечели 1 месец безплатно</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Когато приятелят ти закупи абонамент, ти автоматично получаваш 1 месец безплатно!
        </Text>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGenerateAndShare}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.colors.primaryGradient}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>🚀 Сподели линк</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Current referral link preview */}
        {referralLink && (
          <View style={styles.linkPreview}>
            <Text style={[styles.linkLabel, { color: theme.colors.textSecondary }]}>
              Твоят линк:
            </Text>
            <Text style={[styles.linkText, { color: theme.colors.primary }]} numberOfLines={1}>
              {referralLink.url}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    borderRadius: 16,
    padding: 20,
  },
  rewardBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  rewardBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  rewardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(26, 26, 26, 0.7)',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default ReferralCard; 
export default ReferralCard; 