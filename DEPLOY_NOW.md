# 🚀 DEPLOY СЕГА - Актуализирани команди

## ✅ Поправено:
- ✅ Node.js version upgrade-нат от 18 → 20
- ✅ Functions код компилиран
- ✅ Всички промени са готови

---

## 📋 Изпълни ТОЧНО тези команди:

### 1️⃣ Провери дали си authenticated
```bash
cd /Users/nikolovp/Documents/FinTrack1
firebase login --reauth
```
*(Ще отвори браузър за login)*

---

### 2️⃣ Провери текущата Stripe конфигурация
```bash
firebase functions:config:get --project fintrack-bef0a
```

**Ако виждаш празен резултат `{}`**, това означава че липсва Stripe key!

---

### 3️⃣ **ЗАДЪЛЖИТЕЛНО!** Конфигурирай Stripe Secret Key

#### A. Вземи твоя Stripe Secret Key:
1. Отвори: https://dashboard.stripe.com/test/apikeys
2. Копирай "Secret key" (започва с `sk_test_...`)
3. НЕ използвай Publishable key (`pk_test_...`)!

#### B. Задай го във Firebase:
```bash
firebase functions:config:set stripe.secret="sk_test_ТВОЯ_KEY_ТУК" --project fintrack-bef0a
```

**Пример:**
```bash
firebase functions:config:set stripe.secret="sk_test_51QABCDxyz123..." --project fintrack-bef0a
```

#### C. Провери отново:
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

✅ **Ако виждаш това, продължи напред!**

---

### 4️⃣ Deploy Firebase Functions
```bash
firebase deploy --only functions --project fintrack-bef0a
```

⏱️ **Това ще отнеме 2-3 минути.**

Ще видиш прогрес:
```
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: uploading functions source code...
✔  functions: functions source code uploaded successfully

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/fintrack-bef0a/overview
```

✅ **Ако виждаш "Deploy complete!", продължи!**

---

### 5️⃣ Провери Functions логовете
```bash
firebase functions:log --project fintrack-bef0a
```

Търси за:
- ✅ `"Stripe initialized successfully"`
- ✅ `"Creating Stripe subscription for user..."`

---

### 6️⃣ Рестартирай React Native приложението

#### Terminal Tab 1 - Metro Bundler:
```bash
cd /Users/nikolovp/Documents/FinTrack1
npx react-native start --reset-cache
```

#### Terminal Tab 2 - iOS App (отвори НОВ tab):
```bash
cd /Users/nikolovp/Documents/FinTrack1
npx react-native run-ios
```

---

## 🎯 Тествай плащането:

1. ✅ Отвори приложението на симулатора
2. ✅ Login/Register ако не си logged in
3. ✅ Избери план (Monthly/Quarterly/Yearly)
4. ✅ Натисни "Continue to Payment"
5. ✅ Гледай конзолата:

**ПРЕДИ (грешка):**
```
❌ [PaymentScreen] Function error code: internal
❌ [PaymentScreen] Function error message: INTERNAL
```

**СЛЕД (успех):**
```
✅ [PaymentScreen] Calling createStripeSubscription...
✅ [PaymentScreen] Function call succeeded!
✅ [PaymentScreen] Stripe subscription created successfully
✅ [PaymentScreen] Client secret set, payment ready
```

6. ✅ Въведи тестова карта:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** `12/34`
   - **CVC:** `123`
   - **ZIP:** `12345`

7. ✅ Натисни "Pay"
8. ✅ Трябва да видиш "Payment Successful" екран! 🎉

---

## ❌ Ако срещнеш проблем:

### Проблем: "Authentication Error"
```bash
firebase logout
firebase login
```

### Проблем: "stripe.secret is not defined"
Значи не си задал Stripe key правилно. Повтори стъпка 3!

### Проблем: "No such price"
Това означава че Stripe Price IDs в кода не съществуват в твоя Stripe акаунт.
→ Провери в `src/config/subscription.config.ts`

### Проблем: Deploy failed - "Permission denied"
```bash
firebase login --reauth
firebase use fintrack-bef0a
firebase deploy --only functions --project fintrack-bef0a
```

### Проблем: Functions все още връщат "INTERNAL"
```bash
# Провери дали Stripe key е зададен
firebase functions:config:get --project fintrack-bef0a

# Ако липсва, задай го отново (стъпка 3)
# След това redeploy
firebase deploy --only functions --project fintrack-bef0a
```

---

## 📊 Финален checklist:

- [ ] `firebase login --reauth` ✅
- [ ] `firebase functions:config:set stripe.secret="sk_test_..."` ✅
- [ ] `firebase functions:config:get` показва Stripe key ✅
- [ ] `firebase deploy --only functions` успешен ✅
- [ ] Metro bundler started ✅
- [ ] iOS app running ✅
- [ ] PaymentScreen показва payment form (не грешка) ✅
- [ ] Test payment работи ✅

---

## 🎉 След успешния deploy:

**Дай ми да знам:**
1. Какво показа `firebase functions:config:get`?
2. Deploy-ът завърши успешно ли?
3. Какво виждаш в конзолата когато отвориш PaymentScreen?

Успех! 🚀

