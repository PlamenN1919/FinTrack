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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Types
import { AuthStackParamList } from '../../types/auth.types';
import { SubscriptionPlan, SubscriptionStatus } from '../../types/auth.types';

// Context and config
import { useAuth } from '../../contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '../../config/subscription.config';

// Utils
// formatPrice utility can be added later when needed

// Temporary mock component until Stripe is integrated
const StripePaymentForm: React.FC<{
  planId: SubscriptionPlan;
  userId: string;
  onPaymentSuccess: (subscriptionId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}> = ({ planId, userId, onPaymentSuccess, onPaymentError, onPaymentCancel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMockPayment = async () => {
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate for testing
      
      if (isSuccess) {
        const mockSubscriptionId = `sub_${Date.now()}`;
        onPaymentSuccess(mockSubscriptionId);
      } else {
        onPaymentError('Плащането беше отхвърлено от банката. Моля, опитайте с друга карта.');
      }
      
      setIsLoading(false);
    }, 2000);
  };

  return (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.paymentFormTitle}>Детайли за плащане</Text>
      
      {/* Mock Card Input */}
      <View style={styles.mockCardInput}>
        <Text style={styles.mockCardText}>💳 **** **** **** 1234</Text>
        <Text style={styles.mockCardInfo}>Тестова карта (Mock)</Text>
      </View>
      
      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, isLoading && styles.payButtonDisabled]}
        onPress={handleMockPayment}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#999', '#666'] : ['#4CAF50', '#45a049']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.payButtonGradient}
        >
          <Text style={styles.payButtonText}>
            {isLoading ? 'Обработва се...' : 'Плати сега'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel}>
        <Text style={styles.cancelButtonText}>Отказ</Text>
      </TouchableOpacity>
    </View>
  );
};

type PaymentScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<AuthStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createSubscription, authState, clearError } = useAuth();

  // Route params
  const { planId, amount, currency } = route.params;
  const selectedPlan = SUBSCRIPTION_PLANS[planId];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

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
          {/* Plan Summary */}
          <View style={styles.planSummaryContainer}>
            <Text style={styles.planSummaryTitle}>Избран план</Text>
            <View style={styles.planSummaryCard}>
              <Text style={styles.planName}>{getPlanDisplayName()}</Text>
              <Text style={styles.planPrice}>
                {amount.toFixed(2)} {currency}
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
              <Text style={styles.securityIcon}>💰</Text>
              <Text style={styles.securityText}>
                Автоматично подновяване в края на периода
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityIcon}>🔄</Text>
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
    paddingVertical: 20,
  },
  planSummaryContainer: {
    marginBottom: 30,
  },
  planSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentFormContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  paymentFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mockCardInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mockCardText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  mockCardInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  payButton: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  payButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  securitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
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
    color: 'rgba(255, 255, 255, 0.9)',
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