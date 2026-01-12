# 🔄 Активиране на автоматично подновяване на абонаменти

## ✅ Текущ статус

Вашият код **ВЕЧЕ е конфигуриран** за автоматично подновяване! 🎉

- ✅ `createStripeSubscription` функция имплементирана
- ✅ Webhook handlers за subscription lifecycle готови
- ✅ Firestore автоматични обновления конфигурирани
- ⚠️ **ЛИПСВА САМО**: Stripe Dashboard конфигурация

---

## 📋 Какво трябва да направиш

### Стъпка 1: Конфигурирай Stripe Webhook (ЗАДЪЛЖИТЕЛНО)

#### 1.1. Отвори Stripe Dashboard
```bash
open https://dashboard.stripe.com/test/webhooks
```

#### 1.2. Създай нов Webhook endpoint
- Кликни **"Add endpoint"**
- URL: `https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook`
  (Замени `us-central1` с твоя Firebase region ако е различен)

#### 1.3. Избери следните Events (ЗАДЪЛЖИТЕЛНО):

**Subscription Events:**
```
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
```

**Invoice Events (за автоматични плащания):**
```
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ invoice.payment_action_required
```

**Payment Events (опционално):**
```
✅ payment_intent.payment_failed
```

#### 1.4. Копирай Webhook Secret
След създаване на endpoint, Stripe ще ти даде **Signing Secret** (започва с `whsec_...`)

#### 1.5. Добави Secret във Firebase Config
```bash
firebase functions:config:set stripe.webhook_secret="whsec_ВАШИЯТ_СЕКРЕТ_ТУК" --project fintrack-bef0a

# Пример:
firebase functions:config:set stripe.webhook_secret="whsec_1a2b3c4d5e6f7g8h9i0j" --project fintrack-bef0a
```

#### 1.6. Redeploy Firebase Functions
```bash
cd /Users/nikolovp/Documents/FinTrack1
firebase deploy --only functions --project fintrack-bef0a
```

---

### Стъпка 2: Настрой Payment Method Storage (Автоматично)

Вашият код вече е конфигуриран правилно:

```typescript
// В createStripeSubscription (index.ts:612-615)
subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: priceId }],
  payment_behavior: 'default_incomplete',
  payment_settings: { save_default_payment_method: 'on_subscription' }, // ✅ Това запазва картата
});
```

Stripe автоматично ще:
1. Запази картата на клиента при първо плащане
2. Използва същата карта за следващи плащания
3. Изпраща имейл при неуспешно плащане

---

### Стъпка 3: Настрой Billing Settings в Stripe (ВАЖНО)

#### 3.1. Payment retry logic
```bash
open https://dashboard.stripe.com/test/settings/billing/automatic
```

**Препоръчани настройки:**
- ✅ **Smart retries**: Enabled
- ✅ **Retry schedule**: 
  - 1st retry: 3 days after failure
  - 2nd retry: 5 days after 1st retry
  - 3rd retry: 7 days after 2nd retry
- ✅ **Send dunning emails**: Enabled (автоматични имейли до клиента)

#### 3.2. Email notifications
```bash
open https://dashboard.stripe.com/test/settings/emails
```

Активирай следните имейли:
- ✅ **Payment failed** (когато плащането е неуспешно)
- ✅ **Upcoming invoice** (3 дни преди следващо плащане)
- ✅ **Successful payment** (потвърждение за успешно плащане)
- ✅ **Update card** (при изтекла карта)

---

### Стъпка 4: Тестване на автоматичното подновяване

#### 4.1. Използвай Stripe Test Cards

**Test Card за успешно плащане:**
```
Card Number: 4242 4242 4242 4242
Exp: 12/34
CVC: 123
```

**Test Card за неуспешно плащане:**
```
Card Number: 4000 0000 0000 0341
Exp: 12/34
CVC: 123
```

**Test Card за изтекла карта:**
```
Card Number: 4000 0000 0000 0069
Exp: 12/34
CVC: 123
```

#### 4.2. Симулирай изтичане на абонамент

