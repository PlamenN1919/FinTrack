import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan } from '../../types/auth.types';
import { formatPrice } from '../../config/subscription.config';
import { useAuth } from '../../contexts/AuthContext';

type PaymentSuccessScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PaymentSuccess'>;
type PaymentSuccessScreenRouteProp = RouteProp<AuthStackParamList, 'PaymentSuccess'>;

const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation<PaymentSuccessScreenNavigationProp>();
  const route = useRoute<PaymentSuccessScreenRouteProp>();
  const { authState, setSubscription } = useAuth();

  const { subscription } = route.params;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Confetti animations
  const confetti1 = useRef(new Animated.Value(-100)).current;
  const confetti2 = useRef(new Animated.Value(-100)).current;
  const confetti3 = useRef(new Animated.Value(-100)).current;
  const confetti4 = useRef(new Animated.Value(-100)).current;
  const confetti5 = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Entrance animations sequence
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Scale in success icon
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Slide in content
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Start confetti animation
    setTimeout(() => {
      startConfettiAnimation();
    }, 800);

    // Start pulse animation for success icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const startConfettiAnimation = () => {
    const confettiPieces = [confetti1, confetti2, confetti3, confetti4, confetti5];
    
    confettiPieces.forEach((confetti, index) => {
      Animated.timing(confetti, {
        toValue: 800,
        duration: 2000 + (index * 200),
        useNativeDriver: true,
      }).start();
    });
  };

  const getPlanDisplayName = () => {
    switch (subscription.plan) {
      case SubscriptionPlan.MONTHLY:
        return 'Месечен план';
      case SubscriptionPlan.QUARTERLY:
        return 'Тримесечен план';
      case SubscriptionPlan.YEARLY:
        return 'Годишен план';
      default:
        return 'Абонаментен план';
    }
  };

  const getPlanPeriod = () => {
    switch (subscription.plan) {
      case SubscriptionPlan.MONTHLY:
        return 'месец';
      case SubscriptionPlan.QUARTERLY:
        return '3 месеца';
      case SubscriptionPlan.YEARLY:
        return 'година';
      default:
        return 'период';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleContinue = async () => {
    try {
      // Update auth context with the subscription
      // This will automatically trigger navigation to main app via AppNavigator
      console.log('Activating subscription and navigating to main app...');
      await setSubscription(subscription);
      console.log('Subscription set successfully, navigation should happen automatically');
    } catch (error) {
      console.error('Failed to set subscription:', error);
      // Even if setting fails, the subscription object indicates success
      // so we could still navigate or show an alert to try again
    }
  };

  const handleViewSubscription = () => {
    navigation.navigate('SubscriptionManagement', {
      subscription: subscription,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#01579B', '#0288D1', '#00B4DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Confetti Animation */}
      <View style={styles.confettiContainer}>
        {[confetti1, confetti2, confetti3, confetti4, confetti5].map((confetti, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                left: 50 + (index * 60),
                transform: [{ translateY: confetti }],
                backgroundColor: ['#00B4DB', '#E3F2FD', '#40C4FF', '#80D8FF', '#B3E5FC'][index],
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#00B4DB', '#E3F2FD']}
              style={styles.successIconGradient}
            >
              <Text style={styles.successIcon}>🎉</Text>
            </LinearGradient>
          </Animated.View>

          {/* Success Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.successTitle}>Поздравления!</Text>
            <Text style={styles.successSubtitle}>
              Плащането е успешно и вашият абонамент е активиран
            </Text>
          </View>

          {/* Subscription Details */}
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>Детайли на абонамента</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>АКТИВЕН</Text>
              </View>
            </View>

            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>План:</Text>
                <Text style={styles.detailValue}>{getPlanDisplayName()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Цена:</Text>
                <Text style={styles.detailValue}>
                  {formatPrice(subscription.amount, subscription.currency)}/{getPlanPeriod()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Започва:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.currentPeriodStart)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Следващо плащане:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.currentPeriodEnd)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID на абонамент:</Text>
                <Text style={styles.detailValueSmall}>
                  {subscription.id}
                </Text>
              </View>
            </View>
          </View>

          {/* Features Unlocked */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Отключени функции</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Неограничени транзакции</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Разширени отчети и анализи</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Сканиране на разписки</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Бюджетни цели и прогнози</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Експорт на данни</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Приоритетна поддръжка</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Започни да използваш</Text>
            </TouchableOpacity>

            {/* View Subscription Button */}
            <TouchableOpacity
              style={styles.viewSubscriptionButton}
              onPress={handleViewSubscription}
            >
              <Text style={styles.viewSubscriptionText}>Управление на абонамента</Text>
            </TouchableOpacity>
          </View>

          {/* Thank You Message */}
          <View style={styles.thankYouContainer}>
            <Text style={styles.thankYouText}>
              Благодарим ви, че избрахте FinTrack! 💛
            </Text>
            <Text style={styles.thankYouSubtext}>
              Готови сме да ви помогнем да управлявате финансите си по-умно
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01579B',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 700,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  successSubtitle: {
    fontSize: 18,
    color: 'rgba(227, 242, 253, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    width: '100%',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
  },
  activeBadge: {
    backgroundColor: '#00B4DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subscriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.8)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#E3F2FD',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#E3F2FD',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  featuresContainer: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.9)',
    flex: 1,
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  continueButton: {
    borderRadius: 20,
    backgroundColor: '#00B4DB',
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Platform.OS === 'android' ? '#000' : '#00B4DB',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    minHeight: 64,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 180, 219, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewSubscriptionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    alignItems: 'center',
  },
  viewSubscriptionText: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.9)',
    fontWeight: '600',
  },
  thankYouContainer: {
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 8,
    textAlign: 'center',
  },
  thankYouSubtext: {
    fontSize: 14,
    color: 'rgba(227, 242, 253, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default PaymentSuccessScreen; 