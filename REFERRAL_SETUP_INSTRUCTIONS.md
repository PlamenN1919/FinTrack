# 🎉 Referral System - Инструкции за Инсталация и Тестване

## ✅ Какво беше поправено:

### 1. **Добавени библиотеки**
- ✅ `@react-native-clipboard/clipboard` - за копиране на referral линк
- ✅ `react-native-device-info` - за уникален device ID и anti-fraud

### 2. **ReferralService подобрения**
- ✅ Реална имплементация на `copyReferralLink()` с Clipboard API
- ✅ Реална имплементация на `getDeviceId()` с DeviceInfo
- ✅ Запазване на referrer ID в AsyncStorage при deep link
- ✅ Нови методи: `getPendingReferrerId()`, `clearPendingReferrerId()`

### 3. **Deep Link обработка**
- ✅ Добавен route за `/invite?ref=XXX` в `linking.config.ts`
- ✅ Добавена обработка в `deepLinkHandler.ts`
- ✅ Автоматична навигация към Register screen при referral link

### 4. **PaymentSuccessScreen интеграция**
- ✅ Проверка за pending referrer ID след успешно плащане
- ✅ Автоматично извикване на `processReferralReward()`
- ✅ Изчистване на pending referrer ID след обработка

### 5. **Firebase Functions поправки**
- ✅ Използване на `subscriptions` колекция вместо `users.subscription`
- ✅ Правилно поле: `currentPeriodEnd` вместо `endDate`
- ✅ Подобрена error handling за push notifications

---

## 📦 СТЪПКА 1: Инсталация на зависимости

```bash
# В главната директория на проекта
cd /Users/nikolovp/Documents/FinTrack1

# Инсталирай новите пакети
npm install

# За iOS - инсталирай pods
cd ios
pod install
cd ..
```

---

## 🔥 СТЪПКА 2: Deploy на Firebase Functions

```bash
# Deploy обновените functions
firebase deploy --only functions

# Или deploy само referral функциите:
firebase deploy --only functions:generateReferralLink,functions:processReferralReward,functions:getReferralStats
```

---

## 🧪 СТЪПКА 3: Тестване на Referral Flow

### Тест 1: Генериране на Referral Link

1. Стартирай приложението
2. Влез с потребител с активен абонамент
3. Отвори екрана "Покани приятели"
4. Натисни "🚀 Сподели Link"
5. **Очакван резултат:** 
   - Линк се генерира успешно
   - Показва се Alert с опции за споделяне

### Тест 2: Копиране на Link

1. В екрана "Покани приятели"
2. Натисни на линка в полето за preview
3. **Очакван резултат:**
   - Показва се "✅ Копирано!"
   - Линкът е в clipboard

### Тест 3: Deep Link Handling (Симулатор)

```bash
# iOS Simulator
xcrun simctl openurl booted "fintrack://invite?ref=USER_ID_HERE"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "fintrack://invite?ref=USER_ID_HERE"
```

**Очакван резултат:**
- Приложението се отваря
- Показва се Alert: "🎉 Покана приета!"
- Навигира към Register screen

### Тест 4: Пълен Referral Flow

#### Потребител A (Referrer):
1. Влез в приложението
2. Отвори "Покани приятели"
3. Генерирай referral link
4. Копирай линка (напр. `fintrack://invite?ref=USER_A_ID`)

#### Потребител B (Referee):
1. Отвори линка на нов емулатор/устройство
2. Регистрирай нов потребител
3. Избери абонаментен план
4. Направи тестово плащане
5. **Очакван резултат:**
   - Плащането е успешно
   - Автоматично се обработва referral наградата
   - Потребител A получава +1 месец към абонамента

#### Проверка на наградата:
```bash
# Провери в Firebase Console
# Firestore -> subscriptions -> USER_A_ID
# Виж дали currentPeriodEnd е удължен с 1 месец

# Провери в Firebase Console
# Firestore -> referrals -> (намери документа)
# Виж дали status = 'completed' и rewardGranted = true
```

---

## 🔍 СТЪПКА 4: Debugging

### Проверка на AsyncStorage

