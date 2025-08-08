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
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎉</Text>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Покани приятел
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Спечели 1 месец безплатно!
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Поканете приятел да изтегли FinTrack. Ако закупи абонамент, вие получавате 1 месец безплатно!
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
                <>
                  <Text style={styles.buttonText}>🚀 Създай Link</Text>
                  <Text style={styles.buttonSubtext}>и започни да канят приятели</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Current referral link preview */}
          {referralLink && (
            <View style={styles.linkPreview}>
              <Text style={[styles.linkText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {referralLink.url}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
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
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  content: {
    borderRadius: 14,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
    marginBottom: 2,
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
  },
  linkPreview: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default ReferralCard; 