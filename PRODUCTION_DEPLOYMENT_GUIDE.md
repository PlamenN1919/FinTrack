# 🚀 FinTrack Production Deployment Guide

**Last Updated:** 13 Януари 2026  
**Target Date:** TBD (След security hotfix)  
**Estimated Time:** 2-3 дни

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ **Phase 1: Security Hotfix (MANDATORY)**

- [ ] Ротирани Stripe API keys
- [ ] Премахнати secret keys от git history
- [ ] Създадена .env система
- [ ] Обновен .gitignore за secrets
- [ ] Тествано с нови keys (Test mode)

**Status:** ⏳ PENDING  
**Reference:** Виж `SECURITY_HOTFIX_INSTRUCTIONS.md`

---

### ✅ **Phase 2: Stripe Live Mode Setup (CRITICAL)**

#### **2.1: Създай Products в Stripe Live Mode**

1. Login в Stripe Dashboard: https://dashboard.stripe.com
2. Switch to **Live mode** (toggle горе вдясно)
3. Navigate to: Products → **Create product**

**Product 1: FinTrack Premium**
```
Name: FinTrack Premium
Description: Пълен достъп до всички функции на FinTrack
Statement descriptor: FinTrack
```

**Create 3 Prices:**

**Monthly Price:**
```
Price: 12.99 EUR
Billing period: Monthly
Payment type: Recurring
```
→ Copy Price ID: `price_XXXXXXXXXXXXXX`

**Quarterly Price:**
```
Price: 29.99 EUR
Billing period: Every 3 months
Payment type: Recurring
```
→ Copy Price ID: `price_XXXXXXXXXXXXXX`

**Yearly Price:**
```
Price: 75.99 EUR
Billing period: Yearly
Payment type: Recurring
```
→ Copy Price ID: `price_XXXXXXXXXXXXXX`

#### **2.2: Обнови Price IDs в Code**

**File:** `src/config/subscription.config.ts`
```typescript
export const STRIPE_PRICE_IDS = {
  // LIVE MODE PRICES (обнови с реалните IDs от стъпка 2.1)
  MONTHLY_EUR: 'price_LIVE_MONTHLY_ID_HERE',
  QUARTERLY_EUR: 'price_LIVE_QUARTERLY_ID_HERE', 
  YEARLY_EUR: 'price_LIVE_YEARLY_ID_HERE',
} as const;
```

**File:** `functions/src/config/subscription.config.ts`
```typescript
// Update same Price IDs here
export const getStripePriceId = (planId: SubscriptionPlan): string => {
  const plan = SUBSCRIPTION_PLANS[planId];
  // ... return LIVE price IDs
};
```

#### **2.3: Get Live API Keys**

Stripe Dashboard → Developers → API keys (Live mode)

```
Publishable key: pk_live_51XXXXXXXXXXXXXX...
Secret key: sk_live_51XXXXXXXXXXXXXX...
```

**⚠️ НИКОГА не commit-вай secret key в git!**

#### **2.4: Configure Webhook (Live Mode)**

1. Stripe Dashboard → Developers → Webhooks
2. **Add endpoint** (Live mode)
3. Endpoint URL: `https://us-central1-fintrack-bef0a.cloudfunctions.net/stripeWebhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy Signing secret:** `whsec_XXXXXXXXXXXXXX`

---

### ✅ **Phase 3: Firebase Configuration (CRITICAL)**

#### **3.1: Update Firebase Functions Config**

```bash
# Login to Firebase
firebase login --reauth

# Set LIVE Stripe keys
firebase functions:config:set \
  stripe.secret="sk_live_ТВОЯТ_LIVE_SECRET_KEY" \
  stripe.webhook_secret="whsec_ТВОЯТ_LIVE_WEBHOOK_SECRET" \
  --project fintrack-bef0a

