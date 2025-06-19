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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/auth.types';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const decorativeOpacity = useRef(new Animated.Value(0)).current;
  
  // Additional animations for enhanced effects
  const logoPulse = useRef(new Animated.Value(1)).current;
  const particleAnimations = useRef([
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

  useEffect(() => {
    // Staggered entrance animations
    const animationSequence = Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Title animation
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Subtitle animation
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Buttons animation
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Decorative elements
      Animated.timing(decorativeOpacity, {
        toValue: 0.1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    // Start animation after a short delay
    const timer = setTimeout(() => {
      animationSequence.start();
      
      // Start continuous animations
      startLogoPulse();
      startParticleAnimations();
      startBackgroundAnimations();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Logo pulse animation
  const startLogoPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Background animations
  const startBackgroundAnimations = () => {
    // Gradient rotation
    Animated.loop(
      Animated.timing(gradientRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Mesh animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnimation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(meshAnimation, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Particle animations
  const startParticleAnimations = () => {
    particleAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 500),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  };

  const handleLogin = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale2, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale2, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  const handleRegister = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale1, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Register');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium Background */}
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A', '#1A1A1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Additional Background Layers */}
      <Animated.View style={[
        styles.meshGradient,
        {
          opacity: meshAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.1],
          }),
          transform: [{
            rotate: gradientRotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }],
        }
      ]}>
        <LinearGradient
          colors={['rgba(212, 175, 55, 0.1)', 'transparent', 'rgba(212, 175, 55, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.meshGradientInner}
        />
      </Animated.View>

      {/* Geometric Pattern */}
      <View style={styles.geometricPattern}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={`pattern-${index}`}
            style={[
              styles.geometricLine,
              {
                left: `${index * 20}%`,
                opacity: decorativeOpacity.interpolate({
                  inputRange: [0, 0.1],
                  outputRange: [0, 0.3],
                }),
                transform: [{
                  translateY: meshAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
      
      {/* Animated Particles */}
      {particleAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: Math.random() * width,
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, -50],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Decorative Background Elements */}
      <Animated.View 
        style={[
          styles.decorativeCircle1, 
          { 
            opacity: decorativeOpacity,
            transform: [{
              scale: meshAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            }],
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.decorativeCircle2, 
          { 
            opacity: decorativeOpacity,
            transform: [{
              scale: meshAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1.2, 1],
              }),
            }],
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.decorativeCircle3, 
          { 
            opacity: decorativeOpacity,
            transform: [{
              rotate: gradientRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '-360deg'],
              }),
            }],
          }
        ]} 
      />
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: Animated.multiply(logoScale, logoPulse) }
                ],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../logo/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.3)', 'rgba(247, 231, 206, 0.1)']}
                style={styles.logoGlow}
              />
              {/* Additional glow effect */}
              <Animated.View style={[styles.logoGlowExtra, {
                transform: [{ scale: logoPulse }],
              }]} />
            </View>
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.appName,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            FinTrack
          </Animated.Text>
          
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
        
        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.featureGradient}
              >
                <Text style={styles.featureEmoji}>📊</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Детайлни анализи</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.featureGradient}
              >
                <Text style={styles.featureEmoji}>🎯</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Умни бюджети</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.featureGradient}
              >
                <Text style={styles.featureEmoji}>🔒</Text>
              </LinearGradient>
            </View>
            <Text style={styles.featureText}>Сигурност</Text>
          </View>
        </Animated.View>
        
        {/* Buttons Section */}
        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          {/* Primary Button - Register */}
          <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Започнете сега</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Secondary Button - Login */}
          <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Вече имам акаунт</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        
        {/* Footer */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: decorativeOpacity.interpolate({
                inputRange: [0, 0.1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Text style={styles.footerText}>
            Присъединете се към хиляди потребители, които вече управляват финансите си умно
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    bottom: 100,
    left: -30,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    top: height * 0.3,
    right: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F7E7CE',
    borderWidth: 3,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 62,
    zIndex: 1,
  },
  logoGlowExtra: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    zIndex: 0,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F7E7CE',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(247, 231, 206, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  featureGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonsSection: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  primaryButtonText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  meshGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  meshGradientInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    transform: [{ skewY: '45deg' }],
  },
});

export default WelcomeScreen; 