# 📦 Средни Проблеми - Setup Guide

**Дата:** 13 Януари 2026  
**Статус:** 🔄 В процес на изпълнение

---

## 🎯 Списък на Средните Проблеми

1. ⏳ Setup Firebase Crashlytics
2. ⏳ Setup Firebase Analytics  
3. ⏳ Премахни console.log statements
4. ⏳ Обнови .cursorrules
5. ⏳ Създай deployment scripts

---

## 1️⃣ Setup Firebase Crashlytics (Error Tracking)

### **Инсталация:**

```bash
# Fix npm permissions first (if needed)
sudo chown -R $(whoami) ~/.npm

# Install Crashlytics
npm install @react-native-firebase/crashlytics

# iOS - Install pods
cd ios && pod install && cd ..
```

### **iOS Configuration:**

**File:** `ios/FinTrackNew/AppDelegate.mm`

Добави в края на `didFinishLaunchingWithOptions`:

```objective-c
// Import at top
#import <Firebase/Firebase.h>

// In didFinishLaunchingWithOptions, before return YES:
[[FIRCrashlytics crashlytics] setCrashlyticsCollectionEnabled:YES];
```

**Update Build Phase:**

1. Open Xcode: `open ios/FinTrackNew.xcworkspace`
2. Select target → Build Phases → + New Run Script Phase
3. Add script:
```bash
"${PODS_ROOT}/FirebaseCrashlytics/run"
```
4. Input Files: `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}`
5. Output Files: `${BUILT_PRODUCTS_DIR}/${INFOPLIST_PATH}`

### **Android Configuration:**

**File:** `android/app/build.gradle`

Add at the top (after `apply plugin: "com.google.gms.google-services"`):

```gradle
apply plugin: 'com.google.firebase.crashlytics'
```

**File:** `android/build.gradle`

Add to buildscript dependencies:

```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.9'
    }
}
```

### **Usage in Code:**

Create `src/utils/crashlytics.ts`:

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

export const initCrashlytics = () => {
  if (__DEV__) {
    // Disable in development (optional)
    crashlytics().setCrashlyticsCollectionEnabled(false);
  } else {
    crashlytics().setCrashlyticsCollectionEnabled(true);
  }
};

export const logError = (error: Error, context?: string) => {
  if (context) {
    crashlytics().log(context);
  }
  crashlytics().recordError(error);
};

export const setUserId = (userId: string) => {
  crashlytics().setUserId(userId);
};

export const setAttribute = (key: string, value: string) => {
  crashlytics().setAttribute(key, value);
};

// Force crash for testing (use carefully!)
export const testCrash = () => {
  crashlytics().crash();
};
```

**Update App.tsx:**

```typescript
import { initCrashlytics } from './src/utils/crashlytics';

function App(): React.JSX.Element {
  useEffect(() => {
    initCrashlytics();
  }, []);
  
  // ... rest of app
}
```

**Update AuthContext:**

```typescript
import { setUserId, setAttribute } from '../utils/crashlytics';

// When user logs in:
setUserId(user.uid);
setAttribute('email', user.email || 'unknown');
setAttribute('userState', UserState[authState.userState]);
```

**Update Error Handlers:**

```typescript
import { logError } from '../utils/crashlytics';

try {
  // ... code
} catch (error) {
  logError(error as Error, 'Payment failed');
  console.error('Payment error:', error);
}
```

### **Testing:**

```bash
# Build and run (crashes will be uploaded on next app start)
npx react-native run-ios --configuration Release

# View crashes in Firebase Console:
# https://console.firebase.google.com/project/fintrack-bef0a/crashlytics
```

---

## 2️⃣ Setup Firebase Analytics

### **Инсталация:**

```bash
# Install Analytics
npm install @react-native-firebase/analytics

# iOS - Install pods
cd ios && pod install && cd ..
```

### **iOS Configuration:**

**Already configured** via GoogleService-Info.plist ✅

### **Android Configuration:**

**Already configured** via google-services.json ✅

### **Usage in Code:**

Create `src/utils/analytics.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';

export const initAnalytics = () => {
  if (__DEV__) {
    analytics().setAnalyticsCollectionEnabled(false);
  } else {
    analytics().setAnalyticsCollectionEnabled(true);
  }
};

