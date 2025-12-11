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
  Dimensions,
  SafeAreaView,
  Image,
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
import { useTheme } from '../../utils/ThemeContext';

// Components
import StripeCardForm from '../../components/payment/StripeCardForm';

const { width, height } = Dimensions.get('window');

type PaymentScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<AuthStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createSubscription, authState, clearError } = useAuth();
  const { theme, isDark } = useTheme();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Route params
  const { planId, amount, currency } = route.params;
  const selectedPlan = SUBSCRIPTION_PLANS[planId];

  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(60)).current;
  const planOpacity = useRef(new Animated.Value(0)).current;
  const planTranslateY = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(60)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(60)).current;

  // Floating Elements Animation
  const backgroundFloat1 = useRef(new Animated.Value(0)).current;
  const backgroundFloat2 = useRef(new Animated.Value(0)).current;

  // Enhanced Color Functions
  const getBackgroundGradient = () => {
    if (isDark) {
      return [
        '#1A1A1A', '#2D2A26', '#3D342F', '#4A3E36', '#38362E', '#2D2A26', '#1A1A1A'
      ];
    } else {
      return [
        '#FFFFFF', '#FEFEFE', '#FAF9F6', '#F5F4F1', '#DCD7CE', '#F8F7F4', '#FFFFFF'
      ];
    }
  };

  const getGlassmorphismStyle = () => {
    if (isDark) {
      return {
        backgroundColor: 'rgba(166, 138, 100, 0.08)',
        borderColor: 'rgba(248, 227, 180, 0.15)',
        shadowColor: 'rgba(166, 138, 100, 0.3)',
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(128, 122, 92, 0.12)',
        shadowColor: 'rgba(56, 54, 46, 0.15)',
      };
    }
  };

  const getTextColor = () => isDark ? '#F8E3B4' : '#2D2A26';
  const getSecondaryTextColor = () => isDark ? '#DCD6C1' : '#6B6356';

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
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    return endDate;
  };

  useEffect(() => {
    clearError();

    // Floating elements continuous animation
    const createFloatingAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
      const safeDelay = delay || 0;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(safeDelay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start floating animations
    createFloatingAnimation(backgroundFloat1, 6000, 0).start();
    createFloatingAnimation(backgroundFloat2, 8000, 3000).start();

    // Main entrance sequence
    const entranceSequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(200),
      
      // Title entrance
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(200),
      
      // Plan info entrance
      Animated.parallel([
        Animated.timing(planOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(planTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(200),
      
      // Form entrance
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(200),
      
      // Button entrance
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(buttonTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const preparePayment = async () => {
      try {
        setIsPreparingPayment(true);

        // Check network state
        const netState = await NetInfo.fetch();
        console.log('[PaymentScreen] Network State:', JSON.stringify(netState, null, 2));
        
        if (netState.isConnected === false) {
          throw new Error('Няма връзка с интернет. Моля, проверете връзката си и опитайте отново.');
        }

        // Check for authenticated user
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Грешка', 'Моля, влезте отново в профила си.');
          navigation.navigate('Login');
          return;
        }

        console.log('[PaymentScreen] Current user:', currentUser.uid);
        console.log('[PaymentScreen] User email:', currentUser.email);

        // Refresh token to ensure it's valid
        const token = await currentUser.getIdToken(true);
        console.log('[PaymentScreen] Firebase Auth token refreshed successfully');
        console.log('[PaymentScreen] Token length:', token?.length || 0);

        // Test Firebase Functions connectivity
        console.log('[PaymentScreen] Testing Firebase Functions connectivity...');
        console.log('[PaymentScreen] Functions instance:', functions());
        
        // Create Stripe subscription
        console.log('[PaymentScreen] Calling createStripeSubscription with:', {
          planId,
          userId: currentUser.uid
        });

        let result;
        try {
          result = await createStripeSubscriptionCallable({
            planId
          });
          
          console.log('[PaymentScreen] Function call succeeded! Raw result:', result);
          console.log('[PaymentScreen] Stripe subscription created successfully:', result.data);
        } catch (functionError: any) {
          console.error('[PaymentScreen] Function call failed!');
          console.error('[PaymentScreen] Function error code:', functionError.code);
          console.error('[PaymentScreen] Function error message:', functionError.message);
          console.error('[PaymentScreen] Function error details:', functionError.details);
          throw functionError;
        }

         const data = result.data as { clientSecret?: string; planId?: string; amount?: number; currency?: string; subscriptionId?: string; status?: string };
         if (data && data.clientSecret) {
           setClientSecret(data.clientSecret);
           setSubscriptionData(data); // Save subscription data for later use
           console.log('[PaymentScreen] Client secret set, payment ready. Subscription data saved:', data);
         } else {
           throw new Error('Не може да се създаде плащане. Моля, опитайте отново.');
         }

      } catch (error: any) {
        console.error('[PaymentScreen] Error preparing payment:', error);
        console.error('[PaymentScreen] Error code:', error.code);
        console.error('[PaymentScreen] Error message:', error.message);
        console.error('[PaymentScreen] Full error:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Възникна грешка при подготовката на плащането.';
        let shouldRetry = true;
        
        if (error.code === 'functions/unauthenticated') {
          errorMessage = 'Моля, влезте отново в профила си.';
          shouldRetry = false;
          navigation.navigate('Login');
        } else if (error.code === 'unavailable' || error.message?.includes('UNAVAILABLE')) {
          errorMessage = 'Не може да се свърже със сървъра. Моля, проверете интернет връзката си и опитайте отново.\n\nАко проблемът продължава, рестартирайте приложението.';
        } else if (error.code === 'functions/internal') {
          errorMessage = 'Вътрешна грешка на сървъра. Моля, опитайте отново след малко.';
        } else if (error.code === 'functions/not-found') {
          errorMessage = 'Функцията не е намерена. Моля, уверете се че приложението е актуално.';
          shouldRetry = false;
        } else if (error.message) {
          errorMessage = error.message;
        }

        const alertButtons = shouldRetry ? [
          {
            text: 'Опитай отново',
            onPress: () => preparePayment()
          },
          {
            text: 'Отказ',
            style: 'cancel',
            onPress: () => navigation.goBack()
          }
        ] : [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ];

        Alert.alert('Грешка при плащането', errorMessage, alertButtons);
      } finally {
        setIsPreparingPayment(false);
      }
    };

    const timer = setTimeout(() => {
      entranceSequence.start();
      preparePayment();
    }, 400);

    return () => clearTimeout(timer);
  }, [planId, amount, currency]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log('[PaymentScreen] Payment successful, paymentIntentId:', paymentIntentId);
      console.log('[PaymentScreen] Using saved subscription data:', subscriptionData);
      
      // Use the saved subscription data from createStripeSubscription
      const subscription = {
        id: subscriptionData?.subscriptionId || paymentIntentId,
        planId: subscriptionData?.planId || planId,
        amount: subscriptionData?.amount || amount,
        currency: subscriptionData?.currency || currency,
        status: subscriptionData?.status || 'active',
        ...subscriptionData
      };
      
      console.log('[PaymentScreen] Final subscription object to pass:', subscription);
      
      // Navigate to success screen
      navigation.navigate('PaymentSuccess', { subscription });
    } catch (error) {
      console.error('[PaymentScreen] Error handling payment success:', error);
      Alert.alert('Грешка', 'Възникна грешка. Моля, опитайте отново.');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('[PaymentScreen] Payment error:', error);
    let errorMessage = 'Плащането беше неуспешно. Моля, опитайте отново.';
    
    if (error?.message) {
      errorMessage = error.message;
    }

    navigation.navigate('PaymentFailed', { 
      error: {
        code: error?.code || 'payment_failed',
        message: errorMessage,
        details: error,
        timestamp: new Date(),
        recoverable: true
      },
      planId,
      retryCount: 0
    });
  };

  // Format price for display
  const formatPrice = (price: number, currency: string) => {
    if (price === undefined || price === null || isNaN(price)) {
      return `0.00 ${currency === 'BGN' ? 'лв' : currency}`;
    }
    return `${price.toFixed(2)} ${currency === 'BGN' ? 'лв' : currency}`;
  };

  // Get plan period text
  const getPlanPeriodText = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.MONTHLY:
        return 'месечно';
      case SubscriptionPlan.QUARTERLY:
        return 'тримесечно';
      case SubscriptionPlan.YEARLY:
        return 'годишно';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Enhanced Background */}
      <LinearGradient
        colors={getBackgroundGradient()}
        locations={[0, 0.15, 0.3, 0.45, 0.6, 0.8, 1]}
        style={styles.backgroundGradient}
      />

      {/* Floating Background Elements */}
      <Animated.View
        style={[
          styles.floatingElement,
          styles.floatingElement1,
          {
            transform: [
              {
                translateY: backgroundFloat1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(166, 138, 100, 0.1)', 'rgba(248, 227, 180, 0.05)'] : ['rgba(128, 122, 92, 0.08)', 'rgba(172, 166, 154, 0.05)']}
          style={styles.floatingGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingElement,
          styles.floatingElement2,
          {
            transform: [
              {
                translateY: backgroundFloat2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(220, 214, 193, 0.08)', 'rgba(166, 138, 100, 0.12)'] : ['rgba(245, 244, 241, 0.6)', 'rgba(220, 215, 206, 0.4)']}
          style={styles.floatingGradient}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={[styles.logoContainer, { borderColor: isDark ? '#A68A64' : '#807A5C' }]}>
              <Image
                source={require('../../assets/images/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={[styles.title, { color: getTextColor() }]}>
              Плащане
            </Text>
            <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
              Завършете абонамента си
            </Text>
          </Animated.View>

          {/* Plan Summary */}
          <Animated.View
            style={[
              styles.planSection,
              {
                opacity: planOpacity,
                transform: [{ translateY: planTranslateY }],
              },
            ]}
          >
            <View style={[styles.planCard, getGlassmorphismStyle()]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, { color: getTextColor() }]}>
                  {selectedPlan.name}
                </Text>
                <Text style={[styles.planDescription, { color: getSecondaryTextColor() }]}>
                  {selectedPlan.description}
                </Text>
              </View>
              
              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, { color: getTextColor() }]}>
                  {formatPrice(amount, currency)}
                </Text>
                <Text style={[styles.planPeriod, { color: getSecondaryTextColor() }]}>
                  {getPlanPeriodText(planId)}
                </Text>
              </View>

              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, { color: '#b2ac94' }]}>✓</Text>
                  <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                    Неограничени транзакции
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, { color: '#b2ac94' }]}>✓</Text>
                  <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                    Разширени отчети
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={[styles.featureIcon, { color: '#b2ac94' }]}>✓</Text>
                  <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                    Приоритетна поддръжка
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Payment Form */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            <View style={[styles.formWrapper, getGlassmorphismStyle()]}>
              <Text style={[styles.formTitle, { color: getTextColor() }]}>
                Данни за плащане
              </Text>
              
              {isPreparingPayment ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#b2ac94" />
                  <Text style={[styles.loadingText, { color: getSecondaryTextColor() }]}>
                    Подготвяме плащането...
                  </Text>
                </View>
              ) : clientSecret ? (
                                 <StripeCardForm
                   clientSecret={clientSecret}
                   onPaymentSuccess={handlePaymentSuccess}
                   onPaymentError={handlePaymentError}
                   onPaymentCancel={() => navigation.goBack()}
                 />
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: '#F44336' }]}>
                    Не може да се подготви плащането. Моля, опитайте отново.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Security Note */}
          <Animated.View
            style={[
              styles.securitySection,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            <View style={styles.securityNote}>
              <Text style={[styles.securityIcon, { color: getSecondaryTextColor() }]}>🔒</Text>
              <Text style={[styles.securityText, { color: getSecondaryTextColor() }]}>
                Вашите данни са защитени с SSL криптиране
              </Text>
            </View>
            <View style={styles.securityNote}>
              <Text style={[styles.securityIcon, { color: getSecondaryTextColor() }]}>💳</Text>
              <Text style={[styles.securityText, { color: getSecondaryTextColor() }]}>
                Powered by Stripe - банково ниво на сигурност
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  floatingElement1: {
    width: 200,
    height: 200,
    top: '10%',
    right: '-10%',
  },
  floatingElement2: {
    width: 150,
    height: 150,
    bottom: '20%',
    left: '-8%',
  },
  floatingGradient: {
    flex: 1,
    borderRadius: 100,
  },

  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 10,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },

  // Plan Section
  planSection: {
    marginBottom: 30,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '900',
    marginRight: 8,
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '600',
  },
  planFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },

  // Form Section
  formSection: {
    marginBottom: 30,
  },
  formWrapper: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Security Section
  securitySection: {
    gap: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PaymentScreen; 