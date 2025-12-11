# Как да рестартираш геймификацията от нулата

## Проблем
Показва ниво 3 вместо ниво 1, защото има запазен стар профил в AsyncStorage.

## Решение 1: Изчистване през приложението (Препоръчвам)

### Вариант A: Добави бутон за reset в Settings

В `SettingsScreen.tsx` добави:

```typescript
import gamificationService from '../services/GamificationService';

// В компонента:
const handleResetGamification = async () => {
  Alert.alert(
    'Рестартиране на геймификация',
    'Сигурен ли си? Всичкият ти прогрес ще бъде изтрит!',
    [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Рестартирай',
        style: 'destructive',
        onPress: async () => {
          await gamificationService.clearProfile();
          Alert.alert('Готово!', 'Геймификацията е рестартирана.');
          // Reload app или navigate to home
        }
      }
    ]
  );
};

// Бутон:
<TouchableOpacity onPress={handleResetGamification}>
  <Text>🔄 Рестартирай геймификация</Text>
</TouchableOpacity>
```

### Вариант B: Използвай React Native Debugger Console

1. Отвори приложението
2. Shake device или Cmd+D (iOS) / Cmd+M (Android)
3. Open Debug Menu → Debug
4. В Chrome Console:

```javascript
// Изчисти геймификацията
AsyncStorage.removeItem('fintrack_gamification');

// Reload app
location.reload();
```

## Решение 2: Изчистване на цялото приложение

### iOS:
```bash
# Изтрий приложението от симулатора/устройството
# После rebuild:
cd ios && pod install && cd ..
npx react-native run-ios
```

### Android:
```bash
# Изтрий app data:
adb shell pm clear com.fintracknew

# Или rebuild:
npx react-native run-android
```

## Решение 3: Програмно изчистване (Временно)

Добави в `App.tsx` (само за тестване):

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// В useEffect при стартиране:
useEffect(() => {
  // САМО ЗА ТЕСТВАНЕ - ПРЕМАХНИ СЛЕД ТОВА!
  AsyncStorage.removeItem('fintrack_gamification').then(() => {
    console.log('✅ Gamification reset!');
  });
}, []);
```

## Решение 4: Автоматично изчистване при logout

В `AuthContext.tsx`:

```typescript
const logout = async () => {
  try {
    await auth().signOut();
    
    // Изчисти геймификацията при logout
    await gamificationService.clearProfile();
    
    setAuthState({
      user: null,
      userState: UserState.UNREGISTERED,
      isLoading: false,
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

## Проверка дали е изчистено

След изчистване, провери в console:

```javascript
gamificationService.getProfile()
// Трябва да покаже:
// { xp: 0, level: 1, streakDays: 0, ... }
```

## Превенция за бъдеще

За да не се случва отново, можеш да добавиш версиониране:

```typescript
// В gamificationData.ts:
export const GAMIFICATION_VERSION = '1.0.0';

// В GamificationService:
private async initializeProfile(): Promise<void> {
  const savedProfile = await storageService.loadGamification();
  
  if (savedProfile && savedProfile.version !== GAMIFICATION_VERSION) {
    console.log('🔄 Old version detected, resetting...');
    this.profile = {...mockGamificationProfile, version: GAMIFICATION_VERSION};
    await this.saveProfile();
  }
  // ...
}
```

