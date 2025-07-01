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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, RegisterCredentials } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUpWithEmail, authState, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  // Input refs for focus management
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    // Clear any existing errors when component mounts
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
  }, []);

  // Real-time validation
  const validateEmail = (emailValue: string) => {
    const processedEmail = emailValue.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!processedEmail) {
      setEmailError('Имейлът е задължителен');
      return false;
    }
    if (!emailRegex.test(processedEmail)) {
      setEmailError('Моля, въведете валиден имейл адрес');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (passwordValue: string) => {
    if (!passwordValue.trim()) {
      setPasswordError('Паролата е задължителна');
      return false;
    }
    if (passwordValue.length < 8) {
      setPasswordError('Паролата трябва да бъде поне 8 символа');
      return false;
    }
    if (!/(?=.*[a-z])/.test(passwordValue)) {
      setPasswordError('Паролата трябва да съдържа поне една малка буква');
      return false;
    }
    if (!/(?=.*[A-Z])/.test(passwordValue)) {
      setPasswordError('Паролата трябва да съдържа поне една главна буква');
      return false;
    }
    if (!/(?=.*\d)/.test(passwordValue)) {
      setPasswordError('Паролата трябва да съдържа поне една цифра');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmValue: string) => {
    if (!confirmValue.trim()) {
      setConfirmPasswordError('Потвърждението на паролата е задължително');
      return false;
    }
    if (confirmValue !== password) {
      setConfirmPasswordError('Паролите не съвпадат');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateForm = (): boolean => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!acceptTerms) {
      Alert.alert('Грешка', 'Моля, приемете условията за ползване');
      return false;
    }

    return isEmailValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const processedEmail = value.trim().toLowerCase();
    if (processedEmail) {
      validateEmail(processedEmail);
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.trim()) {
      validatePassword(value);
    } else {
      setPasswordError('');
    }
    // Re-validate confirm password if it's already filled
    if (confirmPassword.trim()) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value.trim()) {
      validateConfirmPassword(value);
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      clearError();

      const credentials: RegisterCredentials = {
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        acceptTerms,
      };

      await signUpWithEmail(credentials);
      
      // Navigation will be handled automatically by AuthNavigator based on user state
    } catch (error: any) {
      // Log a cleaner error message to the console for debugging
      console.warn(`Registration failed: ${error.message}`);
      // The error is already being displayed via the authState.error in the UI
      // so the alert is redundant.
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '#999' };
    
    let strength = 0;
    let text = '';
    let color = '#F44336';

    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        text = 'Много слаба';
        color = '#F44336';
        break;
      case 2:
        text = 'Слаба';
        color = '#FF9800';
        break;
      case 3:
        text = 'Средна';
        color = '#FFC107';
        break;
      case 4:
        text = 'Силна';
        color = '#8BC34A';
        break;
      case 5:
        text = 'Много силна';
        color = '#4CAF50';
        break;
    }

    return { strength: (strength / 5) * 100, text, color };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium Background */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#2A2020', '#1A1A1A', '#0A0A0A']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
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
        <Text style={styles.headerTitle}>Регистрация</Text>
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
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/F.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['rgba(0, 180, 219, 0.4)', 'rgba(64, 196, 255, 0.2)']}
                style={styles.logoGlow}
              />
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Създайте акаунт</Text>
            <Text style={styles.welcomeSubtitle}>
              Присъединете се към FinTrack и започнете да управлявате финансите си умно
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Имейл адрес</Text>
            <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                ref={emailRef}
                style={styles.textInput}
                placeholder="example@email.com"
                placeholderTextColor="rgba(227, 242, 253, 0.5)"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!isLoading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Парола</Text>
            <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                ref={passwordRef}
                style={styles.textInput}
                placeholder="Въведете сигурна парола"
                placeholderTextColor="rgba(227, 242, 253, 0.5)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View 
                    style={[
                      styles.passwordStrengthFill, 
                      { 
                        width: `${passwordStrength.strength}%`,
                        backgroundColor: passwordStrength.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Потвърдете паролата</Text>
            <View style={[styles.inputWrapper, confirmPasswordError && styles.inputWrapperError]}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                ref={confirmPasswordRef}
                style={styles.textInput}
                placeholder="Въведете паролата отново"
                placeholderTextColor="rgba(227, 242, 253, 0.5)"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxWrapper}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              
              <View style={styles.termsTextWrapper}>
                <Text style={styles.termsMainText}>
                  Съгласявам се с{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => navigation.navigate('TermsOfService')}
                  >
                    Условията за ползване
                  </Text>
                  {' '}и{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >
                    Политиката за поверителност
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1A1A1A" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Създай акаунт</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Вече имате акаунт? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Влезте тук</Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {authState.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTextContainer}>{authState.error.message}</Text>
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
    backgroundColor: '#0A0A0A',
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
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#E3F2FD',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.5)',
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 700,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    borderWidth: 3,
    borderColor: '#00B4DB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#00B4DB',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 52,
    zIndex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E3F2FD',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperError: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#E3F2FD',
    paddingVertical: 0,
    paddingLeft: 12,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  passwordToggle: {
    padding: 4,
    marginLeft: 8,
  },
  passwordToggleText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(227, 242, 253, 0.2)',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 80,
  },
  termsContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(227, 242, 253, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00B4DB',
    borderColor: '#00B4DB',
  },
  checkmark: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsTextWrapper: {
    flex: 1,
  },
  termsMainText: {
    fontSize: 14,
    color: 'rgba(227, 242, 253, 0.8)',
    lineHeight: 20,
    fontWeight: '400',
  },
  termsLink: {
    color: '#00B4DB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginBottom: 24,
    borderRadius: 25,
    backgroundColor: '#00B4DB',
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4DB',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 64,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.8)',
  },
  loginLink: {
    fontSize: 16,
    color: '#00B4DB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorTextContainer: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default RegisterScreen; 