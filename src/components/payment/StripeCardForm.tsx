import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { getStripeErrorMessage } from '../../config/stripe.config';
import { useTheme } from '../../utils/ThemeContext';

interface StripeCardFormProps {
  clientSecret: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
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
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [nameIsFocused, setNameIsFocused] = useState(false);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Premium Color Functions
  const getPremiumGlassmorphism = () => {
    if (isDark) {
      return {
        backgroundColor: 'rgba(166, 138, 100, 0.12)',
        borderColor: 'rgba(248, 227, 180, 0.25)',
        shadowColor: 'rgba(204, 179, 137, 0.4)',
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(128, 122, 92, 0.2)',
        shadowColor: 'rgba(56, 54, 46, 0.25)',
      };
    }
  };

  const getPrimaryTextColor = () => isDark ? '#F8E3B4' : '#1A1A1A';
  const getSecondaryTextColor = () => isDark ? '#DCD6C1' : '#6B6356';
  const getAccentColor = () => isDark ? '#CCB389' : '#B2AC94';
  
  const getPremiumInputStyle = () => {
    if (isDark) {
      return {
        backgroundColor: 'rgba(166, 138, 100, 0.15)',
        borderColor: 'rgba(248, 227, 180, 0.3)',
        shadowColor: 'rgba(204, 179, 137, 0.2)',
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderColor: 'rgba(128, 122, 92, 0.25)',
        shadowColor: 'rgba(56, 54, 46, 0.1)',
      };
    }
  };

  const getCardBrandIcon = () => {
    if (cardDetails?.brand) {
      switch (cardDetails.brand.toLowerCase()) {
        case 'visa': return '💳';
        case 'mastercard': return '💳';
        case 'amex': return '💳';
        default: return '💳';
      }
    }
    return '💳';
  };

  const isFormValid = () => {
    return cardDetails?.complete && name.trim().length >= 2;
  };

