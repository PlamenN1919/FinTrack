# Troubleshooting: Error UNAVAILABLE in PaymentScreen

## Проблем
При опит за плащане в PaymentScreen се появява грешка `Error: UNAVAILABLE`.

## Възможни причини и решения

### 1. Firebase Functions не са деплойнати
**Проверка:**
```bash
firebase login --reauth
firebase functions:list --project fintrack-bef0a
```

**Решение:**
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions --project fintrack-bef0a
```

### 2. Stripe конфигурация липсва
**Проверка:**
```bash
firebase functions:config:get --project fintrack-bef0a
```

**Решение:**
```bash
# Добави Stripe secret key
firebase functions:config:set stripe.secret="sk_test_..." --project fintrack-bef0a

# Добави Webhook secret (опционално)
firebase functions:config:set stripe.webhook_secret="whsec_..." --project fintrack-bef0a

# Redeploy functions
firebase deploy --only functions --project fintrack-bef0a
```

### 3. iOS Simulator мрежова изолация
**Проверка:**
- Провери дали имаш интернет връзка на Mac-а
- Рестартирай симулатора
- Провери Settings → Wi-Fi на симулатора

**Решение:**
```bash
# Рестартирай iOS симулатора
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"  # или твоя модел
```

### 4. React Native Firebase кеш проблем
**Решение:**
```bash
# Изчисти всички кешове
cd ios
rm -rf build Pods Podfile.lock
pod cache clean --all
pod install
cd ..

# Рестартирай Metro bundler
npx react-native start --reset-cache

# В нов терминал:
npx react-native run-ios
```

### 5. Firewall или Network блокиране
**Проверка:**
- Провери дали имаш VPN активен
- Провери дали firewall блокира Firebase домейни

**Решение:**
- Изключи VPN временно
- Добави Firebase домейни в whitelist:
  - `*.googleapis.com`
  - `*.cloudfunctions.net`
  - `firebaseapp.com`

### 6. Firebase проект регион проблем
**Проверка:**
В Firebase Console:
1. Отвори https://console.firebase.google.com/project/fintrack-bef0a
2. Functions → Dashboard
3. Провери региона на функциите (трябва да е `us-central1`)

**Решение:**
Ако функциите са в друг регион, трябва да го укажеш в кода:
```typescript
// В src/config/firebase.config.ts
const functionsInstance = functions().useFunctionsEmulator('europe-west1'); // Пример
```

### 7. Firebase CLI authentication проблем
**Решение:**
```bash
# Logout и login отново
firebase logout
firebase login
firebase projects:list
```

## Debugging стъпки

### Стъпка 1: Провери логовете на Metro
Гледай в терминала където работи Metro bundler за грешки като:
```
[Firebase Config] Functions instance created
[Firebase Config] Project ID: fintrack-bef0a
[PaymentScreen] Network State: ...
[PaymentScreen] Current user: ...
[PaymentScreen] Function call failed!
[PaymentScreen] Function error code: unavailable
```

### Стъпка 2: Провери Firebase Functions логове
```bash
firebase functions:log --project fintrack-bef0a
```

Търси за errors свързани с `createStripeSubscription`.

### Стъпка 3: Тествай функцията директно
Използвай Firebase Console:
1. Functions → createStripeSubscription
2. Тествай с payload: `{"planId": "monthly"}`

### Стъпка 4: Провери Xcode конзолата
Отвори Xcode и гледай конзолата за native errors:
- Product → Scheme → Edit Scheme → Run → Arguments
- Добави Environment Variable: `OS_ACTIVITY_MODE` = `disable` за по-чисти логове

## Често срещани грешки

### "Authentication Error: Your credentials are no longer valid"
```bash
firebase login --reauth
```

### "stripe is not defined" в Functions логовете
```bash
firebase functions:config:set stripe.secret="sk_test_..." --project fintrack-bef0a
firebase deploy --only functions --project fintrack-bef0a
```

### "No such price" грешка
Проверка price IDs в `src/config/subscription.config.ts` и `functions/src/config/subscription.config.ts`.

## Контакт за помощ
Ако проблемът продължава:
1. Копирай ВСИЧКИ логове от Metro bundler
2. Копирай логовете от `firebase functions:log`
3. Направи screenshot на грешката в приложението
4. Сподели информацията за debugging

## Последни промени в кода
- ✅ Добавен по-дълъг timeout (60 секунди) за Functions
- ✅ Подобрена обработка на грешки с детайлна информация
- ✅ Добавена диагностична информация във всички логове
- ✅ Добавен retry механизъм в PaymentScreen

