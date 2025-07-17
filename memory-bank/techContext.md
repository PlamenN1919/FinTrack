# Tech Context - FinTrack

## Основни технологии
- **React Native 0.80.0** - Главната платформа за мобилната разработка
- **TypeScript** - За статично типизиране и по-добра разработка
- **Firebase** - Backend-as-a-Service:
  - Authentication за потребителска автентикация
  - Firestore за база данни
  - Functions за serverless логика
- **Stripe** - За обработка на плащания и абонаменти

## Архитектура
- **React Navigation 7.x** - Stack и Tab навигация
- **Context API** - За state management (AuthContext, ThemeContext и др.)
- **React Native Firebase** (@react-native-firebase/*) - За Firebase интеграция
- **Stripe React Native** (@stripe/stripe-react-native) - За плащания

## Структура на проекта
```
src/
├── components/          # Преизползваеми компоненти
├── contexts/           # React Context провайдери
├── navigation/         # Навигационна логика
├── screens/           # Екрани на приложението
├── services/          # Бизнес логика и API услуги
├── types/             # TypeScript типове
├── config/            # Конфигурационни файлове
└── utils/             # Помощни функции
```

## Firebase конфигурация
- Project ID: fintrack-bef0a
- Native конфигурация чрез GoogleService-Info.plist (iOS) и google-services.json (Android)
- React Native Firebase SDK се използва (НЕ web Firebase SDK)

## Известни проблеми
- ❗ **ПОПРАВЕН**: Грешка при смесване на web Firebase SDK с React Native Firebase SDK в StripeService.ts 