# 📱 iOS Setup - Финални Стъпки

**Дата:** 13 Януари 2026  
**Статус:** ⏳ В процес на изпълнение

---

## ✅ Готови Стъпки

- [x] NPM packages инсталирани
- [x] Firebase v23.7.0 обновени (app, auth, firestore, functions, crashlytics, analytics)
- [x] babel-plugin-transform-remove-console инсталиран
- [x] Android gradle files конфигурирани
- [x] Всички code changes направени

---

## ⏳ iOS Pod Install (В Процес)

**ВАЖНО:** Pod install вече върви във фона. Може да отнеме 5-10 минути.

### Ако pod install не е завършил, изпълни:

```bash
cd /Users/nikolovp/Documents/FinTrack1/ios

# Clean old pods
rm -rf Pods Podfile.lock

# Install with repo update
pod install --repo-update
```

**Забележка:** `--repo-update` обновява CocoaPods спецификациите и е необходимо за новите Firebase packages.

---

## 📱 След Завършване на Pod Install

### Стъпка 1: Провери успешна инсталация

След като `pod install` приключи, провери:

```bash
cd ios
ls -la Pods/
```

Трябва да видиш нови папки:
- ✅ `FirebaseCrashlytics`
- ✅ `FirebaseAnalytics`
- ✅ `GoogleAnalytics`

### Стъпка 2: Xcode Run Scripts (КРИТИЧНО!)

Firebase Crashlytics **автоматично** добавя run script phases чрез CocoaPods.

**Провери (не е задължително, но добре е):**

```bash
open ios/FinTrackNew.xcworkspace
```

В Xcode:
1. Select target "FinTrackNew"
2. Go to "Build Phases"
3. Трябва да видиш:
   - ✅ **[RNFB] Core Configuration**
   - ✅ **[RNFB] Crashlytics Configuration**

Ако ги виждаш → **Всичко е готово!** ✅

Ако **НЕ** ги виждаш, добави ръчно (виж по-долу).

---

## 🔧 Ръчна Настройка (Само ако автоматичната не работи)

### Crashlytics Run Script

Ако **[RNFB] Crashlytics Configuration** липсва:

1. Open Xcode: `open ios/FinTrackNew.xcworkspace`
2. Select target "FinTrackNew"
3. Go to "Build Phases"
4. Click "+" → "New Run Script Phase"
5. Name it: `[RNFB] Crashlytics Manual`
6. Add script:

```bash
"${PODS_ROOT}/FirebaseCrashlytics/run"
```

7. **Input Files:**
```
${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}
```

8. **Output Files:**
```
${BUILT_PRODUCTS_DIR}/${INFOPLIST_PATH}
```

9. Move this phase **after "Compile Sources"**

---

## 🧪 Testing

### Build Debug (Development):

```bash
cd /Users/nikolovp/Documents/FinTrack1
npx react-native run-ios
```

**Очаквани резултати:**
- ✅ App build-ва успешно
- ✅ App стартира
- ✅ В Metro logs виждаш:
  ```
  ✅ Crashlytics initialized
  ✅ Analytics initialized
  ```
- ✅ Console.log statements се виждат (в dev mode)

### Build Release (Production):

```bash
npx react-native run-ios --configuration Release
```

**Очаквани резултати:**
- ✅ App build-ва успешно
- ✅ App стартира
- ✅ **NO console.log statements** в Metro logs
- ✅ Само console.error/warn се виждат

---

## 📊 Verify Firebase Console

### 1. Crashlytics

**URL:** https://console.firebase.google.com/project/fintrack-bef0a/crashlytics

**Test crash (само в dev!):**
```typescript
// Add test button in development
import { testCrash } from './src/utils/crashlytics';

// In some screen:
<Button onPress={testCrash} title="Test Crash (Dev Only)" />
```

**След test crash:**
1. App ще crash-не
2. Restart app
3. Check Firebase Console след 5-10 минути
4. Трябва да видиш crash report

### 2. Analytics

**URL:** https://console.firebase.google.com/project/fintrack-bef0a/analytics

**DebugView (за instant testing):**

```bash
# Enable DebugView за simulator
xcrun simctl openurl booted "fintrack://debug?enable=true"

# Disable DebugView
xcrun simctl openurl booted "fintrack://debug?enable=false"
```

**След enable DebugView:**
1. Navigate през app-а
2. Login, view screens, etc.
3. Check Firebase Console → DebugView
4. Events ще се показват instant

**Забележка:** Нормални analytics events имат delay от ~24 часа.

---

## 🚨 Common Issues

### Issue 1: "Firebase/Core not found"

**Причина:** Pod install не е завършил успешно.

**Решение:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Issue 2: "Undefined symbol: _OBJC_CLASS_$_FIRApp"

**Причина:** Xcode не намира Firebase frameworks.

**Решение:**
1. Clean build: Product → Clean Build Folder (⇧⌘K)
2. Rebuild

### Issue 3: Build грешка с "FirebaseCrashlytics run script"

**Причина:** Run script phase не е правилно конфигуриран.

**Решение:**
1. Check Input/Output files (виж по-горе)
2. Move script phase след "Compile Sources"

### Issue 4: "No such module 'Firebase'"

**Причина:** Import statements не са правилни.

**Решение:**
Използвай React Native Firebase SDK:
```typescript
// ✅ CORRECT
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

// ❌ WRONG
import { crashlytics } from '@firebase/crashlytics';
```

---

## ✅ Success Checklist

След успешна инсталация:

- [ ] `pod install` завършил без грешки
- [ ] Xcode workspace отваря без warnings
- [ ] Debug build работи
- [ ] Release build работи
- [ ] Console.log removed в Release build
- [ ] Crashlytics initialized message в logs
- [ ] Analytics initialized message в logs
- [ ] Firebase Console показва app connection

---

## 🎯 Next Steps

След като iOS setup приключи:

### Option 1: Test Monitoring (30 min)

```bash
# Build release
npx react-native run-ios --configuration Release

# Test features
# Verify Firebase Console
```

### Option 2: Security Hotfix (RECOMMENDED)

Премини към **КРИТИЧНИТЕ Security Проблеми**:

1. 🔴 Rotate Stripe Secret Keys
2. 🔴 Clean Git History
3. 🔴 Setup .env System
4. 🔴 Add Webhook Validation

**Време:** 30-60 минути  
**Важност:** BLOCKING production

---

**Prepared:** 13 Януари 2026  
**Pod Install:** ⏳ Running in background  
**Next:** 🔴 Critical Security Hotfix
