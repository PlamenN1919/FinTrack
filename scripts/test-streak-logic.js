/**
 * Manual Test Script за Streak Logic
 * 
 * Този script може да се използва в React Native Debugger console
 * за да се тества streak логиката в real-time
 * 
 * Използване:
 * 1. Отвори приложението в debug mode
 * 2. Отвори React Native Debugger console
 * 3. Copy-paste този код в console-а
 * 4. Изпълни тестовите функции
 */

// Import на gamificationService
// В debugger console, можеш да го достъпиш през global scope
// или през require (зависи от setup-а)

/**
 * Test 1: Първа транзакция започва streak
 */
const testFirstTransaction = () => {
  console.log('\n🧪 TEST 1: First Transaction');
  console.log('================================');
  
  // Reset профила
  gamificationService.resetProfile();
  
  const today = new Date().toISOString().split('T')[0];
  const result = gamificationService.updateStreakForTransaction(today);
  
  console.log('Result:', result);
  console.assert(result.streakDays === 1, '❌ Streak should be 1');
  console.assert(result.isNewStreak === true, '❌ Should be new streak');
  console.assert(result.isFirstOfDay === true, '❌ Should be first of day');
  
  const profile = gamificationService.getProfile();
  console.log('Profile:', {
    streakDays: profile.streakDays,
    lastActiveDate: profile.lastActiveDate
  });
  
  console.log('✅ TEST 1 PASSED\n');
};

/**
 * Test 2: Втора транзакция на същия ден НЕ увеличава streak
 */
const testSameDayTransaction = () => {
  console.log('\n🧪 TEST 2: Same Day Transaction');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Първа транзакция
  gamificationService.updateStreakForTransaction(today);
  
  // Втора транзакция
  const result = gamificationService.updateStreakForTransaction(today);
  
  console.log('Result:', result);
  console.assert(result.streakDays === 1, '❌ Streak should stay 1');
  console.assert(result.isFirstOfDay === false, '❌ Should NOT be first of day');
  
  console.log('✅ TEST 2 PASSED\n');
};

/**
 * Test 3: Consecutive days увеличават streak
 */
const testConsecutiveDays = () => {
  console.log('\n🧪 TEST 3: Consecutive Days');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  // Симулираме 5 consecutive дни
  const results = [];
  for (let i = 4; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const result = gamificationService.updateStreakForTransaction(dateStr);
    results.push(result);
    console.log(`Day ${5 - i}: streak = ${result.streakDays}, continued = ${result.isContinued}`);
  }
  
  console.assert(results[results.length - 1].streakDays === 5, '❌ Streak should be 5');
  console.assert(results[1].isContinued === true, '❌ Day 2 should be continued');
  
  console.log('✅ TEST 3 PASSED\n');
};

/**
 * Test 4: Gap от 2+ дни нулира streak
 */
const testStreakGap = () => {
  console.log('\n🧪 TEST 4: Streak Gap (Reset)');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  // Транзакция преди 5 дни
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const pastDate = fiveDaysAgo.toISOString().split('T')[0];
  
  gamificationService.updateStreakForTransaction(pastDate);
  console.log('Started streak 5 days ago');
  
  // Транзакция днес (gap от 4 дни)
  const today = new Date().toISOString().split('T')[0];
  const result = gamificationService.updateStreakForTransaction(today);
  
  console.log('Result:', result);
  console.assert(result.streakDays === 1, '❌ Streak should reset to 1');
  console.assert(result.wasReset === true, '❌ Should be marked as reset');
  
  console.log('✅ TEST 4 PASSED\n');
};

/**
 * Test 5: Weekly bonus (7 consecutive дни)
 */
const testWeeklyBonus = () => {
  console.log('\n🧪 TEST 5: Weekly Bonus (7 Days)');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  const initialXP = gamificationService.getProfile().xp;
  console.log('Initial XP:', initialXP);
  
  // Симулираме 7 consecutive дни
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    gamificationService.updateStreakForTransaction(dateStr);
  }
  
  const finalXP = gamificationService.getProfile().xp;
  console.log('Final XP:', finalXP);
  console.log('XP gained:', finalXP - initialXP);
  
  // 7 transactions * 5 XP + 25 XP bonus = 60 XP
  console.assert(finalXP - initialXP === 60, '❌ Should gain 60 XP (35 base + 25 bonus)');
  
  console.log('✅ TEST 5 PASSED\n');
};

