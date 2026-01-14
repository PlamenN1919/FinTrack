# 🧪 Android Payment Flow Test Guide

**Дата:** 12 Януари 2026  
**Build:** Release APK  
**Environment:** Production (Live Stripe Keys)

---

## 📱 APK Information

**Location:** `android/app/build/outputs/apk/release/app-release.apk`  
**Size:** 95 MB  
**Build Time:** 8m 51s  
**Status:** ✅ BUILD SUCCESSFUL

---

## 🎯 Test Objectives

### **Primary Goals:**
1. ✅ Verify app starts without crashes
2. ✅ Test user registration flow
3. ✅ Test subscription plan selection
4. ✅ Test Stripe payment integration
5. ✅ Verify payment success handling
6. ✅ Check Firebase subscription creation
7. ✅ Monitor Stripe webhook delivery

### **Secondary Goals:**
1. Check Crashlytics error reporting
2. Verify Analytics screen tracking
3. Test console.log removal (production build)
4. Check navigation flows
5. Verify .env variables loading

---

## 📋 Pre-Test Checklist

### **Environment Variables (.env):**
```bash
✅ STRIPE_PUBLISHABLE_KEY_LIVE - Set
✅ STRIPE_SECRET_KEY_LIVE - Set (Firebase Functions)
✅ STRIPE_WEBHOOK_SECRET_LIVE - Set
✅ STRIPE_PRICE_ID_MONTHLY_LIVE - Set
✅ STRIPE_PRICE_ID_QUARTERLY_LIVE - Set
✅ STRIPE_PRICE_ID_YEARLY_LIVE - Set
✅ FIREBASE_PROJECT_ID - fintrack-bef0a
```

### **Firebase Functions:**
```bash
✅ All 13 functions deployed
✅ Stripe config set with Live keys
✅ Webhook endpoint active
```

### **Stripe Dashboard:**
```bash
✅ Live mode enabled
✅ Webhook configured
✅ Price IDs verified
✅ Test cards ready
```

---

## 🧪 Test Scenario 1: Basic App Launch

### **Steps:**
1. Install APK on device/emulator
2. Launch app
3. Observe splash screen
4. Check Welcome screen loads

### **Expected Results:**
- ✅ No crashes on launch
- ✅ Splash screen animates smoothly
- ✅ Welcome screen shows correctly
- ✅ Firebase initializes (check Crashlytics)
- ✅ Analytics tracks screen view

### **Verification:**
```bash
# Check logcat for errors (should be minimal in Release)
adb logcat | grep -E "(ERROR|FATAL|FinTrack)"

# Check Firebase Console
# - Analytics → Real-time events
# - Crashlytics → No crashes reported
```

---

## 🧪 Test Scenario 2: User Registration

### **Steps:**
1. Tap "Започни сега" on Welcome screen
2. Navigate to Registration screen
3. Fill in registration form:
   - Email: `test+$(date +%s)@fintrack.test`
   - Password: `TestPassword123!`
   - Confirm password: `TestPassword123!`
4. Tap "Регистрирай се"
5. Wait for registration

### **Expected Results:**
- ✅ Firebase Auth creates user
- ✅ User profile created in Firestore (`users` collection)
- ✅ Navigation to Subscription Plans screen
- ✅ Analytics logs `sign_up` event

### **Verification:**
```bash
# Firebase Console
# - Authentication → Users → New user appears
# - Firestore → users → User document created

# Crashlytics
# - User ID set
# - Email attribute set
```

---

## 🧪 Test Scenario 3: Subscription Plan Selection

### **Steps:**
1. On Subscription Plans screen, view all 3 plans:
   - Monthly: 12.99 EUR/месец
   - Quarterly: 29.99 EUR/3 месеца
   - Yearly: 75.99 EUR/година
2. Select "Годишен" plan (best value)
3. Tap "Продължи към плащане"

### **Expected Results:**
- ✅ Plans display correct prices (EUR)
- ✅ Plan selection highlights chosen plan
- ✅ Navigation to Payment screen
- ✅ Selected plan data passed correctly

### **Verification:**
```bash
# Check plan details on Payment screen
# - Price: 75.99 EUR
# - Duration: 12 months
# - Savings message displayed
```

---

## 🧪 Test Scenario 4: Payment Processing (CRITICAL)

### **Steps:**
1. On Payment screen, fill Stripe card form:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
2. Tap "Плати 75.99 EUR"
3. Wait for payment processing (watch loading states)
4. Observe result

### **Expected Results:**
- ✅ Payment intent created via Firebase Function
- ✅ Stripe processes payment successfully
- ✅ Payment confirmation received
- ✅ Navigation to Payment Success screen
- ✅ Success animation plays