# Verify config
firebase functions:config:get --project fintrack-bef0a
```

**Expected output:**
```json
{
  "stripe": {
    "secret": "sk_live_51XXXXXX...",
    "webhook_secret": "whsec_XXXXXX..."
  }
}
```

#### **3.2: Deploy Firebase Functions**

```bash
# Deploy LIVE functions
firebase deploy --only functions --project fintrack-bef0a

# Watch logs за errors
firebase functions:log --project fintrack-bef0a
```

#### **3.3: Verify Firestore Rules**

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project fintrack-bef0a

# Test rules в Firebase Console:
# https://console.firebase.google.com/project/fintrack-bef0a/firestore/rules
```

---

### ✅ **Phase 4: App Configuration (IMPORTANT)**

#### **4.1: Update Environment Variables**

Create `.env.production`:
```env
# Stripe Live Keys
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_ТВОЯТ_KEY
STRIPE_PRICE_ID_MONTHLY_LIVE=price_LIVE_MONTHLY
STRIPE_PRICE_ID_QUARTERLY_LIVE=price_LIVE_QUARTERLY
STRIPE_PRICE_ID_YEARLY_LIVE=price_LIVE_YEARLY

# App Config
APP_ENV=production
ENABLE_DEBUG_LOGGING=false
ENABLE_QR_SCANNER=false
ENABLE_REFERRAL_SYSTEM=false
```

#### **4.2: Update stripe.config.ts**

```typescript
import Config from 'react-native-config';

const STRIPE_PUBLISHABLE_KEY = __DEV__ 
  ? Config.STRIPE_PUBLISHABLE_KEY_TEST 
  : Config.STRIPE_PUBLISHABLE_KEY_LIVE;
```

#### **4.3: Disable Debug Features**

**File:** `App.tsx`
```typescript
// Премахни или set на false
const RESET_GAMIFICATION = false;
```

#### **4.4: Remove Console Logs**

**Option 1:** Use logger utility (препоръчително)
```typescript
// src/utils/logger.ts
export const logger = {
  log: __DEV__ ? console.log : () => {},
  error: console.error,
  warn: __DEV__ ? console.warn : () => {},
};

// Replace all console.log with logger.log
```

**Option 2:** Use babel plugin (automatic)
```bash
npm install --save-dev babel-plugin-transform-remove-console

# .babelrc.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['transform-remove-console', { exclude: ['error', 'warn'] }]
  ]
};
```

---

### ✅ **Phase 5: Testing (MANDATORY)**

#### **5.1: Live Payment Test**

⚠️ **ВАЖНО:** Използвай REAL кредитна карта (не test card)!

```
Test Steps:
1. Build app в production mode
2. Register нов test user
3. Select subscription plan
4. Enter REAL credit card
5. Verify payment succeeds
6. Check Stripe Dashboard (Live) - transaction visible
7. Check Firebase Firestore - subscription created
8. Verify email receipt sent
9. Test app features with active subscription
```

#### **5.2: Webhook Test**

```bash
# Trigger webhook manually в Stripe Dashboard
# Developers → Webhooks → Select endpoint → Send test webhook

# Check Firebase Functions logs:
firebase functions:log --project fintrack-bef0a | grep stripeWebhook
```

#### **5.3: Subscription Lifecycle Test**

```
Test Scenarios:
1. New subscription → status = 'active'
2. Auto-renewal → currentPeriodEnd updated
3. Payment failure → status = 'failed'
4. Subscription cancel → status = 'cancelled'
5. Subscription expired → status = 'expired'
```

---

### ✅ **Phase 6: Build Configuration**

#### **6.1: Android Release Build**

```bash
cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

**Android Configuration Checklist:**
- [ ] Update `versionCode` in `build.gradle`
- [ ] Update `versionName` in `build.gradle`
- [ ] Enable ProGuard: `minifyEnabled true`
- [ ] Sign APK with release keystore
- [ ] Test на real Android device

#### **6.2: iOS Archive Build**

```bash
cd ios

