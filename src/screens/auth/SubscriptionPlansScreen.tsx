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

const { width, height } = Dimensions.get('window');

type SubscriptionPlansScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SubscriptionPlans'>;
type SubscriptionPlansScreenRouteProp = RouteProp<AuthStackParamList, 'SubscriptionPlans'>;

const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionPlansScreenNavigationProp>();
  const route = useRoute<SubscriptionPlansScreenRouteProp>();
  const { authState } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SubscriptionPlan.QUARTERLY);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  const planOpacity = useRef(new Animated.Value(0)).current;
  const planScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(planOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(planScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
    
    const planData = { 
      planId: selectedPlan, 
      amount: amount, 
      currency: planConfig.currency 
    };
    
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Payment', planData);
    }, 1000);
  };

  const handleBack = () => {
    const canGoBack = navigation.canGoBack();
    console.log('SubscriptionPlansScreen: Can go back?', canGoBack);
    
    if (canGoBack) {
      try {
        navigation.goBack();
      } catch (error) {
        console.log('SubscriptionPlansScreen: goBack failed, navigating to Welcome');
        navigation.navigate('Welcome');
      }
    } else {
      console.log('SubscriptionPlansScreen: No back stack, navigating to Welcome');
      navigation.navigate('Welcome');
    }
  };

  const getReasonText = () => {
    const reason = route.params?.reason;
    switch (reason) {
      case 'expired':
        return 'Абонаментът ви е изтекъл. Подновете за да продължите да използвате FinTrack.';
      case 'payment_failed':
        return 'Плащането беше неуспешно. Моля, опитайте отново.';
      case 'upgrade':
        return 'Надстройте абонамента си за още повече възможности.';
      default:
        return 'Изберете абонаментен план, за да започнете да използвате FinTrack.';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium Background */}
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
            opacity: headerOpacity,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Избор на план</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../logo/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(247, 231, 206, 0.1)']}
                style={styles.logoGlow}
              />
            </View>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Изберете вашия план</Text>
            <Text style={styles.heroSubtitle}>
              {getReasonText()}
            </Text>
          </View>

          {/* Plans Container */}
          <View style={styles.plansContainer}>
            {/* Monthly Plan */}
            <Animated.View
              style={[
                styles.planCard,
                selectedPlan === SubscriptionPlan.MONTHLY && styles.planCardSelected,
                {
                  opacity: planOpacity,
                  transform: [{ scale: planScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.planCardInner}
                onPress={() => setSelectedPlan(SubscriptionPlan.MONTHLY)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planIconContainer}>
                    <Text style={styles.planIcon}>📅</Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>Месечен план</Text>
                    <Text style={styles.planPrice}>12.99 лв</Text>
                    <Text style={styles.planPeriod}>месечно</Text>
                  </View>
                  {selectedPlan === SubscriptionPlan.MONTHLY && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Quarterly Plan */}
            <Animated.View
              style={[
                styles.planCard,
                styles.premiumPlanCard,
                selectedPlan === SubscriptionPlan.QUARTERLY && styles.planCardSelected,
                {
                  opacity: planOpacity,
                  transform: [{ scale: planScale }],
                },
              ]}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>ПОПУЛЯРЕН</Text>
              </View>
              
              <TouchableOpacity
                style={styles.planCardInner}
                onPress={() => setSelectedPlan(SubscriptionPlan.QUARTERLY)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={[styles.planIconContainer, { borderColor: 'rgba(212, 175, 55, 0.5)', backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                    <Text style={styles.planIcon}>🏆</Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, styles.premiumPlanName]}>Тримесечен план</Text>
                    <Text style={[styles.planPrice, styles.premiumPlanPrice]}>29.99 лв</Text>
                    <Text style={styles.planPeriod}>за 3 месеца</Text>
                    <Text style={styles.savingsText}>Спестявате 23%</Text>
                  </View>
                  {selectedPlan === SubscriptionPlan.QUARTERLY && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Yearly Plan */}
            <Animated.View
              style={[
                styles.planCard,
                selectedPlan === SubscriptionPlan.YEARLY && styles.planCardSelected,
                {
                  opacity: planOpacity,
                  transform: [{ scale: planScale }],
                },
              ]}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueBadgeText}>НАЙ-ИЗГОДЕН</Text>
                  </View>
              
              <TouchableOpacity
                style={styles.planCardInner}
                onPress={() => setSelectedPlan(SubscriptionPlan.YEARLY)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={[styles.planIconContainer, { borderColor: 'rgba(76, 175, 80, 0.5)', backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                    <Text style={styles.planIcon}>💎</Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>Годишен план</Text>
                    <Text style={styles.planPrice}>99.99 лв</Text>
                    <Text style={styles.planPeriod}>годишно</Text>
                    <Text style={styles.savingsText}>Спестявате 36%</Text>
                  </View>
                  {selectedPlan === SubscriptionPlan.YEARLY && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Защо хората избират FinTrack:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureText}>Спестете средно 20% от разходите си всеки месец</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Разберете къде отиват парите ви с детайлни отчети</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Постигнете финансовите си цели по-бързо</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Автоматично проследяване - без ръчно въвеждане</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureText}>Банково ниво на сигурност за вашите данни</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Достъп от всички ваши устройства</Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.continueButton,
                isLoading && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1A1A1A" size="small" />
                ) : (
                    <Text style={styles.continueButtonText}>
                  Продължете към плащане
                    </Text>
                )}
            </TouchableOpacity>
          </Animated.View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Всички плащания са сигурни и защитени
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
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
  },
  logoSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F7E7CE',
    borderWidth: 3,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 52,
    zIndex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(247, 231, 206, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  plansContainer: {
    marginBottom: 30,
    gap: 16,
  },
  planCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  planCardPopular: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  planCardBestValue: {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  bestValueBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planCardContent: {
    padding: 20,
    paddingTop: 30,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  pricingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  monthlyEquivalent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  billingPeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectionIndicator: {
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FFD700',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  planCardInner: {
    flex: 1,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.7)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  selectedIndicatorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(247, 231, 206, 0.9)',
    flex: 1,
    fontWeight: '500',
  },
  premiumPlanCard: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  premiumPlanName: {
    color: '#D4AF37',
  },
  premiumPlanPrice: {
    color: '#D4AF37',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  continueButton: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(247, 231, 206, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  trialInfo: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.7)',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 16,
    color: 'rgba(247, 231, 206, 0.6)',
    marginRight: 8,
  },
  securityText: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  planIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 12,
    textAlign: 'center',
  },
  featuresList: {
    gap: 8,
  },
});

export default SubscriptionPlansScreen; 