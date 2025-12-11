# 🚀 Quick Fix - Изпълни тези команди

## ✅ Вече готови промени:
- ✅ PaymentScreen с подобрена обработка на грешки
- ✅ Firebase Functions с валидация на Stripe key
- ✅ Увеличен timeout за Functions (60 секунди)
- ✅ **Node.js upgrade-нат от 18 → 20** (поправя deploy грешката)
- ✅ Functions код е компилиран и готов за deploy

## 📋 Изпълни тези команди в СВОЯ ТЕРМИНАЛ:

### 1️⃣ Authentication (ще отвори браузър)
```bash
cd /Users/nikolovp/Documents/FinTrack1
firebase login --reauth
```

### 2️⃣ Провери проекта
```bash
firebase use fintrack-bef0a
firebase projects:list
```

### 3️⃣ **ВАЖНО!** Конфигурирай Stripe Secret Key

Първо вземи твоя Stripe Secret Key:
- Отвори: https://dashboard.stripe.com/test/apikeys
- Копирай "Secret key" (започва с `sk_test_...`)

След това изпълни (замени `YOUR_KEY` с истинския key):
```bash
firebase functions:config:set stripe.secret="sk_test_YOUR_KEY_HERE" --project fintrack-bef0a
```

**Пример:**
```bash
firebase functions:config:set stripe.secret="sk_test_51ABC123XYZ..." --project fintrack-bef0a
```

### 4️⃣ Провери конфигурацията
```bash
firebase functions:config:get --project fintrack-bef0a
```

Трябва да видиш:
```json
{
  "stripe": {
    "secret": "sk_test_..."
  }
}
```

### 5️⃣ Deploy Functions
```bash
firebase deploy --only functions --project fintrack-bef0a
```

⏱️ Това ще отнеме 2-3 минути. Ще видиш:
```
✔ Deploy complete!
```

### 6️⃣ Провери дали Functions работят
```bash
firebase functions:log --project fintrack-bef0a
```

Търси за "Stripe initialized successfully" в логовете.

### 7️⃣ Рестартирай приложението

**Terminal Tab 1:**
```bash
npx react-native start --reset-cache
```

**Terminal Tab 2 (нов tab):**
```bash
cd /Users/nikolovp/Documents/FinTrack1
npx react-native run-ios
```

## 🎯 След рестарта тествай:

1. Отвори приложението
2. Избери план (Monthly/Quarterly/Yearly)
3. Натисни "Continue to Payment"
4. Гледай конзолата за:
   ```
   ✅ [PaymentScreen] Function call succeeded!
   ✅ [PaymentScreen] Stripe subscription created successfully
   ✅ [PaymentScreen] Client secret set, payment ready
   ```

## ⚡ Алтернативен начин - с скрипт:

Или просто изпълни готовия скрипт:
```bash
cd /Users/nikolovp/Documents/FinTrack1
./RUN_THESE_COMMANDS.sh
```

## ❌ Ако срещнеш проблеми:

### "Authentication Error"
→ Изпълни отново: `firebase login --reauth`

### "No such project"
→ Изпълни: `firebase use fintrack-bef0a`

### "Stripe API key is invalid"
→ Провери дали копираш правилния key от https://dashboard.stripe.com/test/apikeys
→ Трябва да започва с `sk_test_` (НЕ `pk_test_`)

### Deploy failed
→ Изпълни:
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions --project fintrack-bef0a
```

## 📞 След deploy:

Дай ми да знам какво видя! Очаквам да видиш:
- ✅ Deploy successful
- ✅ Functions работят
- ✅ Плащането минава през PaymentScreen без грешки