# Clean build
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData

# Install pods
pod install

# Open Xcode
open FinTrackNew.xcworkspace
```

**Xcode Configuration:**
1. Select **Any iOS Device (arm64)** target
2. Product → Archive
3. Organizer → Distribute App
4. Choose **App Store Connect**
5. Upload

**iOS Configuration Checklist:**
- [ ] Update `CFBundleShortVersionString` (Marketing Version)
- [ ] Update `CFBundleVersion` (Build Number)
- [ ] Set Build Configuration to **Release**
- [ ] Enable **Bitcode** (if required)
- [ ] Test на real iOS device

---

### ✅ **Phase 7: Store Submission**

#### **7.1: Google Play Console**

**Setup:**
1. Create app in Play Console
2. Complete store listing (Bulgarian)
3. Upload screenshots (5-8 per device type)
4. Upload feature graphic (1024x500)
5. Upload app icon (512x512)
6. Set content rating
7. Set pricing (Paid with IAP)
8. Add privacy policy URL

**Release Track:**
- Start with **Internal Testing** (1-2 days)
- Then **Closed Beta** (1 week)
- Then **Open Beta** (optional)
- Finally **Production Release**

**Required Assets:**
```
- Screenshots: 5+ (phone, tablet)
- Feature graphic: 1024x500
- App icon: 512x512
- Short description: 80 chars
- Full description: 4000 chars
- Privacy Policy URL
- Terms of Service URL
```

#### **7.2: Apple App Store Connect**

**Setup:**
1. Create app in App Store Connect
2. Complete App Information
3. Upload screenshots (iOS device types)
4. Upload app preview video (optional)
5. Set age rating
6. Set pricing tier
7. Add privacy policy URL
8. Submit for review

**Release Strategy:**
- **TestFlight** beta (1-2 weeks)
- **Phased Release** (recommended)
- Monitor crash reports

**Required Assets:**
```
- Screenshots: 6.5", 5.5" (iPhone)
- Screenshots: 12.9" (iPad Pro)
- App icon: 1024x1024
- Description: 4000 chars
- Keywords: 100 chars
- Support URL
- Marketing URL (optional)
```

---

### ✅ **Phase 8: Monitoring & Analytics**

#### **8.1: Setup Crashlytics**

```bash
npm install @react-native-firebase/crashlytics

# iOS
cd ios && pod install

# Enable in Firebase Console
```

**Test crash:**
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Force crash (for testing)
crashlytics().crash();
```

#### **8.2: Setup Analytics**

```bash
npm install @react-native-firebase/analytics

# iOS
cd ios && pod install
```

**Log events:**
```typescript
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('subscription_purchase', {
  plan: 'yearly',
  currency: 'EUR',
  value: 75.99
});
```

#### **8.3: Setup Error Monitoring (Optional)**

**Sentry:**
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

---

### ✅ **Phase 9: Documentation**

#### **9.1: Update README**

- [ ] Installation instructions
- [ ] Environment setup
- [ ] Build instructions (iOS & Android)
- [ ] Testing guide
- [ ] Deployment process
- [ ] Troubleshooting

#### **9.2: Create Privacy Policy**

Required sections:
- Data collection (what you collect)
- How data is used
- Data sharing (Firebase, Stripe)
- User rights (access, deletion)
- Contact information
- GDPR compliance (if applicable)

**Host at:** `https://yourwebsite.com/privacy` or use GitHub Pages

#### **9.3: Create Terms of Service**

Required sections:
- Service description
- User obligations
- Payment terms
- Subscription terms
- Cancellation policy
- Refund policy
- Limitation of liability

**Host at:** `https://yourwebsite.com/terms`

---

### ✅ **Phase 10: Launch Day**

#### **10.1: Pre-Launch Checklist**

