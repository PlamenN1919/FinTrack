import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList, SubscriptionPlan, UserState } from '../../types/auth.types';
import { 
  SUBSCRIPTION_PLANS, 
  getPlanPrice, 
  getMonthlyEquivalent, 
  getSavingsPercentage,
  getSavingsAmount 
} from '../../config/subscription.config';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';

const { width, height } = Dimensions.get('window');

type SubscriptionPlansScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SubscriptionPlans'>;
type SubscriptionPlansScreenRouteProp = RouteProp<AuthStackParamList, 'SubscriptionPlans'>;

const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionPlansScreenNavigationProp>();
  const route = useRoute<SubscriptionPlansScreenRouteProp>();
  const { authState } = useAuth();
  const { theme, isDark } = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SubscriptionPlan.QUARTERLY);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(60)).current;
  const plansOpacity = useRef(new Animated.Value(0)).current;
  const plansTranslateY = useRef(new Animated.Value(60)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(60)).current;

  // Floating Elements Animation
  const float1Y = useRef(new Animated.Value(0)).current;
  const float2Y = useRef(new Animated.Value(0)).current;
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
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay || 0),
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
    createFloatingAnimation(float1Y, 4000, 0).start();
    createFloatingAnimation(float2Y, 3500, 1000).start();
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
      
      // Plans entrance
      Animated.parallel([
        Animated.timing(plansOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(plansTranslateY, {
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

    const timer = setTimeout(() => {
      entranceSequence.start();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    
    const planConfig = SUBSCRIPTION_PLANS[selectedPlan];
    let amount = planConfig.monthlyPrice;
    
    // Adjust amount based on plan type
    if (selectedPlan === SubscriptionPlan.QUARTERLY && planConfig.quarterlyPrice) {
      amount = planConfig.quarterlyPrice;
    } else if (selectedPlan === SubscriptionPlan.YEARLY && planConfig.yearlyPrice) {
      amount = planConfig.yearlyPrice;
    }

    try {
      console.log('[SubscriptionPlansScreen] Navigating to Payment with plan:', selectedPlan, 'amount:', amount);
      
      navigation.navigate('Payment', { 
        planId: selectedPlan,
        amount: amount,
        currency: planConfig.currency
      });
    } catch (error) {
      console.error('[SubscriptionPlansScreen] Navigation error:', error);
      Alert.alert(
        'Грешка',
        'Възникна грешка. Моля, опитайте отново.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    const isSelected = selectedPlan === plan;
    const savings = plan === SubscriptionPlan.QUARTERLY ? getSavingsPercentage(plan, 'quarterly') : 
                    plan === SubscriptionPlan.YEARLY ? getSavingsPercentage(plan, 'yearly') : 0;
    const savingsAmount = plan === SubscriptionPlan.QUARTERLY ? getSavingsAmount(plan, 'quarterly') : 
                         plan === SubscriptionPlan.YEARLY ? getSavingsAmount(plan, 'yearly') : 0;
    
    let price = planConfig.monthlyPrice;
    let period = 'месец';
    let totalPrice = planConfig.monthlyPrice;

    if (plan === SubscriptionPlan.QUARTERLY && planConfig.quarterlyPrice) {
      price = Math.round(planConfig.quarterlyPrice / 3);
      period = 'месец';
      totalPrice = planConfig.quarterlyPrice;
    } else if (plan === SubscriptionPlan.YEARLY && planConfig.yearlyPrice) {
      price = Math.round(planConfig.yearlyPrice / 12);
      period = 'месец';
      totalPrice = planConfig.yearlyPrice;
    }

    return (
      <TouchableOpacity
        key={plan}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          getGlassmorphismStyle(),
          {
            borderColor: isSelected ? '#b2ac94' : getGlassmorphismStyle().borderColor,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => setSelectedPlan(plan)}
        activeOpacity={0.8}
      >
        {savings > 0 && (
          <View style={[styles.savingsBadge, { backgroundColor: '#b2ac94' }]}>
            <Text style={styles.savingsText}>Спестявате {savings}%</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, { color: getTextColor() }]}>
            {planConfig.name}
          </Text>
          <Text style={[styles.planSubtitle, { color: getSecondaryTextColor() }]}>
            {planConfig.description}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: getTextColor() }]}>
            {price.toFixed(2)} лв
          </Text>
          <Text style={[styles.pricePeriod, { color: getSecondaryTextColor() }]}>
            /{period}
          </Text>
        </View>

        {plan !== SubscriptionPlan.MONTHLY && (
          <Text style={[styles.totalPrice, { color: getSecondaryTextColor() }]}>
            Общо: {totalPrice.toFixed(2)} лв за {plan === SubscriptionPlan.QUARTERLY ? '3 месеца' : '12 месеца'}
          </Text>
        )}

        {savingsAmount > 0 && (
          <Text style={[styles.savingsAmount, { color: '#b2ac94' }]}>
            Спестявате {savingsAmount.toFixed(2)} лв
          </Text>
        )}

        <View style={styles.featuresContainer}>
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
              Бюджетни цели
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: '#b2ac94' }]}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
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
            Изберете план
          </Text>
          <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
            Започнете управлението на финансите си
          </Text>
        </Animated.View>

        {/* Plans Section */}
        <Animated.View
          style={[
            styles.plansSection,
            {
              opacity: plansOpacity,
              transform: [{ translateY: plansTranslateY }],
            },
          ]}
        >
          {Object.values(SubscriptionPlan).map(plan => renderPlanCard(plan))}
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
            disabled={isLoading}
            style={[
              styles.continueButton,
              styles.glassMorphButton,
              {
                backgroundColor: '#b2ac94',
                borderColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.buttonContent, { paddingHorizontal: 24 }]}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.continueButtonText, { color: '#FFFFFF', marginLeft: 30 }]}>
                  Продължи с {SUBSCRIPTION_PLANS[selectedPlan].name}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={[styles.securityIcon, { color: getSecondaryTextColor() }]}>🔒</Text>
            <Text style={[styles.securityText, { color: getSecondaryTextColor() }]}>
              Сигурно плащане с Stripe
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
    marginBottom: 40,
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

  // Plans Section
  plansSection: {
    gap: 20,
    marginBottom: 40,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
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
  planCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
  },
  pricePeriod: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
  totalPrice: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  savingsAmount: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 8,
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
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Button Section
  buttonSection: {
    gap: 16,
  },
  continueButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SubscriptionPlansScreen; 