**Опция 1: Промени периода ръчно в Stripe Dashboard**
```bash
open https://dashboard.stripe.com/test/subscriptions
```
- Намери subscription
- Edit → Current period end → Промени на минало време
- Stripe ще направи instant renewal attempt

**Опция 2: Използвай Stripe CLI**
```bash
# Инсталирай Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Trigger subscription renewal event
stripe trigger invoice.payment_succeeded
```

#### 4.3. Провери Webhook logs
```bash
open https://dashboard.stripe.com/test/webhooks
```
- Кликни на твоя endpoint
- Виж "Recent events" tab
- Провери дали events са successful (status 200)

---

## 🔍 Как работи автоматичното подновяване

### При първо плащане:
```
1. Потребител избира план → SubscriptionPlansScreen
2. Навигация към PaymentScreen
3. PaymentScreen вика createStripeSubscription
   ├─ Stripe създава Subscription (status: incomplete)
   ├─ Stripe създава Invoice
   └─ Stripe създава Payment Intent
4. Потребител въвежда карта → Stripe CardForm
5. Плащането е успешно
6. Stripe изпраща webhook: invoice.payment_succeeded
7. Firebase Function обновява Firestore:
   └─ status: 'active'
   └─ currentPeriodEnd: след 1/3/12 месеца
   └─ Stripe запазва payment method
```

### При изтичане на периода (автоматично):
```
1. Stripe автоматично детектира currentPeriodEnd наближава
2. 3 дни преди край → Stripe изпраща имейл "Upcoming Invoice"
3. На датата на изтичане:
   ├─ Stripe АВТОМАТИЧНО създава нов Invoice
   ├─ Stripe АВТОМАТИЧНО таксува запазената карта
   └─ БЕЗ участие на потребителя!
4. АКО плащането е успешно:
   └─ Stripe изпраща webhook: invoice.payment_succeeded
   └─ Firebase Function обновява Firestore:
       ├─ status: 'active' (остава активен)
       ├─ currentPeriodStart: стара currentPeriodEnd
       └─ currentPeriodEnd: +1/3/12 месеца напред
5. АКО плащането е неуспешно:
   └─ Stripe изпраща webhook: invoice.payment_failed
   └─ Firebase Function обновява Firestore:
       └─ status: 'failed'
   └─ Stripe retry logic се задейства (3-5-7 дни)
   └─ Stripe изпраща имейл до клиента
```

### В твоето приложение:
```
1. При всяко отваряне на приложението:
   └─ AuthContext.tsx:onAuthStateChanged (line 407)
   └─ Зарежда subscription от Firestore
   └─ Проверява status и currentPeriodEnd
   
2. АКО status === 'active' && currentPeriodEnd > now:
   └─ userState = ACTIVE_SUBSCRIBER
   └─ AppNavigator показва Main App ✅
   
3. АКО status === 'failed' || currentPeriodEnd < now:
   └─ userState = EXPIRED_SUBSCRIBER
   └─ AppNavigator показва SubscriptionPlans screen
   └─ Потребителят трябва да обнови картата/плати отново
```

---

## 🛡️ Обработка на грешки

### Сценарий 1: Изтекла карта
```
Stripe автоматично:
1. Опитва плащане → FAIL (card expired)
2. Изпраща webhook: invoice.payment_failed
3. Firestore status → 'failed'
4. Изпраща имейл до клиента: "Update your payment method"
5. Retry след 3 дни
```

**Твоето приложение:**
```
- AuthContext детектира status === 'failed'
- userState → PAYMENT_FAILED
- AppNavigator показва SubscriptionPlans
- Клиентът влиза и обновява картата
```

### Сценарий 2: Недостатъчно средства
```
Stripe автоматично:
1. Опитва плащане → FAIL (insufficient funds)
2. Изпраща webhook: invoice.payment_failed
3. Изпраща имейл: "Payment failed, we'll retry"
4. Retry след 3 дни (Smart retries)
5. Retry след 8 дни (2nd attempt)
6. Retry след 15 дни (3rd attempt)
7. След 3 неуспешни опита → subscription.status = 'past_due'
```