### **Analytics Events (in order):**
1. `payment_attempt` - When payment starts
2. `payment_success` - When payment succeeds
3. `screen_view: PaymentSuccess` - Screen navigation

### **Verification - Firebase Console:**
```bash
# 1. Firestore → subscriptions collection
{
  userId: "...",
  plan: "yearly",
  status: "active",
  stripeSubscriptionId: "sub_...",
  stripePriceId: "price_1SmYsVG1pdDRlAv6oZxuHfRF",
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp (+ 1 year),
  createdAt: Timestamp
}

# 2. Analytics → Events
- payment_attempt (plan: yearly, amount: 75.99)
- payment_success (plan: yearly, amount: 75.99)
- screen_view (screen_name: PaymentSuccess)

# 3. Crashlytics → Attributes
- subscription_status: active
- subscription_plan: yearly
```

### **Verification - Stripe Dashboard:**
```bash
# 1. Payments → Last payment
- Amount: €75.99
- Status: Succeeded
- Customer: Created
- Subscription: Active

# 2. Subscriptions → Active
- Plan: Yearly (price_1SmYsVG1pdDRlAv6oZxuHfRF)
- Status: Active
- Next billing: +1 year

# 3. Webhooks → Event deliveries
- customer.subscription.created (✅ Success)
- invoice.payment_succeeded (✅ Success)
```

---

## 🧪 Test Scenario 5: Payment Success Screen

### **Steps:**
1. On Payment Success screen, observe:
   - Success animation
   - Confirmation message
   - Subscription details
2. Tap "Към приложението"
3. Navigate to Home screen

### **Expected Results:**
- ✅ Success animation plays
- ✅ Subscription details correct
- ✅ Navigation to Home screen
- ✅ User has full app access

### **Verification:**
```bash
# Home screen shows:
- ✅ User name in header
- ✅ Transaction list (empty initially)
- ✅ Add transaction button
- ✅ Bottom navigation active

# Profile screen shows:
- ✅ Subscription status: "Активна"
- ✅ Plan: "Годишен абонамент"
- ✅ Valid until: [date + 1 year]
```

---

## 🧪 Test Scenario 6: Post-Payment Verification

### **Steps:**
1. Navigate through all main screens:
   - Home
   - Transactions
   - Budgets
   - Reports
   - Profile
2. Try creating a transaction
3. Check profile subscription info
4. Sign out and sign back in

### **Expected Results:**
- ✅ All screens accessible
- ✅ No subscription prompts
- ✅ Full app functionality
- ✅ Subscription persists after sign out/in

---

## 🚨 Test Scenario 7: Payment Failure Handling

### **Steps:**
1. Register new user
2. Select any plan
3. On Payment screen, use declining test card:
   - Card Number: `4000 0000 0000 0002`
   - Expiry: `12/34`
   - CVC: `123`
4. Tap "Плати"
5. Observe error handling

### **Expected Results:**
- ✅ Payment fails gracefully
- ✅ Error message displayed
- ✅ User stays on Payment screen
- ✅ Can retry payment
- ✅ Analytics logs `payment_failure`
- ✅ Crashlytics logs error

### **Verification:**
```bash
# Stripe Dashboard
- Payment failed (card declined)
- No subscription created

# Firebase Firestore
- No subscription document created

# Analytics
- payment_failure event (error_code: card_declined)
```

---

## 📊 Monitoring & Logs

### **Real-time Monitoring:**

**1. Firebase Console:**
```bash
- Analytics → Real-time events
- Crashlytics → Live crashes
- Firestore → Data changes
- Authentication → User activity
```

**2. Stripe Dashboard:**
```bash
- Payments → Recent payments
- Webhooks → Event deliveries
- Logs → API requests
```

**3. Firebase Functions Logs:**
```bash
# Terminal command
firebase functions:log --project fintrack-bef0a --only createPaymentIntent,stripeWebhook

# Look for:
- "Payment intent created" (createPaymentIntent)
- "Webhook signature verified" (stripeWebhook)
- "Subscription created in Firestore" (stripeWebhook)
```

### **Android Logcat:**
```bash
# Minimal logging in Release build (console.log removed)
adb logcat | grep -E "(ERROR|FATAL|Crashlytics|Analytics)"

# Should NOT see:
- console.log statements
- Debug messages
- Verbose Firebase logs
```

---

## ✅ Success Criteria

### **Must Pass (Critical):**
- ✅ App launches without crash
- ✅ User can register
- ✅ Payment completes successfully
- ✅ Subscription created in Firestore
- ✅ Stripe subscription active
- ✅ Webhook events delivered
- ✅ User has full app access

