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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const route = useRoute<ForgotPasswordScreenRouteProp>();
  const { sendPasswordResetEmail, authState, clearError } = useAuth();

  const [email, setEmail] = useState(route.params?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Input ref
  const emailRef = useRef<TextInput>(null);

  useEffect(() => {
    clearError();

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus email input if empty
    if (!email) {
      setTimeout(() => emailRef.current?.focus(), 500);
    }
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
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [emailSent]);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue.trim()) {
      setEmailError('Имейлът е задължителен');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Моля, въведете валиден имейл адрес');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim()) {
      validateEmail(value);
    } else {
      setEmailError('');
    }
  };

  const handleSendResetEmail = async () => {
    if (!validateEmail(email)) return;

    if (resendCooldown > 0) {
      Alert.alert(
        'Моля, изчакайте',
        `Можете да изпратите нов имейл след ${resendCooldown} секунди.`
      );
      return;
    }

    try {
      setIsLoading(true);
      clearError();

      await sendPasswordResetEmail(email.trim().toLowerCase());
      
      setEmailSent(true);
      setResendCooldown(60); // 60 seconds cooldown

      Alert.alert(
        'Имейлът е изпратен!',
        'Изпратихме ви инструкции за възстановяване на паролата. Моля, проверете пощенската си кутия.',
        [
          {
            text: 'Разбрах',
            onPress: () => {
              // Optional: navigate back to login after a delay
              setTimeout(() => {
                navigation.navigate('Login');
              }, 2000);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Възникна неочаквана грешка. Моля, опитайте отново.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Не намерихме акаунт с този имейл адрес. Моля, проверете имейла или се регистрирайте.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Невалиден имейл адрес. Моля, въведете правилен имейл.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Твърде много опити. Моля, изчакайте малко преди да опитате отново.';
      }

      Alert.alert('Грешка при изпращане', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8F4F0', '#DDD0C8', '#B0A89F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Забравена парола</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              emailSent && {
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={emailSent ? ['#4CAF50', '#45a049'] : ['#FFD700', '#FFA500']}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>
                {emailSent ? '✅' : '🔑'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>
              {emailSent ? 'Имейлът е изпратен!' : 'Възстановяване на парола'}
            </Text>
            
            <Text style={styles.subtitle}>
              {emailSent 
                ? 'Проверете пощенската си кутия за инструкции как да възстановите паролата си.'
                : 'Въведете имейл адреса си и ще ви изпратим инструкции за възстановяване на паролата.'
              }
            </Text>

            {!emailSent && (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Имейл адрес</Text>
                  <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
                    <TextInput
                      ref={emailRef}
                      style={styles.textInput}
                      placeholder="example@email.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      onSubmitEditing={handleSendResetEmail}
                      editable={!isLoading}
                    />
                    <View style={styles.inputIcon}>
                      <Text style={styles.inputIconText}>📧</Text>
                    </View>
                  </View>
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                {/* Send Reset Email Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleSendResetEmail}
                  disabled={isLoading}
                >
                  <View style={styles.primaryButtonInner}>
                    {isLoading ? (
                      <ActivityIndicator color="#FAF7F3" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Изпрати инструкции</Text>
                        <Text style={styles.primaryButtonIcon}>📤</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {emailSent && (
              <>
                {/* Email Sent Info */}
                <View style={styles.emailSentContainer}>
                  <Text style={styles.emailSentText}>
                    Изпратихме инструкции на:
                  </Text>
                  <Text style={styles.emailAddressText}>{email}</Text>
                </View>

                {/* Resend Button */}
                <TouchableOpacity
                  style={[styles.secondaryButton, resendCooldown > 0 && styles.secondaryButtonDisabled]}
                  onPress={handleSendResetEmail}
                  disabled={resendCooldown > 0}
                >
                  <View style={styles.secondaryButtonContent}>
                    <Text style={styles.secondaryButtonText}>
                      {resendCooldown > 0 
                        ? `Изпрати отново (${resendCooldown}s)` 
                        : 'Изпрати отново'
                      }
                    </Text>
                    <Text style={styles.secondaryButtonIcon}>🔄</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Нужна помощ?</Text>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>💡</Text>
              <Text style={styles.helpText}>
                Проверете папката за спам или нежелана поща
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>⏰</Text>
              <Text style={styles.helpText}>
                Имейлът може да отнеме до 5 минути за пристигане
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🔒</Text>
              <Text style={styles.helpText}>
                Линкът за възстановяване е валиден 1 час
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity style={styles.navigationButton} onPress={handleBackToLogin}>
              <Text style={styles.navigationButtonText}>← Обратно към вход</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navigationButton} onPress={handleCreateAccount}>
              <Text style={styles.navigationButtonText}>Създай нов акаунт →</Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {authState.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDisplayText}>{authState.error.message}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F0',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(176, 168, 159, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#2D2928',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2928',
    textAlign: 'center',
    textShadowColor: 'rgba(45, 41, 40, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B0A89F',
    shadowColor: '#B0A89F',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  icon: {
    fontSize: 48,
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2928',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(45, 41, 40, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#5D504B',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(93, 80, 75, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D342F',
    marginBottom: 8,
    textShadowColor: 'rgba(61, 52, 47, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 244, 240, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.5)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperError: {
    borderColor: '#B85450',
    backgroundColor: 'rgba(184, 84, 80, 0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#3D342F',
    paddingVertical: 0,
  },
  inputIcon: {
    marginLeft: 8,
  },
  inputIconText: {
    fontSize: 20,
    color: '#6B5B57',
  },
  errorText: {
    fontSize: 12,
    color: '#B85450',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  primaryButton: {
    marginBottom: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 127, 120, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(139, 127, 120, 0.9)',
    shadowColor: '#8B7F78',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
    overflow: 'hidden',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAF7F3',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  primaryButtonIcon: {
    fontSize: 18,
    color: '#FAF7F3',
  },
  emailSentContainer: {
    backgroundColor: 'rgba(239, 232, 226, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.5)',
    alignItems: 'center',
  },
  emailSentText: {
    fontSize: 16,
    color: '#5D504B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailAddressText: {
    fontSize: 16,
    color: '#3D342F',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(234, 227, 219, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 56,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#6B5B57',
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButtonIcon: {
    fontSize: 16,
    color: '#6B5B57',
  },
  helpSection: {
    backgroundColor: 'rgba(234, 227, 219, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.5)',
    width: '100%',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D342F',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  helpIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
    color: '#6B5B57',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#5D504B',
    lineHeight: 18,
  },
  navigationContainer: {
    width: '100%',
    gap: 16,
  },
  navigationButton: {
    backgroundColor: 'rgba(239, 232, 226, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  navigationButtonText: {
    fontSize: 16,
    color: '#6B5B57',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(184, 84, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(184, 84, 80, 0.3)',
  },
  errorDisplayText: {
    fontSize: 14,
    color: '#B85450',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen; 