### Сценарий 3: Отменена карта (fraud)
```
Stripe автоматично:
1. Опитва плащане → FAIL (card blocked)
2. Subscription status → 'past_due'
3. Изпраща имейл до клиента
4. НЕ прави повторни опити (security)
```

**Твоето приложение:**
```
- status → 'past_due' (Firestore)
- userState → EXPIRED_SUBSCRIBER
- Клиентът трябва да въведе нова карта
```

---

## 📊 Мониторинг и отчети

### Firestore Listener (Real-time updates)

Можеш да добавиш real-time listener за промени в subscription:

```typescript
// В AuthContext.tsx (опционално)
useEffect(() => {
  if (!authState.user?.uid) return;

  const unsubscribe = db()
    .collection('subscriptions')
    .doc(authState.user.uid)
    .onSnapshot((snapshot) => {
      if (snapshot.exists()) {
        const subData = snapshot.data() as Subscription;
        // Convert timestamps...
        dispatch({ type: 'SET_SUBSCRIPTION', payload: subData });
      }
    });

  return unsubscribe;
}, [authState.user?.uid]);
```

### Stripe Dashboard Reports

```bash
# Провери subscription статус
open https://dashboard.stripe.com/test/subscriptions

# Провери revenue
open https://dashboard.stripe.com/test/reports/mrr

# Провери failed payments
open https://dashboard.stripe.com/test/payments?status=failed
```

---

## 🎯 Checklist за Go-Live (Production)

Преди да пуснеш в Production:

- [ ] Създай webhook endpoint в **LIVE mode**
- [ ] Промени `sk_test_...` с `sk_live_...` (Firebase config)
- [ ] Промени `pk_test_...` с `pk_live_...` (stripe.config.ts)
- [ ] Промени Test Price IDs с Live Price IDs
- [ ] Тествай с REAL карта (малка сума)
- [ ] Провери email notifications работят
- [ ] Настрой Stripe Tax (ако е необходимо за България)
- [ ] Добави Terms of Service link в Stripe Dashboard
- [ ] Активирай Radar (Stripe Fraud Detection)

---

## 🚨 Често срещани проблеми

### Проблем 1: Webhook не работи
```bash
# Провери дали endpoint е достъпен
curl https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook

# Провери Firebase logs
firebase functions:log --project fintrack-bef0a

# Провери Stripe webhook logs
open https://dashboard.stripe.com/test/webhooks
```

### Проблем 2: Subscription status не се обновява
```bash
# Провери Firestore
open https://console.firebase.google.com/project/fintrack-bef0a/firestore

# Провери дали userId е правилен
# Провери дали timestamp conversion работи
```

### Проблем 3: Двойно плащане
```bash
# Провери дали имаш идемпотентност
# Stripe автоматично обработва duplicates
# Но провери webhook logs за duplicate events
```

---

## 📞 Поддръжка

Ако нещо не работи:

1. **Провери Stripe Logs**
   ```bash
   open https://dashboard.stripe.com/test/logs
   ```

2. **Провери Firebase Logs**
   ```bash
   firebase functions:log --project fintrack-bef0a
   ```

3. **Тествай webhook локално**
   ```bash
   stripe listen --forward-to localhost:5001/fintrack-bef0a/us-central1/stripeWebhook
   ```

4. **Stripe Support**
   - Live Chat: https://dashboard.stripe.com/support
   - Documentation: https://stripe.com/docs/billing/subscriptions/overview

---

## ✅ Заключение

След като конфигурираш Stripe Webhook (Стъпка 1), автоматичното подновяване ще работи така:

1. **Потребителят плаща веднъж** → Stripe запазва картата
2. **При изтичане** → Stripe автоматично таксува
3. **Успешно плащане** → Subscription се продължава автоматично
4. **Неуспешно плащане** → Stripe прави 3 опита + изпраща имейли

**Потребителят НИКОГА не трябва да плаща ръчно отново, освен ако картата не е изтекла или блокирана.**

---

Дата: 13 Януари 2026