- [ ] All tests passed (payment, webhooks, subscriptions)
- [ ] Store listings complete (Google Play & App Store)
- [ ] Privacy Policy & Terms published
- [ ] Monitoring enabled (Crashlytics, Analytics)
- [ ] Support email configured
- [ ] Firebase Functions Live keys configured
- [ ] Stripe Live mode enabled
- [ ] Beta testing completed
- [ ] Final QA pass on production build

#### **10.2: Launch**

1. Submit app for review (Google Play & App Store)
2. Wait for approval (1-7 days típically)
3. Monitor crash reports and reviews
4. Be ready for hotfixes

#### **10.3: Post-Launch Monitoring**

**First 24 hours:**
- Monitor Firebase Functions logs
- Monitor Stripe Dashboard (payments, failures)
- Monitor Crashlytics (crashes)
- Monitor app store reviews
- Monitor support email

**First week:**
- Daily analytics review
- Fix critical bugs immediately
- Respond to user reviews
- Collect user feedback

**First month:**
- Weekly analytics review
- Plan feature updates
- Optimize subscription conversion
- A/B test pricing (optional)

---

## 📊 Success Metrics

**Key Performance Indicators (KPIs):**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Subscription conversion rate
- Subscription retention rate (churn)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)
- Crash-free rate (target: >99%)
- App store rating (target: 4.5+)

---

## 🆘 Emergency Contacts

**Firebase Support:** https://firebase.google.com/support  
**Stripe Support:** https://support.stripe.com  
**Google Play Support:** https://support.google.com/googleplay/android-developer  
**Apple Developer Support:** https://developer.apple.com/contact

---

## 📞 Rollback Plan

If critical issues after launch:

```bash
# 1. Pause new installs (Store settings)
# 2. Revert Firebase Functions
firebase functions:delete FUNCTION_NAME --force
firebase deploy --only functions --project fintrack-bef0a

# 3. Switch Stripe back to Test mode (emergency)
firebase functions:config:set stripe.secret="sk_test_..." --project fintrack-bef0a

# 4. Release hotfix update ASAP
```

---

## ✅ FINAL PRODUCTION CHECKLIST

### **Environment**
- [ ] `.env.production` created with Live keys
- [ ] `APP_ENV=production`
- [ ] Debug logging disabled
- [ ] Test data cleared

### **Stripe**
- [ ] Live Products created
- [ ] Live Prices created (12.99, 29.99, 75.99 EUR)
- [ ] Live API keys obtained
- [ ] Live Webhook endpoint configured
- [ ] Live payment tested with real card

### **Firebase**
- [ ] Functions configured with Live Stripe keys
- [ ] Functions deployed to production
- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Crashlytics enabled
- [ ] Analytics enabled

### **App Build**
- [ ] Android release APK signed
- [ ] iOS archive uploaded to App Store Connect
- [ ] Version numbers updated
- [ ] ProGuard/obfuscation enabled
- [ ] Console logs removed/disabled

### **Store**
- [ ] Google Play listing complete
- [ ] App Store Connect listing complete
- [ ] Screenshots uploaded (all sizes)
- [ ] Privacy Policy published
- [ ] Terms of Service published

### **Testing**
- [ ] End-to-end payment test (Live)
- [ ] Subscription auto-renewal test
- [ ] Webhook delivery test
- [ ] Beta testing complete (TestFlight/Internal)
- [ ] QA sign-off

### **Monitoring**
- [ ] Firebase Crashlytics working
- [ ] Firebase Analytics working
- [ ] Stripe Dashboard monitoring setup
- [ ] Support email configured

---

**Status:** 📝 DRAFT  
**Next Review:** След security hotfix  
**Owner:** Development Team  
**Approver:** TBD

---

**Estimated Timeline:**
- Security Hotfix: 1 day
- Stripe Live Setup: 0.5 days
- Firebase Config: 0.5 days
- Testing: 1 day
- Build & Submit: 0.5 days
- **Total: 3-4 days**

**Review & Approval:** 1-7 days (store review)  
**Launch Date:** TBD
