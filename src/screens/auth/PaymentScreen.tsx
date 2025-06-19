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
        colors={['#1A1A1A', '#2A2A2A', '#1A1A1A']}
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
          <StripeCardForm
            amount={amount}
            currency={currency}
            onPaymentSuccess={() => {
              navigation.navigate('PaymentSuccess', {
                subscription: {
                  id: `pi_${Date.now()}`,
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
                },
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
    backgroundColor: '#1A1A1A',
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
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7E7CE',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7E7CE',
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
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
    color: '#F7E7CE',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planSummaryCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: 'rgba(247, 231, 206, 0.8)',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentFormContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  paymentFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mockCardInput: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  mockCardText: {
    fontSize: 16,
    color: '#F7E7CE',
    fontWeight: '600',
    marginBottom: 4,
  },
  mockCardInfo: {
    fontSize: 12,
    color: 'rgba(247, 231, 206, 0.7)',
    fontStyle: 'italic',
  },
  payButton: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Platform.OS === 'android' ? '#000' : '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F7E7CE',
    minHeight: 64,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(247, 231, 206, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.8)',
    fontWeight: '500',
  },
  securitySection: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
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
    color: 'rgba(247, 231, 206, 0.9)',
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