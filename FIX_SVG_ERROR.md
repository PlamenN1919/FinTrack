# Решение на грешката "topSvgLayout"

## Проблем
```
Unsupported top level event type "topSvgLayout" dispatched
```

Тази грешка се появява заради несъвместимост между `react-native-svg` и `react-native-chart-kit`.

## Решение 1: Обновяване на react-native-chart-kit (ПРЕПОРЪЧВАМ)

```bash
# Премахни старата версия
npm uninstall react-native-chart-kit

# Инсталирай по-нова версия или алтернатива
npm install react-native-gifted-charts
# ИЛИ
npm install victory-native
```

## Решение 2: Downgrade на react-native-svg

```bash
npm install react-native-svg@13.4.0
cd ios && pod install && cd ..
```

## Решение 3: Използване на алтернативна библиотека

### Victory Native (Препоръчвам)
```bash
npm install victory-native
```

### React Native Gifted Charts
```bash
npm install react-native-gifted-charts react-native-linear-gradient react-native-svg
```

## Решение 4: Временен workaround (Бърз фикс)

Добави в `App.tsx` или `index.js`:

```typescript
import { LogBox } from 'react-native';

// Игнорирай грешката временно
LogBox.ignoreLogs(['Unsupported top level event type']);
```

## Препоръчано решение за FinTrack

Използвай **victory-native** или **react-native-gifted-charts** вместо react-native-chart-kit:

### Victory Native (по-добра производителност)
```bash
npm install victory-native
```

### Gifted Charts (по-лесна за използване)
```bash
npm install react-native-gifted-charts
```

## След промяната

1. Рестартирай Metro bundler:
```bash
npm start -- --reset-cache
```

2. Rebuild приложението:
```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

