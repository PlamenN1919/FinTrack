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

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PrivacyPolicy'>;

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

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
        colors={['#FAF7F3', '#EFE8E2', '#DFD6CF', '#EFE8E2', '#FAF7F3']}
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
        <Text style={styles.headerTitle}>Политика за поверителност</Text>
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
              Тази политика за поверителност ("Политика") описва как FinTrack ("ние", "нас", "нашия") събира, използва, съхранява и защитава вашите лични данни, когато използвате нашето мобилно приложение и свързаните услуги.
            </Text>
          </View>

          {/* Information We Collect */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>1. Информация, която събираме</Text>
            <Text style={styles.sectionText}>
              Ние събираме следните видове информация:
            </Text>
            
            <Text style={styles.subsectionTitle}>Лична информация:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Имейл адрес</Text>
              <Text style={styles.bulletPoint}>• Име (ако е предоставено)</Text>
              <Text style={styles.bulletPoint}>• Профилна снимка (ако е качена)</Text>
            </View>

            <Text style={styles.subsectionTitle}>Финансови данни:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Транзакции и разходи</Text>
              <Text style={styles.bulletPoint}>• Категории на разходи</Text>
              <Text style={styles.bulletPoint}>• Бюджети и финансови цели</Text>
              <Text style={styles.bulletPoint}>• Данни от сканирани разписки</Text>
            </View>

            <Text style={styles.subsectionTitle}>Техническа информация:</Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Тип устройство и операционна система</Text>
              <Text style={styles.bulletPoint}>• IP адрес</Text>
              <Text style={styles.bulletPoint}>• Данни за използването на приложението</Text>
              <Text style={styles.bulletPoint}>• Логове на грешки</Text>
            </View>
          </View>

          {/* How We Use Information */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>2. Как използваме информацията</Text>
            <Text style={styles.sectionText}>
              Използваме събраната информация за:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Предоставяне и подобряване на нашите услуги</Text>
              <Text style={styles.bulletPoint}>• Персонализиране на вашето изживяване</Text>
              <Text style={styles.bulletPoint}>• Анализ на финансови модели и генериране на отчети</Text>
              <Text style={styles.bulletPoint}>• Комуникация с вас относно услугата</Text>
              <Text style={styles.bulletPoint}>• Техническа поддръжка и отстраняване на проблеми</Text>
              <Text style={styles.bulletPoint}>• Предотвратяване на злоупотреби</Text>
            </View>
          </View>

          {/* Data Security */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>3. Сигурност на данните</Text>
            <Text style={styles.sectionText}>
              Вашата сигурност е наш приоритет. Ние прилагаме индустриални стандарти за защита:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• SSL шифроване за всички комуникации</Text>
              <Text style={styles.bulletPoint}>• Криптирани бази данни</Text>
              <Text style={styles.bulletPoint}>• Редовни одити на сигурността</Text>
              <Text style={styles.bulletPoint}>• Ограничен достъп до данни</Text>
              <Text style={styles.bulletPoint}>• Сигурни сървъри и дата центрове</Text>
            </View>
          </View>

          {/* Data Sharing */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>4. Споделяне на данни</Text>
            <Text style={styles.sectionText}>
              Ние НЕ продаваме, търгуваме или даваме под наем вашите лични данни на трети страни. Може да споделим информация само в следните случаи:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• С ваше изрично съгласие</Text>
              <Text style={styles.bulletPoint}>• За спазване на законови изисквания</Text>
              <Text style={styles.bulletPoint}>• С доверени партньори за технически услуги (под строги договори)</Text>
              <Text style={styles.bulletPoint}>• За защита на правата и сигурността на потребителите</Text>
            </View>
          </View>

          {/* Your Rights */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>5. Вашите права</Text>
            <Text style={styles.sectionText}>
              В съответствие с GDPR и българското законодателство, имате следните права:
            </Text>
            <View style={styles.bulletContainer}>
              <Text style={styles.bulletPoint}>• Достъп до вашите лични данни</Text>
              <Text style={styles.bulletPoint}>• Поправка на неточни данни</Text>
              <Text style={styles.bulletPoint}>• Изтриване на данни ("правото да бъдете забранени")</Text>
              <Text style={styles.bulletPoint}>• Ограничаване на обработката</Text>
              <Text style={styles.bulletPoint}>• Преносимост на данни</Text>
              <Text style={styles.bulletPoint}>• Възражение срещу обработката</Text>
            </View>
          </View>

          {/* Data Retention */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>6. Съхранение на данни</Text>
            <Text style={styles.sectionText}>
              Съхраняваме вашите данни само докато е необходимо за предоставянето на услугата или според законовите изисквания. При изтриване на акаунт, всички лични данни се изтриват в рамките на 30 дни, освен ако не са необходими за законови цели.
            </Text>
          </View>

          {/* Cookies */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>7. Бисквитки и проследяване</Text>
            <Text style={styles.sectionText}>
              Използваме технически бисквитки за правилното функциониране на приложението. Можете да управлявате настройките за бисквитки чрез вашето устройство. Не използваме бисквитки за реклама или проследяване от трети страни.
            </Text>
          </View>

          {/* Children's Privacy */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>8. Поверителност на деца</Text>
            <Text style={styles.sectionText}>
              Нашата услуга не е предназначена за деца под 16 години. Ако сте родител или настойник и забележите, че детето ви е предоставило лични данни, моля свържете се с нас за незабавно изтриване.
            </Text>
          </View>

          {/* Changes to Policy */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>9. Промени в политиката</Text>
            <Text style={styles.sectionText}>
              Можем да актуализираме тази политика периодично. Ще ви уведомим за значими промени чрез приложението или по имейл. Препоръчваме редовно да преглеждате тази политика.
            </Text>
          </View>



          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              © 2024 FinTrack. Всички права запазени.
              {'\n'}Политиката е в съответствие с GDPR и българското законодателство.
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
    backgroundColor: '#FAF7F3',
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
    backgroundColor: 'rgba(180, 170, 160, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(168, 157, 147, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FAF7F3',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D342F',
    textAlign: 'center',
    textShadowColor: 'rgba(180, 170, 160, 0.3)',
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
    backgroundColor: 'rgba(248, 244, 240, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.3)',
    width: '100%',
  },
  lastUpdatedContainer: {
    backgroundColor: 'rgba(239, 232, 226, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.3)',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#6B5B57',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D342F',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(180, 170, 160, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B4DB',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#5D504B',
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletContainer: {
    marginLeft: 20,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#6B5B57',
    lineHeight: 22,
    marginBottom: 6,
  },
  footerContainer: {
    backgroundColor: 'rgba(219, 208, 198, 0.8)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 160, 0.3)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#5D504B',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen; 