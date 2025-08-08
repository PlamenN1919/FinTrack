import React, { useRef, useEffect, useState } from 'react';
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
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan, SubscriptionStatus } from '../../types/auth.types';
import { formatPrice, getPlanPrice } from '../../config/subscription.config';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';

const { width, height } = Dimensions.get('window');

type SubscriptionManagementScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SubscriptionManagement'>;
type SubscriptionManagementScreenRouteProp = RouteProp<AuthStackParamList, 'SubscriptionManagement'>;

const SubscriptionManagementScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionManagementScreenNavigationProp>();
  const route = useRoute<SubscriptionManagementScreenRouteProp>();
  const { cancelSubscription, updateSubscription } = useAuth();
  const { theme, isDark } = useTheme();

  const { subscription } = route.params;

  // Debug subscription data
  console.log('[SubscriptionManagementScreen] Subscription data:', {
    amount: subscription?.amount,
    currency: subscription?.currency,
    plan: subscription?.plan,
    status: subscription?.status
  });

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(60)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(60)).current;
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

    const timer = setTimeout(() => {
      entranceSequence.start();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const getPlanDisplayName = () => {
    if (!subscription) {
      return 'Абонаментен план';
    }
    
    // Firebase Functions return 'planId', so check that first, then 'plan' for backward compatibility
    const planValue = (subscription as any).planId || subscription.plan;
    
    if (!planValue) {
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
        return 'Абонаментен план';
    }
  };

  const getPlanPeriodForPrice = (): 'monthly' | 'quarterly' | 'yearly' => {
    if (!subscription) {
      console.warn('[SubscriptionManagementScreen] No subscription found, defaulting to monthly');
      return 'monthly';
    }
    
    // Firebase Functions return 'planId', so check that first, then 'plan' for backward compatibility
    const planValue = (subscription as any).planId || subscription.plan;
    
    if (!planValue) {
      console.warn('[SubscriptionManagementScreen] No subscription plan found, defaulting to monthly');
      return 'monthly';
    }
    
    console.log('[SubscriptionManagementScreen] Plan value found:', planValue);
    
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
        console.warn(`[SubscriptionManagementScreen] Unknown plan: ${planValue}, defaulting to monthly`);
        return 'monthly';
    }
  };

  const getPlanPeriod = () => {
    if (!subscription) {
      return 'период';
    }
    
    // Support both 'plan' and 'planId' for backward compatibility
    const planValue = subscription.plan || (subscription as any).planId;
    
    if (!planValue) {
      return 'период';
    }
    
    switch (planValue) {
      case SubscriptionPlan.MONTHLY:
      case 'monthly':
        return 'месечно';
      case SubscriptionPlan.QUARTERLY:
      case 'quarterly':
        return 'тримесечно';
      case SubscriptionPlan.YEARLY:
      case 'yearly':
        return 'годишно';
      default:
        return 'период';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = () => {
    switch (subscription.status) {
      case SubscriptionStatus.ACTIVE:
        return '#4CAF50';
      case SubscriptionStatus.EXPIRED:
        return '#FF9800';
      case SubscriptionStatus.CANCELLED:
        return '#F44336';
      case SubscriptionStatus.PENDING:
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case SubscriptionStatus.ACTIVE:
        return 'Активен';
      case SubscriptionStatus.EXPIRED:
        return 'Изтекъл';
      case SubscriptionStatus.CANCELLED:
        return 'Отменен';
      case SubscriptionStatus.PENDING:
        return 'В процес';
      default:
        return 'Неизвестен';
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Отмяна на абонамент',
      'Сигурни ли сте, че искате да отмените абонамента си? Ще запазите достъп до края на текущия период.',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Отмени абонамента',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingSubscription(true);
              await cancelSubscription();
              
              Alert.alert(
                'Абонаментът е отменен',
                'Вашият абонамент е успешно отменен. Ще запазите достъп до края на текущия период.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => navigation.goBack() 
                  }
                ]
              );
            } catch (error) {
              console.error('[SubscriptionManagement] Error cancelling subscription:', error);
              Alert.alert('Грешка', 'Възникна грешка при отмяната на абонамента. Моля, опитайте отново.');
            } finally {
              setCancellingSubscription(false);
            }
          },
        },
      ]
    );
  };

  const handleUpgradeSubscription = () => {
    navigation.navigate('SubscriptionPlans', { 
      reason: 'upgrade',
      previousPlan: subscription?.plan || SubscriptionPlan.MONTHLY
    });
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const endDate = new Date(subscription.currentPeriodEnd);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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
            Управление на абонамент
          </Text>
          <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
            Прегледайте и управлявайте вашия план
          </Text>
        </Animated.View>

        {/* Content Section */}
        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          {/* Subscription Status Card */}
          <View style={[styles.statusCard, getGlassmorphismStyle()]}>
            <View style={styles.statusHeader}>
              <Text style={[styles.statusTitle, { color: getTextColor() }]}>
                Статус на абонамента
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>
            
            {subscription.status === SubscriptionStatus.ACTIVE && (
              <View style={styles.daysRemaining}>
                <Text style={[styles.daysRemainingText, { color: getSecondaryTextColor() }]}>
                  {getDaysRemaining()} дни до следващо плащане
                </Text>
              </View>
            )}
          </View>

          {/* Subscription Details Card */}
          <View style={[styles.detailsCard, getGlassmorphismStyle()]}>
            <Text style={[styles.detailsTitle, { color: getTextColor() }]}>
              Детайли на плана
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
                    const finalCurrency = subscription?.currency || 'BGN';
                    
                    console.log('[SubscriptionManagementScreen] Price calculation:', {
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
                    console.error('[SubscriptionManagementScreen] Error calculating price:', error);
                    return '12.99 BGN'; // Ultimate fallback
                  }
                })()} {getPlanPeriod()}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: getSecondaryTextColor() }]}>Започнал:</Text>
              <Text style={[styles.detailValue, { color: getTextColor() }]}>
                {formatDate(subscription.currentPeriodStart)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: getSecondaryTextColor() }]}>
                {subscription.cancelAtPeriodEnd ? 'Изтича:' : 'Следващо плащане:'}
              </Text>
              <Text style={[styles.detailValue, { color: getTextColor() }]}>
                {formatDate(subscription.currentPeriodEnd)}
              </Text>
            </View>

            {subscription.cancelAtPeriodEnd && (
              <View style={styles.cancelNotice}>
                <Text style={[styles.cancelNoticeText, { color: '#FF9800' }]}>
                  ⚠️ Абонаментът е отменен и ще изтече на {formatDate(subscription.currentPeriodEnd)}
                </Text>
              </View>
            )}
          </View>

          {/* Features Card */}
          <View style={[styles.featuresCard, getGlassmorphismStyle()]}>
            <Text style={[styles.featuresTitle, { color: getTextColor() }]}>
              Включени функции
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

        {/* Buttons Section */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          {/* Upgrade Plan Button */}
          <TouchableOpacity
            onPress={handleUpgradeSubscription}
            style={[
              styles.primaryButton,
              styles.glassMorphButton,
              {
                backgroundColor: '#b2ac94',
                borderColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <View style={[styles.buttonContent, { paddingHorizontal: 24 }]}>
              <Text style={[styles.primaryButtonText, { color: '#FFFFFF', marginLeft: 30 }]}>
                Промени план
              </Text>
            </View>
          </TouchableOpacity>

          {/* Cancel Subscription Button */}
          {subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd && (
            <TouchableOpacity
              onPress={handleCancelSubscription}
              disabled={cancellingSubscription}
              style={[
                styles.secondaryButton,
                getGlassmorphismStyle(),
                styles.glassMorphButton,
                {
                  opacity: cancellingSubscription ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.buttonContent}>
                {cancellingSubscription ? (
                  <ActivityIndicator size="small" color={getTextColor()} />
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: '#F44336' }]}>
                    Отмени абонамента
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, getGlassmorphismStyle(), styles.glassMorphButton]}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.backButtonText, { color: getTextColor() }]}>
                ← Назад
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={[styles.supportText, { color: getSecondaryTextColor() }]}>
            💬 Нужна помощ? Свържете се с нашия екип за поддръжка чрез приложението.
          </Text>
        </View>
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

  // Content Section
  contentSection: {
    gap: 20,
    marginBottom: 30,
  },

  // Status Card
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysRemaining: {
    alignItems: 'center',
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Details Card
  detailsCard: {
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  cancelNotice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  cancelNoticeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Features Card
  featuresCard: {
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
    gap: 16,
  },
  primaryButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
  },
  secondaryButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
  },
  backButton: {
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
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    textAlign: 'center',
  },

  // Support Section
  supportSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubscriptionManagementScreen; 
