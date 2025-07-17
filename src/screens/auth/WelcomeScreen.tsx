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
  Image,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, UserState } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { authState, logout } = useAuth();
  
  // Enhanced Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(80)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.9)).current;
  const subtitleTranslateY = useRef(new Animated.Value(50)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(60)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const decorativeOpacity = useRef(new Animated.Value(0)).current;
  
  // Advanced animations for premium effects
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoGlow = useRef(new Animated.Value(0.5)).current;
  const particleAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const gradientRotation = useRef(new Animated.Value(0)).current;
  const meshAnimation = useRef(new Animated.Value(0)).current;
  const buttonScale1 = useRef(new Animated.Value(1)).current;
  const buttonScale2 = useRef(new Animated.Value(1)).current;
  const glassOpacity = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const orbAnimation = useRef(new Animated.Value(0)).current;
  
  // Feature card animations
  const featureCard1 = useRef(new Animated.Value(0)).current;
  const featureCard2 = useRef(new Animated.Value(0)).current;
  const featureCard3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Debug logging for auth state changes
    console.log('[WelcomeScreen] Auth state changed:', {
      userState: authState.userState,
      hasUser: !!authState.user,
      userEmail: authState.user?.email,
      isLoading: authState.isLoading,
      isInitialized: authState.isInitialized,
    });
    
    // Note: No auto-navigation here - RegisterScreen handles direct navigation
    // This allows users to return to welcome and choose when to proceed
  }, [authState.userState, authState.user, authState.isInitialized, authState.isLoading, navigation]);

  useEffect(() => {
    // Enhanced staggered entrance animations
    const animationSequence = Animated.sequence([
      // Logo entrance with rotation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 45,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      
      // Title with scale and translate
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      
      // Subtitle animation
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      
      // Feature cards staggered
      Animated.stagger(180, [
        Animated.spring(featureCard1, {
          toValue: 1,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(featureCard2, {
          toValue: 1,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(featureCard3, {
          toValue: 1,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      
      // Buttons with glass effect
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      
      // Decorative elements
      Animated.timing(decorativeOpacity, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    ]);

    // Start animation after a short delay
    const timer = setTimeout(() => {
      animationSequence.start();
      
      // Start continuous animations
      startAdvancedAnimations();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const startAdvancedAnimations = () => {
    // Enhanced logo pulse with glow
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoPulse, {
            toValue: 1.06,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(logoPulse, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoGlow, {
            toValue: 0.9,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(logoGlow, {
            toValue: 0.4,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Gradient rotation
    Animated.loop(
      Animated.timing(gradientRotation, {
        toValue: 1,
        duration: 35000,
        useNativeDriver: true,
      })
    ).start();

    // Enhanced mesh animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnimation, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(meshAnimation, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating card effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb animation
    Animated.loop(
      Animated.timing(orbAnimation, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Enhanced particle animations
    particleAnimations.forEach((anim, index) => {
      const delay = index * 900;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 4500 + Math.random() * 2500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handleLogin = () => {
    Animated.sequence([
      Animated.timing(buttonScale2, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale2, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  const handleRegister = () => {
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale1, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Register');
    });
  };

  const handleChoosePlan = () => {
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale1, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('SubscriptionPlans', {
        reason: 'new_user'
      });
    });
  };

  const handleEnterApp = () => {
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale1, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate to SubscriptionManagement to trigger app navigation
      if (authState.subscription) {
        navigation.navigate('SubscriptionManagement', {
          subscription: authState.subscription,
        });
      }
    });
  };

  const handleLogout = () => {
    Animated.sequence([
      Animated.timing(buttonScale2, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale2, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await logout();
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Multi-layer Premium Background */}
      <LinearGradient
        colors={['#FAF7F3', '#F5F1ED', '#E8DDD6', '#D4C5B8', '#E8DDD6', '#F5F1ED', '#FAF7F3']}
        locations={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Enhanced Dynamic Mesh Background */}
      <Animated.View style={[
        styles.meshGradient,
        {
          opacity: meshAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.08],
          }),
          transform: [{
            rotate: gradientRotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }, {
            scale: meshAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.15],
            }),
          }],
        }
      ]}>
        <LinearGradient
          colors={[
            'rgba(180, 170, 160, 0.12)', 
            'rgba(212, 197, 184, 0.06)', 
            'transparent', 
            'rgba(168, 157, 147, 0.08)',
            'rgba(245, 241, 237, 0.04)'
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.meshGradientInner}
        />
      </Animated.View>

      {/* Enhanced Geometric Pattern */}
      <View style={styles.geometricPattern}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={`pattern-${index}`}
            style={[
              styles.geometricLine,
              {
                left: `${index * 16.66}%`,
                opacity: decorativeOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.12],
                }),
                transform: [{
                  translateY: meshAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 25],
                  }),
                }, {
                  scaleY: meshAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
      
      {/* Enhanced Floating Orbs */}
      <Animated.View style={[styles.orb1, {
        transform: [{
          translateX: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 35],
          }),
        }, {
          translateY: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -25],
          }),
        }, {
          scale: orbAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }),
        }],
        opacity: decorativeOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.6],
        }),
      }]} />
      
      <Animated.View style={[styles.orb2, {
        transform: [{
          translateX: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -30],
          }),
        }, {
          translateY: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          }),
        }, {
          scale: orbAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.95, 1],
          }),
        }],
        opacity: decorativeOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.45],
        }),
      }]} />

      <Animated.View style={[styles.orb3, {
        transform: [{
          rotate: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        }, {
          scale: orbAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.1, 1],
          }),
        }],
        opacity: decorativeOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.35],
        }),
      }]} />

      {/* Enhanced Animated Particles */}
      {particleAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: (Math.random() * width),
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 0.8, 0.8, 0],
              }),
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height + 60, -120],
                  }),
                },
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.random() - 0.5) * 80],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1.2, 1.2, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Content Container with Enhanced Glass Effect */}
      <View style={styles.contentContainer}>
        
        {/* Enhanced Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: Animated.multiply(logoScale, logoPulse) },
                  { 
                    rotate: logoRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }
                ],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              {/* Enhanced multiple glow layers */}
              <Animated.View style={[styles.logoGlowOuter, {
                opacity: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.4],
                }),
                transform: [{ scale: logoPulse }],
              }]} />
              <Animated.View style={[styles.logoGlowMiddle, {
                opacity: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
                }),
                transform: [{ scale: Animated.multiply(logoPulse, 0.92) }],
              }]} />
              
              <LinearGradient
                colors={['rgba(180, 170, 160, 0.3)', 'rgba(168, 157, 147, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGlow}
              />
              
              <Image
                source={require('../../assets/images/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              
              {/* Enhanced inner glow */}
              <Animated.View style={[styles.logoInnerGlow, {
                opacity: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.4],
                }),
              }]} />
            </View>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.appNameContainer,
              {
                opacity: titleOpacity,
                transform: [
                  { translateY: titleTranslateY },
                  { scale: titleScale }
                ],
              },
            ]}
          >
            <Text style={[styles.appName, styles.appNameFin]}>Fin</Text>
            <Text style={[styles.appName, styles.appNameTrack]}>Track</Text>
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            Управлявайте финансите си умно
          </Animated.Text>
        </View>
        
        {/* Enhanced Features Section */}
        <View style={styles.featuresSection}>
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureCard1,
                transform: [
                  {
                    translateY: featureCard1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: featureCard1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                  {
                    translateY: cardFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.glassOverlay} />
                <Text style={styles.featureEmoji}>📊</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Детайлни анализи</Text>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureCard2,
                transform: [
                  {
                    translateY: featureCard2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: featureCard2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                  {
                    translateY: cardFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -12],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.glassOverlay} />
                <Text style={styles.featureEmoji}>🎯</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Умни бюджети</Text>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.featureItem,
              {
                opacity: featureCard3,
                transform: [
                  {
                    translateY: featureCard3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: featureCard3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                  {
                    translateY: cardFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -6],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.glassOverlay} />
                <Text style={styles.featureEmoji}>🔒</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Пълна сигурност</Text>
          </Animated.View>
        </View>
        
        {/* Enhanced Buttons Section */}
        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          {authState.userState === UserState.ACTIVE_SUBSCRIBER ? (
            // Buttons for active subscribers
            <>
              <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
                <TouchableOpacity
                  onPress={handleEnterApp}
                  activeOpacity={0.8}
                  style={styles.primaryButton}
                >
                  <View style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>Управление на абонамента</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                <TouchableOpacity
                  onPress={handleLogout}
                  activeOpacity={0.8}
                  style={styles.secondaryButton}
                >
                  <View style={styles.secondaryButtonInner}>
                    <Text style={styles.secondaryButtonText}>Излизане от профила</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : authState.userState === UserState.REGISTERED_NO_SUBSCRIPTION ? (
            // Buttons for registered users without subscription
            <>
              {/* Enhanced Info message for registered users */}
              <Animated.View style={[styles.infoContainer, {
                opacity: buttonsOpacity,
              }]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.infoGradient}
                >
                  <View style={styles.infoGlassOverlay} />
                  <Text style={styles.infoText}>
                    Добре дошли, {authState.user?.email || 'потребител'}!
                  </Text>
                  <Text style={styles.infoSubtext}>
                    Изберете абонамент, за да започнете да следите финансите си
                  </Text>
                </LinearGradient>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
                <TouchableOpacity
                  onPress={handleChoosePlan}
                  activeOpacity={0.8}
                  style={styles.primaryButton}
                >
                  <View style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>Изберете абонамент</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                <TouchableOpacity
                  onPress={handleLogout}
                  activeOpacity={0.8}
                  style={styles.secondaryButton}
                >
                  <View style={styles.secondaryButtonInner}>
                    <Text style={styles.secondaryButtonText}>Излизане от профила</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            // Default buttons for unregistered users
            <>
              <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
                <TouchableOpacity
                  onPress={handleRegister}
                  activeOpacity={0.8}
                  style={styles.primaryButton}
                >
                  <View style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>Започнете сега</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  style={styles.secondaryButton}
                >
                  <View style={styles.secondaryButtonInner}>
                    <Text style={styles.secondaryButtonText}>Вече имам акаунт</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Animated.View>
        
        {/* Enhanced Footer */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: decorativeOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.85],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerGradient}
          >
            <View style={styles.footerGlassOverlay} />
            <Text style={styles.footerText}>
              Присъединете се към хиляди потребители, които вече управляват финансите си умно
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F3',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  meshGradient: {
    position: 'absolute',
    left: -width * 0.4,
    right: -width * 0.4,
    top: -height * 0.25,
    bottom: -height * 0.25,
  },
  meshGradientInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  // Enhanced Orbs with better shadows and colors
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(180, 170, 160, 0.12)',
    top: -80,
    right: -80,
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
  },
  orb2: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(168, 157, 147, 0.1)',
    bottom: 120,
    left: -40,
    shadowColor: '#A89D93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
  },
  orb3: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(154, 141, 130, 0.08)',
    top: height * 0.4,
    right: 40,
    shadowColor: '#9A8D82',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  particle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#B4A498',
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  geometricPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  geometricLine: {
    position: 'absolute',
    width: 0.8,
    height: '100%',
    backgroundColor: 'rgba(168, 157, 147, 0.18)',
    transform: [{ skewY: '25deg' }],
    shadowColor: '#A89D93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 75 : (StatusBar.currentHeight || 0) + 55,
    paddingBottom: 55,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 35,
  },
  logoContainer: {
    marginBottom: 35,
  },
  logoWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FAF7F3',
    borderWidth: 3,
    borderColor: 'rgba(180, 170, 160, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    zIndex: 3,
  },
  logoGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 78,
    zIndex: 1,
  },
  logoGlowOuter: {
    position: 'absolute',
    top: -25,
    left: -25,
    right: -25,
    bottom: -25,
    borderRadius: 100,
    backgroundColor: 'rgba(180, 170, 160, 0.12)',
    zIndex: 0,
  },
  logoGlowMiddle: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 87,
    backgroundColor: 'rgba(180, 170, 160, 0.15)',
    zIndex: 1,
  },
  logoInnerGlow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 67,
    backgroundColor: 'rgba(180, 170, 160, 0.08)',
    zIndex: 2,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  appName: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1.8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-condensed',
  },
  appNameFin: {
    color: '#2D2928',
    textShadowColor: 'rgba(45, 41, 40, 0.25)',
  },
  appNameTrack: {
    color: '#A89D93',
    textShadowColor: 'rgba(168, 157, 147, 0.4)',
  },
  tagline: {
    fontSize: 22,
    color: '#6B5B57',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '600',
    textShadowColor: 'rgba(168, 157, 147, 0.2)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 50,
    paddingHorizontal: 15,
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 70,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  featureEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#6B5B57',
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(168, 157, 147, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 18,
    letterSpacing: 0.2,
    marginTop: 2,
    maxWidth: 80,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  buttonsSection: {
    marginBottom: 55,
    paddingHorizontal: 15,
  },
  primaryButton: {
    borderRadius: 30,
    marginBottom: 22,
    backgroundColor: 'rgba(139, 127, 120, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(139, 127, 120, 0.9)',
    shadowColor: '#8B7F78',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    paddingVertical: 24,
    paddingHorizontal: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(139, 127, 120, 0.3)',
  },
  primaryButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FAF7F3',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-medium',
  },
  secondaryButton: {
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(168, 157, 147, 0.4)',
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  secondaryButtonInner: {
    paddingVertical: 24,
    paddingHorizontal: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8B7F78',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(139, 127, 120, 0.3)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  footerGradient: {
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerText: {
    fontSize: 16,
    color: '#8B7F78',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(139, 127, 120, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  infoContainer: {
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#B4A498',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoGradient: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },
  infoGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#3D342F',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(61, 52, 47, 0.15)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  infoSubtext: {
    fontSize: 17,
    color: '#6B5B57',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(107, 91, 87, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});

export default WelcomeScreen; 