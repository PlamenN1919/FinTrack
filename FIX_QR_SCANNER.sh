#!/bin/bash

echo "=========================================="
echo "🔧 QR Scanner Fix Script"
echo "Премахване на конфликтни camera библиотеки"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean old installations
echo ""
echo "${YELLOW}📦 Стъпка 1: Почистване на стари инсталации...${NC}"
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build
rm -f package-lock.json
rm -f yarn.lock
rm -f ios/Podfile.lock
echo "${GREEN}✅ Почистено${NC}"

# Step 2: Install dependencies
echo ""
echo "${YELLOW}📦 Стъпка 2: Инсталиране на зависимости...${NC}"
npm install
if [ $? -eq 0 ]; then
  echo "${GREEN}✅ npm install завърши успешно${NC}"
else
  echo "${RED}❌ npm install се провали${NC}"
  exit 1
fi

# Step 3: Install iOS Pods
echo ""
echo "${YELLOW}🍎 Стъпка 3: Инсталиране на iOS Pods...${NC}"
cd ios
pod deintegrate
pod install
if [ $? -eq 0 ]; then
  echo "${GREEN}✅ pod install завърши успешно${NC}"
else
  echo "${RED}❌ pod install се провали${NC}"
  cd ..
  exit 1
fi
cd ..

# Step 4: Summary
echo ""
echo "=========================================="
echo "${GREEN}✅ Готово!${NC}"
echo "=========================================="
echo ""
echo "${YELLOW}Следващи стъпки:${NC}"
echo "1. iOS: npx react-native run-ios"
echo "2. Android: npx react-native run-android"
echo ""
echo "${YELLOW}Какво беше оправено:${NC}"
echo "✅ Премахнати конфликтни библиотеки:"
echo "   - react-native-camera (deprecated)"
echo "   - react-native-vision-camera (не се използва)"
echo "   - react-native-qrcode-scanner (зависи от deprecated camera)"
echo ""
echo "✅ Оставена само react-native-camera-kit (модерна и надеждна)"
echo ""
echo "${YELLOW}Ако QR скенерът все още не работи:${NC}"
echo "1. Проверете permissions в AndroidManifest.xml (CAMERA)"
echo "2. Проверете Info.plist (NSCameraUsageDescription)"
echo "3. Рестартирайте приложението напълно"
echo ""
echo "=========================================="

