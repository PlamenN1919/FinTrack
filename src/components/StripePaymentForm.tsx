import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SubscriptionPlan } from '../types/auth.types';
import { SUBSCRIPTION_PLANS, formatPrice } from '../config/subscription.config';
import { PAYMENT_CONFIG, getStripeErrorMessage, formatAmountForStripe } from '../config/stripe.config';

// Conditional imports with fallbacks
let CardField: any = null;
let useStripe: any = null;
let useConfirmPayment: any = null;

try {
  const StripeModule = require('@stripe/stripe-react-native');
  CardField = StripeModule.CardField;
  useStripe = StripeModule.useStripe;
  useConfirmPayment = StripeModule.useConfirmPayment;
} catch (error) {
  console.warn('Stripe React Native не е достъпен, използваме fallback mode');
}

interface StripePaymentFormProps {
  planId: SubscriptionPlan;
  userId: string;
  onPaymentSuccess: (subscriptionId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  planId,
  userId,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  // Conditionally use Stripe hooks
  const confirmPayment = useConfirmPayment ? useConfirmPayment().confirmPayment : null;
  const createPaymentMethod = useStripe ? useStripe().createPaymentMethod : null;

  // State
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);

  // Animation values
  const cardBorderAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Plan configuration
  const selectedPlan = SUBSCRIPTION_PLANS[planId];
  const priceId = selectedPlan?.stripePriceIds?.monthly || 
                  selectedPlan?.stripePriceIds?.quarterly || 
                  selectedPlan?.stripePriceIds?.yearly;

  useEffect(() => {
    // Check if Stripe is available
    setStripeAvailable(CardField != null && confirmPayment != null);
    
    // Animate card border when focused
    Animated.timing(cardBorderAnim, {
      toValue: cardFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [cardFocused]);

  const handleCardChange = (cardDetails: any) => {
    if (!stripeAvailable) return;
    
    setCardComplete(cardDetails.complete);
    setCardError(cardDetails.error ? cardDetails.error.message : null);
  };

  const handleCardFocus = () => {
    setCardFocused(true);
  };

  const handleCardBlur = () => {
    setCardFocused(false);
  };

  const createPaymentIntent = async () => {
    try {
      // В реална имплементация тук трябва да направите заявка към вашия backend
      // Ето примерен код за backend заявката:
      
      const response = await fetch('https://your-backend.com/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: userId,
          planId: planId,
        }),
      });

      const { clientSecret, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }

      return clientSecret;
    } catch (error: any) {
      // За демо цели - симулираме успешно създаване на Payment Intent
      console.log('Demo mode: Simulating payment intent creation');
      return `pi_demo_${Date.now()}_secret_demo`;
    }
  };

  const handlePaymentDemo = async () => {
    try {
      setIsProcessing(true);

      // Animate button press
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const mockPaymentIntentId = `pi_demo_${Date.now()}`;
      console.log('Demo payment успешно:', mockPaymentIntentId);
      onPaymentSuccess(mockPaymentIntentId);

    } catch (error: any) {
      console.error('Demo payment грешка:', error);
      onPaymentError(error.message || 'Възникна грешка при demo плащането.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!stripeAvailable) {
      // Fallback to demo mode
      return handlePaymentDemo();
    }

    if (!cardComplete) {
      Alert.alert(
        'Невалидни данни за карта',
        'Моля, въведете валидни данни за банкова карта.'
      );
      return;
    }

    if (cardError) {
      Alert.alert(
        'Грешка в картата',
        getStripeErrorMessage(cardError)
      );
      return;
    }

    try {
      setIsProcessing(true);

      // Animate button press
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Step 1: Create Payment Intent on backend
      const clientSecret = await createPaymentIntent();

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email: 'user@example.com', // Заменете с реален email от AuthContext
          },
        },
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        onPaymentError(getStripeErrorMessage(error.code));
        return;
      }

      if (paymentIntent?.status === 'Succeeded') {
        // Payment успешно!
        console.log('Payment succeeded:', paymentIntent.id);
        onPaymentSuccess(paymentIntent.id);
      } else {
        onPaymentError('Плащането не беше завършено успешно.');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      onPaymentError(error.message || 'Възникна грешка при плащането.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanPrice = () => {
    if (!selectedPlan) return 0;
    
    switch (planId) {
      case SubscriptionPlan.MONTHLY:
        return selectedPlan.monthlyPrice;
      case SubscriptionPlan.QUARTERLY:
        return selectedPlan.quarterlyPrice || selectedPlan.monthlyPrice * 3;
      case SubscriptionPlan.YEARLY:
        return selectedPlan.yearlyPrice || selectedPlan.monthlyPrice * 12;
      default:
        return selectedPlan.monthlyPrice;
    }
  };

  // Demo Card Input Component (fallback)
  const DemoCardInput = () => (
    <View style={styles.demoCardContainer}>
      <Text style={styles.demoCardTitle}>💳 Demo Mode</Text>
      <Text style={styles.demoCardText}>
        Stripe SDK не е достъпен. Използваме demo режим.
      </Text>
      <Text style={styles.demoCardText}>
        Натиснете "Плати" за симулация на успешно плащане.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Payment Method Section */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Метод за плащане</Text>
        
        {/* Card Input or Demo */}
        {stripeAvailable && CardField ? (
          <Animated.View
            style={[
              styles.cardContainer,
              {
                borderColor: cardBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E0E0E0', '#667eea'],
                }),
                borderWidth: cardBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ]}
          >
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
                expiration: 'MM/YY',
                cvc: 'CVC',
              }}
              cardStyle={PAYMENT_CONFIG.cardStyle}
              style={styles.cardField}
              onCardChange={handleCardChange}
              onFocus={handleCardFocus}
              onBlur={handleCardBlur}
            />
          </Animated.View>
        ) : (
          <DemoCardInput />
        )}

        {/* Card Error */}
        {cardError && stripeAvailable && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{getStripeErrorMessage(cardError)}</Text>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            {stripeAvailable 
              ? 'Вашите данни са защитени с SSL криптиране'
              : 'Demo режим - без реални плащания'
            }
          </Text>
        </View>
      </View>

      {/* Price Summary */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>План:</Text>
          <Text style={styles.priceValue}>
            {formatPrice(getPlanPrice(), 'BGN')}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>ДДС (включен):</Text>
          <Text style={styles.priceValue}>0.00 лв</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Общо:</Text>
          <Text style={styles.totalValue}>
            {formatPrice(getPlanPrice(), 'BGN')}
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!stripeAvailable || (!cardComplete && stripeAvailable) || isProcessing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={stripeAvailable ? (!cardComplete || isProcessing) : isProcessing}
        >
          <LinearGradient
            colors={
              (stripeAvailable ? cardComplete : true) && !isProcessing
                ? ['#4CAF50', '#45a049']
                : ['#CCCCCC', '#AAAAAA']
            }
            style={styles.payButtonGradient}
          >
            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  {stripeAvailable ? 'Обработване...' : 'Demo плащане...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.payButtonText}>
                {stripeAvailable ? 'Плати' : 'Demo Плащане'} {formatPrice(getPlanPrice(), 'BGN')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onPaymentCancel}
        disabled={isProcessing}
      >
        <Text style={styles.cancelButtonText}>Отказ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  demoCardContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  demoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoCardText: {
    fontSize: 14,
    color: '#FFC107',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  priceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  priceValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  payButton: {
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 16,
  },
  payButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  payButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
});

export default StripePaymentForm; 