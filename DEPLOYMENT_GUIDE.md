# 🚀 FinTrack - Пълно Ръководство за Публикуване

**Дата:** 21 Януари 2026  
**Версия:** 1.0.0  
**Статус:** Готово за production след изпълнение на стъпките

---

## 📋 Съдържание

1. [Предварителни Изисквания](#предварителни-изисквания)
2. [Подготовка на Кода](#подготовка-на-кода)
3. [Android - Google Play Store](#android---google-play-store)
4. [iOS - Apple App Store](#ios---apple-app-store)
5. [Firebase Production Setup](#firebase-production-setup)
6. [Stripe Live Mode](#stripe-live-mode)
7. [Финални Проверки](#финални-проверки)

---

## 🔧 Предварителни Изисквания

### Акаунти (ако нямаш)

| Акаунт | Цена | Линк |
|--------|------|------|
| Google Play Console | $25 еднократно | https://play.google.com/console |
| Apple Developer Program | $99/година | https://developer.apple.com/programs |
| Firebase (Blaze план) | Pay-as-you-go | https://console.firebase.google.com |
| Stripe Account | Безплатно + комисиони | https://stripe.com |

### Задължителни Документи

1. **Privacy Policy** - Политика за поверителност
2. **Terms of Service** - Общи условия
3. **App Description** - Описание на български и английски
4. **Screenshots** - За двете платформи
5. **App Icon** - 1024x1024 PNG без прозрачност

---

## 🔨 Подготовка на Кода

### 1. Проверка на версията

Текуща версия: `1.0` / Build: `1`

За следващи версии обнови:
- **Android:** `android/app/build.gradle` → `versionCode` и `versionName`
- **iOS:** Xcode → Target → General → Version и Build

### 2. Production Build Configuration

Babel вече е конфигуриран да премахва `console.log` в production:

```javascript
// babel.config.js - ВЕЧЕ КОНФИГУРИРАН ✅
env: {
  production: {
    plugins: [
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ]
  }
}
```

### 3. Environment Variables

Създай `.env.production` файл (вече е в .gitignore):

```env
# .env.production
STRIPE_PUBLISHABLE_KEY=pk_live_51RHUZWG1pdDRlAv6QmXDa9GYBXlCxLZo1XFbXQYRJhs98fzMbkxGgIBkHX7FyXp1jOEZuGmTGmqmREA2siiVajcj00KVZbWE63

# Firebase се инициализира автоматично от native config файлове
```

---

## 🤖 Android - Google Play Store

### Стъпка 1: Генериране на Release Keystore

⚠️ **ВАЖНО:** Keystore файлът е ЕДИНСТВЕНИЯТ начин да обновяваш приложението!  
Запази го на сигурно място (Google Drive, iCloud) с паролите!

```bash
# В папката android/app
cd android/app

# Генерирай keystore (ще те пита за пароли)
keytool -genkeypair -v -storetype PKCS12 -keystore fintrack-release.keystore -alias fintrack -keyalg RSA -keysize 2048 -validity 10000

# Ще те пита:
# - Keystore password: (запиши я!)
# - Key password: (може да е същата)
# - Име и фамилия: Твоето име
# - Organizational Unit: FinTrack
# - Organization: Твоята фирма
# - City: София
# - State: София
# - Country Code: BG
```

### Стъпка 2: Конфигуриране на Signing

Добави в `android/gradle.properties`:

```properties
# Release Signing (НЕ COMMIT-вай тези данни!)
MYAPP_UPLOAD_STORE_FILE=fintrack-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=fintrack
MYAPP_UPLOAD_STORE_PASSWORD=твоята_парола
MYAPP_UPLOAD_KEY_PASSWORD=твоята_парола
```

Обнови `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### Стъпка 3: Build Release APK/AAB

```bash
# От root на проекта
cd android

# Изчисти предишни build-ове
./gradlew clean

# Build Android App Bundle (препоръчително за Play Store)
./gradlew bundleRelease

# Или APK (за тестване)
./gradlew assembleRelease
```

**Резултат:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### Стъпка 4: Google Play Console

1. **Отиди на:** https://play.google.com/console

2. **Създай ново приложение:**
   - Име: FinTrack
   - Език: Български
   - Тип: Приложение
   - Категория: Финанси

3. **Попълни Store listing:**
   - Кратко описание (80 символа): "Умен финансов мениджър с AI анализи"
   - Пълно описание (4000 символа)
   - Икона: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: Минимум 2 на телефон

4. **Content rating:** Попълни въпросника (IARC)

5. **Pricing:** Безплатно (абонаментите са In-App)

6. **Upload AAB:**
   - Production → Create new release
   - Upload `app-release.aab`
   - Release notes на български

7. **Review:** Google преглежда 1-7 дни

---

## 🍎 iOS - Apple App Store

### Стъпка 1: Apple Developer Account

1. **Влез в:** https://developer.apple.com
2. **Членство:** $99/година
3. **Certificates & Identifiers:** Създай App ID

### Стъпка 2: Xcode Конфигурация

```bash
# Отвори Xcode workspace
open ios/FinTrackNew.xcworkspace
```

В Xcode:

1. **Signing & Capabilities:**
   - Team: Твоя Apple Developer Team
   - Bundle Identifier: `com.fintracknew` (или твой уникален)
   - Signing Certificate: Automatic

2. **Build Settings:**
   - Провери `MARKETING_VERSION` = 1.0
   - Провери `CURRENT_PROJECT_VERSION` = 1

3. **General:**
   - Display Name: FinTrack
   - Deployment Target: iOS 13.0+

### Стъпка 3: Archive и Upload

1. **Product → Archive**
2. **Изчакай build-а**
3. **Organizer → Distribute App**
4. **App Store Connect → Upload**

### Стъпка 4: App Store Connect

1. **Отиди на:** https://appstoreconnect.apple.com

2. **My Apps → + → New App:**
   - Платформа: iOS
   - Име: FinTrack
   - Primary Language: Bulgarian
   - Bundle ID: com.fintracknew
   - SKU: fintrack001

3. **App Information:**
   - Категория: Finance
   - Подкатегория: Personal Finance

4. **Pricing:** Безплатно

5. **App Privacy:**
   - Data Collection: Да
   - Data Types: Account info, Financial info
   - Linked to user: Да
   - Tracking: Не

6. **Screenshots:**
   - iPhone 6.7" (1290x2796): 3-5 снимки
   - iPhone 6.5" (1284x2778): 3-5 снимки
   - iPad 12.9" (2048x2732): Ако поддържаш

7. **Submit for Review:** Apple преглежда 1-3 дни

---

## 🔥 Firebase Production Setup

### 1. Firestore Security Rules

Провери `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - само собственикът
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Subscriptions - само четене
    match /subscriptions/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false;
    }
    
    // Transactions
    match /transactions/{userId}/userTransactions/{transactionId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Budgets
    match /budgets/{userId}/userBudgets/{budgetId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

### 2. Firebase Functions

```bash
# Провери конфигурацията
firebase functions:config:get

# Ако липсва Stripe конфиг:
firebase functions:config:set stripe.secret="sk_live_ТВОЯ_КЛЮЧ"
firebase functions:config:set stripe.webhook_secret="whsec_ТВОЯ_WEBHOOK_SECRET"

# Deploy
firebase deploy --only functions
```

### 3. Firebase Crashlytics

Вече е конфигуриран в проекта. Провери в Firebase Console → Crashlytics.

---

## 💳 Stripe Live Mode

### 1. Активирай Live Mode

1. **Stripe Dashboard → Activate account**
2. Попълни бизнес информация
3. Добави банкова сметка

### 2. Live Price IDs

Текущите Price IDs вече са Live:

```typescript
// src/config/subscription.config.ts
Monthly:   price_1SmYnPG1pdDRlAv6q17RYNIr   (12.99 EUR)
Quarterly: price_1SmYsVG1pdDRlAv6u14OQk4u   (29.99 EUR)
Yearly:    price_1SmYsVG1pdDRlAv6oZxuHfRF   (75.99 EUR)
```

### 3. Webhook Endpoint

1. **Stripe Dashboard → Developers → Webhooks**
2. **Add endpoint:**
   - URL: `https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook`
   - Events: 
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Копирай Signing secret** → Firebase config

---

## ✅ Финални Проверки

### Pre-Launch Checklist

- [ ] **Privacy Policy** публикувана онлайн
- [ ] **Terms of Service** публикувани онлайн
- [ ] **Stripe Live mode** активиран
- [ ] **Firebase Functions** деплойнати с Live keys
- [ ] **Webhook** конфигуриран и тестван
- [ ] **Keystore** запазен на сигурно място
- [ ] **Screenshots** подготвени
- [ ] **App Description** написано

### Тестване Преди Launch

```bash
# Android Release build test
cd android && ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk

# iOS Archive test
# В Xcode: Product → Archive → Distribute (Ad Hoc)
```

### Payment Flow Test

1. Регистрирай нов потребител
2. Избери абонамент
3. Плати с **реална** карта (Live mode)
4. Провери Stripe Dashboard за плащането
5. Провери Firestore за subscription документа

---

## 📞 Поддръжка

При проблеми:
- Firebase Console → Functions → Logs
- Stripe Dashboard → Developers → Logs
- Crashlytics → Issues

---

## 🎉 След Успешно Публикуване

1. **Мониторинг:** Следи Crashlytics първите дни
2. **Reviews:** Отговаряй на потребителски отзиви
3. **Updates:** Планирай версия 1.1 с подобрения
4. **Marketing:** Социални мрежи, реклама

---

**Успех! 🚀**
