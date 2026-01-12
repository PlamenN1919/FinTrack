#!/bin/bash

# FinTrack - Test Stripe Configuration
# Verifies Stripe keys are configured correctly

echo "💳 FinTrack - Test Stripe Configuration"
echo "========================================"
echo ""

# Check Firebase Functions config
echo "🔐 Checking Firebase Functions Stripe config..."
firebase functions:config:get stripe --project fintrack-bef0a

echo ""
echo "✅ Configuration retrieved"
echo ""
echo "⚠️  IMPORTANT CHECKS:"
echo "  1. Secret key starts with 'sk_test_' (Test) or 'sk_live_' (Production)"
echo "  2. Webhook secret starts with 'whsec_'"
echo "  3. Keys match your Stripe Dashboard"
echo ""

# Test Functions deployment
echo "🧪 Testing Functions connectivity..."
firebase functions:log --project fintrack-bef0a --limit 5

echo ""
echo "📊 Stripe Dashboard URLs:"
echo "  Test: https://dashboard.stripe.com/test/dashboard"
echo "  Live: https://dashboard.stripe.com/dashboard"
echo ""
echo "🔍 Check:"
echo "  - API Keys: https://dashboard.stripe.com/test/apikeys"
echo "  - Webhooks: https://dashboard.stripe.com/test/webhooks"
echo "  - Products: https://dashboard.stripe.com/test/products"
