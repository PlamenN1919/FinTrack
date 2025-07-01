import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

// Интерфейс за потребителски данни
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { userData, updateUserData, loading: isUserLoading } = useUser();
  
  // Локално състояние за редактиране
  const [profile, setProfile] = useState<UserProfile>({
    name: userData?.name || '',
    email: userData?.email || '',
    avatar: userData?.avatar || 'https://example.com/default-avatar.png',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Обновяване на поле от профила
  const updateField = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Валидация на данните
  const validateProfile = (): boolean => {
    if (!profile.name.trim()) {
      Alert.alert('Грешка', 'Моля, въведете име');
      return false;
    }
    
    if (!profile.email.trim() || !profile.email.includes('@')) {
      Alert.alert('Грешка', 'Моля, въведете валиден имейл адрес');
      return false;
    }

    return true;
  };

  // Запазване на промените
  const saveProfile = async () => {
    if (!validateProfile()) return;
    
    setIsLoading(true);
    
    try {
      const dataToUpdate = {
        name: profile.name,
        avatar: profile.avatar,
      };

      await updateUserData(dataToUpdate);
      
      Alert.alert(
        'Успех', 
        'Профилът е обновен успешно!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Грешка', 'Възникна проблем при запазването. Моля, опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  };

  // Избор на снимка от галерията
  const selectImageFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          updateField('avatar', imageUri);
        }
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Минималистичен header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Назад
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Редактиране
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Аватар секция */}
        <View style={[styles.avatarCard, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity 
            onPress={selectImageFromGallery}
            style={styles.avatarContainer}
            activeOpacity={0.7}
          >
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={[styles.avatarOverlay, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarOverlayText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>
            Натиснете за промяна на снимката
          </Text>
        </View>

        {/* Основна информация */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Основна информация
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Пълно име
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={profile.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Въведете вашето име"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Имейл адрес
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={profile.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="example@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={styles.inputHint}>Имейлът не може да бъде променян.</Text>
          </View>
        </View>

        {/* Бутони */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
              Отказ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: theme.colors.primary,
              opacity: isLoading ? 0.7 : 1
            }]}
            onPress={saveProfile}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Запазване...' : 'Запази'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Минималистичен header
  header: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 2,
  },
  headerSpacer: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
    padding: 20,
  },
  
  // Аватар карта
  avatarCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarOverlayText: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Информационна карта
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Бутони
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 