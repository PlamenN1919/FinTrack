import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../utils/ThemeContext';

interface TimelineStepProps {
  icon: string;
  title: string;
  description: string;
  isLast?: boolean;
}

interface TimelineProps {
  steps: TimelineStepProps[];
  style?: ViewStyle;
}

const TimelineStep: React.FC<TimelineStepProps & { isDark: boolean }> = ({ 
  icon, 
  title, 
  description, 
  isLast = false,
  isDark 
}) => {
  return (
    <View style={styles.stepContainer}>
      {/* Timeline Icon */}
      <View style={styles.iconSection}>
        {/* Градиентен обръч */}
        <View style={styles.iconRingContainer}>
          <LinearGradient
            colors={['#2D2B24', '#A68A64', '#F5F0E8']}
            style={styles.iconRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4A5568', '#2D3748', '#1A202C']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name={icon} size={22} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#2D3748' }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: isDark ? '#E2E8F0' : '#4A5568' }]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const TimelineCard: React.FC<TimelineProps> = ({ steps, style }) => {
  const { theme } = useTheme();
  const isDark = theme.dark;

  // Изчисляваме височината на линията - спира преди последната икона
  const lineHeight = (steps.length - 1) * 80; // 80px е разстоянието между стъпките (marginBottom 24 + icon height 56)

  return (
    <View style={[styles.container, style]}>
      {/* Continuous Timeline Line - спира преди последната икона */}
      <View style={[
        styles.timelineLine, 
        { 
          backgroundColor: isDark ? '#4A5568' : '#2D3748',
          height: lineHeight 
        }
      ]} />
      
      {steps.map((step, index) => (
        <TimelineStep
          key={index}
          icon={step.icon}
          title={step.title}
          description={step.description}
          isLast={index === steps.length - 1}
          isDark={isDark}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 47,
    top: 44,
    width: 2,
    borderRadius: 1,
    opacity: 0.8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
    zIndex: 1,
  },
  iconRingContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentSection: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
});

export default TimelineCard; 