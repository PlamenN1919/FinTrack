import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface OverlayProps {
  title: string;
  message: string;
  icon: string;
  color: string;
  onDismiss: () => void;
  showXP?: boolean;
  xpAmount?: number;
}

const { width } = Dimensions.get('window');

const GamificationOverlay: React.FC<OverlayProps> = ({ 
  title, 
  message, 
  icon, 
  color,
  onDismiss,
  showXP = false,
  xpAmount = 0,
}) => {
  const { theme } = useTheme();
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Анимирано показване
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Автоматично скриване след 5 секунди
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    // Анимирано скриване
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };
  
  // Изчисляване на трансформации за анимацията
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });
  
  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          </View>
          {showXP && (
            <View style={[styles.xpBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.xpText}>+{xpAmount} XP</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
            Затвори
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    width: width - 40,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  xpText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Пример за използване:
// 
// const [notifications, setNotifications] = useState<React.ReactNode[]>([]);
//
// const showAchievementNotification = (achievement: Achievement) => {
//   const notificationId = Date.now().toString();
//   
//   const notification = (
//     <GamificationOverlay
//       key={notificationId}
//       title={`Ново постижение: ${achievement.name}`}
//       message={achievement.description}
//       icon={achievement.icon}
//       color="#4CAF50"
//       showXP
//       xpAmount={achievement.xpReward}
//       onDismiss={() => {
//         setNotifications(prev => prev.filter(n => n.key !== notificationId));
//       }}
//     />
//   );
//   
//   setNotifications(prev => [...prev, notification]);
// };

export default GamificationOverlay; 