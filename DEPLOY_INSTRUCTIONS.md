# 🚀 Deployment Instructions - Fix "Error: INTERNAL"

## Проблем идентифициран ✅
Грешката **"Error: INTERNAL"** в PaymentScreen се дължи на липсваща или грешна Stripe конфигурация в Firebase Functions.

## 📋 Стъпки за решаване

### 1️⃣ Authenticate Firebase CLI

```bash
firebase login --reauth
```

Ще се отвори браузър за login. Влез с Google акаунта свързан с Firebase проекта.

### 2️⃣ Провери текущата конфигурация

```bash
cd /Users/nikolovp/Documents/FinTrack1
firebase functions:config:get --project fintrack-bef0a
```

**Очакван резултат:**
```json
{
  "stripe": {
    "secret": "sk_test_...",
    "webhook_secret": "whsec_..."
  }
}
```

**Ако липсва `stripe.secret`**, това е причината за грешката!

### 3️⃣ Конфигурирай Stripe Secret Key

Намери твоя Stripe Secret Key:
1. Отвори https://dashboard.stripe.com/test/apikeys
2. Копирай "Secret key" (започва с `sk_test_`)

Задай го в Firebase:
```bash
firebase functions:config:set stripe.secret="sk_test_ТВОЯ_STRIPE_KEY" --project fintrack-bef0a
```

### 4️⃣ (Опционално) Конфигурирай Webhook Secret

Ако използваш Stripe Webhooks:
```bash
firebase functions:config:set stripe.webhook_secret="whsec_ТВОЯ_WEBHOOK_SECRET" --project fintrack-bef0a
```

### 5️⃣ Deploy Functions

```bash
firebase deploy --only functions --project fintrack-bef0a
```

**Очаквано време:** 2-3 минути

**Очакван резултат:**
```
✔  Deploy complete!

Functions deployed:
  - createStripeSubscription
  - createPaymentIntent
  - generateReferralLink
  - getReferralStats
  - processReferralReward
  ...
```

### 6️⃣ Провери дали Functions работят

```bash
firebase functions:log --project fintrack-bef0a
```

Търси за "Stripe initialized successfully" в логовете.

### 7️⃣ Рестартирай iOS приложението

```bash
# В терминал tab 1 - Рестартирай Metro
npx react-native start --reset-cache

# В терминал tab 2 - Стартирай iOS app
npx react-native run-ios
```

### 8️⃣ Тествай плащането

1. Отвори приложението
2. Избери план (например Monthly)
3. Натисни "Continue to Payment"
4. Проверявай конзолата за логове:
   - `[PaymentScreen] Calling createStripeSubscription...`
   - `[PaymentScreen] Function call succeeded!`
   - `[PaymentScreen] Client secret set, payment ready`

## ✅ Как да разбера че работи?

### Преди поправката:
```
❌ [PaymentScreen] Function call failed!
❌ [PaymentScreen] Function error code: internal
❌ [PaymentScreen] Function error message: INTERNAL
```

### След поправката:
```
✅ [PaymentScreen] Function call succeeded! Raw result: {...}
✅ [PaymentScreen] Stripe subscription created successfully: {...}
✅ [PaymentScreen] Client secret set, payment ready
```

## 🐛 Ако все още не работи

### Проблем: "Authentication Error"
```bash
firebase login --reauth
```

### Проблем: "No such project"
```bash
firebase projects:list
firebase use fintrack-bef0a
```

### Проблем: "Stripe API key is invalid"
- Провери дали копираш правилния key от Stripe Dashboard
- Убеди се че използваш **Test Mode** key (`sk_test_...`)
- НЕ използвай Publishable key (`pk_test_...`)

### Проблем: Functions deployment failed
```bash
cd functions
rm -rf node_modules
npm install
npm run build
cd ..
firebase deploy --only functions --project fintrack-bef0a
```

## 📞 Нужна помощ?

Ако проблемът продължава:
1. Изпрати output от: `firebase functions:config:get --project fintrack-bef0a`
2. Изпрати последните логове от: `firebase functions:log --project fintrack-bef0a`
3. Изпрати screenshot от грешката в приложението

## 🎉 След успешния deploy

След като Functions заработят правилно, можеш да тестваш цялата payment flow:
1. ✅ Избери план
2. ✅ Въведи тестова карта: `4242 4242 4242 4242`
3. ✅ Expiry: `12/34`, CVC: `123`
4. ✅ Потвърди плащането
5. ✅ Трябва да видиш "Payment Successful" екран

