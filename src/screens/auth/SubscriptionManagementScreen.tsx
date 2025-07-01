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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, SubscriptionPlan, SubscriptionStatus } from '../../types/auth.types';
import { formatPrice } from '../../config/subscription.config';
import { useAuth } from '../../contexts/AuthContext';

type SubscriptionManagementScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SubscriptionManagement'>;
type SubscriptionManagementScreenRouteProp = RouteProp<AuthStackParamList, 'SubscriptionManagement'>;

const SubscriptionManagementScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionManagementScreenNavigationProp>();
  const route = useRoute<SubscriptionManagementScreenRouteProp>();
  const { cancelSubscription, updateSubscription } = useAuth();

  const { subscription } = route.params;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getPlanDisplayName = () => {
    switch (subscription.plan) {
      case SubscriptionPlan.MONTHLY:
        return 'Месечен план';
      case SubscriptionPlan.QUARTERLY:
        return 'Тримесечен план';
      case SubscriptionPlan.YEARLY:
        return 'Годишен план';
      default:
        return 'Абонаментен план';
    }
  };

  const getPlanPeriod = () => {
    switch (subscription.plan) {
      case SubscriptionPlan.MONTHLY:
        return 'месец';
      case SubscriptionPlan.QUARTERLY:
        return '3 месеца';
      case SubscriptionPlan.YEARLY:
        return 'година';
      default:
        return 'период';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
      case SubscriptionStatus.FAILED:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case SubscriptionStatus.ACTIVE:
        return 'АКТИВЕН';
      case SubscriptionStatus.EXPIRED:
        return 'ИЗТЕКЪЛ';
      case SubscriptionStatus.CANCELLED:
        return 'ОТМЕНЕН';
      case SubscriptionStatus.PENDING:
        return 'ЧАКАЩ';
      case SubscriptionStatus.FAILED:
        return 'НЕУСПЕШЕН';
      default:
        return 'НЕИЗВЕСТЕН';
    }
  };

  const handleChangePlan = () => {
    navigation.navigate('SubscriptionPlans', {
      reason: 'upgrade',
      previousPlan: subscription.plan,
    });
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Отмяна на абонамент',
      'Сигурни ли сте, че искате да отмените абонамента си? Той ще остане активен до края на текущия период.',
      [
        { text: 'Не', style: 'cancel' },
        { 
          text: 'Да, отмени', 
          style: 'destructive',
          onPress: async () => {
            setCancellingSubscription(true);
            try {
              await cancelSubscription();
              Alert.alert('Успех', 'Абонаментът е отменен успешно');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Грешка', 'Възникна проблем при отмяната на абонамента');
            } finally {
              setCancellingSubscription(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdatePaymentMethod = () => {
    Alert.alert(
      'Промяна на начин на плащане',
      'Тази функционалност ще бъде добавена скоро',
      [{ text: 'OK' }]
    );
  };

  const handleViewPaymentHistory = () => {
    Alert.alert(
      'История на плащанията',
      'Тази функционалност ще бъде добавена скоро',
      [{ text: 'OK' }]
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#01579B', '#0288D1', '#00B4DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [{ translateY: headerAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Управление на абонамента</Text>
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
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Current Subscription Card */}
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>Текущ абонамент</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
              </View>
            </View>

            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>План:</Text>
                <Text style={styles.detailValue}>{getPlanDisplayName()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Цена:</Text>
                <Text style={styles.detailValue}>
                  {formatPrice(subscription.amount, subscription.currency)}/{getPlanPeriod()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Започнат:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.currentPeriodStart)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {subscription.cancelAtPeriodEnd ? 'Изтича:' : 'Следващо плащане:'}
                </Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.currentPeriodEnd)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID:</Text>
                <Text style={styles.detailValueSmall}>{subscription.id}</Text>
              </View>
            </View>

            {subscription.cancelAtPeriodEnd && (
              <View style={styles.cancellationNotice}>
                <Text style={styles.cancellationText}>
                  ⚠️ Абонаментът е отменен, но остава активен до {formatDate(subscription.currentPeriodEnd)}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>Бързи действия</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleChangePlan}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Промяна на план</Text>
                <Text style={styles.actionSubtitle}>Upgrade или downgrade на абонамента</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUpdatePaymentMethod}
            >
              <Text style={styles.actionIcon}>💳</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Начин на плащане</Text>
                <Text style={styles.actionSubtitle}>Промяна на картата за плащане</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewPaymentHistory}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>История на плащанията</Text>
                <Text style={styles.actionSubtitle}>Преглед на всички плащания</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Включени функции</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Неограничени транзакции</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Разширени отчети и анализи</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Сканиране на разписки</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Бюджетни цели и прогнози</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Експорт на данни</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Приоритетна поддръжка</Text>
              </View>
            </View>
          </View>

          {/* Cancel Subscription Button */}
          {!subscription.cancelAtPeriodEnd && subscription.status === SubscriptionStatus.ACTIVE && (
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Опасна зона</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
                disabled={cancellingSubscription}
              >
                {cancellingSubscription ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.cancelButtonText}>Отмяна на абонамента</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.cancelWarning}>
                Абонаментът ще остане активен до края на текущия период
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01579B',
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
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#E3F2FD',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
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
    paddingTop: 20,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 180, 219, 0.3)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subscriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.8)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#E3F2FD',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#E3F2FD',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  cancellationNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  cancellationText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.2)',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(227, 242, 253, 0.7)',
  },
  actionArrow: {
    fontSize: 18,
    color: '#00B4DB',
    fontWeight: 'bold',
  },
  featuresContainer: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 180, 219, 0.3)',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.9)',
    fontWeight: '500',
    flex: 1,
  },
  dangerZone: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    alignItems: 'center',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelWarning: {
    fontSize: 12,
    color: 'rgba(244, 67, 54, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SubscriptionManagementScreen; 