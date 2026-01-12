#!/bin/bash

# FinTrack - Build Android Release APK
# Creates a production-ready APK

set -e  # Exit on error

echo "🤖 FinTrack - Build Android Release"
echo "===================================="
echo ""

# Check if android folder exists
if [ ! -d "android" ]; then
  echo "❌ android folder not found"
  echo "Run this script from the project root"
  exit 1
fi

# Check version
echo "📱 Current app version:"
grep "versionName" android/app/build.gradle | head -1

echo ""
read -p "Version correct? Continue build? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Build cancelled"
  echo "Update version in android/app/build.gradle first"
  exit 0
fi

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean

# Build release APK
echo ""
echo "🔨 Building Release APK..."
echo "This may take a few minutes..."
./gradlew assembleRelease

cd ..

# Check if build succeeded
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "📦 APK location:"
  echo "   $APK_PATH"
  echo ""
  
  # Show APK size
  APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
  echo "📊 APK size: $APK_SIZE"
  echo ""
  
  echo "🎉 Ready for testing or distribution!"
  echo ""
  echo "Next steps:"
  echo "  1. Test APK on real device"
  echo "  2. Upload to Google Play Console (Internal Testing)"
  echo "  3. Expand to Beta/Production when ready"
else
  echo ""
  echo "❌ Build failed!"
  echo "APK not found at: $APK_PATH"
  exit 1
fi
