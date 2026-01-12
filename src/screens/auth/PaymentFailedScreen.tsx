import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan } from '../../types/auth.types';
import { formatPrice, SUBSCRIPTION_PLANS, getPlanPrice } from '../../config/subscription.config';

type PaymentFailedScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PaymentFailed'>;
type PaymentFailedScreenRouteProp = RouteProp<AuthStackParamList, 'PaymentFailed'>;

const PaymentFailedScreen: React.FC = () => {
  const navigation = useNavigation<PaymentFailedScreenNavigationProp>();
  const route = useRoute<PaymentFailedScreenRouteProp>();

  const { error, planId, retryCount } = route.params;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for error icon
    const shakeAnimation = Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);

    setTimeout(() => {
      shakeAnimation.start();
    }, 500);

    // Pulse animation for error icon
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

  const getErrorTitle = () => {
    switch (error.code) {
      case 'payment/card-declined':
        return 'Картата е отхвърлена';
      case 'payment/insufficient-funds':
        return 'Недостатъчни средства';
      case 'payment/expired-card':
        return 'Картата е изтекла';
      case 'payment/invalid-card':
        return 'Невалидна карта';
      case 'payment/network-error':
        return 'Грешка в мрежата';
      default:
        return 'Плащането беше неуспешно';
    }
  };

  const getErrorDescription = () => {
    switch (error.code) {
      case 'payment/card-declined':
        return 'Вашата банка отхвърли транзакцията. Моля, свържете се с банката или опитайте с друга карта.';
      case 'payment/insufficient-funds':
        return 'Няма достатъчно средства по картата. Моля, проверете баланса или използвайте друга карта.';
      case 'payment/expired-card':
        return 'Картата ви е изтекла. Моля, обновете данните или използвайте друга карта.';
      case 'payment/invalid-card':
        return 'Данните на картата са невалидни. Моля, проверете номера, датата и CVC кода.';
      case 'payment/network-error':
        return 'Възникна проблем с връзката. Моля, проверете интернет връзката и опитайте отново.';
      default:
        return error.message || 'Възникна неочаквана грешка при обработката на плащането.';
    }
  };

  const getRetryButtonText = () => {
    if (retryCount >= 2) {
      return 'Последен опит';
    }
    return `Опитай отново (${retryCount + 1}/3)`;
  };

  const canRetry = () => {
    return retryCount < 3 && error.recoverable;
  };

  const handleRetryPayment = () => {
    if (!canRetry()) {
      Alert.alert(
        'Максимален брой опити',
        'Достигнахте максималния брой опити за плащане. Моля, изберете друг план или се свържете с поддръжката.'
      );
      return;
    }

    // Navigate back to payment with incremented retry count
    navigation.navigate('Payment', {
      planId,
      amount: getPlanAmount(),
      currency: 'EUR',
    });
  };

  const handleTryDifferentCard = () => {
    Alert.alert(
      'Нова карта',
      'Ще бъдете пренасочени към екрана за плащане за да въведете данни за нова карта.',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Продължи',
          onPress: () => {
            navigation.navigate('Payment', {
              planId,
              amount: getPlanAmount(),
              currency: 'EUR',
            });
          },
        },
      ]
    );
  };

  const handleChooseDifferentPlan = () => {
    navigation.navigate('SubscriptionPlans', { 
      reason: 'payment_failed' 
    });
  };

  const handleBackToPlans = () => {
    navigation.navigate('SubscriptionPlans', { 
      reason: 'payment_failed' 
    });
  };

  const getPlanAmount = () => {
    // Get price from configuration based on plan
    const planConfig = SUBSCRIPTION_PLANS[planId];
    if (!planConfig) {
      console.error('[PaymentFailedScreen] Unknown plan:', planId);
      return 0;
    }
    
    // Return the appropriate price based on plan type
    switch (planId) {
      case SubscriptionPlan.MONTHLY:
        return planConfig.monthlyPrice;
      case SubscriptionPlan.QUARTERLY:
        return planConfig.quarterlyPrice || planConfig.monthlyPrice * 3;
      case SubscriptionPlan.YEARLY:
        return planConfig.yearlyPrice || planConfig.monthlyPrice * 12;
      default:
        return planConfig.monthlyPrice;
    }
  };

  const getPlanDisplayName = () => {
    const planConfig = SUBSCRIPTION_PLANS[planId];
    if (!planConfig) {
      console.error('[PaymentFailedScreen] Unknown plan for display:', planId);
      return 'Абонаментен план';
    }
    return planConfig.name;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8F4F0', '#DDD0C8', '#B0A89F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

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
          {/* Error Icon */}
          <Animated.View
            style={[
              styles.errorIconContainer,
              {
                transform: [
                  { translateX: shakeAnim },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#DDD0C8', '#F8F4F0']}
              style={styles.errorIconGradient}
            >
              <Text style={styles.errorIcon}>❌</Text>
            </LinearGradient>
          </Animated.View>

          {/* Error Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.errorTitle}>{getErrorTitle()}</Text>
            <Text style={styles.errorDescription}>
              {getErrorDescription()}
            </Text>
          </View>

          {/* Payment Details */}
          <View style={styles.paymentDetailsCard}>
            <Text style={styles.paymentDetailsTitle}>Детайли на плащането</Text>
            <View style={styles.paymentDetailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>План:</Text>
                <Text style={styles.detailValue}>{getPlanDisplayName()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Сума:</Text>
                <Text style={styles.detailValue}>
                  {formatPrice(getPlanAmount(), 'EUR')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Опити:</Text>
                <Text style={styles.detailValue}>{retryCount + 1}/3</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Retry Payment Button */}
            {canRetry() && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryPayment}
                >
                  <Text style={styles.retryButtonText}>{getRetryButtonText()}</Text>
              </TouchableOpacity>
            )}

            {/* Try Different Card Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleTryDifferentCard}
            >
                <Text style={styles.secondaryButtonText}>Опитай с друга карта</Text>
            </TouchableOpacity>

            {/* Choose Different Plan Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleChooseDifferentPlan}
            >
                <Text style={styles.secondaryButtonText}>Избери друг план</Text>
            </TouchableOpacity>

            {/* Back to Plans Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToPlans}
            >
              <Text style={styles.backButtonText}>← Обратно към планове</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Полезни съвети</Text>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>💡</Text>
              <Text style={styles.helpText}>
                Проверете дали данните на картата са правилни
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🏦</Text>
              <Text style={styles.helpText}>
                Свържете се с банката за проверка на лимитите
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🔄</Text>
              <Text style={styles.helpText}>
                Опитайте отново след няколко минути
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F0',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
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
  errorIconContainer: {
    marginBottom: 30,
  },
  errorIconGradient: {
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
  errorIcon: {
    fontSize: 48,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  errorDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentDetailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  retryButton: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    flex: 1,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default PaymentFailedScreen; 