// Screen tracking
export const logScreenView = async (screenName: string, screenClass?: string) => {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

// User properties
export const setUserProperty = async (name: string, value: string) => {
  await analytics().setUserProperty(name, value);
};

// Custom events
export const logEvent = async (name: string, params?: { [key: string]: any }) => {
  await analytics().logEvent(name, params);
};

// Predefined events
export const logLogin = async (method: string) => {
  await analytics().logLogin({ method });
};

export const logSignUp = async (method: string) => {
  await analytics().logSignUp({ method });
};

export const logPurchase = async (value: number, currency: string, items?: any[]) => {
  await analytics().logPurchase({
    value,
    currency,
    items: items || [],
  });
};

export const logSelectContent = async (contentType: string, itemId: string) => {
  await analytics().logSelectContent({
    content_type: contentType,
    item_id: itemId,
  });
};
```

**Update App.tsx:**

```typescript
import { initAnalytics } from './src/utils/analytics';

function App(): React.JSX.Element {
  useEffect(() => {
    initCrashlytics();
    initAnalytics();
  }, []);
  
  // ... rest of app
}
```

**Update Navigation:**

```typescript
import { logScreenView } from '../utils/analytics';

const AppNavigator: React.FC = () => {
  const routeNameRef = useRef<string>();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          await logScreenView(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      {/* ... */}
    </NavigationContainer>
  );
};
```

**Update Auth Screens:**

```typescript
import { logLogin, logSignUp, setUserProperty } from '../../utils/analytics';

// In LoginScreen:
const handleLogin = async () => {
  // ... login logic
  await logLogin('email');
};

// In RegisterScreen:
const handleRegister = async () => {
  // ... register logic
  await logSignUp('email');
};

// After subscription:
await setUserProperty('subscription_plan', planId);
await setUserProperty('subscription_status', 'active');
```

**Update Payment Screens:**

```typescript
import { logPurchase, logEvent } from '../../utils/analytics';

// In PaymentSuccessScreen:
await logPurchase(amount, currency, [
  { item_id: planId, item_name: selectedPlan.name }
]);

await logEvent('subscription_purchase', {
  plan: planId,
  amount,
  currency,
  period: getPlanPeriod(planId),
});
```

### **Testing:**

```bash
# Run app
npx react-native run-ios

# View events in Firebase Console (with ~24h delay for DebugView):
# https://console.firebase.google.com/project/fintrack-bef0a/analytics

# Enable DebugView (immediate testing):
# iOS: adb shell setprop debug.firebase.analytics.app com.fintracknew
# Android: adb shell setprop debug.firebase.analytics.app com.fintracknew
```

---

## 3️⃣ Премахни Console.Log Statements

### **Автоматично (Препоръчително):**

Install babel plugin:

```bash
npm install --save-dev babel-plugin-transform-remove-console
```

**Update `babel.config.js`:**

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }]
      ]
    }
  }
};
```

**Резултат:**
- ✅ Всички `console.log` автоматично премахнати в production build
- ✅ `console.error` и `console.warn` остават (за debugging)
- ✅ Не трябва ръчно да се променя код

### **Ръчно (За критични файлове):**

Find all console.log:

```bash
grep -r "console\.log" src/ --exclude-dir=node_modules
```

Replace with logger:

```typescript
// ПРЕДИ
console.log('[PaymentScreen] Payment initiated');

// СЛЕД
import { paymentLogger } from '../utils/logger';
paymentLogger.log('Payment initiated');
```

**Priority Files за Ръчно Replacement:**

1. `src/contexts/AuthContext.tsx`
2. `src/screens/auth/PaymentScreen.tsx`
3. `src/screens/auth/PaymentSuccessScreen.tsx`
4. `src/config/firebase.config.ts`
5. `src/services/*.ts` files

---

## 4️⃣ Обнови .cursorrules

Add new patterns discovered during audit:

```markdown
## Logger Utility Pattern ✅ ДОБАВЕНО

**ALWAYS use logger utility instead of console.log:**
```typescript
// ✅ CORRECT - Production-safe
import { logger, paymentLogger } from '../utils/logger';
logger.log('Debug info');        // Only in development
logger.error('Error occurred');  // Always logged

// ❌ WRONG - Will run in production
console.log('Debug info');
```

## Crashlytics Error Tracking ✅ ДОБАВЕНО

**ALWAYS log errors to Crashlytics:**
```typescript
import { logError } from '../utils/crashlytics';

try {
  // ... code
} catch (error) {
  logError(error as Error, 'Context description');
  logger.error('Error:', error);
}
```

## Analytics Events ✅ ДОБАВЕНО

**Track important user actions:**
```typescript
import { logEvent, logPurchase } from '../utils/analytics';

// Custom events
await logEvent('feature_used', { feature_name: 'qr_scanner' });

// Purchase events
await logPurchase(amount, 'EUR', [{ item_id: planId }]);
```

## Production Readiness Checklist ✅ ДОБАВЕНО

Before deploying to production:
- [ ] All Stripe secret keys rotated
- [ ] Git history cleaned of secrets
- [ ] .env system configured
- [ ] Crashlytics enabled and tested
- [ ] Analytics tracking verified
- [ ] console.log statements removed
- [ ] Firestore indexes deployed
- [ ] Firebase Functions deployed with Live keys
```

---

## 5️⃣ Deployment Scripts

Create helper scripts for common operations:

### **deploy-functions.sh:**

```bash
#!/bin/bash
# Deploy Firebase Functions

echo "🚀 Deploying Firebase Functions..."

# Check if logged in
firebase login --reauth

# Deploy functions
firebase deploy --only functions --project fintrack-bef0a

# Check logs
echo "📊 Recent logs:"
firebase functions:log --project fintrack-bef0a --limit 10

echo "✅ Deployment complete!"
```

### **deploy-firestore.sh:**

```bash
#!/bin/bash
# Deploy Firestore Rules and Indexes

echo "🗄️ Deploying Firestore configuration..."

# Deploy rules
echo "📋 Deploying security rules..."
firebase deploy --only firestore:rules --project fintrack-bef0a

# Deploy indexes
echo "🔍 Deploying indexes..."
firebase deploy --only firestore:indexes --project fintrack-bef0a

echo "✅ Firestore deployment complete!"
```

### **build-android-release.sh:**

```bash
#!/bin/bash
# Build Android Release APK

echo "🤖 Building Android Release..."

cd android

# Clean
./gradlew clean

# Build release
./gradlew assembleRelease

cd ..

echo "✅ Build complete!"
echo "📦 APK location: android/app/build/outputs/apk/release/app-release.apk"
```

### **build-ios-archive.sh:**

```bash
#!/bin/bash
# Prepare iOS Archive

echo "🍎 Preparing iOS Archive..."

cd ios

# Clean
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/FinTrackNew-*

# Install pods
pod install

echo "✅ Ready for Xcode Archive!"
echo "📱 Next: Open Xcode and Product → Archive"

cd ..
```

### **Make scripts executable:**

```bash
chmod +x deploy-functions.sh deploy-firestore.sh build-android-release.sh build-ios-archive.sh
```

---

## ✅ Verification Checklist

След setup на всичко, провери:

### **Crashlytics:**
- [ ] Package installed
- [ ] iOS configured (run script phase added)
- [ ] Android configured (gradle plugin added)
- [ ] Crashlytics utility created
- [ ] Error logging added to critical code
- [ ] Test crash works (in release build)

### **Analytics:**
- [ ] Package installed
- [ ] Analytics utility created
- [ ] Screen tracking added to navigation
- [ ] Event tracking added to key actions
- [ ] User properties set after login
- [ ] Purchase events tracked

### **Console Logs:**
- [ ] Babel plugin installed
- [ ] babel.config.js updated
- [ ] Production build verified (no console.log)
- [ ] Critical files updated with logger

### **Documentation:**
- [ ] .cursorrules updated with new patterns
- [ ] README updated with monitoring info

### **Scripts:**
- [ ] Deployment scripts created
- [ ] Scripts made executable
- [ ] Scripts tested

---

## 📊 Expected Impact

### **Before:**
- ❌ No crash tracking
- ❌ No analytics
- ❌ Console logs in production
- ❌ Manual deployment process

### **After:**
- ✅ Real-time crash reports
- ✅ User behavior analytics
- ✅ Clean production builds
- ✅ Automated deployment scripts

---

## 🚀 Next Steps

1. Install Crashlytics & Analytics packages
2. Configure iOS & Android
3. Add tracking to critical code paths
4. Setup babel plugin for console removal
5. Create deployment scripts
6. Test in Release build
7. Verify in Firebase Console

---

**Estimated Time:** 1-2 hours  
**Complexity:** Medium  
**Priority:** ⚠️ Important (but not blocking production)

---

**Last Updated:** 13 Януари 2026  
**Status:** 📝 Ready for implementation
