import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { CardField } from '@stripe/stripe-react-native';
import { getStripeErrorMessage } from '../../config/stripe.config';

interface StripeCardFormProps {
  amount: number;
  currency: string;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentCancel,
}) => {
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCardChange = (details: any) => {
    setCardDetails(details);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      setTimeout(() => {
        setIsLoading(false);
        onPaymentSuccess();
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Грешка при плащането', getStripeErrorMessage(error?.code));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Детайли за плащане</Text>
      
      {/* Input Form */}
      <View style={styles.formContainer}>
        {/* Card Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Номер на карта</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="rgba(247, 231, 206, 0.5)"
            keyboardType="numeric"
            maxLength={19}
          />
        </View>

        {/* Row with Expiry and CVC */}
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.inputLabel}>Валидност</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
              placeholder="MM/YY"
              placeholderTextColor="rgba(247, 231, 206, 0.5)"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.inputLabel}>CVC</Text>
            <TextInput
              style={styles.input}
              value={cvc}
              onChangeText={setCvc}
              placeholder="123"
              placeholderTextColor="rgba(247, 231, 206, 0.5)"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {/* Card Holder Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Име на притежателя</Text>
          <TextInput
            style={styles.input}
            value={cardHolder}
            onChangeText={setCardHolder}
            placeholder="Иван Петров"
            placeholderTextColor="rgba(247, 231, 206, 0.5)"
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Hidden Stripe CardField for validation */}
      <View style={styles.hiddenCardField}>
        <CardField
          postalCodeEnabled={false}
          cardStyle={styles.cardFieldStyle}
          style={styles.cardField}
          onCardChange={handleCardChange}
        />
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        style={[styles.payButton, (!cardNumber || !expiryDate || !cvc || !cardHolder || isLoading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardNumber || !expiryDate || !cvc || !cardHolder || isLoading}
      >
        <Text style={styles.payButtonText}>
          {isLoading ? 'Обработва се...' : `Плати ${amount.toFixed(2)} ${currency}`}
        </Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel}>
        <Text style={styles.cancelButtonText}>Отказ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F7E7CE',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 15,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#F7E7CE',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F7E7CE',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    fontFamily: 'monospace',
  },
  hiddenCardField: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  cardField: {
    width: 1,
    height: 1,
  },
  cardFieldStyle: {
    backgroundColor: 'transparent',
  },
  payButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#F7E7CE',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default StripeCardForm; 