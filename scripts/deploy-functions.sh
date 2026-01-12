#!/bin/bash

# FinTrack - Deploy Firebase Functions
# Deploys all Firebase Functions to production

set -e  # Exit on error

echo "🚀 FinTrack - Deploy Firebase Functions"
echo "========================================"
echo ""

# Check if logged in
echo "🔐 Checking Firebase login..."
if ! firebase projects:list > /dev/null 2>&1; then
  echo "❌ Not logged in to Firebase"
  echo "Run: firebase login --reauth"
  exit 1
fi

echo "✅ Firebase login OK"
echo ""

# Confirm deployment
read -p "Deploy to fintrack-bef0a? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

# Check Functions config
echo "⚙️  Checking Functions configuration..."
firebase functions:config:get --project fintrack-bef0a

echo ""
read -p "Configuration looks good? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please fix configuration first"
  echo "Use: firebase functions:config:set key=value --project fintrack-bef0a"
  exit 1
fi

# Deploy functions
echo ""
echo "📦 Deploying Functions..."
firebase deploy --only functions --project fintrack-bef0a

# Check deployment status
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  
  # Show recent logs
  echo "📊 Recent logs (last 10 lines):"
  firebase functions:log --project fintrack-bef0a --limit 10
  
  echo ""
  echo "🎉 All done!"
  echo "Monitor at: https://console.firebase.google.com/project/fintrack-bef0a/functions"
else
  echo ""
  echo "❌ Deployment failed!"
  echo "Check errors above and try again"
  exit 1
fi
