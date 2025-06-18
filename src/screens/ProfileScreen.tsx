import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../utils/ThemeContext';
import { useUser } from '../utils/UserContext';
import { SCREENS } from '../utils/constants';

// Модерни UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';
import AnimatedStats from '../components/ui/AnimatedStats';

// Гамификация компоненти и данни
import LevelProgressBar from '../components/gamification/LevelProgressBar';
import AchievementCard from '../components/gamification/AchievementCard';
import MissionCard from '../components/gamification/MissionCard';
import gamificationService from '../services/GamificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Примерно изображение за профил (в реално приложение бихме имали URL към изображение)
const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const { userData } = useUser();
  
  // Получаване на данни за профила от гамификацията с автоматично обновяване
  const [profile, setProfile] = useState(gamificationService.getProfile());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Автоматично обновяване на профила
  useEffect(() => {
    console.log('🔄 ProfileScreen: Setting up profile listeners');
    
    // Обновяваме профила при инициализация
    const handleProfileUpdate = (updatedProfile: any) => {
      console.log('📱 ProfileScreen: Profile updated', {
        streakDays: updatedProfile.streakDays,
        completedAchievements: updatedProfile.completedAchievements,
        completedMissions: updatedProfile.missions.completed.length,
      });
      setProfile(updatedProfile);
    };

    // Слушаме за промени в профила
    gamificationService.onProfileUpdated(handleProfileUpdate);
    gamificationService.onInitialized(handleProfileUpdate);

    // Проверяваме дали има готов профил
    if (gamificationService.isReady()) {
      const currentProfile = gamificationService.getProfile();
      console.log('✅ ProfileScreen: Initial profile loaded', currentProfile);
      setProfile(currentProfile);
    }

    // Cleanup при unmount
    return () => {
      console.log('🧹 ProfileScreen: Cleaning up profile listeners');
      gamificationService.offProfileUpdated(handleProfileUpdate);
    };
  }, []);
  
  // Обработка при натискане върху постижение
  const handleAchievementPress = (id: string) => {
    navigation.navigate(SCREENS.ACHIEVEMENTS);
  };
  
  // Обработка при натискане върху мисия
  const handleMissionPress = (id: string) => {
    navigation.navigate(SCREENS.ACHIEVEMENTS, { initialTab: 'missions' });
  };
  
  // Превключване на нотификациите
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      
      {/* Минималистичен header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Профил</Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Редактирай</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Чиста профилна карта */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: userData.avatar }} 
                style={styles.avatar}
              />
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.levelText}>{profile.level}</Text>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {userData.name}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {userData.email}
              </Text>
              <Text style={[styles.joinDate, { color: theme.colors.textSecondary }]}>
                Потребител от {userData.joinDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Статистики */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Статистики
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {profile.streakDays}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Дни стрийк
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {profile.completedAchievements}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Постижения
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                {profile.missions.completed.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Мисии
              </Text>
            </View>
          </View>
          
          {/* Прогрес бар за ниво */}
          <View style={styles.progressSection}>
            <LevelProgressBar 
              xp={profile.xp}
              level={profile.level}
            />
          </View>
        </View>

        {/* Постижения */}
        <View style={[styles.achievementsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Постижения
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(SCREENS.ACHIEVEMENTS)}>
              <Text style={[styles.seeAllButton, { color: theme.colors.primary }]}>
                Виж всички
              </Text>
            </TouchableOpacity>
          </View>
          
          {profile.achievements.filter(a => a.isCompleted).length > 0 ? (
            profile.achievements
              .filter(a => a.isCompleted)
              .slice(0, 2)
              .map((achievement, index) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <AchievementCard 
                    achievement={achievement}
                    onPress={() => handleAchievementPress(achievement.id)}
                  />
                </View>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Няма завършени постижения
              </Text>
            </View>
          )}
        </View>

        {/* Активни мисии */}
        <View style={[styles.missionsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Активни мисии
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(SCREENS.ACHIEVEMENTS, { initialTab: 'missions' })}>
              <Text style={[styles.seeAllButton, { color: theme.colors.primary }]}>
                Виж всички
              </Text>
            </TouchableOpacity>
          </View>
          
          {profile.missions.active.length > 0 ? (
            profile.missions.active.slice(0, 2).map((mission, index) => (
              <View key={mission.id} style={styles.missionItem}>
                <MissionCard 
                  mission={mission}
                  onPress={() => handleMissionPress(mission.id)}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Няма активни мисии
              </Text>
            </View>
          )}
        </View>

        {/* Настройки */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Настройки
          </Text>
          
          {/* Тъмна тема */}
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                Тъмна тема
              </Text>
            </View>
            <Switch
              value={theme.dark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={theme.dark ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          
          {/* Известия */}
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                Известия
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          
          {/* Изход */}
          <TouchableOpacity 
            style={[styles.settingsItem, styles.logoutItem]}
            onPress={() => Alert.alert('Изход', 'Сигурни ли сте, че искате да излезете?', [
              { text: 'Отказ', style: 'cancel' },
              { text: 'Изход', style: 'destructive' }
            ])}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>
              Изход от акаунта
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Версия */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Версия 1.0.0
          </Text>
        </View>
        
        {/* Bottom spacing за tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Минималистичен header
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  
  // Чиста профилна карта
  profileCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  levelBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
  },
  
  // Статистики
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressSection: {
    marginTop: 8,
  },
  
  // Секции
  achievementsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  missionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Елементи
  achievementItem: {
    marginBottom: 12,
  },
  missionItem: {
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Настройки
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingsItemLeft: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Версия
  versionContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
  
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen; 