### **Should Pass (High Priority):**
- ✅ Analytics events tracked
- ✅ Crashlytics attributes set
- ✅ Payment errors handled gracefully
- ✅ console.log removed in Release
- ✅ Navigation flows work
- ✅ Subscription persists after restart

### **Nice to Have:**
- ✅ Animations smooth
- ✅ UI responsive
- ✅ Loading states clear
- ✅ Error messages helpful

---

## 🐛 Known Issues to Watch For

### **Potential Issues:**

1. **Payment Intent Creation Fails:**
   - Check Firebase Functions logs
   - Verify Stripe secret key in Firebase config
   - Check user authentication token

2. **Webhook Not Received:**
   - Verify webhook URL in Stripe
   - Check webhook secret matches
   - View Stripe webhook delivery attempts

3. **Subscription Not Created in Firestore:**
   - Check Firebase Functions logs
   - Verify Firestore security rules
   - Check webhook event handler

4. **Analytics Not Tracking:**
   - Wait 24h for data processing
   - Check Real-time events (immediate)
   - Verify Analytics initialized in App.tsx

5. **Crashlytics Not Reporting:**
   - Verify Gradle plugin applied
   - Check google-services.json
   - Restart app after first install

---

## 📝 Test Results Template

```markdown
# Test Results - [Date] [Time]

## Environment:
- Device: [Pixel 8 Emulator / Real Device]
- Android Version: [Version]
- APK: app-release.apk (95 MB)

## Test Scenario 1: App Launch
- [ ] App launches
- [ ] No crashes
- [ ] Welcome screen loads
- Result: PASS / FAIL
- Notes: 

## Test Scenario 2: Registration
- [ ] User registers successfully
- [ ] Firebase Auth creates user
- [ ] Firestore user document created
- Result: PASS / FAIL
- Notes:

## Test Scenario 3: Plan Selection
- [ ] Plans display correctly
- [ ] Prices in EUR
- [ ] Navigation works
- Result: PASS / FAIL
- Notes:

## Test Scenario 4: Payment (CRITICAL)
- [ ] Payment intent created
- [ ] Stripe processes payment
- [ ] Payment success
- [ ] Navigation to success screen
- Result: PASS / FAIL
- Notes:

## Test Scenario 5: Firestore Verification
- [ ] Subscription document created
- [ ] Correct plan (yearly)
- [ ] Status: active
- [ ] Valid period set
- Result: PASS / FAIL
- Notes:

## Test Scenario 6: Stripe Verification
- [ ] Payment recorded
- [ ] Subscription active
- [ ] Webhooks delivered
- Result: PASS / FAIL
- Notes:

## Test Scenario 7: Analytics & Crashlytics
- [ ] Events tracked
- [ ] User attributes set
- [ ] No errors reported
- Result: PASS / FAIL
- Notes:

## Overall Result: PASS / FAIL

## Issues Found:
1. 
2. 

## Recommendations:
1. 
2. 
```

---

## 🎯 Next Steps After Testing

### **If All Tests Pass:**
1. ✅ Mark production-ready
2. ✅ Prepare for Google Play deployment
3. ✅ Create release notes
4. ✅ Setup production monitoring alerts

### **If Tests Fail:**
1. Document failure details
2. Check Firebase Functions logs
3. Review Stripe webhook deliveries
4. Fix issues and rebuild
5. Re-test

---

## 📞 Troubleshooting Quick Reference

### **Payment fails immediately:**
```bash
# Check Firebase Functions
firebase functions:log --project fintrack-bef0a

# Look for:
- "Firebase Auth token missing" → User not authenticated
- "Stripe API error" → Check secret key
- "Invalid price ID" → Check .env Price IDs
```

### **Webhook not received:**
```bash
# Stripe Dashboard → Webhooks → [Your webhook] → Event deliveries
# If failed, check:
- Endpoint URL correct
- Webhook secret matches
- Firebase Functions deployed
```

### **Subscription not in Firestore:**
```bash
# Possible causes:
- Webhook handler error (check Functions logs)
- Firestore security rules blocking write
- Wrong collection name in code
```

---

## 🎉 Ready to Test!

**Commands to run:**
```bash
# 1. Check emulator started
adb devices

# 2. Install APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 3. Launch app
adb shell am start -n com.fintracknew/.MainActivity

# 4. Monitor logs
adb logcat | grep -E "(ERROR|FATAL)"
```

**Test User Template:**
```
Email: test+[timestamp]@fintrack.test
Password: TestPassword123!
Test Card: 4242 4242 4242 4242
Plan: Yearly (75.99 EUR)
```

---

**Generated:** 12 Януари 2026  
**Build Status:** ✅ READY  
**Test Status:** ⏳ PENDING  
**Next:** Install APK and begin testing
