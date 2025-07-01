import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/auth.types';

type TermsOfServiceScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TermsOfService'>;

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<TermsOfServiceScreenNavigationProp>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
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

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
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
        <Text style={styles.headerTitle}>Условия за ползване</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
          {/* Last Updated */}
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Последна актуализация: {new Date().toLocaleDateString('bg-BG')}
            </Text>
          </View>

          {/* Introduction */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Въведение</Text>
            <Text style={styles.sectionText}>
              Добре дошли в FinTrack! Тези условия за ползване ("Условия") уреждат използването на мобилното приложение FinTrack ("Приложението") и свързаните с него услуги. Използвайки нашето приложение, вие се съгласявате да спазвате тези условия.
            </Text>
          </View>

          {/* Service Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>1. Описание на услугата</Text>
            <Text style={styles.sectionText}>
              FinTrack е приложение за управление на лични финанси, което ви позволява да:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Проследявате приходи и разходи</Text>
              <Text style={styles.bulletPoint}>• Анализирате финансови модели</Text>
              <Text style={styles.bulletPoint}>• Създавате бюджети и цели</Text>
              <Text style={styles.bulletPoint}>• Получавате подробни отчети</Text>
              <Text style={styles.bulletPoint}>• Сканирате разписки</Text>
            </View>
          </View>

          {/* User Accounts */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>2. Потребителски акаунти</Text>
            <Text style={styles.sectionText}>
              За да използвате пълната функционалност на FinTrack, трябва да създадете акаунт. Вие сте отговорни за:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Поддържане на сигурността на вашия акаунт</Text>
              <Text style={styles.bulletPoint}>• Предоставяне на точна информация</Text>
              <Text style={styles.bulletPoint}>• Актуализиране на данните при промени</Text>
              <Text style={styles.bulletPoint}>• Незабавно известяване при неоторизиран достъп</Text>
            </View>
          </View>

          {/* Subscription */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>3. Абонамент и плащания</Text>
            <Text style={styles.sectionText}>
              FinTrack предлага различни абонаментни планове с различни функционалности. Абонаментите се подновяват автоматично освен ако не бъдат отменени. Всички такси са окончателни и не подлежат на възстановяване, освен ако не е предвидено друго по закон.
            </Text>
          </View>

          {/* Data Privacy */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>4. Поверителност на данните</Text>
            <Text style={styles.sectionText}>
              Вашата поверителност е важна за нас. Моля, прегледайте нашата Политика за поверителност, която описва как събираме, използваме и защитаваме вашите данни. Използвайки нашето приложение, вие се съгласявате със събирането и използването на информация според тази политика.
            </Text>
          </View>

          {/* Prohibited Use */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>5. Забранено използване</Text>
            <Text style={styles.sectionText}>
              Не можете да използвате FinTrack за:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Незаконни дейности</Text>
              <Text style={styles.bulletPoint}>• Нарушаване на правата на други</Text>
              <Text style={styles.bulletPoint}>• Разпространение на вируси или злонамерен код</Text>
              <Text style={styles.bulletPoint}>• Опити за неоторизиран достъп</Text>
              <Text style={styles.bulletPoint}>• Използване за търговски цели без разрешение</Text>
            </View>
          </View>

          {/* Liability */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>6. Ограничение на отговорността</Text>
            <Text style={styles.sectionText}>
              FinTrack се предоставя "както е" без никакви гаранции. Не носим отговорност за загуба на данни, финансови загуби или други щети, възникнали от използването на приложението. Използвате услугата на собствен риск.
            </Text>
          </View>

          {/* Changes */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>7. Промени в условията</Text>
            <Text style={styles.sectionText}>
              Запазваме си правото да променяме тези условия по всяко време. Ще ви уведомим за съществени промени чрез приложението или по имейл. Продължаването на използването след промените означава приемане на новите условия.
            </Text>
          </View>



          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              © 2024 FinTrack. Всички права запазени.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E3F2FD',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
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
    paddingTop: 20,
  },
  lastUpdatedContainer: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: 'rgba(227, 242, 253, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionContainer: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E3F2FD',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 180, 219, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionText: {
    fontSize: 15,
    color: 'rgba(227, 242, 253, 0.9)',
    lineHeight: 22,
    fontWeight: '400',
  },
  bulletContainer: {
    marginTop: 12,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: 'rgba(227, 242, 253, 0.9)',
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: '400',
  },
  footerContainer: {
    backgroundColor: 'rgba(1, 87, 155, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 219, 0.3)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(227, 242, 253, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TermsOfServiceScreen; 