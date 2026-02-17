# 🔧 Stripe Webhook Debug Guide

Този файл съдържа стъпки за диагностика на webhook проблема.

---

## ❌ ПРОБЛЕМ: Webhook не записва абонаменти във Firestore

**Симптоми:**
- Плащането минава успешно в Stripe
- Абонаментът НЕ се записва във Firestore колекция `subscriptions`
- Потребителят остава на екрана за избор на план след login

---

## 🔍 СТЪПКА 1: Проверете Firebase Functions конфигурация

### В терминал изпълнете:
```bash
firebase login --reauth
firebase functions:config:get --project fintrack-bef0a
```

### Очакван резултат:
```json
{
  "stripe": {
    "secret": "sk_test_51RHUZWG1pdDRlAv6QC7FQ...",
    "webhook_secret": "whsec_..."  ← ТОВА трябва да съществува!
  }
}
```

### ⚠️ АКО `webhook_secret` ЛИПСВА:

1. Отидете на Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Намерете вашия webhook endpoint (или създайте нов - вижте СТЪПКА 2)
3. Копирайте **Signing secret** (започва с `whsec_`)
4. Изпълнете:
```bash
firebase functions:config:set stripe.webhook_secret="whsec_..." --project fintrack-bef0a
firebase deploy --only functions --project fintrack-bef0a
```

---

## 🔍 СТЪПКА 2: Проверете Stripe Webhook Endpoint

### Отидете на:
https://dashboard.stripe.com/test/webhooks

### Проверете дали съществува endpoint:
```
URL: https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook
```

### ⚠️ АКО ENDPOINT ЛИПСВА или е ГРЕШЕН:

1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook`
3. **Events to send:** Select these events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Click **"Add endpoint"**
5. Копирайте **Signing secret** и добавете го в Firebase (СТЪПКА 1)

---

## 🔍 СТЪПКА 3: Проверете Firestore `users` колекция

### Отидете на:
https://console.firebase.google.com/project/fintrack-bef0a/firestore

### Проверете документ:
```
users/kvcpLBw6zQhsAqG6Ja41sC0xpvg2
```

### Трябва да има поле:
```
stripeCustomerId: "cus_..."
```

### ⚠️ АКО `stripeCustomerId` ЛИПСВА:

Това означава, че при регистрация на потребителя не е създаден Stripe Customer.

**Причини:**
- Firebase Function `onUserCreate` не е била деплойната когато се регистрирахте
- Има грешка в `onUserCreate` функцията

**Решение:**
Създайте поле ръчно в Firestore:

1. Отидете на: https://console.firebase.google.com/project/fintrack-bef0a/firestore
2. Намерете документ: `users/kvcpLBw6zQhsAqG6Ja41sC0xpvg2`
3. Добавете поле:
   - Field: `stripeCustomerId`
   - Type: `string`
   - Value: Вземете го от Stripe Dashboard → Customers

**ИЛИ създайте Stripe Customer ръчно:**

Отидете на: https://dashboard.stripe.com/test/customers
1. Click "New"
2. Email: `plamenn1926@gmail.com`
3. Metadata: 
   - Key: `firebaseUID`
   - Value: `kvcpLBw6zQhsAqG6Ja41sC0xpvg2`
4. Save
5. Копирайте Customer ID (започва с `cus_`)
6. Добавете го в Firestore `users` документа

---

## 🔍 СТЪПКА 4: Проверете Webhook Logs

### Отидете на:
https://dashboard.stripe.com/test/webhooks

### Кликнете на вашия endpoint

### Проверете "Attempts":
- ✅ **Successful** - webhook-ът работи
- ❌ **Failed** - има грешка

### Ако Failed, кликнете на грешния request за да видите детайли

**Типични грешки:**
- `401 Unauthorized` - webhook secret е грешен
- `500 Internal Error` - грешка във функцията
- `Timeout` - функцията работи твърде бавно

---

## 🔍 СТЪПКА 5: Проверете Firebase Functions Logs

### Отидете на:
https://console.firebase.google.com/project/fintrack-bef0a/functions/logs

### Филтрирайте по:
```
stripeWebhook
```

### Търсете за съобщения като:
- ✅ `Webhook signature verified: customer.subscription.created`
- ✅ `Successfully created subscription document for user ...`
- ❌ `Webhook signature verification failed`
- ❌ `Could not find user for customer ...`

---

## ✅ ВРЕМЕННО РЕШЕНИЕ: Създайте абонамент ръчно

Докато не оправим webhook-а, можете да създадете абонамент **ръчно**:

### Отидете на:
https://console.firebase.google.com/project/fintrack-bef0a/firestore

### Създайте документ:
**Collection:** `subscriptions`  
**Document ID:** `kvcpLBw6zQhsAqG6Ja41sC0xpvg2`

**Полета:**
```
plan: "monthly"                    (string)
status: "active"                   (string)
userId: "kvcpLBw6zQhsAqG6Ja41sC0xpvg2"  (string)
currentPeriodStart: [today]        (timestamp)
currentPeriodEnd: [1 month ahead]  (timestamp)
createdAt: [today]                 (timestamp)
updatedAt: [today]                 (timestamp)
cancelAtPeriodEnd: false           (boolean)
currency: "eur"                    (string)
stripeSubscriptionId: "sub_test_manual_001"  (string)
stripeCustomerId: "cus_test_manual_001"      (string)
```

### След създаване:
1. Restart app
2. Login отново
3. Трябва да видите главния екран! 🎉

---

## 📊 Checklist:

- [ ] Firebase Functions config има `stripe.webhook_secret`
- [ ] Stripe Dashboard има webhook endpoint
- [ ] Webhook endpoint получава всички нужни events
- [ ] Firestore `users/{uid}` има `stripeCustomerId`
- [ ] Webhook logs показват успешни attempts
- [ ] Firebase Functions logs показват успешни webhook обработки

---

## 🆘 Ако нищо не работи:

1. **Опция 1:** Създайте абонамент ръчно (временно решение горе)
2. **Опция 2:** Презаредете приложението с нов потребител след оправяне на webhook-а
3. **Опция 3:** Свържете се за детайлна диагностика

---

## 📝 Бележки:

**За Test Mode:**
- Използвайте `whsec_` secret от Test mode webhook
- Използвайте `sk_test_` API key
- Създайте Test mode Customers

**За Production:**
- Трябва да създадете SEPARATE webhook endpoint за Live mode
- Използвайте `whsec_` secret от Live mode webhook  
- Използвайте `sk_live_` API key
- Конфигурирайте отделно!

---

**Последно обновяване:** 16 Януари 2026
