import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Гамификация компоненти и услуги
import LevelProgressBar from '../components/gamification/LevelProgressBar';
import AchievementCard from '../components/gamification/AchievementCard';
import MissionCard from '../components/gamification/MissionCard';
import MissionFilters from '../components/gamification/MissionFilters';
import gamificationService from '../services/GamificationService';
import { Achievement, Mission } from '../models/gamification';
import { ACHIEVEMENT_TYPES, MISSION_TYPES } from '../utils/constants';

const AchievementsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements', 'missions', 'rewards'
  const [profile, setProfile] = useState(gamificationService.getProfile());
  const [filterType, setFilterType] = useState('all'); // 'all' или конкретен тип
  const [selectedMissionType, setSelectedMissionType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isGamificationReady, setIsGamificationReady] = useState(gamificationService.isReady());
  
  // Event listeners за геймификацията
  useEffect(() => {
    // Функция за обновяване на профила
    const updateProfile = (newProfile: typeof profile) => {
      setProfile(newProfile);
      setIsGamificationReady(true);
      console.log('📊 Achievements profile updated');
    };

    // Слушаме за инициализация на геймификацията
    gamificationService.onInitialized(updateProfile);
    
    // Слушаме за обновявания на профила
    gamificationService.onProfileUpdated(updateProfile);

    // Cleanup
    return () => {
      gamificationService.offProfileUpdated(updateProfile);
    };
  }, []);

  // Refresh профила при промяна на таба (за сигурност)
  useEffect(() => {
    if (isGamificationReady) {
      const freshProfile = gamificationService.getProfile();
      setProfile(freshProfile);
    }
  }, [activeTab, isGamificationReady]);
  
  // Филтриране на постижения по тип
  const getFilteredAchievements = () => {
    if (filterType === 'all') {
      return profile.achievements;
    } else if (filterType === 'completed') {
      return profile.achievements.filter(a => a.isCompleted);
    } else if (filterType === 'inprogress') {
      return profile.achievements.filter(a => !a.isCompleted);
    } else if (filterType === 'saving') {
      return profile.achievements.filter(a => a.type === ACHIEVEMENT_TYPES.SAVING);
    } else {
      return profile.achievements.filter(a => a.type === filterType);
    }
  };
  
  // Получаване на етикет за тип постижение
  const getAchievementTypeLabel = (type: string) => {
    switch (type) {
      case ACHIEVEMENT_TYPES.SAVING:
        return 'Спестяване';
      case ACHIEVEMENT_TYPES.BUDGETING:
        return 'Бюджетиране';
      case ACHIEVEMENT_TYPES.TRACKING:
        return 'Проследяване';
      case ACHIEVEMENT_TYPES.LEARNING:
        return 'Обучение';
      case ACHIEVEMENT_TYPES.CONSISTENCY:
        return 'Последователност';
      case ACHIEVEMENT_TYPES.GOALS:
        return 'Цели';
      default:
        return 'Всички';
    }
  };
  
  // Обработка на натискане върху постижение
  const handleAchievementPress = (achievement: Achievement) => {
    Alert.alert(
      achievement.name,
      `${achievement.description}\n\nНаграда: ${achievement.xpReward} XP\n${achievement.isCompleted ? `Завършено на: ${new Date(achievement.dateCompleted!).toLocaleDateString('bg-BG')}` : ''}`,
      [{ text: 'Затвори', style: 'cancel' }]
    );
  };
  
  // Обработка на натискане върху мисия
  const handleMissionPress = (mission: Mission) => {
    Alert.alert(
      mission.name,
      `${mission.description}\n\nНаграда: ${mission.xpReward} XP\n${mission.isCompleted ? `Завършена на: ${new Date(mission.completedAt!).toLocaleDateString('bg-BG')}` : `Изтича на: ${new Date(mission.expiresAt).toLocaleDateString('bg-BG')}`}`,
      [{ text: 'Затвори', style: 'cancel' }]
    );
  };
  
  // Обработка на започване на мисия
  const handleStartMission = (mission: Mission) => {
    const updatedMission = gamificationService.startMission(mission.id);
    if (updatedMission) {
      setProfile(gamificationService.getProfile());
      Alert.alert('Мисия започната', 'Успешно започнахте новата мисия!');
    }
  };

  // Филтриране на мисии
  const getFilteredMissions = (missions: Mission[]) => {
    return missions.filter((mission) => {
      // Филтър по тип
      const typeMatch = selectedMissionType === 'all' || mission.type === selectedMissionType;
      
      // Филтър по трудност
      let difficultyMatch = true;
      if (selectedDifficulty !== 'all') {
        const xpReward = mission.xpReward;
        if (selectedDifficulty === 'easy' && xpReward > 10) difficultyMatch = false;
        if (selectedDifficulty === 'medium' && (xpReward <= 10 || xpReward > 30)) difficultyMatch = false;
        if (selectedDifficulty === 'hard' && xpReward <= 30) difficultyMatch = false;
      }
      
      return typeMatch && difficultyMatch;
    });
  };
  
  // Рендериране на таб за постижения
  const renderAchievementsTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
    >
      {/* Компактни филтри */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalFilters}
        >
          <TouchableOpacity
            style={[
              styles.compactFilterChip,
              filterType === 'all' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.compactFilterText,
                { color: filterType === 'all' ? 'white' : theme.colors.text }
              ]}
            >
              Всички
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.compactFilterChip,
              filterType === 'completed' && { backgroundColor: theme.colors.success }
            ]}
            onPress={() => setFilterType('completed')}
          >
            <Text
              style={[
                styles.compactFilterText,
                { color: filterType === 'completed' ? 'white' : theme.colors.text }
              ]}
            >
              Завършени
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.compactFilterChip,
              filterType === 'inprogress' && { backgroundColor: theme.colors.warning }
            ]}
            onPress={() => setFilterType('inprogress')}
          >
            <Text
              style={[
                styles.compactFilterText,
                { color: filterType === 'inprogress' ? 'white' : theme.colors.text }
              ]}
            >
              В процес
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.compactFilterChip,
              filterType === 'saving' && { backgroundColor: '#4CAF50' }
            ]}
            onPress={() => setFilterType('saving')}
          >
            <Text
              style={[
                styles.compactFilterText,
                { color: filterType === 'saving' ? 'white' : theme.colors.text }
              ]}
            >
              Спестявания
            </Text>
          </TouchableOpacity>

          {Object.values(ACHIEVEMENT_TYPES).filter(type => type !== 'saving').map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.compactFilterChip,
                filterType === type && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.compactFilterText,
                  { color: filterType === type ? 'white' : theme.colors.text }
                ]}
              >
                {getAchievementTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Компактни статистики */}
      <View style={[styles.compactStatsContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.compactStatsRow}>
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: theme.colors.success }]}>
              {getFilteredAchievements().filter(a => a.isCompleted).length}
            </Text>
            <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
              Завършени
            </Text>
          </View>
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: theme.colors.primary }]}>
              {getFilteredAchievements().length}
            </Text>
            <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
              Общо
            </Text>
          </View>
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: theme.colors.warning }]}>
              {getFilteredAchievements().filter(a => !a.isCompleted).length}
            </Text>
            <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
              В процес
            </Text>
          </View>
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: theme.colors.error }]}>
              {Math.round((getFilteredAchievements().filter(a => a.isCompleted).length / getFilteredAchievements().length) * 100) || 0}%
            </Text>
            <Text style={[styles.compactStatLabel, { color: theme.colors.textSecondary }]}>
              Прогрес
            </Text>
          </View>
        </View>
      </View>
      
      {/* Списък с постижения */}
      <View style={styles.achievementsListContainer}>
        {getFilteredAchievements().map((item) => (
          <AchievementCard 
            key={item.id}
            achievement={item} 
            onPress={() => handleAchievementPress(item)}
          />
        ))}
        
        {getFilteredAchievements().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Няма постижения за показване в тази категория
            </Text>
          </View>
        )}
      </View>
      
      {/* Долно разстояние за навигацията */}
      <View style={styles.bottomNavSpacing} />
    </ScrollView>
  );
  
  // Рендериране на таб за мисии
  const renderMissionsTab = () => {
    const filteredActiveMissions = getFilteredMissions(profile.missions.active);
    const filteredCompletedMissions = getFilteredMissions(profile.missions.completed);

    return (
      <ScrollView 
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.missionsHeader}>
          <Text style={[styles.missionsTitle, { color: theme.colors.text }]}>
            Мисии
          </Text>
          <Text style={[styles.missionsSubtitle, { color: theme.colors.textSecondary }]}>
            Завършете мисии, за да получите XP и отключите награди
          </Text>
        </View>

        {/* Филтри за мисии */}
        <MissionFilters
          selectedType={selectedMissionType}
          selectedDifficulty={selectedDifficulty}
          onTypeChange={setSelectedMissionType}
          onDifficultyChange={setSelectedDifficulty}
        />
      
      <View style={styles.dailyStreakContainer}>
        <Text style={[styles.dailyStreakTitle, { color: theme.colors.text }]}>
          Последователни дни
        </Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakCount, { color: theme.colors.primary }]}>
            {profile.streakDays}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
            {profile.streakDays === 1 ? 'ден' : 'дни'}
          </Text>
          {profile.streakDays >= 7 && (
            <View style={[styles.streakBonus, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.streakBonusText}>+25 XP бонус</Text>
            </View>
          )}
        </View>
      </View>
      
        {/* Активни мисии */}
        <View style={styles.activeMissionsContainer}>
          <Text style={[styles.completedMissionsTitle, { color: theme.colors.text, marginBottom: 12 }]}>
            Активни мисии ({filteredActiveMissions.length})
          </Text>
          {filteredActiveMissions.map((item) => (
            <MissionCard 
              key={item.id}
              mission={item} 
              onPress={() => handleMissionPress(item)}
            />
          ))}
          
          {filteredActiveMissions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Няма активни мисии за показване с избраните филтри
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.completedMissionsHeader}>
          <Text style={[styles.completedMissionsTitle, { color: theme.colors.text }]}>
            Завършени мисии ({filteredCompletedMissions.length})
          </Text>
        </View>
        
        {/* Завършени мисии */}
        <View style={styles.completedMissionsContainer}>
          {filteredCompletedMissions.slice(0, 5).map((item) => (
            <MissionCard 
              key={item.id}
              mission={item} 
              onPress={() => handleMissionPress(item)}
            />
          ))}
          
          {filteredCompletedMissions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Няма завършени мисии за показване с избраните филтри
              </Text>
            </View>
          )}
        </View>
        
        {/* Долно разстояние за навигацията */}
        <View style={styles.bottomNavSpacing} />
      </ScrollView>
    );
  };
  
  // Рендериране на таб за награди
  const renderRewardsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <Text style={[styles.rewardsTitle, { color: theme.colors.text }]}>
        Отключени награди
      </Text>
      
      <View style={styles.rewardsContainer}>
        {profile.rewards.filter(r => r.isUnlocked).map(reward => (
          <View 
            key={reward.id}
            style={[styles.rewardItem, { backgroundColor: theme.colors.card }]}
          >
            <Text style={styles.rewardIcon}>{reward.icon}</Text>
            <Text style={[styles.rewardName, { color: theme.colors.text }]}>
              {reward.name}
            </Text>
            <Text style={[styles.rewardDescription, { color: theme.colors.textSecondary }]}>
              {reward.description}
            </Text>
            <Text style={[styles.rewardDate, { color: theme.colors.primary }]}>
              Отключено на: {new Date(reward.dateUnlocked!).toLocaleDateString('bg-BG')}
            </Text>
          </View>
        ))}
        
        {profile.rewards.filter(r => r.isUnlocked).length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Все още нямате отключени награди
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.rewardsTitle, { color: theme.colors.text, marginTop: 24 }]}>
        Предстоящи награди
      </Text>
      
      <View style={styles.rewardsContainer}>
        {profile.rewards.filter(r => !r.isUnlocked).map(reward => (
          <View 
            key={reward.id}
            style={[styles.rewardItem, { backgroundColor: theme.colors.card }]}
          >
            <Text style={styles.rewardIcon}>{reward.icon}</Text>
            <Text style={[styles.rewardName, { color: theme.colors.text }]}>
              {reward.name}
            </Text>
            <Text style={[styles.rewardDescription, { color: theme.colors.textSecondary }]}>
              {reward.description}
            </Text>
            <View style={[styles.lockedBadge, { backgroundColor: theme.colors.error + '20' }]}>
              <Text style={[styles.lockedText, { color: theme.colors.error }]}>
                Заключено
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Долно разстояние за навигацията */}
      <View style={styles.bottomNavSpacing} />
    </ScrollView>
  );

  // Обновяване на мисиите
  const handleRefreshMissions = () => {
    gamificationService.refreshMissionsAndRewards();
    setProfile(gamificationService.getProfile());
    Alert.alert('Обновено', 'Мисиите и наградите са обновени с най-новите данни!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Постижения и Мисии
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleRefreshMissions}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      
      <LevelProgressBar 
        xp={profile.xp}
        level={profile.level}
      />
      
      {/* Табове */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'achievements' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'achievements' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Постижения
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'missions' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('missions')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'missions' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Мисии
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'rewards' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
          ]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'rewards' ? theme.colors.primary : theme.colors.textSecondary }
            ]}
          >
            Награди
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Съдържание на табовете */}
      {activeTab === 'achievements' && renderAchievementsTab()}
      {activeTab === 'missions' && renderMissionsTab()}
      {activeTab === 'rewards' && renderRewardsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainFiltersContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  mainFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mainFilterChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  mainFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryFiltersContainer: {
    marginBottom: 16,
  },
  categoryFiltersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryFilterChip: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  categoryFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  // Нови стилове за компактните филтри
  filtersContainer: {
    paddingVertical: 16,
  },
  horizontalFilters: {
    paddingHorizontal: 16,
  },
  compactFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 80,
    alignItems: 'center',
  },
  compactFilterText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  compactStatsContainer: {
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  compactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactStatItem: {
    alignItems: 'center',
  },
  compactStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  achievementsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  missionsHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  missionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  missionsSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  dailyStreakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dailyStreakTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  streakLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  streakBonus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBonusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedMissionsHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  completedMissionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardDate: {
    fontSize: 10,
    textAlign: 'center',
  },
  lockedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  bottomNavSpacing: {
    height: 100,
  },
  activeMissionsContainer: {
    marginBottom: 16,
  },
  completedMissionsContainer: {
    marginBottom: 16,
  },
});

export default AchievementsScreen; 