  const handlePayPress = async () => {
    if (!isFormValid()) {
      Alert.alert(
        'Грешка', 
        'Моля, попълнете всички полета правилно.',
        [{ text: 'Разбрах', style: 'default' }]
      );
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
        let errorMessage = '';
        if (error.declineCode) {
          errorMessage = getStripeErrorMessage(error.declineCode);
        } else if (error.code) {
          errorMessage = getStripeErrorMessage(error.code);
        } else {
          errorMessage = getStripeErrorMessage('Failed');
        }
        onPaymentError(errorMessage);
      } else if (paymentIntent) {
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (e: any) {
      onPaymentError('Възникна неочаквана грешка при плащането.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        getPremiumGlassmorphism(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >


      {/* Premium Form */}
      <View style={styles.premiumForm}>
        {/* Cardholder Name - Premium Style */}
        <View style={styles.inputSection}>
          <Text style={[styles.premiumLabel, { color: getSecondaryTextColor() }]}>
            ИМЕ НА КАРТОДЪРЖАТЕЛЯ
          </Text>
          <View style={[
            styles.premiumInputWrapper, 
            getPremiumInputStyle(),
            nameIsFocused && { borderColor: getAccentColor(), borderWidth: 2 }
          ]}>
            <View style={styles.inputIcon}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <TextInput
              style={[styles.premiumInput, { color: getPrimaryTextColor() }]}
              placeholder="Въведете вашето пълно име"
              placeholderTextColor={getSecondaryTextColor() + '60'}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameIsFocused(true)}
              onBlur={() => setNameIsFocused(false)}
              editable={!isLoading}
              autoCapitalize="words"
            />
            {name.length >= 2 && (
              <View style={styles.validationIcon}>
                <Text style={styles.validIcon}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Details Section - Professional */}
        <View style={styles.inputSection}>
          <Text style={[styles.premiumLabel, { color: getSecondaryTextColor() }]}>
            ДАННИ НА КАРТАТА
          </Text>
          <View style={[
            styles.modernCardWrapper, 
            getPremiumInputStyle(),
            cardDetails?.complete && { borderColor: '#00C851', borderWidth: 2 }
          ]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardBrandSection}>
                <View style={styles.cardBrandIcon}>
                  <Text style={styles.cardBrandText}>{getCardBrandIcon()}</Text>
                </View>
                <Text style={[styles.cardBrandLabel, { color: getSecondaryTextColor() }]}>
                  {cardDetails?.brand ? cardDetails.brand.toUpperCase() : 'ПЛАТЕЖНА КАРТА'}
                </Text>
              </View>
              {cardDetails?.complete && (
                <View style={styles.completeIcon}>
                  <Text style={styles.validIcon}>✓</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardFieldContainer}>
              <CardField
                postalCodeEnabled={false}
                style={styles.modernCardField}
                cardStyle={{
                  fontSize: 16,
                  borderWidth: 0,
                }}
                onCardChange={(details) => setCardDetails(details)}
              />
            </View>
            
            <View style={styles.cardHints}>
              <Text style={[styles.hintText, { color: getSecondaryTextColor() }]}>
                💳 Номер • 📅 MM/YY • 🔒 CVC
              </Text>
            </View>
          </View>
        </View>

        {/* Test Card Notice - Elegant */}
        <View style={styles.testNotice}>
          <View style={styles.testIcon}>
            <Text style={styles.testIconText}>⚡</Text>
          </View>
          <Text style={[styles.testText, { color: getAccentColor() }]}>
            Тест режим: 4242 4242 4242 4242
          </Text>
        </View>
      </View>

      {/* Premium Action Buttons */}
      <View style={styles.premiumActions}>
        <TouchableOpacity 
          style={[
            styles.premiumPayButton,
            {
              backgroundColor: isFormValid() ? '#00C851' : getSecondaryTextColor() + '40',
              opacity: isLoading ? 0.8 : 1,
            }
          ]} 
          onPress={handlePayPress}
          disabled={isLoading || !isFormValid()}
          activeOpacity={0.9}
        >
          <View style={styles.payButtonContent}>
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.payButtonText}>Обработва се...</Text>
              </>
            ) : (
              <>
                <View style={styles.payIcon}>
                  <Text style={styles.payIconText}>🔒</Text>
                </View>
                <Text style={styles.payButtonText}>
                  Потвърди плащането
                </Text>
                <View style={styles.payArrow}>
                  <Text style={styles.payArrowText}>→</Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.cancelButton, getPremiumGlassmorphism()]} 
          onPress={onPaymentCancel} 
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelButtonText, { color: getSecondaryTextColor() }]}>
            Отказ
          </Text>
        </TouchableOpacity>
      </View>


    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },



  // Premium Form
  premiumForm: {
    marginBottom: 28,
  },
  inputSection: {
    marginBottom: 24,
  },
  premiumLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Premium Input Styles
  premiumInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  premiumInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  validationIcon: {
    width: 24,
    alignItems: 'center',
  },
  validIcon: {
    fontSize: 16,
    color: '#00C851',
  },

  // Modern Card Input Section
  modernCardWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBrandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardBrandIcon: {
    width: 32,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardBrandText: {
    fontSize: 18,
  },
  cardBrandLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  completeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00C851',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFieldContainer: {
    minHeight: 44,
    marginBottom: 12,
  },
  modernCardField: {
    height: 44,
  },
  cardHints: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    opacity: 0.7,
  },

  // Test Notice
  testNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  testIcon: {
    marginRight: 8,
  },
  testIconText: {
    fontSize: 14,
  },
  testText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Premium Actions
  premiumActions: {
    gap: 16,
    marginBottom: 24,
  },
  premiumPayButton: {
    height: 56,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 200, 81, 0.4)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  payButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  payIcon: {
    marginRight: 8,
  },
  payIconText: {
    fontSize: 16,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  payArrow: {
    marginLeft: 8,
  },
  payArrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },


});

export default StripeCardForm; 