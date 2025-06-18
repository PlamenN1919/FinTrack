import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import { MISSION_TYPES } from '../../utils/constants';

interface MissionFiltersProps {
  selectedType: string;
  selectedDifficulty: string;
  onTypeChange: (type: string) => void;
  onDifficultyChange: (difficulty: string) => void;
}

const MissionFilters: React.FC<MissionFiltersProps> = ({
  selectedType,
  selectedDifficulty,
  onTypeChange,
  onDifficultyChange,
}) => {
  const { theme } = useTheme();

  const missionTypes = [
    { key: 'all', label: 'Всички', icon: '🎯', color: '#6C63FF' },
    { key: MISSION_TYPES.DAILY, label: 'Дневни', icon: '☀️', color: '#2196F3' },
    { key: MISSION_TYPES.WEEKLY, label: 'Седмични', icon: '📅', color: '#4CAF50' },
    { key: MISSION_TYPES.MONTHLY, label: 'Месечни', icon: '🗓️', color: '#9C27B0' },
    { key: MISSION_TYPES.SPECIAL, label: 'Специални', icon: '⭐', color: '#FFC107' },
  ];

  const difficultyLevels = [
    { key: 'all', label: 'Всички', icon: '🎲', color: '#6C63FF' },
    { key: 'easy', label: 'Лесни', icon: '⭐', color: '#4CAF50' },
    { key: 'medium', label: 'Средни', icon: '⭐⭐', color: '#FF9800' },
    { key: 'hard', label: 'Трудни', icon: '⭐⭐⭐', color: '#F44336' },
  ];

  const renderFilterChip = (
    item: any,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={item.key}
      style={[
        styles.filterChip,
        {
          backgroundColor: isSelected ? item.color + '20' : theme.colors.card,
          borderColor: isSelected ? item.color : theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && (
        <LinearGradient
          colors={[item.color + '30', item.color + '10']}
          style={styles.chipGradient}
        />
      )}
      <Text style={styles.chipIcon}>{item.icon}</Text>
      <Text
        style={[
          styles.chipText,
          {
            color: isSelected ? item.color : theme.colors.textSecondary,
            fontWeight: isSelected ? 'bold' : 'normal',
          },
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Филтри по тип */}
      <View style={styles.filterSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Тип мисии
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {missionTypes.map((type) =>
            renderFilterChip(
              type,
              selectedType === type.key,
              () => onTypeChange(type.key)
            )
          )}
        </ScrollView>
      </View>

      {/* Филтри по трудност */}
      <View style={styles.filterSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Трудност
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {difficultyLevels.map((difficulty) =>
            renderFilterChip(
              difficulty,
              selectedDifficulty === difficulty.key,
              () => onDifficultyChange(difficulty.key)
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  filtersRow: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    overflow: 'hidden',
  },
  chipGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MissionFilters; 