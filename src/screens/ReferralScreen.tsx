import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../utils/ThemeContext';
import ReferralService, { ReferralStats, ReferralLink } from '../services/ReferralService';

const ReferralScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const [statsData, linkData] = await Promise.all([
        ReferralService.getReferralStats(),
        ReferralService.generateReferralLink(),
      ]);
      setStats(statsData);
      setReferralLink(linkData);
    } catch (error: any) {
      console.error('Error loading referral data:', error);
      Alert.alert('Грешка', 'Възникна грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    
    Alert.alert(
      '🎉 Споделете вашия Referral Link!',
      'Изберете как искате да споделите:',
      [
        { text: 'Отказ', style: 'cancel' },
        { 
          text: '📱 Общо споделяне', 
          onPress: () => ReferralService.shareReferralLink(referralLink.url)
        },
        { 
          text: '💬 WhatsApp', 
          onPress: () => ReferralService.shareViaWhatsApp(referralLink.url)
        },
        { 
          text: '📧 Email', 
          onPress: () => ReferralService.shareViaEmail(referralLink.url)
        },
        { 
          text: '📋 Копирай', 
          onPress: () => ReferralService.copyReferralLink(referralLink.url)
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Неизвестно';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'expired': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '✅ Завършен';
      case 'pending': return '⏳ Чака се';
      case 'expired': return '❌ Изтекъл';
      default: return '❓ Неизвестен';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Зареждане на данни...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={true}
      />
      
      {/* Луксозен header с градиент - в стила на HomeScreen */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Декоративни елементи */}
          <View style={styles.headerDecorations}>
            <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
            <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
            <View style={[styles.decorativeCircle, styles.decorativeCircle3]} />
          </View>
          
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Назад</Text>
              </TouchableOpacity>
            </View>

            {/* Hero секция */}
            <View style={styles.heroSection}>
              <Text style={styles.heroEmoji}>🎁</Text>
              <Text style={styles.heroTitle}>Покани приятели</Text>
              <Text style={styles.heroSubtitle}>
                Споделете любовта към FinTrack
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Main Referral Card - Подобрен дизайн */}
        <View style={[styles.mainCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.mainCardContent}>
            <View style={styles.rewardBanner}>
              <LinearGradient
                colors={theme.colors.accentGradient}
                style={styles.rewardBannerGradient}
              >
                <Text style={styles.rewardBannerEmoji}>🎉</Text>
                <View style={styles.rewardBannerText}>
                  <Text style={styles.rewardBannerTitle}>Спечели 1 месец безплатно!</Text>
                  <Text style={styles.rewardBannerSubtitle}>
                    За всеки приятел, който закупи абонамент
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
              Поканете приятел да изтегли FinTrack. Когато закупи абонамент, вие автоматично получавате 1 месец безплатно към вашия план!
            </Text>
          </View>
          
          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.colors.primaryGradient}
              style={styles.shareButtonGradient}
            >
              <Text style={styles.shareButtonText}>🚀 Сподели твоя линк</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Referral Link Preview */}
          {referralLink && (
            <View style={styles.linkContainer}>
              <Text style={[styles.linkLabel, { color: theme.colors.textSecondary }]}>
                Твоят referral link:
              </Text>
              <TouchableOpacity 
                style={[styles.linkBox, { backgroundColor: theme.colors.background }]}
                onPress={() => ReferralService.copyReferralLink(referralLink.url)}
              >
                <Text style={[styles.linkText, { color: theme.colors.primary }]} numberOfLines={1}>
                  {referralLink.url}
                </Text>
                <Text style={[styles.copyHint, { color: theme.colors.textSecondary }]}>
                  (натиснете за копиране)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Статистики
            </Text>
            
            <View style={styles.statsGrid}>
              {/* Total Invites */}
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={styles.statEmoji}>📧</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {stats.totalInvites}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Общо покани
                </Text>
              </View>

              {/* Completed Referrals */}
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {stats.completedReferrals}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Завършени
                </Text>
              </View>

              {/* Pending Referrals */}
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={styles.statEmoji}>⏳</Text>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {stats.pendingReferrals}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Чакащи
                </Text>
              </View>

              {/* Total Rewards */}
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={styles.statEmoji}>🎁</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {stats.totalRewardsEarned}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Награди
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Referral History */}
        {stats && stats.referralHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              История на поканите
            </Text>
            
            {stats.referralHistory.map((item, index) => (
              <View key={item.id} style={[styles.historyItem, { backgroundColor: theme.colors.card }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyEmail, { color: theme.colors.text }]}>
                    {item.refereeEmail}
                  </Text>
                  <View style={styles.historyStatus}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                    {item.rewardGranted && (
                      <Text style={styles.rewardBadge}>🎁</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.historyDates}>
                  <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                    Поканен: {formatDate(item.invitedAt)}
                  </Text>
                  {item.completedAt && (
                    <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                      Завършен: {formatDate(item.completedAt)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {stats && stats.referralHistory.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.emptyEmoji}>📱</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Все още няма покани
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
              Започнете като споделите вашия referral link с приятели!
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  
  // Модерен header в стила на HomeScreen
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  headerDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(247, 231, 206, 0.08)',
  },
  decorativeCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  decorativeCircle2: {
    width: 80,
    height: 80,
    top: 60,
    left: -30,
  },
  decorativeCircle3: {
    width: 60,
    height: 60,
    bottom: 20,
    right: 80,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7E7CE',
  },
  heroSection: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#F7E7CE',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(247, 231, 206, 0.8)',
    fontWeight: '400',
    textAlign: 'center',
  },
  
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -16,
  },
  scrollContent: {
    paddingTop: 32,
  },
  
  // Подобрена главна карта
  mainCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCardContent: {
    padding: 20,
  },
  rewardBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  rewardBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardBannerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  rewardBannerText: {
    flex: 1,
  },
  rewardBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  rewardBannerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(26, 26, 26, 0.7)',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  shareButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  linkText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyHint: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Подобрени секции
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyEmail: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rewardBadge: {
    fontSize: 16,
    marginLeft: 8,
  },
  historyDates: {
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 60,
  },
});

export default ReferralScreen; 