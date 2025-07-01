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
import { AuthStackParamList, LoginCredentials } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signInWithEmail, authState, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  // Input refs for focus management
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

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
    if (passwordValue.length < 6) {
      setPasswordError('Паролата трябва да бъде поне 6 символа');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateForm = (): boolean => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    return isEmailValid && isPasswordValid;
  };

  const handleEmailLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      clearError();

      const credentials: LoginCredentials = {
        email: email.trim().toLowerCase(),
        password,
      };

      await signInWithEmail(credentials);
      
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      // The error will be displayed via authState.error, no need for an alert here.
      console.error('Login error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>Влизане</Text>
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
            <Text style={styles.welcomeTitle}>Добре дошли отново!</Text>
            <Text style={styles.welcomeSubtitle}>
              Влезте в акаунта си, за да продължите
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
                onChangeText={(text) => {
                  setEmail(text);
                  validateEmail(text);
                }}
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
                placeholder="Въведете паролата си"
                placeholderTextColor="rgba(227, 242, 253, 0.5)"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validatePassword(text);
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleEmailLogin}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Forgot Password Link */}
          <View style={styles.optionsRow}>
             <View style={{flex: 1}} />
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Забравена парола?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1A1A1A" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Влизане</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Нямате акаунт? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Регистрирайте се</Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {authState.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authState.error.message}</Text>
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
    minHeight: 600,
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
    marginBottom: 40,
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
  },
  inputContainer: {
    marginBottom: 20,
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
    fontSize: 20,
    color: 'rgba(227, 242, 253, 0.6)',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00B4DB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: 'rgba(227, 242, 253, 0.8)',
  },
  registerLink: {
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
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen; 