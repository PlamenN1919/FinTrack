#!/bin/bash

# FinTrack - Prepare iOS Archive
# Prepares iOS project for Archive build in Xcode

set -e  # Exit on error

echo "🍎 FinTrack - Prepare iOS Archive"
echo "=================================="
echo ""

# Check if ios folder exists
if [ ! -d "ios" ]; then
  echo "❌ ios folder not found"
  echo "Run this script from the project root"
  exit 1
fi

# Check version
echo "📱 Current app version:"
grep "MARKETING_VERSION" ios/FinTrackNew.xcodeproj/project.pbxproj | head -1

echo ""
read -p "Version correct? Continue preparation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Preparation cancelled"
  echo "Update version in Xcode first"
  exit 0
fi

cd ios

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/FinTrackNew-*

# Install/update pods
echo ""
echo "📦 Installing CocoaPods dependencies..."
pod install

cd ..

echo ""
echo "✅ iOS project prepared!"
echo ""
echo "🎯 Next steps:"
echo "  1. Open: ios/FinTrackNew.xcworkspace (use .xcworkspace not .xcodeproj!)"
echo "  2. Select 'Any iOS Device (arm64)' as target"
echo "  3. Product → Archive"
echo "  4. Wait for archive to complete"
echo "  5. Organizer → Distribute App → App Store Connect"
echo ""
echo "💡 Tips:"
echo "  - Make sure Build Configuration is 'Release'"
echo "  - Verify signing is correct (automatic or manual)"
echo "  - Check that version/build number is incremented"
echo ""

# Open Xcode
read -p "Open Xcode now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  open ios/FinTrackNew.xcworkspace
  echo "✅ Xcode opened!"
else
  echo "ℹ️  Open manually: open ios/FinTrackNew.xcworkspace"
fi
