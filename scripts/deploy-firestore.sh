#!/bin/bash

# FinTrack - Deploy Firestore Configuration
# Deploys security rules and indexes

set -e  # Exit on error

echo "🗄️  FinTrack - Deploy Firestore Configuration"
echo "=============================================="
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

# Show what will be deployed
echo "📋 Files to deploy:"
echo "  - firestore.rules (Security Rules)"
echo "  - firestore.indexes.json (Composite Indexes)"
echo ""

# Confirm deployment
read -p "Deploy to fintrack-bef0a? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

# Deploy security rules
echo ""
echo "🔒 Deploying Security Rules..."
firebase deploy --only firestore:rules --project fintrack-bef0a

# Deploy indexes
echo ""
echo "🔍 Deploying Composite Indexes..."
firebase deploy --only firestore:indexes --project fintrack-bef0a

# Check deployment status
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  echo "🎉 Firestore configuration deployed!"
  echo "View at: https://console.firebase.google.com/project/fintrack-bef0a/firestore"
else
  echo ""
  echo "❌ Deployment failed!"
  echo "Check errors above and try again"
  exit 1
fi
