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
    // Enhanced staggered entrance animations
    const animationSequence = Animated.sequence([
      // Logo entrance with rotation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      
      // Title with scale and translate
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Subtitle animation
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Feature cards staggered
      Animated.stagger(150, [
        Animated.spring(featureCard1, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(featureCard2, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(featureCard3, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Buttons with glass effect
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(glassOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Decorative elements
      Animated.timing(decorativeOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    // Start animation after a short delay
    const timer = setTimeout(() => {
      animationSequence.start();
      
      // Start continuous animations
      startAdvancedAnimations();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const startAdvancedAnimations = () => {
    // Enhanced logo pulse with glow
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoPulse, {
            toValue: 1.08,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(logoPulse, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoGlow, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(logoGlow, {
            toValue: 0.3,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Gradient rotation
    Animated.loop(
      Animated.timing(gradientRotation, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();

    // Enhanced mesh animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnimation, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(meshAnimation, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating card effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb animation
    Animated.loop(
      Animated.timing(orbAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Enhanced particle animations
    particleAnimations.forEach((anim, index) => {
      const delay = index * 800;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handleLogin = () => {
    Animated.sequence([
      Animated.timing(buttonScale2, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale2, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  const handleRegister = () => {
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale1, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Register');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Multi-layer Premium Background */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#2A2020', '#1A1A1A', '#0A0A0A']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Dynamic Mesh Background */}
      <Animated.View style={[
        styles.meshGradient,
        {
          opacity: meshAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.1],
          }),
          transform: [{
            rotate: gradientRotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }, {
            scale: meshAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2],
            }),
          }],
        }
      ]}>
                 <LinearGradient
           colors={[
             'rgba(0, 180, 219, 0.15)', 
             'rgba(64, 196, 255, 0.08)', 
             'transparent', 
             'rgba(2, 136, 209, 0.1)',
             'rgba(0, 180, 219, 0.05)'
           ]}
           locations={[0, 0.3, 0.5, 0.7, 1]}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.meshGradientInner}
         />
      </Animated.View>

      {/* Floating Orbs */}
      <Animated.View style={[styles.orb1, {
        transform: [{
          translateX: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 30],
          }),
        }, {
          translateY: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -20],
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
            outputRange: [0, -25],
          }),
        }, {
          translateY: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 15],
          }),
        }],
        opacity: decorativeOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.4],
        }),
      }]} />

      <Animated.View style={[styles.orb3, {
        transform: [{
          rotate: orbAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        }],
        opacity: decorativeOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.3],
        }),
      }]} />

      {/* Enhanced Geometric Pattern */}
      <View style={styles.geometricPattern}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={`pattern-${index}`}
            style={[
              styles.geometricLine,
              {
                left: `${index * 12.5}%`,
                opacity: decorativeOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.15],
                }),
                transform: [{
                  translateY: meshAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30],
                  }),
                }, {
                  scaleY: meshAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
      
      {/* Enhanced Animated Particles */}
      {particleAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: (Math.random() * width),
              opacity: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height + 50, -100],
                  }),
                },
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (Math.random() - 0.5) * 100],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      
      {/* Content Container with Glass Effect */}
      <View style={styles.contentContainer}>
        
        {/* Logo Section with Enhanced Effects */}
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
              {/* Multiple glow layers */}
              <Animated.View style={[styles.logoGlowOuter, {
                opacity: logoGlow,
                transform: [{ scale: logoPulse }],
              }]} />
              <Animated.View style={[styles.logoGlowMiddle, {
                opacity: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [{ scale: Animated.multiply(logoPulse, 0.9) }],
              }]} />
              
                             <LinearGradient
                 colors={['rgba(0, 180, 219, 0.4)', 'rgba(64, 196, 255, 0.2)']}
                 style={styles.logoGlow}
               />
              
              <Image
                source={require('../../assets/images/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              
              {/* Inner glow */}
              <Animated.View style={[styles.logoInnerGlow, {
                opacity: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
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
        
                 {/* Simple Features Section */}
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
                       outputRange: [30, 0],
                     }),
                   },
                   {
                     scale: featureCard1.interpolate({
                       inputRange: [0, 1],
                       outputRange: [0.9, 1],
                     }),
                   },
                 ],
               },
             ]}
           >
             <View style={styles.featureIcon}>
               <View style={styles.featureGradient}>
                 <Text style={styles.featureEmoji}>📊</Text>
               </View>
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
                       outputRange: [30, 0],
                     }),
                   },
                   {
                     scale: featureCard2.interpolate({
                       inputRange: [0, 1],
                       outputRange: [0.9, 1],
                     }),
                   },
                 ],
               },
             ]}
           >
             <View style={styles.featureIcon}>
               <View style={styles.featureGradient}>
                 <Text style={styles.featureEmoji}>🎯</Text>
               </View>
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
                       outputRange: [30, 0],
                     }),
                   },
                   {
                     scale: featureCard3.interpolate({
                       inputRange: [0, 1],
                       outputRange: [0.9, 1],
                     }),
                   },
                 ],
               },
             ]}
           >
             <View style={styles.featureIcon}>
               <View style={styles.featureGradient}>
                 <Text style={styles.featureEmoji}>🔒</Text>
               </View>
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
           {/* Simple Primary Button */}
           <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
             <TouchableOpacity
               onPress={handleRegister}
               activeOpacity={0.8}
               style={styles.primaryButton}
             >
               <Text style={styles.primaryButtonText}>Започнете сега</Text>
             </TouchableOpacity>
           </Animated.View>
           
           {/* Glass Secondary Button */}
           <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
             <TouchableOpacity
               onPress={handleLogin}
               activeOpacity={0.8}
               style={styles.secondaryButton}
             >
               <Text style={styles.secondaryButtonText}>Вече имам акаунт</Text>
             </TouchableOpacity>
           </Animated.View>
         </Animated.View>
        
        {/* Enhanced Footer */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: decorativeOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.9],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
            style={styles.footerGradient}
          >
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
    backgroundColor: '#0A0A0A',
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
    left: -width * 0.5,
    right: -width * 0.5,
    top: -height * 0.3,
    bottom: -height * 0.3,
  },
  meshGradientInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
     // Enhanced Orbs
   orb1: {
     position: 'absolute',
     width: 300,
     height: 300,
     borderRadius: 150,
     backgroundColor: 'rgba(0, 180, 219, 0.08)',
     top: -100,
     right: -100,
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.3,
     shadowRadius: 40,
   },
   orb2: {
     position: 'absolute',
     width: 200,
     height: 200,
     borderRadius: 100,
     backgroundColor: 'rgba(64, 196, 255, 0.06)',
     bottom: 100,
     left: -50,
     shadowColor: '#40C4FF',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.2,
     shadowRadius: 30,
   },
   orb3: {
     position: 'absolute',
     width: 120,
     height: 120,
     borderRadius: 60,
     backgroundColor: 'rgba(2, 136, 209, 0.05)',
     top: height * 0.4,
     right: 30,
     shadowColor: '#0288D1',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.15,
     shadowRadius: 20,
   },
     particle: {
     position: 'absolute',
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: '#00B4DB',
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 1,
     shadowRadius: 8,
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
     backgroundColor: 'rgba(0, 180, 219, 0.08)',
     transform: [{ skewY: '30deg' }],
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.3,
     shadowRadius: 2,
   },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 0) + 50,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 32,
  },
     logoWrapper: {
     width: 140,
     height: 140,
     borderRadius: 70,
     backgroundColor: '#E3F2FD',
     borderWidth: 4,
     borderColor: '#00B4DB',
     justifyContent: 'center',
     alignItems: 'center',
     position: 'relative',
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 15 },
     shadowOpacity: 0.6,
     shadowRadius: 25,
     elevation: 20,
   },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    zIndex: 3,
  },
     logoGlow: {
     position: 'absolute',
     top: -4,
     left: -4,
     right: -4,
     bottom: -4,
     borderRadius: 74,
     zIndex: 1,
   },
   logoGlowOuter: {
     position: 'absolute',
     top: -30,
     left: -30,
     right: -30,
     bottom: -30,
     borderRadius: 100,
     backgroundColor: 'rgba(0, 180, 219, 0.15)',
     zIndex: 0,
   },
   logoGlowMiddle: {
     position: 'absolute',
     top: -15,
     left: -15,
     right: -15,
     bottom: -15,
     borderRadius: 85,
     backgroundColor: 'rgba(0, 180, 219, 0.2)',
     zIndex: 1,
   },
   logoInnerGlow: {
     position: 'absolute',
     top: 10,
     left: 10,
     right: 10,
     bottom: 10,
     borderRadius: 60,
     backgroundColor: 'rgba(0, 180, 219, 0.1)',
     zIndex: 2,
   },
     appNameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 16,
   },
   appName: {
     fontSize: 52,
     fontWeight: '900',
     textAlign: 'center',
     textShadowOffset: { width: 0, height: 4 },
     textShadowRadius: 12,
     letterSpacing: 2,
     fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
   },
   appNameFin: {
     color: '#FFFFFF',
     textShadowColor: 'rgba(255, 255, 255, 0.3)',
   },
   appNameTrack: {
     color: '#00B4DB',
     textShadowColor: 'rgba(0, 180, 219, 0.5)',
   },
   tagline: {
     fontSize: 20,
     color: 'rgba(227, 242, 253, 0.9)',
     textAlign: 'center',
     lineHeight: 28,
     fontWeight: '600',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     letterSpacing: 0.5,
   },
     featuresSection: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     marginVertical: 60,
     paddingHorizontal: 20,
   },
   featureItem: {
     alignItems: 'center',
     marginHorizontal: 24,
     minWidth: 80,
   },
        featureIcon: {
     width: 72,
     height: 72,
     borderRadius: 36,
     marginBottom: 20,
     overflow: 'hidden',
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.2,
     shadowRadius: 16,
     elevation: 8,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   featureGradient: {
     width: '100%',
     height: '100%',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 36,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.15)',
     position: 'relative',
   },
   glassOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     height: '30%',
     borderTopLeftRadius: 36,
     borderTopRightRadius: 36,
     backgroundColor: 'rgba(255, 255, 255, 0.08)',
     zIndex: 0,
   },
   featureEmoji: {
     fontSize: 32,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     zIndex: 2,
   },
   featureText: {
     fontSize: 15,
     color: 'rgba(227, 242, 253, 0.95)',
     textAlign: 'center',
     fontWeight: '700',
     textShadowColor: 'rgba(0, 0, 0, 0.4)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     lineHeight: 20,
     letterSpacing: 0.5,
     marginTop: 8,
     maxWidth: 90,
   },
     buttonsSection: {
     marginBottom: 50,
     paddingHorizontal: 20,
   },
   primaryButton: {
     borderRadius: 25,
     paddingVertical: 20,
     paddingHorizontal: 40,
     alignItems: 'center',
     marginBottom: 20,
     backgroundColor: '#00B4DB',
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.3,
     shadowRadius: 16,
     elevation: 8,
   },
   primaryButtonText: {
     fontSize: 19,
     fontWeight: '800',
     color: '#1A1A1A',
     letterSpacing: 0.8,
   },
   secondaryButton: {
     borderRadius: 25,
     paddingVertical: 20,
     paddingHorizontal: 40,
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.08)',
     borderWidth: 2,
     borderColor: 'rgba(0, 180, 219, 0.4)',
     shadowColor: '#00B4DB',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.15,
     shadowRadius: 16,
     elevation: 8,
   },
   secondaryButtonText: {
     fontSize: 17,
     fontWeight: '700',
     color: '#00B4DB',
     letterSpacing: 0.6,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerGradient: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
     footerText: {
     fontSize: 15,
     color: 'rgba(227, 242, 253, 0.8)',
     textAlign: 'center',
     lineHeight: 22,
     fontWeight: '500',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 3,
     letterSpacing: 0.2,
   },
});

export default WelcomeScreen; 