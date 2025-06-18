import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { calculateLevelProgress } from '../../models/gamification';
import { LEVEL_THRESHOLDS } from '../../utils/constants';

interface LevelProgressBarProps {
  xp: number;
  level: number;
  compact?: boolean;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ xp, level, compact = false }) => {
  const { theme } = useTheme();
  
  // Валидация на входните данни
  const safeXP = typeof xp === 'number' && !isNaN(xp) && xp >= 0 ? xp : 0;
  const safeLevel = typeof level === 'number' && !isNaN(level) && level >= 1 ? level : 1;
  
  // Изчисляване на прогрес към следващото ниво в проценти
  const progress = React.useMemo(() => {
    try {
      return calculateLevelProgress(safeXP, LEVEL_THRESHOLDS);
    } catch (error) {
      console.warn('Error calculating level progress:', error);
      return 0;
    }
  }, [safeXP]);
  
  // Изчисляване на необходим опит за следващото ниво
  const calculateXPForNextLevel = React.useCallback(() => {
    try {
      if (safeLevel >= LEVEL_THRESHOLDS.length) {
        return {
          current: 0,
          total: 0,
          remaining: 0
        }; // Максимално ниво
      }
      
      const currentLevelThreshold = LEVEL_THRESHOLDS[safeLevel - 1] || 0;
      const nextLevelThreshold = LEVEL_THRESHOLDS[safeLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
      const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;
      const remainingXP = Math.max(0, nextLevelThreshold - safeXP);
      
      return {
        current: Math.max(0, safeXP - currentLevelThreshold),
        total: xpForNextLevel,
        remaining: remainingXP
      };
    } catch (error) {
      console.warn('Error calculating XP for next level:', error);
      return {
        current: 0,
        total: 100,
        remaining: 100
      };
    }
  }, [safeXP, safeLevel]);
  
  const xpInfo = calculateXPForNextLevel();
  
  // Компактен изглед
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.levelBadgeCompact}>
          <Text style={styles.levelTextCompact}>{level}</Text>
        </View>
        <View style={[styles.progressBarContainerCompact, { backgroundColor: theme.colors.background }]}>
          <View 
            style={[
              styles.progressBarFillCompact,
              { backgroundColor: theme.colors.primary, width: `${progress}%` }
            ]} 
          />
        </View>
      </View>
    );
  }
  
  // Пълен изглед
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.levelText}>{safeLevel}</Text>
          </View>
          <Text style={[styles.levelLabel, { color: theme.colors.text }]}>Ниво</Text>
        </View>
        <Text style={[styles.xpText, { color: theme.colors.primary }]}>
          {safeXP} XP общо
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
          <View 
            style={[
              styles.progressBarFill,
              { backgroundColor: theme.colors.primary, width: `${progress}%` }
            ]} 
          />
        </View>
        {safeLevel < LEVEL_THRESHOLDS.length && (
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {xpInfo.current} / {xpInfo.total} XP
            </Text>
            <Text style={[styles.nextLevelText, { color: theme.colors.textSecondary }]}>
              Още {xpInfo.remaining} XP до ниво {safeLevel + 1}
            </Text>
          </View>
        )}
        {safeLevel >= LEVEL_THRESHOLDS.length && (
          <Text style={[styles.maxLevelText, { color: theme.colors.success }]}>
            Максимално ниво достигнато!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    display: 'flex',
  },
  levelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  nextLevelText: {
    fontSize: 12,
  },
  maxLevelText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Стилове за компактния изглед
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  levelBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4E7FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    display: 'flex',
  },
  levelTextCompact: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 12,
    includeFontPadding: false,
  },
  progressBarContainerCompact: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillCompact: {
    height: 6,
    borderRadius: 3,
  },
});

export default LevelProgressBar; 