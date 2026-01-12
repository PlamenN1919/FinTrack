# FinTrack - Personal Finance Management App

FinTrack е мобилно приложение за управление на лични финанси, разработено с React Native. Предоставя функции за проследяване на разходи, бюджетиране, отчети и абонаментни планове с интегрирано плащане чрез Stripe.

## 🎯 Features

- ✅ Автентикация с Firebase (Email/Password)
- ✅ Абонаментна система със Stripe
- ✅ Проследяване на транзакции
- ✅ Управление на бюджети
- ✅ QR Scanner за касови бележки (временно заключен)
- ✅ Финансови отчети и анализи
- ✅ Интелигентни предвиждания с AI
- ✅ Referral система (временно скрита)
- ✅ Тъмна/Светла тема
- ✅ Български език

## 📱 Platform Support

- ✅ iOS (iPhone - Portrait only)
- ✅ Android (Portrait only)

**Note:** Приложението е оптимизирано за portrait orientation. Landscape mode не се поддържа.

## 🏗️ Tech Stack

- **React Native**: 0.80.0
- **TypeScript**: 5.0.4
- **Firebase**: Authentication, Firestore, Functions
- **Stripe**: Payments & Subscriptions
- **React Navigation**: 7.x
- **React Native Camera Kit**: QR Scanning

## 🚀 Getting Started

### Prerequisites

Make sure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment).

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FinTrack1
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies:
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

4. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the App

#### Start Metro:
```bash
npm start
```

#### Run on iOS:
```bash
npm run ios
# OR for specific device
npx react-native run-ios --device "iPhone 15 Pro"
```

#### Run on Android:
```bash
npm run android
```

## 🔧 Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── navigation/     # Navigation configuration
├── screens/        # App screens
├── services/       # Business logic & API services
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── utils/          # Helper functions & utilities
```

### Key Configurations

#### Firebase
- Project ID: `fintrack-bef0a`
- Native config files:
  - iOS: `ios/FinTrackNew/GoogleService-Info.plist`
  - Android: `android/app/google-services.json`

#### Stripe
- Test Mode Price IDs:
  - Monthly: `price_1SoQM7G1pdDRlAv65jodPGib` (12.99 EUR)
  - Quarterly: `price_1SoQNHG1pdDRlAv6j0XFjpuD` (29.99 EUR)
  - Yearly: `price_1SoQNHG1pdDRlAv6yXGPyu00` (75.99 EUR)

### Logging

Use the built-in logger utility instead of `console.log`:

```typescript
import { logger } from './src/utils/logger';

logger.log('Debug message');    // Only in development
logger.info('Info message');    // Only in development
logger.warn('Warning');         // Only in development
logger.error('Error occurred'); // Always logged
```

### Testing Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- CVC: Any 3 digits
- Expiry: Any future date

## 📦 Building for Production

### Android Release Build

```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Archive Build

```bash
cd ios
open FinTrackNew.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device (arm64)" as target
# 2. Product → Archive
# 3. Organizer → Distribute App
```

## 🔐 Security

### Environment Variables

**NEVER commit sensitive data to git!**

Required environment variables:
- `STRIPE_PUBLISHABLE_KEY_TEST` - Stripe publishable key (Test mode)
- `STRIPE_PUBLISHABLE_KEY_LIVE` - Stripe publishable key (Live mode)
- `FIREBASE_*` - Firebase configuration

Secret keys (like Stripe secret key) should ONLY be in:
- Firebase Functions config (via `firebase functions:config:set`)
- Environment variables on your local machine
- CI/CD secrets

### Firestore Security

Security rules are defined in `firestore.rules` and automatically enforce:
- User-scoped read/write access
- Subscription read-only for clients
- Transactions, budgets, goals are user-specific

## 📚 Documentation

### Available Guides

- `PRODUCTION_READINESS_AUDIT_REPORT.md` - Full production audit report
- `SECURITY_HOTFIX_INSTRUCTIONS.md` - Security fixes guide
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `КРАТКО_РЕЗЮМЕ_НА_ПРОВЕРКАТА.md` - Summary in Bulgarian

### Key Features Documentation

#### QR Scanner
- Status: ✅ Ready (temporarily locked)
- Library: `react-native-camera-kit`
- To enable: Set `isLocked = false` in `ScannerScreen.tsx`

#### Referral System
- Status: ✅ Backend ready (UI hidden)
- To enable: Uncomment `ReferralCard` in `ProfileScreen.tsx`

#### Auto-Renewal
- Status: ✅ Working
- Stripe subscriptions handle renewal automatically
- Scheduled function checks expired subscriptions daily

## 🐛 Troubleshooting

### Common Issues

#### Metro won't start
```bash
npx react-native start --reset-cache
```

#### iOS build fails
```bash
cd ios
rm -rf Pods
pod deintegrate
pod install
cd ..
```

#### Android build fails
```bash
cd android
./gradlew clean
cd ..
```

#### Firebase connection issues
- Verify `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are present
- Check Firebase project ID matches in config files

## 📄 License

This project is private and confidential.

## 👥 Contact

For support or questions, contact: [your-email@example.com]

---

## 🚨 Important Notes

### Before Production Deployment

**CRITICAL:** Read `SECURITY_HOTFIX_INSTRUCTIONS.md` before deploying to production!

Required steps:
1. ✅ Rotate all Stripe API keys
2. ✅ Remove secrets from git history
3. ✅ Setup `.env` system
4. ✅ Configure webhook secrets
5. ✅ Create Live mode Stripe products
6. ✅ Deploy Firebase Functions with Live keys
7. ✅ Test end-to-end with real card

### Current Status

- ✅ Development: Ready
- ⚠️ Production: Requires security fixes (see audit report)

**Overall Score: 81/100**

---

**Built with ❤️ using React Native**
