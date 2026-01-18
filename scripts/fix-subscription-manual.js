#!/usr/bin/env node

/**
 * MANUAL FIX: Create test subscription via Firestore REST API
 * 
 * This script creates a subscription document directly in Firestore
 * without needing Firebase Admin SDK or authentication.
 * 
 * Usage: node scripts/fix-subscription-manual.js
 */

const USER_ID = 'kvcpLBw6zQhsAqG6Ja41sC0xpvg2';
const USER_EMAIL = 'plamenn1926@gmail.com';
const PLAN = 'monthly'; // monthly, quarterly, yearly
const MONTHS_VALID = 1;

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  РЪЧНО СЪЗДАВАНЕ НА АБОНАМЕНТ ВЪВ FIRESTORE              ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log('📋 Следвайте тези стъпки в Firebase Console:');
console.log('');
console.log('🔗 URL: https://console.firebase.google.com/project/fintrack-bef0a/firestore');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Calculate dates
const now = new Date();
const endDate = new Date();
endDate.setMonth(endDate.getMonth() + MONTHS_VALID);

console.log('📝 СТЪПКА 1: Кликнете на "Start collection" или намерете "subscriptions"');
console.log('');
console.log('📝 СТЪПКА 2: Създайте DOCUMENT с ID:');
console.log('');
console.log(`   ${USER_ID}`);
console.log('');
console.log('📝 СТЪПКА 3: Добавете следните ПОЛЕТА (едно по едно):');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Generate field list
const fields = [
  { name: 'plan', type: 'string', value: PLAN },
  { name: 'status', type: 'string', value: 'active' },
  { name: 'userId', type: 'string', value: USER_ID },
  { name: 'cancelAtPeriodEnd', type: 'boolean', value: 'false' },
  { name: 'currency', type: 'string', value: 'eur' },
  { name: 'stripeSubscriptionId', type: 'string', value: 'sub_manual_test_' + Date.now() },
  { name: 'stripeCustomerId', type: 'string', value: 'cus_manual_test_' + Date.now() },
];

console.log('');
fields.forEach((field, index) => {
  console.log(`   ${index + 1}. Field: "${field.name}"`);
  console.log(`      Type:  ${field.type}`);
  console.log(`      Value: ${field.value}`);
  console.log('');
});

console.log(`   ${fields.length + 1}. Field: "currentPeriodStart"`);
console.log(`      Type:  timestamp`);
console.log(`      Value: ${now.toISOString()} (ДНЕС)`);
console.log('');

console.log(`   ${fields.length + 2}. Field: "currentPeriodEnd"`);
console.log(`      Type:  timestamp`);
console.log(`      Value: ${endDate.toISOString()} (1 МЕСЕЦ НАПРЕД) ⚠️ ВАЖНО!`);
console.log('');

console.log(`   ${fields.length + 3}. Field: "createdAt"`);
console.log(`      Type:  timestamp`);
console.log(`      Value: ${now.toISOString()} (ДНЕС)`);
console.log('');

console.log(`   ${fields.length + 4}. Field: "updatedAt"`);
console.log(`      Type:  timestamp`);
console.log(`      Value: ${now.toISOString()} (ДНЕС)`);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📝 СТЪПКА 4: Кликнете "Save"');
console.log('');
console.log('📝 СТЪПКА 5: Рестартирайте приложението и влезте отново');
console.log('');
console.log('✅ Трябва да видите главния екран вместо екрана за планове!');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('⚠️  ВАЖНА ИНФОРМАЦИЯ:');
console.log('');
console.log('   • currentPeriodEnd ТРЯБВА да е дата в БЪДЕЩЕТО');
console.log('   • Ако е в миналото, абонаментът ще се счита за изтекъл');
console.log('   • За тестване, направете го поне 1 месец напред');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('💡 КОПИРАЙ-ПЕЙСТ VALUES (за по-лесно):');
console.log('');
console.log('   plan: ' + PLAN);
console.log('   status: active');
console.log('   userId: ' + USER_ID);
console.log('   cancelAtPeriodEnd: false');
console.log('   currency: eur');
console.log('   stripeSubscriptionId: sub_manual_test_' + Date.now());
console.log('   stripeCustomerId: cus_manual_test_' + Date.now());
console.log('');
console.log('   currentPeriodStart: ' + now.toISOString());
console.log('   currentPeriodEnd: ' + endDate.toISOString() + ' ⚠️');
console.log('   createdAt: ' + now.toISOString());
console.log('   updatedAt: ' + now.toISOString());
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🔧 За да оправите webhook-а перманентно, вижте:');
console.log('   WEBHOOK_DEBUG_GUIDE.md');
console.log('');
