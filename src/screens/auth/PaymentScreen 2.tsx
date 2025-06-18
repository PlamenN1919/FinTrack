import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan, SubscriptionStatus } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';
import { SUBSCRIPTION_PLANS, formatPrice, calculateSavings } from '../../config/subscription.config';
import StripePaymentForm from '../../components/StripePaymentForm';

type PaymentScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<AuthStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createSubscription, authState, clearError } = useAuth();

  // Route params
  const { planId, amount, currency } = route.params;
  const selectedPlan = SUBSCRIPTION_PLANS[planId];

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  // Email verification removed - no longer required

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Stripe hooks (ще бъдат активирани когато инсталираме Stripe)
  // const { confirmPayment } = useConfirmPayment();
  // const { createPaymentMethod } = useStripe();

  useEffect(() => {
    clearError();

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
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for payment icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const handleCardChange = (cardDetails: any) => {
    setCardComplete(cardDetails.complete);
    setCardError(cardDetails.error ? cardDetails.error.message : null);
    
    // Animate card field based on completion
    Animated.timing(cardAnim, {
      toValue: cardDetails.complete ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validatePayment = (): boolean => {
    // Email verification is no longer required

    if (!cardComplete) {
      Alert.alert(
        'Невалидни данни за карта',
        'Моля, въведете валидни данни за банкова карта.'
      );
      return false;
    }

    if (cardError) {
      Alert.alert(
        'Грешка в картата',
        cardError
      );
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    try {
      setIsProcessingPayment(true);
      clearError();

      // Simulate Stripe payment process
      // В реалната имплементация тук ще бъде:
      /*
      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
        card: cardDetails,
        billingDetails: {
          email: authState.user?.email,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      const subscription = await createSubscription(planId, paymentMethod.id);
      */

      // Симулация на успешно плащане (2 секунди)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Симулираме създаване на subscription
      const mockSubscription = {
        id: `sub_${Date.now()}`,
        userId: authState.user?.uid || '',
        plan: planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (planId === SubscriptionPlan.MONTHLY ? 30 : planId === SubscriptionPlan.QUARTERLY ? 90 : 365) * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        stripeCustomerId: `cus_${Date.now()}`,
        stripeSubscriptionId: `sub_${Date.now()}`,
        priceId: selectedPlan?.stripePriceIds.monthly || '',
        amount,
        currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Navigate to success screen
      navigation.navigate('PaymentSuccess', {
        subscription: mockSubscription,
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Navigate to failed screen with error details
      navigation.navigate('PaymentFailed', {
        error: {
          code: error.code || 'payment/failed',
          message: error.message || 'Възникна грешка при обработката на плащането.',
          details: error,
          timestamp: new Date(),
          recoverable: true,
        },
        planId,
        retryCount: 0,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleVerifyEmail = () => {
    navigation.navigate('EmailVerification', { 
      email: authState.user?.email || '' 
    });
  };

  const getPlanDisplayName = () => {
    switch (planId) {
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

  const getSavingsText = () => {
    if (!selectedPlan) return null;
    const savings = calculateSavings(selectedPlan.id);
    return savings > 0 ? `Спестявате ${savings}%` : null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Плащане</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
          {/* Payment Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.iconGradient}
            >
              <Text style={styles.paymentIcon}>💳</Text>
            </LinearGradient>
          </Animated.View>

          {/* Plan Summary */}
          <View style={styles.planSummaryContainer}>
            <Text style={styles.planSummaryTitle}>Избран план</Text>
            <View style={styles.planSummaryCard}>
              <View style={styles.planSummaryHeader}>
                <Text style={styles.planName}>{getPlanDisplayName()}</Text>
                {getSavingsText() && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{getSavingsText()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>
                {formatPrice(amount, currency)}
                <Text style={styles.planPeriod}>
                  {planId === SubscriptionPlan.MONTHLY ? '/месец' : 
                   planId === SubscriptionPlan.QUARTERLY ? '/3 месеца' : '/година'}
                </Text>
              </Text>
              <Text style={styles.planDescription}>
                Пълен достъп до всички функции на FinTrack
              </Text>
            </View>
          </View>

          {/* Email Verification Status */}
          {checkingEmail ? (
            <View style={styles.emailStatusContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.emailStatusText}>Проверяваме имейла...</Text>
            </View>
          ) : (
            <View style={[
              styles.emailStatusContainer,
              emailVerified ? styles.emailVerified : styles.emailNotVerified
            ]}>
              <Text style={styles.emailStatusIcon}>
                {emailVerified ? '✅' : '⚠️'}
              </Text>
              <Text style={styles.emailStatusText}>
                {emailVerified 
                  ? 'Имейлът е потвърден' 
                  : 'Имейлът не е потвърден'
                }
              </Text>
              {!emailVerified && (
                <TouchableOpacity 
                  style={styles.verifyEmailButton}
                  onPress={handleVerifyEmail}
                >
                  <Text style={styles.verifyEmailText}>Потвърди</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stripe Payment Form */}
          {emailVerified && (
            <StripePaymentForm
              planId={planId}
              userId={authState.user?.uid || ''}
              onPaymentSuccess={(subscriptionId) => {
                navigation.navigate('PaymentSuccess', {
                  subscription: {
                    id: subscriptionId,
                    userId: authState.user?.uid || '',
                    plan: planId,
                                         status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + (planId === SubscriptionPlan.MONTHLY ? 30 : planId === SubscriptionPlan.QUARTERLY ? 90 : 365) * 24 * 60 * 60 * 1000),
                    cancelAtPeriodEnd: false,
                    stripeCustomerId: `cus_${Date.now()}`,
                    stripeSubscriptionId: subscriptionId,
                    priceId: selectedPlan?.stripePriceIds.monthly || '',
                    amount,
                    currency,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
              }}
              onPaymentError={(error) => {
                navigation.navigate('PaymentFailed', {
                  error: {
                    code: 'payment/failed',
                    message: error,
                    details: { error },
                    timestamp: new Date(),
                    recoverable: true,
                  },
                  planId,
                  retryCount: 0,
                });
              }}
              onPaymentCancel={() => {
                navigation.goBack();
              }}
            />
          )}

          {/* Terms and Security */}
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Условия и сигурност</Text>
            <View style={styles.termsItem}>
              <Text style={styles.termsIcon}>📋</Text>
              <Text style={styles.termsText}>
                С плащането приемате нашите Условия за ползване
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsIcon}>🔄</Text>
              <Text style={styles.termsText}>
                Можете да отмените абонамента по всяко време
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsIcon}>💰</Text>
              <Text style={styles.termsText}>
                Автоматично подновяване в края на периода
              </Text>
            </View>
            <View style={styles.termsItem}>
              <Text style={styles.termsIcon}>🛡️</Text>
              <Text style={styles.termsText}>
                Обработвано сигурно от Stripe
              </Text>
            </View>
          </View>

          {/* Error Display */}
          {authState.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authState.error.message}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 700,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  paymentIcon: {
    fontSize: 40,
  },
  planSummaryContainer: {
    marginBottom: 30,
  },
  planSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  planSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  emailStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailVerified: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  emailNotVerified: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: '#FF9800',
  },
  emailStatusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  emailStatusText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifyEmailButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyEmailText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cardSection: {
    marginBottom: 30,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFieldContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  cardFieldPlaceholder: {
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  cardFieldPlaceholderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  cardFieldSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  cardErrorText: {
    fontSize: 12,
    color: '#FFCDD2',
    marginTop: 4,
    marginLeft: 4,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  paymentButton: {
    marginBottom: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentButtonDisabled: {
    opacity: 0.7,
  },
  paymentButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  termsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  termsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  termsIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  errorText: {
    color: '#FFCDD2',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PaymentScreen; 