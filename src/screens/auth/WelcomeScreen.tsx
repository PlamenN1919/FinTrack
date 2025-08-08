import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Animated,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/auth.types';
import { useTheme } from '../../utils/ThemeContext';
import TimelineCard from '../../components/ui/TimelineCard';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  
  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(60)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(40)).current;
  
  const timelineOpacity = useRef(new Animated.Value(0)).current;
  const timelineTranslateY = useRef(new Animated.Value(50)).current;
  
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(60)).current;
  
  // Floating Elements Animation
  const float1Y = useRef(new Animated.Value(0)).current;
  const float1Rotation = useRef(new Animated.Value(0)).current;
  const float2Y = useRef(new Animated.Value(0)).current;
  const float2Scale = useRef(new Animated.Value(1)).current;
  const float3Y = useRef(new Animated.Value(0)).current;
  
  // Button interaction animations
  const registerButtonScale = useRef(new Animated.Value(1)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  
  // Parallax Background Elements
  const backgroundFloat1 = useRef(new Animated.Value(0)).current;
  const backgroundFloat2 = useRef(new Animated.Value(0)).current;

  // Enhanced Color Functions
  const getBackgroundGradient = () => {
    if (isDark) {
      return [
        '#1A1A1A', // Deep black
        '#2D2A26', // Rich dark brown
        '#3D342F', // Warm dark brown
        '#4A3E36', // Medium brown
        '#38362E', // Dark olive
        '#2D2A26', // Rich dark brown
        '#1A1A1A', // Deep black
      ];
    } else {
      return [
        '#FFFFFF', // Pure white
        '#FEFEFE', // Off white
        '#FAF9F6', // Cream white
        '#F5F4F1', // Light cream
        '#DCD7CE', // Light beige
        '#F8F7F4', // Warm white
        '#FFFFFF', // Pure white
      ];
    }
  };

  const getGlassmorphismStyle = () => {
    if (isDark) {
      return {
        backgroundColor: 'rgba(166, 138, 100, 0.08)',
        borderColor: 'rgba(248, 227, 180, 0.15)',
        shadowColor: 'rgba(166, 138, 100, 0.3)',
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(128, 122, 92, 0.12)',
        shadowColor: 'rgba(56, 54, 46, 0.15)',
      };
    }
  };

  const getButtonGradient = (isPrimary: boolean) => {
    if (isPrimary) {
      if (isDark) {
        return ['#A68A64', '#C4A876', '#F8E3B4', '#DCD6C1']; // Enhanced golden
      } else {
        return ['#807A5C', '#9C8F72', '#A68A64', '#F8E3B4']; // Rich earth
      }
    } else {
      if (isDark) {
        return [
          'rgba(166, 138, 100, 0.12)',
          'rgba(220, 214, 193, 0.08)',
          'rgba(248, 227, 180, 0.15)',
          'rgba(166, 138, 100, 0.18)',
        ];
      } else {
        return [
          'rgba(255, 255, 255, 0.4)',
          'rgba(248, 247, 244, 0.6)',
          'rgba(245, 244, 241, 0.5)',
          'rgba(255, 255, 255, 0.3)',
        ];
      }
    }
  };

  const getTextColor = () => {
    return isDark ? '#F8E3B4' : '#2D2A26';
  };

  const getSecondaryTextColor = () => {
    return isDark ? '#DCD6C1' : '#6B6356';
  };

  const getAccentColor = () => {
    return isDark ? '#C4A876' : '#A68A64';
  };

  // Enhanced Animation Sequences
  useEffect(() => {
    // Floating elements continuous animation
    const createFloatingAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay || 0),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start floating animations
    createFloatingAnimation(float1Y, 4000, 0).start();
    createFloatingAnimation(float2Y, 3500, 1000).start();
    createFloatingAnimation(float3Y, 4500, 2000).start();
    
    // Rotation animations
    Animated.loop(
      Animated.timing(float1Rotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(float2Scale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(float2Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Background parallax
    createFloatingAnimation(backgroundFloat1, 6000, 0).start();
    createFloatingAnimation(backgroundFloat2, 8000, 3000).start();

    // Main entrance sequence with staggered timing
    const entranceSequence = Animated.sequence([
      // Logo dramatic entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      
      // Staggered content entrance
      Animated.delay(200),
      
      // Title with enhanced animation
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(150),
      
      // Subtitle
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 90,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(200),
      
      // Timeline cards
      Animated.parallel([
        Animated.timing(timelineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(timelineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(250),
      
      // Buttons finale
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const timer = setTimeout(() => {
      entranceSequence.start();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Enhanced Button Press Handlers
  const handleRegisterPress = () => {
    Animated.sequence([
      Animated.spring(registerButtonScale, {
        toValue: 0.92,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(registerButtonScale, {
        toValue: 1.02,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(registerButtonScale, {
        toValue: 1,
        tension: 180,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      navigation.navigate('Register');
    }, 300);
  };

  const handleLoginPress = () => {
    Animated.sequence([
      Animated.spring(loginButtonScale, {
        toValue: 0.92,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(loginButtonScale, {
        toValue: 1.02,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(loginButtonScale, {
        toValue: 1,
        tension: 180,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      navigation.navigate('Login');
    }, 300);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Enhanced Background with Multiple Layers */}
      <LinearGradient
        colors={getBackgroundGradient()}
        locations={[0, 0.15, 0.3, 0.45, 0.6, 0.8, 1]}
        style={styles.backgroundGradient}
      />

      {/* Floating Background Elements */}
      <Animated.View
        style={[
          styles.floatingElement,
          styles.floatingElement1,
          {
            transform: [
              {
                translateY: backgroundFloat1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
              {
                translateX: backgroundFloat1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(166, 138, 100, 0.1)', 'rgba(248, 227, 180, 0.05)'] : ['rgba(128, 122, 92, 0.08)', 'rgba(172, 166, 154, 0.05)']}
          style={styles.floatingGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingElement,
          styles.floatingElement2,
          {
            transform: [
              {
                translateY: backgroundFloat2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40],
                }),
              },
              {
                translateX: backgroundFloat2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(220, 214, 193, 0.08)', 'rgba(166, 138, 100, 0.12)'] : ['rgba(245, 244, 241, 0.6)', 'rgba(220, 215, 206, 0.4)']}
          style={styles.floatingGradient}
        />
      </Animated.View>

      {/* Main Content with Enhanced Layout */}
      <View style={styles.contentContainer}>
        
        {/* Clean Logo Section with Single Ring */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                {
                  rotate: logoRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.logoContainer, { borderColor: isDark ? '#A68A64' : '#807A5C' }]}>
            <Image
              source={require('../../assets/images/F.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Enhanced Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: titleOpacity,
              transform: [
                { translateY: titleTranslateY },
                { scale: titleScale },
              ],
            },
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.modernTextPrimary, { color: getTextColor() }]}>
              Fin
            </Text>
            <Text style={[styles.modernTextPrimary, { color: '#b2ac94' }]}>
              Track
            </Text>
          </View>
        </Animated.View>

        {/* Enhanced Subtitle */}
        <Animated.View
          style={[
            styles.subtitleSection,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <Text style={[styles.heroSubtitle, { color: getSecondaryTextColor() }]}>
            Вашият път към финансова свобода
          </Text>
        </Animated.View>

        {/* Enhanced Timeline with Glassmorphism */}
        <Animated.View
          style={[
            styles.timelineContainer,
            {
              opacity: timelineOpacity,
              transform: [{ translateY: timelineTranslateY }],
            },
          ]}
        >
          <View style={[styles.timelineWrapper, getGlassmorphismStyle()]}>
            <TimelineCard
              steps={[
                {
                  icon: 'analytics',
                  title: 'ПЛАНИРАЙ',
                  description: 'Създай цели и бюджети'
                },
                {
                  icon: 'visibility',
                  title: 'КОНТРОЛИРАЙ',
                  description: 'Следи разходите в реално време'
                },
                {
                  icon: 'trending-up',
                  title: 'РАСТЕШ',
                  description: 'Постигай целите си и спестявай'
                }
              ]}
            />
          </View>
        </Animated.View>

        {/* Enhanced Premium Buttons */}
        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          {/* Enhanced Register Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { transform: [{ scale: registerButtonScale }] }
            ]}
          >
            <TouchableOpacity
              onPress={handleRegisterPress}
              activeOpacity={0.85}
              style={[styles.primaryButton, styles.glassMorphButton, { 
                backgroundColor: '#b2ac94',
                borderColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center'
              }]}
            >
              <View style={[styles.buttonContent, { paddingHorizontal: 24 }]}>
                <Text style={[styles.primaryButtonText, { color: '#FFFFFF', marginLeft: 30 }]}>
                  Започнете пътуването
                </Text>
                <View style={[styles.buttonIcon, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                  <Text style={[styles.buttonIconText, { color: '#FFFFFF' }]}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Enhanced Login Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { transform: [{ scale: loginButtonScale }] }
            ]}
          >
            <TouchableOpacity
              onPress={handleLoginPress}
              activeOpacity={0.85}
              style={[styles.secondaryButton, getGlassmorphismStyle(), styles.glassMorphButton]}
            >
              <LinearGradient
                colors={getButtonGradient(false)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={[styles.secondaryButtonText, { color: getTextColor() }]}>
                    Вече имам акаунт
                  </Text>
                  <View style={[styles.buttonIconSecondary, { borderColor: getTextColor() + '40' }]}>
                    <Text style={[styles.buttonIconText, { color: getTextColor() }]}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Decorative Floating Elements */}
        <Animated.View
          style={[
            styles.decorativeFloat,
            styles.decorativeFloat1,
            {
              transform: [
                {
                  translateY: float1Y.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
                {
                  rotate: float1Rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['rgba(248, 227, 180, 0.1)', 'rgba(166, 138, 100, 0.05)'] : ['rgba(166, 138, 100, 0.08)', 'rgba(128, 122, 92, 0.04)']}
            style={styles.decorativeGradient}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.decorativeFloat,
            styles.decorativeFloat2,
            {
              transform: [
                {
                  translateY: float2Y.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  }),
                },
                { scale: float2Scale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['rgba(220, 214, 193, 0.08)', 'rgba(248, 227, 180, 0.12)'] : ['rgba(245, 244, 241, 0.4)', 'rgba(220, 215, 206, 0.6)']}
            style={styles.decorativeGradient}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.decorativeFloat,
            styles.decorativeFloat3,
            {
              transform: [
                {
                  translateY: float3Y.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['rgba(166, 138, 100, 0.06)', 'rgba(220, 214, 193, 0.10)'] : ['rgba(172, 166, 154, 0.3)', 'rgba(245, 244, 241, 0.5)']}
            style={styles.decorativeGradient}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  // Floating Background Elements
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  floatingElement1: {
    width: 200,
    height: 200,
    top: '10%',
    right: '-10%',
  },
  floatingElement2: {
    width: 150,
    height: 150,
    bottom: '20%',
    left: '-8%',
  },
  floatingGradient: {
    flex: 1,
    borderRadius: 100,
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Enhanced Logo Section
  logoSection: {
    marginBottom: 25,
    marginTop: 10,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 70,
    borderWidth: 1,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    zIndex: 10,
  },
  logoGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -10,
    left: -10,
    zIndex: 5,
  },
  logoRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -15,
    left: -15,
    zIndex: 1,
  },
  logoRingGradient: {
    flex: 1,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Enhanced Hero Section
  heroSection: {
    marginBottom: 5,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  modernTextPrimary: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -3,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },

  // Enhanced Subtitle
  subtitleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    textAlign: 'center',
    opacity: 0.9,
  },

  // Enhanced Timeline
  timelineContainer: {
    width: '100%',
    marginBottom: 35,
    paddingHorizontal: 8,
  },
  timelineWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Enhanced Buttons
  buttonsSection: {
    width: '100%',
    gap: 18,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
  },
  enhancedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(166, 138, 100, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  secondaryButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassMorphButton: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    flex: 1,
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    flex: 1,
    textAlign: 'center',
  },
  buttonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  buttonIconSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  buttonIconText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Decorative Elements
  decorativeFloat: {
    position: 'absolute',
    borderRadius: 50,
    overflow: 'hidden',
  },
  decorativeFloat1: {
    width: 80,
    height: 80,
    top: '25%',
    left: '8%',
  },
  decorativeFloat2: {
    width: 60,
    height: 60,
    top: '60%',
    right: '12%',
  },
  decorativeFloat3: {
    width: 100,
    height: 100,
    bottom: '15%',
    left: '15%',
  },
  decorativeGradient: {
    flex: 1,
    borderRadius: 50,
  },
});

export default WelcomeScreen; 