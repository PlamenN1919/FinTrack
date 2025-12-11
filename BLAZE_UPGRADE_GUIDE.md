# 🔥 Firebase Blaze Plan Upgrade Guide

## Защо е нужен Blaze план?

Firebase **Spark (безплатен) план** не позволява:
- ❌ External API calls от Cloud Functions (Stripe, др.)
- ❌ Deploy на нови functions с external dependencies
- ❌ Scheduled functions с cloud scheduler

Firebase **Blaze (Pay-as-you-go) план**:
- ✅ Разрешава external API calls
- ✅ Позволява пълна функционалност на Cloud Functions
- ✅ **БЕЗПЛАТЕН за малък traffic**

## 💰 Цени (Безплатни лимити):

### Cloud Functions (месечни безплатни квоти):
- ✅ **2,000,000 invocations** - безплатно
- ✅ **400,000 GB-seconds** compute time - безплатно  
- ✅ **200,000 CPU-seconds** compute time - безплатно
- ✅ **5GB network egress** - безплатно

### За development/testing:
**Вероятно няма да платиш нищо!** 🎉

Типичен тестов период използва:
- ~1,000 function calls
- ~10 GB-seconds compute
- ~1 GB network

Това е **0.05% от безплатния лимит**!

## 📝 Стъпки за Upgrade:

### 1️⃣ Отвори Firebase Console
```
https://console.firebase.google.com/project/fintrack-bef0a/overview
```

### 2️⃣ Кликни на "Upgrade" 
- Намира се в лявото меню, долу
- Или: Settings (зъбчатка) → Usage and billing → Details & settings

### 3️⃣ Избери "Blaze - Pay as you go"
- Кликни "Select plan"
- Прегледай деталите

### 4️⃣ Добави Billing Information
- Име
- Адрес  
- Кредитна/дебитна карта
- **Няма начална такса!**

### 5️⃣ Потвърди Upgrade
- Прочети terms
- Кликни "Purchase"

### 6️⃣ Изчакай потвърждение
⏱️ Обикновено отнема 30 секунди

## 🚀 След Upgrade - Deploy Functions:

```bash
cd /Users/nikolovp/Documents/FinTrack1

# Deploy с новата Node 20 версия
firebase deploy --only functions --project fintrack-bef0a
```

Това ще отнеме 2-3 минути и ще update-не функциите с:
- ✅ Node.js 20 runtime
- ✅ Нова Stripe конфигурация  
- ✅ Подобрена error handling

## 💳 Billing Protection Tips:

### Задай Budget Alert:
1. Отвори: https://console.cloud.google.com/billing
2. Избери проекта `fintrack-bef0a`
3. Кликни "Budgets & alerts"
4. Създай нов budget:
   - Name: "Monthly Firebase Budget"
   - Amount: $5 или $10
   - Alert threshold: 50%, 80%, 100%

### Monitor Usage:
```bash
# Провери usage
firebase projects:list
```

В Console:
- Usage and billing → Dashboard
- Виж Function invocations
- Виж Compute time

## ❌ Ако НЕ искаш да upgrade-ваш:

### Опция 1: Тествай сега
Старите functions (nodejs18) може да работят с новата Stripe конфигурация.

**Тествай преди да upgrade-ваш!**

Стартирай:
```bash
npx react-native start --reset-cache
# В нов tab:
npx react-native run-ios
```

### Опция 2: Local Development
Използвай Firebase Emulator Suite:
```bash
firebase emulators:start
```

**НО** - не можеш да тестваш Stripe payments локално без production keys.

## 🎯 Препоръка:

**UPGRADE на Blaze!** Защото:
1. ✅ Безплатен за development (под лимитите)
2. ✅ Необходим за production app
3. ✅ Можеш да зададеш budget limits
4. ✅ Получаваш пълна функционалност
5. ✅ Всички Firebase features unlocked

## 📞 След Upgrade:

Съобщи ми и ще deploy-нем Functions с:
- Node.js 20
- Обновена Stripe конфигурация
- Подобрена error handling
- Extended timeout (60s)

---

**Готов си за Upgrade? Отвори Firebase Console и започни!** 🔥

