# 🔧 Fix: Test Customer with Live Keys

**Error:** `No such customer: 'cus_TIyrAd1MaZBZPI'; a similar object exists in test mode, but a live mode key was used`

---

## Проблем

User-ът е създаден с **Test Stripe customer ID**, но app-ът сега използва **Live Stripe keys**.

Stripe не може да намери Test customers когато се използват Live keys.

---

## Решение 1: Delete User & Re-register (FASTEST)

### **Стъпки:**

1. **Delete User от Firebase Authentication:**
   ```
   Firebase Console → Authentication → Users → 
   Find user → Delete user
   ```

2. **Delete User Document от Firestore:**
   ```
   Firebase Console → Firestore → Database →
   Collections → users → [userId] → Delete document
   ```

3. **Re-register в App:**
   - На emulator, натисни "ОТКАЗ" на error dialog
   - Sign out (ако има бутон)
   - Register нов user с НОВ email:
     - Email: `test+live$(date +%s)@fintrack.test`
     - Password: `TestPassword123!`

4. **Try Payment Again:**
   - Select plan
   - Complete payment
   - Този път ще създаде LIVE customer

---

## Решение 2: Clear App Data (ALTERNATIVE)

### **Android Emulator:**

```bash
# Uninstall app completely
adb uninstall com.fintracknew

# Reinstall
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Launch
adb shell am start -n com.fintracknew/.MainActivity
```

Това ще изтрие всички локални данни и ще принуди app-а да стартира отначало.

---

## Решение 3: Fix Firestore Data (ADVANCED)

Ако искаш да запазиш user-а:

1. **Find User Document:**
   ```
   Firebase Console → Firestore → users → [userId]
   ```

2. **Update stripeCustomerId field:**
   - Delete `stripeCustomerId` field
   - OR set to empty string: `""`

3. **Retry Payment:**
   - App ще създаде нов LIVE customer
   - Ще update-не Firestore с новия Live customer ID

---

## 🎯 Препоръчано Решение

**ИЗПОЛЗВАЙ РЕШЕНИЕ 1 (Delete & Re-register)**

Защото:
- ✅ Най-бързо
- ✅ Най-чисто
- ✅ Гарантирано работи
- ✅ Избягва Test/Live data mixing

---

## 📋 Конкретни Стъпки ЗА ТЕБ:

1. **Firebase Console:**
   - Отвори: https://console.firebase.google.com/project/fintrack-bef0a
   - Authentication → Users
   - Намери user-а (с email от test-a)
   - Натисни Delete

2. **Firestore Database:**
   - Firestore Database → Data
   - Collections → users
   - Намери user document (същият userId)
   - Delete document

3. **Emulator:**
   - Натисни "ОТКАЗ" на error dialog
   - Restart app (или sign out)
   - Register НОВ user:
     ```
     Email: test+live12345@fintrack.test
     Password: TestPassword123!
     ```

4. **Try Payment Again:**
   - Select Годишен plan
   - Fill card: 4242 4242 4242 4242, 12/34, 123
   - Complete payment
   - ✅ Трябва да мине!

---

## 🔍 Verification

След успешен payment, провери:

### **Firebase Firestore:**
```
subscriptions → [userId]
  stripeCustomerId: "cus_..." (започва с cus_, НОВ Live customer)
  stripeSubscriptionId: "sub_..." (започва с sub_)
  status: "active"
  plan: "yearly"
```

### **Stripe Dashboard:**
```
Customers → [NEW customer]
  Customer ID: cus_... (РАЗЛИЧЕН от cus_TIyrAd1MaZBZPI)
  Mode: Live (НЕ Test)
  
Subscriptions → [NEW subscription]
  Status: Active
  Plan: Yearly (75.99 EUR)
```

---

## ⚠️ Important Note

Този error е **очакван** когато преминаваш от Test към Live mode.

За production app:
- Нови users ще винаги получават Live customers
- Няма да има този проблем
- Само existing Test users трябва да се re-register

---

## 🎉 След Fix-a

След като изтриеш user-а и регистрираш нов:
- ✅ Payment ще мине успешно
- ✅ Live Stripe customer ще се създаде
- ✅ Subscription ще стане active
- ✅ App ще работи нормално

**Време: ~2 минути**

---

**СЕГА: Delete user от Firebase Console и register нов!** 🚀
