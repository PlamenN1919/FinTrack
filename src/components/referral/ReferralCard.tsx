import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
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
  
  // 🔒 Функцията е временно заключена - промени на false за да активираш
  const [isLocked] = useState(true);
  const lockedOpacity = useRef(new Animated.Value(0)).current;

  // Анимация на locked overlay
  useEffect(() => {
    if (isLocked) {
      Animated.timing(lockedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(lockedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLocked]);

  const handleGenerateAndShare = async () => {
    // Ако е заключено, показваме съобщение
    if (isLocked) {
      Alert.alert(
        '🔒 Функцията е временно недостъпна',
        'Покани приятел скоро ще бъде достъпна. Очаквайте скоро!',
        [{ text: 'OK' }]
      );
      return;
    }

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

  const handleCardPress = () => {
    if (isLocked) {
      Alert.alert(
        '🔒 Функцията е временно недостъпна',
        'Покани приятел скоро ще бъде достъпна. Очаквайте скоро!',
        [{ text: 'OK' }]
      );
      return;
    }
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
        {/* Locked Overlay */}
        {isLocked && (
          <Animated.View style={[styles.lockedOverlay, { opacity: lockedOpacity }]}>
            <View style={styles.lockedContent}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>Очаквайте скоро...</Text>
              <Text style={styles.lockedSubtitle}>
                Покани приятел скоро ще бъде достъпна
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Reward Banner */}
        <View style={[styles.rewardBanner, isLocked && styles.lockedElement]}>
          <LinearGradient
            colors={isLocked ? ['#9CA3AF', '#6B7280'] : theme.colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardBannerGradient}
          >
            <Text style={[styles.rewardEmoji, isLocked && styles.lockedText]}>
              {isLocked ? '🔒' : '🎁'}
            </Text>
            <View style={styles.rewardText}>
              <Text style={[styles.rewardTitle, isLocked && styles.lockedText]}>
                Покани приятел
              </Text>
              <Text style={[styles.rewardSubtitle, isLocked && styles.lockedText]}>
                {isLocked ? 'Скоро ще бъде достъпна' : 'Спечели 1 месец безплатно'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Description */}
        <Text style={[
          styles.description, 
          { color: theme.colors.textSecondary },
          isLocked && styles.lockedDescription
        ]}>
          {isLocked 
            ? 'Тази функция скоро ще бъде налична. Следете за актуализации!'
            : 'Когато приятелят ти закупи абонамент, ти автоматично получаваш 1 месец безплатно!'
          }
        </Text>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, isLocked && styles.lockedButton]}
          onPress={handleGenerateAndShare}
          disabled={loading || isLocked}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLocked ? ['#9CA3AF', '#6B7280'] : theme.colors.primaryGradient}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isLocked ? '🔒 Заключено' : '🚀 Сподели линк'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Current referral link preview - скрит когато е заключено */}
        {referralLink && !isLocked && (
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
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Locked overlay стилове
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 16,
  },
  lockedContent: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedElement: {
    opacity: 0.5,
  },
  lockedText: {
    opacity: 0.7,
  },
  lockedDescription: {
    opacity: 0.6,
  },
  lockedButton: {
    opacity: 0.7,
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