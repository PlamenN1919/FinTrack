import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';

const { width, height } = Dimensions.get('window');

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const route = useRoute<ForgotPasswordScreenRouteProp>();
  const { sendPasswordResetEmail, authState, clearError } = useAuth();
  const { theme, isDark } = useTheme();

  const [email, setEmail] = useState(route.params?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState('');

  // Enhanced Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(60)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(60)).current;

  // Floating Elements Animation
  const backgroundFloat1 = useRef(new Animated.Value(0)).current;
  const backgroundFloat2 = useRef(new Animated.Value(0)).current;

  // Enhanced Color Functions
  const getBackgroundGradient = () => {
    if (isDark) {
      return [
        '#1A1A1A', '#2D2A26', '#3D342F', '#4A3E36', '#38362E', '#2D2A26', '#1A1A1A'
      ];
    } else {
      return [
        '#FFFFFF', '#FEFEFE', '#FAF9F6', '#F5F4F1', '#DCD7CE', '#F8F7F4', '#FFFFFF'
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

  const getTextColor = () => isDark ? '#F8E3B4' : '#2D2A26';
  const getSecondaryTextColor = () => isDark ? '#DCD6C1' : '#6B6356';

  useEffect(() => {
    clearError();

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
    createFloatingAnimation(backgroundFloat1, 6000, 0).start();
    createFloatingAnimation(backgroundFloat2, 8000, 3000).start();

    // Main entrance sequence
    const entranceSequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.delay(200),
      
      // Title entrance
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
      ]),
      
      Animated.delay(200),
      
      // Form entrance
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(200),
      
      // Button entrance
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(buttonTranslateY, {
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

  // Cooldown timer effect
  useEffect(() => {
    let timer: number;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  // Success animation effect
  useEffect(() => {
    if (emailSent) {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [emailSent]);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue.trim()) {
      setEmailError('Имейлът е задължителен');
      return false;
    }
    if (!emailRegex.test(emailValue.trim())) {
      setEmailError('Моля, въведете валиден имейл адрес');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendResetEmail = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email.trim().toLowerCase());
      setEmailSent(true);
      setResendCooldown(60); // 60 seconds cooldown
      
      Alert.alert(
        'Имейл изпратен',
        `Изпратихме инструкции за възстановяване на паролата на ${email}. Проверете пощенската си кутия.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[ForgotPasswordScreen] Error sending reset email:', error);
      
      let errorMessage = 'Възникна грешка при изпращане на имейла.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Не е намерен потребител с този имейл адрес.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Невалиден имейл адрес.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Твърде много заявки. Моля, опитайте отново по-късно.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Грешка', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    if (resendCooldown === 0) {
      handleSendResetEmail();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Enhanced Background */}
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
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(220, 214, 193, 0.08)', 'rgba(166, 138, 100, 0.12)'] : ['rgba(245, 244, 241, 0.6)', 'rgba(220, 215, 206, 0.4)']}
          style={styles.floatingGradient}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
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

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={[styles.title, { color: getTextColor() }]}>
              Забравена парола
            </Text>
            <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
              Въведете имейла си за възстановяване
            </Text>
          </Animated.View>

          {/* Success Message */}
          {emailSent && (
            <Animated.View
              style={[
                styles.successSection,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <View style={[styles.successCard, getGlassmorphismStyle()]}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={[styles.successTitle, { color: getTextColor() }]}>
                  Имейл изпратен!
                </Text>
                <Text style={[styles.successMessage, { color: getSecondaryTextColor() }]}>
                  Проверете пощенската си кутия за инструкции за възстановяване на паролата.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            <View style={[styles.formWrapper, getGlassmorphismStyle()]}>
              <Text style={[styles.formTitle, { color: getTextColor() }]}>
                Имейл адрес
              </Text>
              
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                  <TextInput
                    style={[styles.textInput, { color: getTextColor() }]}
                    placeholder="Въведете вашия имейл"
                    placeholderTextColor={getSecondaryTextColor() + '80'}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={() => validateEmail(email)}
                    editable={!isLoading}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <Text style={[styles.instructionText, { color: getSecondaryTextColor() }]}>
                Ще получите имейл с линк за възстановяване на паролата си.
              </Text>
            </View>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonSection,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            {/* Send Reset Email Button */}
            <TouchableOpacity
              onPress={emailSent ? handleResendEmail : handleSendResetEmail}
              disabled={isLoading || (emailSent && resendCooldown > 0)}
              style={[
                styles.primaryButton,
                styles.glassMorphButton,
                {
                  backgroundColor: emailSent ? '#FF9800' : '#b2ac94',
                  borderColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: (isLoading || (emailSent && resendCooldown > 0)) ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.buttonContent, { paddingHorizontal: 24 }]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                    {emailSent 
                      ? (resendCooldown > 0 ? `Изпрати отново (${resendCooldown}s)` : 'Изпрати отново')
                      : 'Изпрати имейл'
                    }
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Back to Login Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[styles.secondaryButton, getGlassmorphismStyle(), styles.glassMorphButton]}
            >
              <View style={styles.buttonContent}>
                <Text style={[styles.secondaryButtonText, { color: getTextColor() }]}>
                  Назад към влизане
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={[styles.helpText, { color: getSecondaryTextColor() }]}>
              💡 Съвет: Проверете и папката си за спам ако не получите имейла в рамките на няколко минути.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 10,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },

  // Success Section
  successSection: {
    width: '100%',
    marginBottom: 30,
  },
  successCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
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
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form Section
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  formWrapper: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(166, 138, 100, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  inputWrapperError: {
    borderColor: '#F44336',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Button Section
  buttonSection: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1,
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
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    textAlign: 'center',
  },

  // Help Section
  helpSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen; 