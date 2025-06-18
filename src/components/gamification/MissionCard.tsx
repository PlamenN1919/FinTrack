import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Mission } from '../../models/gamification';
import { useTheme } from '../../utils/ThemeContext';
import { MISSION_TYPES } from '../../utils/constants';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onPress }) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Получаване на цвят според типа мисия
  const getMissionTypeColor = (type: string) => {
    switch (type) {
      case MISSION_TYPES.DAILY:
        return '#2196F3'; // Синьо
      case MISSION_TYPES.WEEKLY:
        return '#4CAF50'; // Зелено
      case MISSION_TYPES.MONTHLY:
        return '#9C27B0'; // Лилаво
      case MISSION_TYPES.SPECIAL:
        return '#FFC107'; // Жълто
      default:
        return theme.colors.primary;
    }
  };

  // Получаване на градиент според типа мисия
  const getMissionGradient = (type: string) => {
    switch (type) {
      case MISSION_TYPES.DAILY:
        return ['#2196F3', '#21CBF3']; // Синьо към светло синьо
      case MISSION_TYPES.WEEKLY:
        return ['#4CAF50', '#8BC34A']; // Зелено към светло зелено
      case MISSION_TYPES.MONTHLY:
        return ['#9C27B0', '#E91E63']; // Лилаво към розово
      case MISSION_TYPES.SPECIAL:
        return ['#FFC107', '#FF9800']; // Жълто към оранжево
      default:
        return [theme.colors.primary, theme.colors.primary];
    }
  };

  // Получаване на difficulty според XP наградата
  const getDifficulty = (xpReward: number) => {
    if (xpReward <= 10) return { label: 'Лесно', color: '#4CAF50', icon: '⭐' };
    if (xpReward <= 30) return { label: 'Средно', color: '#FF9800', icon: '⭐⭐' };
    return { label: 'Трудно', color: '#F44336', icon: '⭐⭐⭐' };
  };
  
  // Получаване на етикет за типа мисия
  const getMissionTypeLabel = (type: string) => {
    switch (type) {
      case MISSION_TYPES.DAILY:
        return 'Дневна';
      case MISSION_TYPES.WEEKLY:
        return 'Седмична';
      case MISSION_TYPES.MONTHLY:
        return 'Месечна';
      case MISSION_TYPES.SPECIAL:
        return 'Специална';
      default:
        return '';
    }
  };
  
  // Форматиране на оставащо време
  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Изтекла';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'час' : 'часа'}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${diffDays === 1 ? 'ден' : 'дни'}`;
    }
  };
  
  const typeColor = getMissionTypeColor(mission.type);
  const typeLabel = getMissionTypeLabel(mission.type);
  const timeRemaining = formatTimeRemaining(mission.expiresAt);
  const progressPercentage = Math.min(Math.floor((mission.progress / mission.maxProgress) * 100), 100);
  const gradient = getMissionGradient(mission.type);
  const difficulty = getDifficulty(mission.xpReward);

  // Анимация при натискане
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.colors.card }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Градиентна лента отгоре */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}
        />

        <View style={styles.header}>
          <Text style={styles.icon}>{mission.icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {mission.name}
            </Text>
            <View style={styles.labelContainer}>
              <View style={[styles.typeLabel, { backgroundColor: typeColor + '20', borderColor: typeColor }]}>
                <Text style={[styles.typeLabelText, { color: typeColor }]}>{typeLabel}</Text>
              </View>
              
              {/* Difficulty Badge */}
              <View style={[styles.difficultyBadge, { backgroundColor: difficulty.color + '20', borderColor: difficulty.color }]}>
                <Text style={[styles.difficultyText, { color: difficulty.color }]}>
                  {difficulty.icon} {difficulty.label}
                </Text>
              </View>
              
              {!mission.isCompleted && (
                <Text style={[styles.timeRemaining, { color: theme.colors.textSecondary }]}>
                  Остават: {timeRemaining}
                </Text>
              )}
            </View>
          </View>
          <Text style={[styles.xpReward, { color: theme.colors.primary }]}>
            +{mission.xpReward} XP
          </Text>
        </View>
        
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {mission.description}
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
              colors={mission.isCompleted ? [theme.colors.success, theme.colors.success] : gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {mission.progress} / {mission.maxProgress} ({progressPercentage}%)
            </Text>
            {mission.isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.completedText}>✅ Завършена</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
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
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeRemaining: {
    fontSize: 12,
    marginTop: 2,
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
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MissionCard; 