```typescript
// В ReferralService или PaymentSuccessScreen
import AsyncStorage from '@react-native-async-storage/async-storage';

// Провери дали referrer ID е запазен
const referrerId = await AsyncStorage.getItem('pendingReferrerId');
console.log('Pending Referrer ID:', referrerId);
```

### Проверка на Firebase Functions Logs

```bash
# Виж логовете в реално време
firebase functions:log --only generateReferralLink,processReferralReward,getReferralStats

# Или в Firebase Console:
# Functions -> Logs
```

### Проверка на Device ID

```typescript
import DeviceInfo from 'react-native-device-info';

const deviceId = await DeviceInfo.getUniqueId();
console.log('Device ID:', deviceId);
```

---

## ⚠️ Известни ограничения

### 1. **Universal Links не са конфигурирани**

Текущият referral link е: `fintrack://invite?ref=XXX`

Това работи само ако приложението е инсталирано. За production трябва:

#### iOS - Universal Links:
1. Създай `apple-app-site-association` файл
2. Качи го на `https://fintrack.app/.well-known/apple-app-site-association`
3. Добави Associated Domains в Xcode

#### Android - App Links:
1. Създай `assetlinks.json` файл
2. Качи го на `https://fintrack.app/.well-known/assetlinks.json`
3. Добави intent-filter в AndroidManifest.xml

### 2. **Referral Link URL**

Firebase Function генерира: `https://fintrack.app/invite?ref=XXX`

Този домейн трябва да:
- Съществува и да е достъпен
- Има конфигурирани Universal/App Links
- Или да се използва Firebase Dynamic Links

### 3. **Anti-fraud система**

Текущата имплементация проверява:
- ✅ Device ID дубликати
- ✅ IP адрес дубликати
- ✅ Временни email домейни
- ✅ Self-referral

Но може да се подобри с:
- Geolocation проверки
- Времеви интервали между инсталация и абонамент
- Поведенчески анализ

---

## 🚀 Production Deployment Checklist

- [ ] Инсталирай зависимости (`npm install`)
- [ ] Build iOS (`cd ios && pod install`)
- [ ] Deploy Firebase Functions
- [ ] Тествай deep link handling
- [ ] Тествай пълния referral flow
- [ ] Конфигурирай Universal Links (iOS)
- [ ] Конфигурирай App Links (Android)
- [ ] Настрой production домейн за referral links
- [ ] Тествай на реални устройства
- [ ] Провери Firestore security rules за `referrals` колекция

---

## 📊 Firestore Collections

### `referrals` колекция:
```typescript
{
  referrerId: string,           // UID на поканилия
  referrerEmail: string,        // Email на поканилия
  refereeId?: string,           // UID на поканения (след регистрация)
  refereeEmail?: string,        // Email на поканения
  status: 'pending' | 'completed' | 'expired',
  createdAt: Timestamp,
  completedAt?: Timestamp,
  rewardGranted: boolean,
  rewardGrantedAt?: Timestamp,
  refereeIpAddress?: string,
  refereeDeviceId?: string,
}
```

### `subscriptions` колекция (обновена):
```typescript
{
  // ... други полета
  currentPeriodEnd: Timestamp,  // Това се удължава с 1 месец при награда
}
```

---

## 💡 Съвети за тестване

1. **Използвай различни емулатори** за referrer и referee
2. **Изчиствай AsyncStorage** между тестове
3. **Провери Firebase Functions logs** за грешки
4. **Тествай с невалидни referrer IDs** за error handling
5. **Тествай с изтекъл абонамент** на referrer-а

---

## 🎯 Следващи подобрения (опционално)

1. **Firebase Dynamic Links** - за по-добра deep link обработка
2. **Referral Dashboard** - визуализация на статистики
3. **Email notifications** - известия при успешен referral
4. **Referral tiers** - различни награди според броя покани
5. **Social sharing** - директна интеграция с Facebook, Instagram, etc.

---

## 📞 Support

Ако има проблеми:
1. Провери Firebase Functions logs
2. Провери Metro bundler console
3. Провери Xcode/Android Studio console
4. Провери Firestore данни

Всички промени са документирани в `.cursorrules` файла под секция "Referral System Patterns".

