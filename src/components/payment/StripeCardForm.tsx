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
    try {
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        console.error('Stripe payment confirmation error:', error);
        const errorMessage = getStripeErrorMessage(error.code);
        onPaymentError(errorMessage);
      } else if (paymentIntent) {
        console.log('Payment successful!', paymentIntent);
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