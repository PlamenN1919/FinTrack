import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { getStripeErrorMessage } from '../../config/stripe.config';

interface StripeCardFormProps {
  clientSecret: string;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onPaymentCancel: () => void;
  onPaymentError: (error: string) => void;
}

const StripeCardForm: React.FC<StripeCardFormProps> = ({ 
  clientSecret, 
  onPaymentSuccess,
  onPaymentCancel,
  onPaymentError
}) => {
  const { confirmPayment } = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<any | null>(null);
  const [name, setName] = useState('');

  const handlePayPress = async () => {
    if (!cardDetails?.complete || !name.trim()) {
      Alert.alert('Грешка', 'Моля, попълнете всички полета за картата и вашето име.');
      return;
    }

    setIsLoading(true);
    console.log('[StripeCardForm] Starting payment confirmation with clientSecret:', clientSecret.substring(0, 20) + '...');
    try {
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: name.trim(),
          },
        },
      });
      
      console.log('[StripeCardForm] Payment confirmation response:', { 
        paymentIntent: paymentIntent ? { id: paymentIntent.id, status: paymentIntent.status } : null, 
        error: error ? { code: error.code, message: error.message, declineCode: error.declineCode } : null 
      });

      if (error) {
        console.error('Stripe payment confirmation error:', error);
        // Handle different error types
        let errorMessage = '';
        if (error.declineCode) {
          // Check decline code first (most specific)
          errorMessage = getStripeErrorMessage(error.declineCode);
        } else if (error.code) {
          errorMessage = getStripeErrorMessage(error.code);
        } else if (error.message) {
          errorMessage = getStripeErrorMessage('Failed');
        } else {
          errorMessage = getStripeErrorMessage('unknown_error');
        }
        onPaymentError(errorMessage);
      } else if (paymentIntent) {
        console.log('Payment successful!', paymentIntent);
        // Payment successful - pass the payment intent ID
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (e: any) {
      console.error('An unexpected error occurred during payment:', e);
      onPaymentError('Възникна неочаквана грешка при плащането.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Име на картодържателя</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Иван Иванов"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />
      
      <Text style={styles.label}>Данни на картата</Text>
      <View style={styles.testCardContainer}>
        <Text style={styles.testCardTitle}>⚠️ ВАЖНО: Използвайте САМО тестови карти!</Text>
        <Text style={styles.testCardInfo}>
          Номер: 4242 4242 4242 4242{'\n'}
          CVC: 123, Дата: 12/{new Date().getFullYear() + 2}
        </Text>
        <Text style={styles.testCardWarning}>
          Реални карти ще бъдат отхвърлени!
        </Text>
      </View>
      <CardField
        postalCodeEnabled={false}
        style={styles.cardField}
        onCardChange={(details) => setCardDetails(details)}
      />

      <TouchableOpacity 
        style={[styles.payButton, (isLoading || !cardDetails?.complete) && styles.payButtonDisabled]} 
        onPress={handlePayPress}
        disabled={isLoading || !cardDetails?.complete}
      >
        {isLoading ? (
          <ActivityIndicator color="#1A1A1A" />
        ) : (
          <Text style={styles.payButtonText}>Плати</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel} disabled={isLoading}>
        <Text style={styles.cancelButtonText}>Отказ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7E7CE',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  testCardContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    textAlign: 'center',
  },
  testCardInfo: {
    fontSize: 12,
    color: '#F7E7CE',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  testCardWarning: {
    fontSize: 11,
    color: '#FF6B6B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardField: {
    height: 50,
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F7E7CE',
    fontSize: 14,
  },
});

export default StripeCardForm; 