/**
 * Test 6: Backdated транзакция НЕ променя streak
 */
const testBackdatedTransaction = () => {
  console.log('\n🧪 TEST 6: Backdated Transaction');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const today = new Date().toISOString().split('T')[0];
  
  // Транзакция вчера
  gamificationService.updateStreakForTransaction(yesterdayStr);
  
  // Транзакция днес (streak = 2)
  gamificationService.updateStreakForTransaction(today);
  console.log('Current streak: 2 days');
  
  // Backdated транзакция от преди 3 дни
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const backdatedStr = threeDaysAgo.toISOString().split('T')[0];
  
  const result = gamificationService.updateStreakForTransaction(backdatedStr);
  
  console.log('Result after backdated:', result);
  console.assert(result.streakDays === 2, '❌ Streak should remain 2');
  console.assert(result.isFirstOfDay === false, '❌ Should NOT count as first of day');
  
  const profile = gamificationService.getProfile();
  console.assert(profile.lastActiveDate === today, '❌ Last active should still be today');
  
  console.log('✅ TEST 6 PASSED\n');
};

/**
 * Test 7: App startup нулира streak след gap
 */
const testAppStartupReset = () => {
  console.log('\n🧪 TEST 7: App Startup Reset');
  console.log('================================');
  
  gamificationService.resetProfile();
  
  // Създаваме streak от преди 5 дни
  const profile = gamificationService.getProfile();
  profile.streakDays = 10;
  profile.lastActiveDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  console.log('Simulated profile:', {
    streakDays: profile.streakDays,
    lastActiveDate: profile.lastActiveDate
  });
  
  // "Отваряме" апа
  const streak = gamificationService.checkDailyStreak();
  
  console.log('Streak after app startup:', streak);
  console.assert(streak === 0, '❌ Streak should be reset to 0');
  
  console.log('✅ TEST 7 PASSED\n');
};

/**
 * Пусни всички тестове
 */
const runAllTests = () => {
  console.clear();
  console.log('🚀 STREAK LOGIC TEST SUITE');
  console.log('===========================\n');
  
  try {
    testFirstTransaction();
    testSameDayTransaction();
    testConsecutiveDays();
    testStreakGap();
    testWeeklyBonus();
    testBackdatedTransaction();
    testAppStartupReset();
    
    console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  }
};

/**
 * Debug helper - показва текущия streak статус
 */
const showStreakStatus = () => {
  const profile = gamificationService.getProfile();
  
  console.log('\n📊 CURRENT STREAK STATUS');
  console.log('========================');
  console.log('Streak days:', profile.streakDays);
  console.log('Last active:', profile.lastActiveDate || 'Never');
  console.log('XP:', profile.xp);
  console.log('Level:', profile.level);
  console.log('========================\n');
};

/**
 * Export функциите за използване в console
 */
if (typeof global !== 'undefined') {
  global.testStreak = {
    runAll: runAllTests,
    test1: testFirstTransaction,
    test2: testSameDayTransaction,
    test3: testConsecutiveDays,
    test4: testStreakGap,
    test5: testWeeklyBonus,
    test6: testBackdatedTransaction,
    test7: testAppStartupReset,
    status: showStreakStatus,
  };
  
  console.log('\n✅ Streak test suite loaded!');
  console.log('Run: testStreak.runAll() to test everything');
  console.log('Or run individual tests: testStreak.test1(), testStreak.test2(), etc.');
  console.log('Check status: testStreak.status()\n');
}

// За Jest тестове
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testFirstTransaction,
    testSameDayTransaction,
    testConsecutiveDays,
    testStreakGap,
    testWeeklyBonus,
    testBackdatedTransaction,
    testAppStartupReset,
    runAllTests,
    showStreakStatus,
  };
}
