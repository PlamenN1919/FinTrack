#!/usr/bin/env node

/**
 * Script to check user subscription status in Firestore
 * Usage: node scripts/check-user-subscription.js <email>
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (requires service account)
// You can download service account from Firebase Console -> Project Settings -> Service accounts

// Check if running from command line with email argument
const email = process.argv[2];

if (!email) {
  console.log('=====================================');
  console.log('📋 ПРОВЕРКА НА АБОНАМЕНТ');
  console.log('=====================================');
  console.log('');
  console.log('За да проверите абонамент, трябва да:');
  console.log('');
  console.log('1. Отворете Firebase Console:');
  console.log('   https://console.firebase.google.com/project/fintrack-bef0a/firestore');
  console.log('');
  console.log('2. Намерете колекцията "subscriptions"');
  console.log('');
  console.log('3. Потърсете документ с ID = вашето user UID');
  console.log('   (User UID може да намерите в Authentication -> Users)');
  console.log('');
  console.log('4. Проверете следните полета:');
  console.log('   - status: трябва да е "active"');
  console.log('   - currentPeriodEnd: трябва да е дата в БЪДЕЩЕТО');
  console.log('   - plan: трябва да е "monthly", "quarterly" или "yearly"');
  console.log('');
  console.log('=====================================');
  console.log('');
  console.log('❓ АКО НЯМА ДОКУМЕНТ за вашия потребител:');
  console.log('   Това означава, че webhook-ът от Stripe не е записал абонамента.');
  console.log('   Трябва да направите ново плащане.');
  console.log('');
  console.log('❓ АКО currentPeriodEnd е в МИНАЛОТО:');
  console.log('   Абонаментът ви е изтекъл. Трябва да го подновите.');
  console.log('');
  console.log('❓ АКО status не е "active":');
  console.log('   Може да е "cancelled", "expired" или друг статус.');
  console.log('   Трябва да направите ново плащане.');
  console.log('');
  process.exit(0);
}

console.log('Looking for subscription for email:', email);
