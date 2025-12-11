import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '../../models/gamification';
import { useTheme } from '../../utils/ThemeContext';
import { ACHIEVEMENT_RARITY } from '../../utils/constants';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
  compact?: boolean; // За по-компактен изглед в някои екрани
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onPress, compact = false }) => {
  const { theme } = useTheme();
  
  // Безопасни стойности с fallbacks
  const safeAchievement = {
    id: achievement?.id || 'unknown',
    name: achievement?.name || 'Неизвестно постижение',
    description: achievement?.description || 'Няма описание',
    icon: achievement?.icon || '🏆',
    rarity: achievement?.rarity || ACHIEVEMENT_RARITY.COMMON,
    xpReward: typeof achievement?.xpReward === 'number' ? achievement.xpReward : 0,
    progress: typeof achievement?.progress === 'number' ? achievement.progress : 0,
    maxProgress: typeof achievement?.maxProgress === 'number' ? achievement.maxProgress : 1,
    isCompleted: Boolean(achievement?.isCompleted),
    dateCompleted: achievement?.dateCompleted,
  };
  
  // Получаване на цвят според рядкостта
  const getRarityColor = React.useCallback((rarity: string) => {
    try {
      switch (rarity) {
        case ACHIEVEMENT_RARITY.COMMON:
          return '#A0A0A0';
        case ACHIEVEMENT_RARITY.UNCOMMON:
          return '#4CAF50';
        case ACHIEVEMENT_RARITY.RARE:
          return '#2196F3';
        case ACHIEVEMENT_RARITY.EPIC:
          return '#9C27B0';
        case ACHIEVEMENT_RARITY.LEGENDARY:
          return '#FFC107';
        default:
          return theme.colors.primary;
      }
    } catch (error) {
      console.warn('Error getting rarity color:', error);
      return theme.colors.primary;
    }
  }, [theme.colors.primary]);
  
  // Получаване на етикет за рядкостта
  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case ACHIEVEMENT_RARITY.COMMON:
        return 'Обикновено';
      case ACHIEVEMENT_RARITY.UNCOMMON:
        return 'Необикновено';
      case ACHIEVEMENT_RARITY.RARE:
        return 'Рядко';
      case ACHIEVEMENT_RARITY.EPIC:
        return 'Епично';
      case ACHIEVEMENT_RARITY.LEGENDARY:
        return 'Легендарно';
      default:
        return '';
    }
  };
  
  const rarityColor = getRarityColor(safeAchievement.rarity);
  const rarityLabel = getRarityLabel(safeAchievement.rarity);
  const progressPercentage = React.useMemo(() => {
    try {
      if (safeAchievement.maxProgress === 0) return 100;
      return Math.min(Math.floor((safeAchievement.progress / safeAchievement.maxProgress) * 100), 100);
    } catch (error) {
      console.warn('Error calculating progress percentage:', error);
      return 0;
    }
  }, [safeAchievement.progress, safeAchievement.maxProgress]);
  
  // Валидация на achievement обекта
  if (!achievement) {
    console.warn('AchievementCard: achievement prop is required');
    return null;
  }
  
  // Компактен изглед
  if (compact) {
    return (
      <TouchableOpacity 
        style={[
          styles.compactContainer, 
          { 
            backgroundColor: theme.colors.card,
            borderColor: safeAchievement.isCompleted ? rarityColor : 'transparent',
          }
        ]}
        onPress={onPress}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>{safeAchievement.icon}</Text>
          <Text 
            style={[styles.compactName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {safeAchievement.name}
          </Text>
        </View>
        
        {safeAchievement.isCompleted ? (
          <View style={[styles.completedBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        ) : (
          <Text style={[styles.compactProgress, { color: theme.colors.textSecondary }]}>
            {progressPercentage}%
          </Text>
        )}
      </TouchableOpacity>
    );
  }
  
  // Пълен изглед
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{safeAchievement.icon}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {safeAchievement.name}
          </Text>
          <Text style={[styles.rarityLabel, { color: rarityColor }]}>
            {rarityLabel}
          </Text>
        </View>
        <Text style={[styles.xpReward, { color: theme.colors.primary }]}>
          +{safeAchievement.xpReward} XP
        </Text>
      </View>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {safeAchievement.description}
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: rarityColor,
                width: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {safeAchievement.progress} / {safeAchievement.maxProgress}
          {safeAchievement.isCompleted && ' • Завършено'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rarityLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpReward: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  compactProgress: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AchievementCard; 