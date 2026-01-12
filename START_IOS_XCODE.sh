#!/bin/bash

echo "🚀 Стартиране на iOS приложението през Xcode..."
echo ""

# Отвори проекта в Xcode
echo "📱 Отваряне на Xcode..."
cd /Users/nikolovp/Documents/FinTrack1
open ios/FinTrackNew.xcworkspace

echo ""
echo "✅ Xcode се отваря!"
echo ""
echo "📋 Следващи стъпки в Xcode:"
echo ""
echo "1️⃣  Избери устройство от горното меню:"
echo "    - За физическо устройство: 'Plamen Nikolov's iPhone'"
echo "    - За симулатор: 'iPhone 16 Pro' (или друг)"
echo ""
echo "2️⃣  Натисни ▶️ бутона (или Cmd+R)"
echo ""
echo "3️⃣  Изчакай build-а да завърши (може да отнеме 2-5 минути)"
echo ""
echo "⚠️  Ако има грешка 'Signing for FinTrackNew requires a development team':"
echo "    - Отвори проекта 'FinTrackNew' в лявата панел"
echo "    - Избери 'Signing & Capabilities'"
echo "    - Избери твоя Apple Developer Team"
echo ""
