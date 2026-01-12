import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan, SubscriptionStatus, UserState } from '../../types/auth.types';
import { formatPrice, getPlanPrice } from '../../config/subscription.config';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import ReferralService from '../../services/ReferralService';

const { width, height } = Dimensions.get('window');

type PaymentSuccessScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PaymentSuccess'>;
type PaymentSuccessScreenRouteProp = RouteProp<AuthStackParamList, 'PaymentSuccess'>;

const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation<PaymentSuccessScreenNavigationProp>();
  const route = useRoute<PaymentSuccessScreenRouteProp>();
  const { authState, refreshAuthState, setSubscription } = useAuth();
  const { isDark } = useTheme();

  const { subscription } = route.params;

  // Debug subscription data
  console.log('[PaymentSuccessScreen] Subscription data:', {
    amount: subscription?.amount,
    currency: subscription?.currency,
    plan: subscription?.plan,
    planId: (subscription as any)?.planId,
    status: subscription?.status,
    fullObject: subscription
  });

  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(60)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(60)).current;

  // Celebration animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confetti1 = useRef(new Animated.Value(-100)).current;
  const confetti2 = useRef(new Animated.Value(-100)).current;
  const confetti3 = useRef(new Animated.Value(-100)).current;
  const confetti4 = useRef(new Animated.Value(-100)).current;
  const confetti5 = useRef(new Animated.Value(-100)).current;

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

  useEffect(() => {
    // Floating elements continuous animation
    const createFloatingAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
      const safeDelay = delay || 0;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(safeDelay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration || 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration || 1000,
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
      
      // Success icon entrance
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(200),
      
      // Content entrance
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
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

    // Start confetti animation
    const startConfettiAnimation = () => {
      const confettiPieces = [confetti1, confetti2, confetti3, confetti4, confetti5];
      
      confettiPieces.forEach((confetti, index) => {
        Animated.timing(confetti, {
          toValue: height + 100,
          duration: 2000 + index * 200,
          useNativeDriver: true,
        }).start();
      });
    };

    // Start pulse animation for success icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const timer = setTimeout(() => {
      entranceSequence.start();
      startConfettiAnimation();
      pulseAnimation.start();
    }, 400);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, [backgroundFloat1, backgroundFloat2, buttonOpacity, buttonTranslateY, confetti1, confetti2, confetti3, confetti4, confetti5, contentOpacity, contentTranslateY, logoOpacity, logoScale, pulseAnim, successOpacity, successScale]);

  // Auto-navigate when user becomes ACTIVE_SUBSCRIBER
  useEffect(() => {
    if (authState.userState === UserState.ACTIVE_SUBSCRIBER) {
      console.log('[PaymentSuccessScreen] User is now ACTIVE_SUBSCRIBER - auto-navigating to Main App');
      
      // Small delay to let user see the success screen
      const navigationTimer = setTimeout(() => {
        console.log('[PaymentSuccessScreen] Navigating to Main App...');
        // Navigation will happen automatically via AppNavigator
        // AppNavigator checks userState and shows Main when ACTIVE_SUBSCRIBER
      }, 2000);
      
      return () => clearTimeout(navigationTimer);
    }
    
    // Return empty cleanup function for other code paths
    return () => {};
  }, [authState.userState]);

    const handleContinue = async () => {
    try {
      console.log('[PaymentSuccessScreen] Starting navigation to main app...');
      console.log('[PaymentSuccessScreen] Current auth state:', authState.userState);
      console.log('[PaymentSuccessScreen] Subscription data:', subscription);
      
      // Validate required subscription fields
      if (!subscription.id) {
        throw new Error('Subscription ID is missing');
      }
      if (!subscription.plan) {
        throw new Error('Subscription plan is missing');
      }
      if (!authState.user?.uid) {
        throw new Error('User ID is missing');
      }
      
      // Create active subscription object with validated data
      const activeSubscription = {
        id: subscription.id,
        userId: subscription.userId || authState.user.uid,
        plan: subscription.plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: subscription.currentPeriodStart || new Date(),
        currentPeriodEnd: subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        stripeCustomerId: subscription.stripeCustomerId || '',
        stripeSubscriptionId: subscription.stripeSubscriptionId || '',
        priceId: subscription.priceId || '',
        amount: subscription.amount || getPlanPrice(subscription.plan, getPlanPeriodForPrice()),
        currency: subscription.currency || 'EUR',
        createdAt: subscription.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      console.log('[PaymentSuccessScreen] Setting active subscription:', activeSubscription);
      
      // Set subscription - this should automatically update userState to ACTIVE_SUBSCRIBER
      await setSubscription(activeSubscription);
      
      console.log('[PaymentSuccessScreen] Subscription set! New auth state should be ACTIVE_SUBSCRIBER');
      console.log('[PaymentSuccessScreen] Current userState after setSubscription:', authState.userState);

      // REFERRAL SYSTEM: Check if there's a pending referral and process reward
      try {
        const pendingReferrerId = await ReferralService.getPendingReferrerId();
        
        if (pendingReferrerId) {
          console.log('[PaymentSuccessScreen] Processing referral reward for referrer:', pendingReferrerId);
          
          // Process the referral reward
          await ReferralService.processReferralReward(pendingReferrerId);
          
          // Clear the pending referrer ID
          await ReferralService.clearPendingReferrerId();
          
          console.log('[PaymentSuccessScreen] Referral reward processed successfully!');
        } else {
          console.log('[PaymentSuccessScreen] No pending referral found');
        }
      } catch (referralError: any) {
        console.error('[PaymentSuccessScreen] Error processing referral:', referralError);
        // Don't block the payment success flow if referral processing fails
        // Just log the error
      }
      
      // Navigation will happen automatically via useEffect when userState changes to ACTIVE_SUBSCRIBER
      console.log('[PaymentSuccessScreen] Subscription set successfully. Waiting for state propagation...');
      
    } catch (error: any) {
      console.error('[PaymentSuccessScreen] Error:', error);
      
      // Show appropriate error message based on error type
      const errorMessage = error.message || 'Възникна грешка при обработката на абонамента.';
      
      Alert.alert(
        'Грешка',
        `${errorMessage}\n\nМоля, опитайте отново или се свържете с поддръжката.`,
        [
          { 
            text: 'Опитай отново',
            onPress: () => refreshAuthState()
          },
          {
            text: 'Обратно към планове',
            style: 'cancel',
            onPress: () => navigation.navigate('SubscriptionPlans', { reason: 'payment_failed' })
          }
        ]
      );
    }
  };

  const getPlanPeriodForPrice = (): 'monthly' | 'quarterly' | 'yearly' => {
    if (!subscription) {
      console.error('[PaymentSuccessScreen] No subscription found');
      throw new Error('Subscription data is missing');
    }
    
    // Use subscription.plan (preferred) or fallback to planId for backward compatibility
    const planValue = subscription.plan || (subscription as any).planId;
    
    if (!planValue) {
      console.error('[PaymentSuccessScreen] No subscription plan found');
      // Return default instead of throwing error
      return 'monthly';
    }
    
    console.log('[PaymentSuccessScreen] Plan value found:', planValue);
    
    switch (planValue) {
      case SubscriptionPlan.MONTHLY:
      case 'monthly':
        return 'monthly';
      case SubscriptionPlan.QUARTERLY:
      case 'quarterly':
        return 'quarterly';
      case SubscriptionPlan.YEARLY:
      case 'yearly':
        return 'yearly';
      default:
        console.error(`[PaymentSuccessScreen] Unknown plan: ${planValue}`);
        return 'monthly'; // Fallback instead of throwing
    }
  };

  const getPlanDisplayName = () => {
    if (!subscription) {
      console.error('[PaymentSuccessScreen] No subscription for display name');
      return 'Абонаментен план';
    }
    
    // Use subscription.plan (preferred) or fallback to planId for backward compatibility
    const planValue = subscription.plan || (subscription as any).planId;
    
    if (!planValue) {
      console.error('[PaymentSuccessScreen] No plan value for display name');
      return 'Абонаментен план';
    }
    
    switch (planValue) {
      case SubscriptionPlan.MONTHLY:
      case 'monthly':
        return 'Месечен план';
      case SubscriptionPlan.QUARTERLY:
      case 'quarterly':
        return 'Тримесечен план';
      case SubscriptionPlan.YEARLY:
      case 'yearly':
        return 'Годишен план';
      default:
        console.error(`[PaymentSuccessScreen] Unknown plan for display: ${planValue}`);
        return 'Абонаментен план';
    }
  };

  const formatSubscriptionDate = (date: Date | any) => {
    try {
      // Handle different date formats
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date.toDate === 'function') {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else if (date && typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        console.error('[PaymentSuccessScreen] Invalid date format:', date);
        return 'Неизвестна дата';
      }
      
      return new Intl.DateTimeFormat('bg-BG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('[PaymentSuccessScreen] Error formatting date:', error);
      return 'Неизвестна дата';
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

      {/* Confetti Elements */}
      {[confetti1, confetti2, confetti3, confetti4, confetti5].map((confetti, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: (index + 1) * (width / 6),
              transform: [{ translateY: confetti }],
              backgroundColor: ['#b2ac94', '#F8E3B4', '#DCD6C1', '#A68A64', '#C4A876'][index],
            },
          ]}
        />
      ))}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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

        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successIconSection,
            {
              opacity: successOpacity,
              transform: [
                { scale: Animated.multiply(successScale, pulseAnim) }
              ],
            },
          ]}
        >
          <View style={[styles.successIcon, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
        </Animated.View>

        {/* Content Section */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <Text style={[styles.title, { color: getTextColor() }]}>
            Плащането е успешно!
          </Text>
          <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
            Добре дошли в FinTrack Premium
          </Text>

          {/* Subscription Details */}
          <View style={[styles.detailsCard, getGlassmorphismStyle()]}>
            <Text style={[styles.detailsTitle, { color: getTextColor() }]}>
              Детайли на абонамента
            </Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: getSecondaryTextColor() }]}>План:</Text>
              <Text style={[styles.detailValue, { color: getTextColor() }]}>
                {getPlanDisplayName()}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: getSecondaryTextColor() }]}>Цена:</Text>
              <Text style={[styles.detailValue, { color: getTextColor() }]}>
                {(() => {
                  try {
                    const period = getPlanPeriodForPrice();
                    // Firebase Functions return 'planId', so check that first, then 'plan' for backward compatibility
                    const planValue = (subscription as any).planId || subscription?.plan;
                    const plan = planValue || SubscriptionPlan.MONTHLY;
                    const fallbackPrice = getPlanPrice(plan, period);
                    const finalPrice = subscription?.amount || fallbackPrice;
                    const finalCurrency = subscription?.currency || 'EUR';
                    
                    console.log('[PaymentSuccessScreen] Price calculation:', {
                      originalAmount: subscription?.amount,
                      planValue,
                      plan,
                      period,
                      fallbackPrice,
                      finalPrice,
                      finalCurrency
                    });
                    
                    return formatPrice(finalPrice, finalCurrency);
                  } catch (error) {
                    console.error('[PaymentSuccessScreen] Error calculating price:', error);
                    return '12.99 €'; // Ultimate fallback
                  }
                })()}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: getSecondaryTextColor() }]}>Активен до:</Text>
              <Text style={[styles.detailValue, { color: getTextColor() }]}>
                {formatSubscriptionDate(subscription.currentPeriodEnd)}
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={[styles.featuresCard, getGlassmorphismStyle()]}>
            <Text style={[styles.featuresTitle, { color: getTextColor() }]}>
              Вече имате достъп до:
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={[styles.featureIcon, { color: '#4CAF50' }]}>✓</Text>
                <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                  Неограничени транзакции
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureIcon, { color: '#4CAF50' }]}>✓</Text>
                <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                  Разширени отчети и анализи
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureIcon, { color: '#4CAF50' }]}>✓</Text>
                <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                  Приоритетна поддръжка
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={[styles.featureIcon, { color: '#4CAF50' }]}>✓</Text>
                <Text style={[styles.featureText, { color: getSecondaryTextColor() }]}>
                  Експорт на данни
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleContinue}
            style={[
              styles.continueButton,
              styles.glassMorphButton,
              {
                backgroundColor: '#4CAF50',
                borderColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <View style={[styles.buttonContent, { paddingHorizontal: 24 }]}>
              <Text style={[styles.continueButtonText, { color: '#FFFFFF', marginLeft: 30 }]}>
                Влез в приложението
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.celebrationNote}>
            <Text style={[styles.celebrationText, { color: getSecondaryTextColor() }]}>
              🎉 Благодарим ви за доверието! Готови сте да управлявате финансите си по-умно.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
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

  // Confetti
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
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

  // Success Icon
  successIconSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(76, 175, 80, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  successIconText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Main Content
  mainContent: {
    width: '100%',
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
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
  },

  // Details Card
  detailsCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
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
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Features Card
  featuresCard: {
    width: '100%',
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  // Button Section
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
  },
  glassMorphButton: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    textAlign: 'center',
  },
  celebrationNote: {
    paddingHorizontal: 20,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PaymentSuccessScreen; 