#!/usr/bin/env node

/**
 * Script to create a test subscription in Firestore
 * Run: node scripts/create-test-subscription.js
 * 
 * This creates an active subscription for the specified user
 */

const admin = require('firebase-admin');
const path = require('path');

// User details from logs
const USER_ID = 'kvcpLBw6zQhsAqG6Ja41sC0xpvg2';
const USER_EMAIL = 'plamenn1926@gmail.com';

// Subscription details
const PLAN = 'monthly'; // monthly, quarterly, or yearly
const MONTHS_VALID = 1; // How many months the subscription should be valid

async function createTestSubscription() {
  try {
    // Initialize Firebase Admin
    // Try to find service account or use default credentials
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'fintrack-bef0a'
      });
      console.log('✅ Initialized with service account');
    } catch (e) {
      // Try default credentials (for CI/CD or local emulator)
      admin.initializeApp({
        projectId: 'fintrack-bef0a'
      });
      console.log('✅ Initialized with default credentials');
    }

    const db = admin.firestore();
    
    // Calculate dates
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + MONTHS_VALID);

    // Create subscription document
    const subscriptionData = {
      id: `sub_test_${Date.now()}`,
      userId: USER_ID,
      plan: PLAN,
      status: 'active',
      stripeSubscriptionId: `sub_test_${Date.now()}`,
      stripeCustomerId: `cus_test_${Date.now()}`,
      currentPeriodStart: admin.firestore.Timestamp.fromDate(now),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
      cancelAtPeriodEnd: false,
      currency: 'eur',
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };

    console.log('');
    console.log('📋 Creating subscription with:');
    console.log(`   User ID: ${USER_ID}`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Plan: ${PLAN}`);
    console.log(`   Status: active`);
    console.log(`   Valid until: ${endDate.toISOString()}`);
    console.log('');

    // Write to Firestore
    await db.collection('subscriptions').doc(USER_ID).set(subscriptionData);

    console.log('✅ Subscription created successfully!');
    console.log('');
    console.log('📱 Now restart the app and login again.');
    console.log('   The user should now see the Main App instead of subscription plans.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating subscription:', error.message);
    console.log('');
    console.log('💡 Alternative: Create subscription manually in Firebase Console:');
    console.log('');
    console.log('1. Go to: https://console.firebase.google.com/project/fintrack-bef0a/firestore');
    console.log('2. Click "subscriptions" collection (create if needed)');
    console.log('3. Add document with ID: ' + USER_ID);
    console.log('4. Add these fields:');
    console.log('   - plan (string): "monthly"');
    console.log('   - status (string): "active"');
    console.log('   - userId (string): "' + USER_ID + '"');
    console.log('   - currentPeriodStart (timestamp): now');
    console.log('   - currentPeriodEnd (timestamp): 1 month from now');
    console.log('   - createdAt (timestamp): now');
    console.log('   - updatedAt (timestamp): now');
    console.log('   - cancelAtPeriodEnd (boolean): false');
    console.log('   - currency (string): "eur"');
    console.log('');
    process.exit(1);
  }
}

createTestSubscription();
