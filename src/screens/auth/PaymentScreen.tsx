import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';

// Types
import { AuthStackParamList, SubscriptionPlan, SubscriptionStatus } from '../../types/auth.types';

// Context and config
import { useAuth } from '../../contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '../../config/subscription.config';
import { stripeService } from '../../services/StripeService';
import { auth, createStripeSubscriptionCallable, functions } from '../../config/firebase.config';

// Components
import StripeCardForm from '../../components/payment/StripeCardForm';

// Utils
// formatPrice utility can be added later when needed

type PaymentScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<AuthStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createSubscription, authState, clearError } = useAuth();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(true);

  // Route params
  const { planId, amount, currency } = route.params;
  const selectedPlan = SUBSCRIPTION_PLANS[planId];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  // Helper function to calculate subscription period end date
  const calculatePeriodEndDate = (planId: SubscriptionPlan, startDate: Date = new Date()): Date => {
    const endDate = new Date(startDate);
    
    switch (planId) {
      case SubscriptionPlan.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionPlan.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case SubscriptionPlan.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        // Fallback to monthly if unknown plan
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    return endDate;
  };

  useEffect(() => {
    clearError();

    const preparePayment = async () => {
      // The outer try-catch handles all errors in the process
      try {
        setIsPreparingPayment(true);

        // 1. Check network state first (more lenient check)
        const netState = await NetInfo.fetch();
        console.log('[PaymentScreen] Network State:', JSON.stringify(netState, null, 2));
        
        // Be more lenient - only fail if we're definitely offline
        if (netState.isConnected === false) {
          throw new Error('Няма връзка с интернет. Моля, проверете връзката си и опитайте отново.');
        }
        
        // Log network details for debugging
        console.log('[PaymentScreen] Network check passed - isConnected:', netState.isConnected, 'isInternetReachable:', netState.isInternetReachable);
        
        // Even if NetInfo is uncertain, let's try the Firebase call - it will fail properly if there's no connection

        // 2. Check for authenticated user
        const currentUser = auth().currentUser;
        if (!currentUser) {
          // This case should ideally not happen if navigation is correct, but as a safeguard:
          Alert.alert('Грешка', 'Моля, влезте отново в профила си.');
          navigation.navigate('Login');
          return;
        }

        // 3. Get a fresh auth token
        console.log('[PaymentScreen] Getting fresh Firebase Auth token...');
        await currentUser.getIdToken(true);
        console.log('[PaymentScreen] Firebase Auth token obtained');

        // 4. Call the Firebase Function
        console.log(`[PaymentScreen] Calling createStripeSubscriptionCallable for plan: ${planId}`);
        const response = await createStripeSubscriptionCallable({ planId });
        console.log('[PaymentScreen] Successfully received response from function.');

        const data = response.data as { clientSecret: string };
        if (!data || !data.clientSecret) {
          throw new Error('Невалиден отговор от сървъра при подготовка на плащането.');
        }

        console.log('[PaymentScreen] Client secret received.');
        setClientSecret(data.clientSecret);

      } catch (error: any) {
        console.error('[PaymentScreen] Error preparing payment:', error);
        console.error('[PaymentScreen] Error details:', JSON.stringify({
          message: error.message,
          code: error.code,
          stack: error.stack
        }, null, 2));

        // Centralized error handling with better diagnostics
        if (error.code === 'functions/unauthenticated') {
           Alert.alert('Сесията е изтекла', 'Моля, влезте отново в профила си.');
           navigation.navigate('Login');
        } else if (error.code === 'functions/unavailable') {
          Alert.alert('Недостъпни сървъри', 'Firebase сървърите са недостъпни. Моля, проверете интернет връзката си и опитайте отново.');
          navigation.goBack();
        } else if (error.message && error.message.includes('Няма връзка с интернет')) {
          // This is our custom NetInfo error
          Alert.alert('Няма връзка с интернет', 'Моля, проверете връзката си и опитайте отново.');
          navigation.goBack();
        } else if (error.message && (error.message.includes('Could not connect') || error.message.includes('Network request failed'))) {
          Alert.alert('Мрежова грешка', 'Неуспешна връзка със сървърите. Моля, проверете интернет връзката си и опитайте отново.');
          navigation.goBack();
        } else {
          // For any other error, show detailed message for debugging
          const errorMessage = error.message || 'Възникна неочаквана грешка при подготовка на плащането.';
          Alert.alert('Грешка', `${errorMessage}\n\nError code: ${error.code || 'unknown'}`);
          navigation.goBack();
        }
      } finally {
        setIsPreparingPayment(false);
      }
    };

    preparePayment();

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
  }, []);

  const handleBack = () => {
    navigation.goBack();
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

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    console.log('[PaymentScreen] Subscription payment successful! PaymentMethod ID:', paymentMethodId);
    
    // Payment is successful, subscription webhook will handle the rest
    // Navigate directly to success screen with ACTIVE status
    navigation.navigate('PaymentSuccess', { 
      subscription: {
        id: paymentMethodId, // Use payment method ID as temporary ID
        userId: authState.user?.uid || '',
        plan: planId,
        status: SubscriptionStatus.ACTIVE, // Payment successful = active subscription
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEndDate(planId),
        cancelAtPeriodEnd: false,
        stripeCustomerId: '',
        stripeSubscriptionId: '',
        priceId: '',
        amount,
        currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  };

  const handlePaymentError = (errorMessage: string) => {
    navigation.navigate('PaymentFailed', {
      error: {
        code: 'payment/failed',
        message: errorMessage,
        timestamp: new Date(),
        recoverable: true,
      },
      planId,
      retryCount: 0,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8F4F0', '#DDD0C8', '#B0A89F']}
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
          {/* Plan Summary */}
          <View style={styles.planSummaryContainer}>
            <Text style={styles.planSummaryTitle}>Избран план</Text>
            <View style={styles.planSummaryCard}>
              <Text style={styles.planName}>{getPlanDisplayName()}</Text>
              <Text style={styles.planPrice}>
                {`${amount.toFixed(2)} ${currency}`}
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

          {/* Payment Form */}
          {isPreparingPayment ? (
                          <ActivityIndicator size="large" color="#B0A89F" style={{ marginVertical: 40 }}/>
          ) : clientSecret ? (
            <StripeCardForm
              clientSecret={clientSecret}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onPaymentCancel={() => navigation.goBack()}
            />
          ) : (
            <Text style={styles.errorText}>Не успяхме да подготвим плащането. Моля, опитайте отново.</Text>
          )}

          {/* Security Info */}
          <View style={styles.securitySection}>
            <Text style={styles.securityTitle}>🔒 Сигурно плащане</Text>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>
                Обработвано сигурно от Stripe
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>🔄</Text>
              <Text style={styles.securityText}>
                Автоматично подновяване - няма прекъсване на услугата
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>❌</Text>
              <Text style={styles.securityText}>
                Можете да отмените абонамента по всяко време
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
    backgroundColor: '#F8F4F0',
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
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(176, 168, 159, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2928',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2928',
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
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
    paddingVertical: 20,
  },
  planSummaryContainer: {
    marginBottom: 30,
  },
  planSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planSummaryCard: {
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(176, 168, 159, 0.5)',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B0A89F',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(176, 168, 159, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#6B5B57',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B5B57',
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentFormContainer: {
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(176, 168, 159, 0.5)',
  },
  paymentFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mockCardInput: {
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(176, 168, 159, 0.5)',
  },
  mockCardText: {
    fontSize: 16,
    color: '#2D2928',
    fontWeight: '600',
    marginBottom: 4,
  },
  mockCardInfo: {
    fontSize: 12,
    color: '#6B5B57',
    fontStyle: 'italic',
  },
  payButton: {
    marginBottom: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 127, 120, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(139, 127, 120, 0.9)',
    paddingVertical: 22,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B7F78',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 64,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAF7F3',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(219, 208, 198, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.4)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B5B57',
    fontWeight: '500',
  },
  securitySection: {
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(176, 168, 159, 0.5)',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(176, 168, 159, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  securityText: {
    fontSize: 14,
    color: '#6B5B57',
    flex: 1,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PaymentScreen; 