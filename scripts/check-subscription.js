#!/usr/bin/env node

/**
 * Check Subscription Status in Firestore
 * Usage: node scripts/check-subscription.js <email>
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fintrack-bef0a'
});

const db = admin.firestore();
const auth = admin.auth();

async function checkSubscription(email) {
  try {
    console.log('========================================');
    console.log('🔍 Checking subscription for:', email);
    console.log('========================================');
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found!');
    console.log('  - UID:', userRecord.uid);
    console.log('  - Email:', userRecord.email);
    console.log('  - Created:', new Date(userRecord.metadata.creationTime));
    console.log('========================================');
    
    // Get subscription document
    const subscriptionDoc = await db.collection('subscriptions').doc(userRecord.uid).get();
    
    if (!subscriptionDoc.exists) {
      console.log('❌ NO SUBSCRIPTION FOUND in Firestore!');
      console.log('📍 Path:', `subscriptions/${userRecord.uid}`);
      console.log('========================================');
      return;
    }
    
    const subscription = subscriptionDoc.data();
    console.log('✅ SUBSCRIPTION FOUND!');
    console.log('========================================');
    console.log('📋 Subscription Details:');
    console.log('  - Status:', subscription.status);
    console.log('  - Plan:', subscription.plan || subscription.planId || 'null');
    console.log('  - Stripe Sub ID:', subscription.stripeSubscriptionId || 'null');
    console.log('  - Currency:', subscription.currency || 'null');
    console.log('========================================');
    console.log('📅 Period:');
    console.log('  - Start:', subscription.currentPeriodStart?.toDate());
    console.log('  - End:', subscription.currentPeriodEnd?.toDate());
    console.log('  - Now:', new Date());
    console.log('========================================');
    
    // Check if expired
    const now = new Date();
    const endDate = subscription.currentPeriodEnd?.toDate();
    const isExpired = endDate && now > endDate;
    
    console.log('⏰ Expiration Check:');
    console.log('  - Is Expired?:', isExpired);
    if (endDate) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      console.log('  - Days Left:', daysLeft);
    }
    console.log('========================================');
    
    // Determine expected UserState
    let expectedUserState;
    if (!subscription) {
      expectedUserState = 'REGISTERED_NO_SUBSCRIPTION';
    } else if (isExpired) {
      expectedUserState = 'EXPIRED_SUBSCRIBER';
    } else if (subscription.status === 'active') {
      expectedUserState = 'ACTIVE_SUBSCRIBER';
    } else if (subscription.status === 'failed') {
      expectedUserState = 'PAYMENT_FAILED';
    } else {
      expectedUserState = 'REGISTERED_NO_SUBSCRIPTION';
    }
    
    console.log('🎯 Expected UserState:', expectedUserState);
    console.log('========================================');
    
    if (expectedUserState === 'ACTIVE_SUBSCRIBER') {
      console.log('✅ Should show MAIN APP');
    } else {
      console.log('🔐 Should show AUTH FLOW');
      console.log('📍 Reason:', expectedUserState);
    }
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('📍 User not found with email:', email);
    }
  }
  
  process.exit(0);
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-subscription.js <email>');
  process.exit(1);
}

checkSubscription(email);
