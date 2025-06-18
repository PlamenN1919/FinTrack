import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

// Импортиране на икони
import HomeIcon from '../icons/HomeIcon';
import TransactionsIcon from '../icons/TransactionsIcon';
import BudgetsIcon from '../icons/BudgetsIcon';
import ReportsIcon from '../icons/ReportsIcon';
import ScannerIcon from '../icons/ScannerIcon';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();

  // Анимации за всеки таб
  const animatedValues = useRef(
    state.routes.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.7),
      translateY: new Animated.Value(0),
    }))
  ).current;

  // Пулсираща анимация за диамантния бутон
  const diamondPulse = useRef(new Animated.Value(1)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const breathingValue = useRef(new Animated.Value(1)).current;
  const rippleValue = useRef(new Animated.Value(0)).current;


  // Анимационни ефекти при смяна на таб
  useEffect(() => {
    state.routes.forEach((route: any, index: number) => {
      const isFocused = state.index === index;
      const isScanner = route.name === 'ScannerTab';
      
      if (isScanner) return; // Skip scanner animations
      
      // Bounce анимация за активен таб
      if (isFocused) {
        Animated.parallel([
          Animated.spring(animatedValues[index].scale, {
            toValue: 1.1,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValues[index].opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValues[index].translateY, {
            toValue: -2,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Return анимация за неактивни табове
        Animated.parallel([
          Animated.spring(animatedValues[index].scale, {
            toValue: 1,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValues[index].opacity, {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValues[index].translateY, {
            toValue: 0,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [state.index, animatedValues]);

  // Continuous pulse за диамантния бутон - по-субтилен
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(diamondPulse, {
          toValue: 1.03,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(diamondPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [diamondPulse]);

  // Shimmer ефект - по-рядко
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(8000), // По-дълго чакане между shimmer ефектите
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  // Breathing анимация - много субтилна
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingValue, {
          toValue: 1.015,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimation.start();

    return () => breathingAnimation.stop();
  }, [breathingValue]);



  const getTabIcon = (routeName: string, focused: boolean, color: string) => {
    const size = 26; // Увеличен размер за по-голяма навигация
    
    switch (routeName) {
      case 'HomeTab':
        return <HomeIcon color={color} size={size} />;
      case 'TransactionsTab':
        return <TransactionsIcon color={color} size={size} />;
      case 'ScannerTab':
        return <ScannerIcon color={color} size={size} />;
      case 'BudgetsTab':
        return <BudgetsIcon color={color} size={size} />;
      case 'ReportsTab':
        return <ReportsIcon color={color} size={size} />;
      default:
        return null;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab':
        return 'Начало';
      case 'TransactionsTab':
        return 'Транзакции';
      case 'ScannerTab':
        return '';
      case 'BudgetsTab':
        return 'Бюджети';
      case 'ReportsTab':
        return 'Отчети';
      default:
        return '';
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Floating Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <LinearGradient
          colors={[theme.colors.card, theme.colors.surface]}
          style={styles.tabBar}
                >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isScanner = route.name === 'ScannerTab';

            const onPress = () => {
              // Haptic feedback за по-добро усещане
              if (Platform.OS === 'ios') {
                // iOS haptic feedback
                Vibration.vibrate(1);
              } else {
                // Android vibration
                Vibration.vibrate(10);
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Оставяме празно място за диамантения бутон
            if (isScanner) {
              return <View key={route.key} style={styles.scannerPlaceholder} />;
            }

            // Обикновени tab бутони
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabButton,
                  isFocused && styles.tabButtonFocused,
                ]}
                activeOpacity={0.7}
              >
                {/* Фокус индикатор */}
                {isFocused && (
                  <LinearGradient
                    colors={[`${theme.colors.primary}15`, `${theme.colors.primary}05`]}
                    style={styles.focusIndicator}
                  />
                )}
                
                {/* Анимирана икона */}
                <Animated.View 
                  style={[
                    styles.iconContainer,
                    {
                      transform: [
                        { scale: animatedValues[index].scale },
                        { translateY: animatedValues[index].translateY }
                      ],
                      opacity: animatedValues[index].opacity,
                    }
                  ]}
                >
                  {getTabIcon(
                    route.name,
                    isFocused,
                    isFocused ? theme.colors.primary : theme.colors.textSecondary
                  )}
                </Animated.View>
                
                {/* Label */}
                {getTabLabel(route.name) !== '' && (
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {getTabLabel(route.name)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
      
      {/* Диамантен бутон извън wrapper-а */}
      <Animated.View 
        style={[
          styles.diamondContainer,
          {
            transform: [
              { scale: Animated.multiply(diamondPulse, breathingValue) }
            ]
          }
        ]}
      >
        {/* Floating particles - по-субтилни */}
        <Animated.View 
          style={[
            styles.floatingParticle, 
            styles.particle1,
            {
              opacity: shimmerValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4],
              }),
              transform: [
                { 
                  translateY: shimmerValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  })
                }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.floatingParticle, 
            styles.particle2,
            {
              opacity: shimmerValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
              transform: [
                { 
                  translateX: shimmerValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 4],
                  })
                }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.floatingParticle, 
            styles.particle3,
            {
              opacity: shimmerValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.25],
              }),
              transform: [
                { 
                  translateY: shimmerValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  })
                }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.floatingParticle, 
            styles.particle4,
            {
              opacity: shimmerValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.35],
              }),
              transform: [
                { 
                  translateX: shimmerValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  })
                }
              ]
            }
          ]} 
        />

        <TouchableOpacity
          onPress={() => {
            // Ripple ефект при натискане
            rippleValue.setValue(0);
            Animated.timing(rippleValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start(() => {
              rippleValue.setValue(0);
            });

            // Haptic feedback
            if (Platform.OS === 'ios') {
              Vibration.vibrate(1);
            } else {
              Vibration.vibrate(10);
            }
            navigation.navigate('ScannerTab');
          }}
          style={styles.diamondButton}
          activeOpacity={0.9}
        >
          {/* Aura ефект */}
          <Animated.View 
            style={[
              styles.diamondAura,
              {
                opacity: breathingValue.interpolate({
                  inputRange: [1, 1.015],
                  outputRange: [0.15, 0.25],
                }),
                transform: [{ scale: breathingValue }]
              }
            ]} 
          />

          {/* Neumorphic ефекти */}
          <View style={styles.diamondNeumorphicShadow} />
          <View style={styles.diamondHighlight} />
          
          {/* Ripple ефект при натискане */}
          <Animated.View 
            style={[
              styles.diamondRipple,
              { 
                opacity: rippleValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.6, 0],
                }),
                transform: [
                  { 
                    scale: rippleValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.4],
                    })
                  }
                ]
              }
            ]} 
          />
          
          {/* Пулсиращ външен пръстен */}
          <Animated.View 
            style={[
              styles.diamondPulseRing,
              { 
                transform: [{ scale: diamondPulse }],
                opacity: diamondPulse.interpolate({
                  inputRange: [1, 1.03],
                  outputRange: [0.2, 0.05],
                }),
              }
            ]} 
          />
          
          {/* Външен сияещ пръстен */}
          <Animated.View 
            style={[
              styles.diamondOuterGlow, 
              { 
                shadowColor: theme.colors.accent,
                transform: [{ scale: diamondPulse }]
              }
            ]} 
          />
          
          {/* Вътрешен декоративен пръстен */}
          <View style={styles.diamondInnerRing} />

          {/* Shimmer ефект */}
          <Animated.View style={styles.diamondShimmer}>
            <Animated.View
              style={[
                styles.shimmerGradient,
                {
                  transform: [
                    {
                      translateX: shimmerValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-68, 68],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255, 255, 255, 0.4)',
                  'rgba(255, 255, 255, 0.8)',
                  'rgba(255, 255, 255, 0.4)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
          
          {/* Диамантен фон с градиент */}
          <View style={styles.diamondShape}>
            <LinearGradient
              colors={theme.colors.accentGradient}
              style={styles.diamondGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Вътрешен блестящ ефект */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                style={styles.diamondShine}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              {/* Икона */}
              <View style={styles.diamondIconContainer}>
                {getTabIcon('ScannerTab', true, '#1A1A1A')}
              </View>
            </LinearGradient>
          </View>
          
          {/* Премиум сенки система */}
          {/* Основна сенка */}
          <Animated.View 
            style={[
              styles.diamondShadow, 
              { 
                shadowColor: theme.colors.accent,
                transform: [{ scale: diamondPulse }]
              }
            ]} 
          />
          
          {/* Дълбока сенка */}
          <Animated.View 
            style={[
              styles.diamondDeepShadow, 
              { 
                shadowColor: '#000',
                transform: [{ scale: diamondPulse }]
              }
            ]} 
          />
          
          {/* Светещ ефект */}
          <Animated.View 
            style={[
              styles.diamondGlow, 
              { 
                shadowColor: theme.colors.accent,
                transform: [{ scale: diamondPulse }]
              }
            ]} 
          />
          
          {/* Допълнителна цветна сенка */}
          <Animated.View 
            style={[
              styles.diamondColorShadow, 
              { 
                shadowColor: theme.colors.primary,
                transform: [{ scale: diamondPulse }]
              }
            ]} 
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tabBarWrapper: {
    borderRadius: 35,
    marginHorizontal: 8,
    marginBottom: Platform.OS === 'ios' ? 34 : 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 80,
    overflow: 'visible',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
    minHeight: 70,
  },
  tabButtonFocused: {
    transform: [{ scale: 1.02 }],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    marginHorizontal: 2,
  },
  focusIndicator: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    bottom: 6,
    borderRadius: 30,
  },
  iconContainer: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Диамантен CTA бутон стилове
  diamondContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 35,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 20,
    pointerEvents: 'box-none', // Важно: позволява touch events да преминават към долните елементи
  },
  diamondButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 100,
    height: 100,
  },
  diamondShape: {
    width: 68,
    height: 68,
    transform: [{ rotate: '45deg' }],
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 100,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  diamondGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
  },
  diamondIconContainer: {
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondShadow: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
    top: 5,
  },
  diamondDeepShadow: {
    position: 'absolute',
    width: 75,
    height: 75,
    borderRadius: 37,
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 20,
    top: 10,
  },
  diamondGlow: {
    position: 'absolute',
    width: 85,
    height: 85,
    borderRadius: 42,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 45,
    elevation: 12,
    top: -10,
  },
  diamondOuterGlow: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 47,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 55,
    elevation: 18,
    top: -15,
  },
  diamondShine: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondColorShadow: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    top: 12,
  },
  scannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Нови модерни ефекти
  diamondInnerRing: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    top: 22,
    zIndex: 150,
  },
  diamondPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    top: -17,
    zIndex: 50,
  },
  diamondNeumorphicShadow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: -5,
      height: -5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    top: 16,
  },
  diamondHighlight: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    top: 16,
  },
  // Напреднали визуални ефекти
  diamondShimmer: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    top: 16,
    zIndex: 200,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '200%',
    height: '100%',
    transform: [{ rotate: '45deg' }],
  },
  diamondRipple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    top: -27,
    zIndex: 30,
  },
  floatingParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 250,
    pointerEvents: 'none', // Не блокират touch events
  },
  particle1: {
    top: 10,
    left: 20,
  },
  particle2: {
    top: 25,
    right: 15,
  },
  particle3: {
    bottom: 20,
    left: 25,
  },
  particle4: {
    bottom: 35,
    right: 20,
  },
  diamondAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: -22,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 25,
  },

});

export default CustomTabBar; 