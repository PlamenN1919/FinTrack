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
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Назад</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Покани приятели</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Main Referral Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.colors.card }]}>
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            style={styles.mainCardGradient}
          >
            <View style={styles.mainCardContent}>
              <Text style={styles.mainCardTitle}>🎉 Покани приятел</Text>
              <Text style={styles.mainCardSubtitle}>Спечели 1 месец безплатно!</Text>
              <Text style={styles.mainCardDescription}>
                Поканете приятел да изтегли FinTrack. Ако закупи абонамент, вие получавате 1 месец безплатно!
              </Text>
            </View>
          </LinearGradient>
          
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
              <Text style={styles.shareButtonText}>🚀 Сподели Link</Text>
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
  header: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  mainCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainCardGradient: {
    padding: 24,
  },
  mainCardContent: {
    alignItems: 'center',
  },
  mainCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainCardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  mainCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  shareButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ReferralScreen; 