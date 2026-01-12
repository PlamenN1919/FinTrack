"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const logger = require("firebase-functions/logger");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const Stripe = require("stripe");

// Initialize services
admin.initializeApp();
const stripe = new Stripe(functions.config().stripe.secret);

// Helper function to get or create a Stripe customer
const getOrCreateCustomer = async (userId, email) => {
  const userSnapshot = await admin.firestore().collection("users").doc(userId).get();
  const userData = userSnapshot.data();

  if (userData && userData.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: { firebaseUID: userId },
  });

  await admin.firestore().collection("users").doc(userId).set({
    stripeCustomerId: customer.id,
  }, { merge: true });

  return customer.id;
};

// =====================================
// REFERRAL SYSTEM FUNCTIONS
// =====================================

/**
 * Generate a unique referral link for a user
 */
exports.generateReferralLink = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Трябва да бъдете автентикирани.');
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    if (!userEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Нямате валиден email адрес.');
    }

    // Generate unique referral ID
    const referralId = `ref_${userId}_${Date.now()}`;
    
    // Create referral document
    const referralData = {
      referrerId: userId,
      referrerEmail: userEmail,
      createdAt: admin.firestore.Timestamp.now(),
      status: 'pending',
      rewardGranted: false,
    };

    await admin.firestore().collection('referrals').doc(referralId).set(referralData);

    // Generate the referral link
    const referralLink = `https://fintrack.app/invite?ref=${userId}`;

    logger.info(`Generated referral link for user ${userId}: ${referralLink}`);

    return {
      success: true,
      referralLink,
      referralId,
    };

  } catch (error) {
    logger.error('Error generating referral link:', error);
    
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to generate referral link: ${error.message}`);
  }
});

/**
 * Process referral when a new user subscribes
 */
exports.processReferralReward = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Трябва да бъдете автентикирани.');
    }

    const { referrerId, ipAddress, deviceId } = data;
    const newUserId = context.auth.uid;
    const newUserEmail = context.auth.token.email;

    if (!referrerId || !newUserEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Липсват задължителни данни.');
    }

    // Anti-fraud checks
    const antifraudCheck = {
      ipAddress: ipAddress || '',
      deviceId: deviceId || '',
      email: newUserEmail,
      installTime: admin.firestore.Timestamp.now(),
      passed: true,
      reasons: [],
    };

    // Check for duplicate IP/Device combinations
    const duplicateCheck = await admin.firestore()
      .collection('referrals')
      .where('refereeIpAddress', '==', ipAddress)
      .where('refereeDeviceId', '==', deviceId)
      .get();

    if (!duplicateCheck.empty) {
      antifraudCheck.passed = false;
      antifraudCheck.reasons.push('Duplicate IP/Device combination');
    }

    // Check email domain (basic temp email detection)
    const tempEmailDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const emailDomain = newUserEmail.split('@')[1];
    if (tempEmailDomains.includes(emailDomain)) {
      antifraudCheck.passed = false;
      antifraudCheck.reasons.push('Temporary email domain detected');
    }

    // Check if referrer is trying to refer themselves
    if (referrerId === newUserId) {
      antifraudCheck.passed = false;
      antifraudCheck.reasons.push('Self-referral detected');
    }

    // Store anti-fraud check result
    await admin.firestore().collection('antifraud_checks').add(antifraudCheck);

    if (!antifraudCheck.passed) {
      logger.warn(`Anti-fraud check failed for referral. Reasons: ${antifraudCheck.reasons.join(', ')}`);
      return {
        success: false,
        message: 'Реферралът не премина проверките за сигурност.',
        reasons: antifraudCheck.reasons,
      };
    }

    // Find active referral for this referrer
    const referralQuery = await admin.firestore()
      .collection('referrals')
      .where('referrerId', '==', referrerId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (referralQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Не е намерен активен реферрал.');
    }

    const referralDoc = referralQuery.docs[0];
    const referralData = referralDoc.data();

    // Check 7-day limit
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (referralData.createdAt.toDate() < sevenDaysAgo) {
      await referralDoc.ref.update({ status: 'expired' });
      throw new functions.https.HttpsError('deadline-exceeded', 'Реферралът е изтекъл (7 дни лимит).');
    }

    // Update referral with referee info
    await referralDoc.ref.update({
      refereeId: newUserId,
      refereeEmail: newUserEmail,
      status: 'completed',
      completedAt: admin.firestore.Timestamp.now(),
      refereeIpAddress: ipAddress,
      refereeDeviceId: deviceId,
    });

    // Get referrer's current subscription
    const referrerDoc = await admin.firestore().collection('users').doc(referrerId).get();
    const referrerData = referrerDoc.data();

    if (!referrerData || !referrerData.subscription) {
      logger.warn(`Referrer ${referrerId} has no active subscription`);
      return {
        success: true,
        message: 'Реферралът е записан, но наградата ще бъде дадена когато реферрърът има активен абонамент.',
      };
    }

    // Extend referrer's subscription by 1 month
    const currentEndDate = new Date(referrerData.subscription.endDate.toDate());
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    await admin.firestore().collection('users').doc(referrerId).update({
      'subscription.endDate': admin.firestore.Timestamp.fromDate(newEndDate)
    });

    // Mark reward as granted
    await referralDoc.ref.update({
      rewardGranted: true,
      rewardGrantedAt: admin.firestore.Timestamp.now(),
    });

    // Send push notification to referrer
    if (referrerData.fcmToken) {
      await admin.messaging().send({
        token: referrerData.fcmToken,
        notification: {
          title: '🎉 Успешен реферрал!',
          body: 'Вашият приятел се абонира! Получавате 1 месец безплатно 🎁',
        },
        data: {
          type: 'referral_reward',
          referralId: referralDoc.id,
        },
      });
    }

    logger.info(`Processed referral reward for ${referrerId}, extended subscription until ${newEndDate}`);

    return {
      success: true,
      message: 'Наградата е успешно предоставена!',
      newEndDate: newEndDate.toISOString(),
    };

  } catch (error) {
    logger.error('Error processing referral reward:', error);
    
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to process referral reward: ${error.message}`);
  }
});

/**
 * Get referral statistics for dashboard
 */
exports.getReferralStats = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Трябва да бъдете автентикирани.');
    }

    const userId = context.auth.uid;

    // Get all referrals for this user
    const referralsQuery = await admin.firestore()
      .collection('referrals')
      .where('referrerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const referrals = referralsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate statistics
    const totalInvites = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const totalRewardsEarned = referrals.filter(r => r.rewardGranted).length;

    // Build referral history
    const referralHistory = referrals.map(r => ({
      id: r.id,
      refereeEmail: r.refereeEmail || 'Чака се регистрация',
      status: r.status,
      invitedAt: r.createdAt,
      completedAt: r.completedAt,
      rewardGranted: r.rewardGranted,
    }));

    const stats = {
      totalInvites,
      completedReferrals,
      pendingReferrals,
      totalRewardsEarned,
      referralHistory,
    };

    return {
      success: true,
      stats,
    };

  } catch (error) {
    logger.error('Error getting referral stats:', error);
    
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to get referral stats: ${error.message}`);
  }
});

/**
 * Send periodic push notifications for referral reminders
 */
exports.sendReferralReminders = functions.pubsub.schedule('0 12 * * 1').onRun(async (context) => {
  try {
    // Get users with active subscriptions but no recent referrals
    const usersQuery = await admin.firestore()
      .collection('users')
      .where('subscription.status', '==', 'ACTIVE')
      .get();

    for (const userDoc of usersQuery.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      if (!userData.fcmToken) continue;

      // Check if user has made any referrals in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentReferrals = await admin.firestore()
        .collection('referrals')
        .where('referrerId', '==', userId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();

      // Only send reminder if no recent referrals
      if (recentReferrals.empty) {
        await admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: '💸 Покани приятел',
            body: 'Спечели 1 месец безплатно! Покани приятел да използва FinTrack.',
          },
          data: {
            type: 'referral_reminder',
            action: 'open_referral_screen',
          },
        });

        logger.info(`Sent referral reminder to user ${userId}`);
      }
    }

    return { success: true, message: 'Referral reminders sent successfully' };

  } catch (error) {
    logger.error('Error sending referral reminders:', error);
    return { success: false, error: error.message };
  }
});

// =====================================
// EXISTING CORE FUNCTIONS (BASIC)
// =====================================

/**
 * Create Stripe Subscription (simplified version)
 */
exports.createStripeSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Трябва да бъдете автентикирани.');
    }

    const { planId } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    if (!planId || !['monthly', 'quarterly', 'yearly'].includes(planId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Невалиден план.');
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateCustomer(userId, userEmail);

    // Price mapping (use your actual Stripe price IDs)
    const priceIds = {
      monthly: 'price_1RY1fU4dsTm22ri7UDyH5v94',
      quarterly: 'price_1RY1iM4dsTm22ri71Ov28LF4',
      yearly: 'price_1RY1io4dsTm22ri7uNflBZqk'
    };

    const priceId = priceIds[planId];
    if (!priceId) {
      throw new functions.https.HttpsError('invalid-argument', 'Невалиден план ID.');
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
    });

    // Get payment intent
    const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice, {
      expand: ['payment_intent'],
    });

    let paymentIntent = latestInvoice.payment_intent;
    if (typeof paymentIntent === 'string') {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
    }

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
      planId: planId,
    };

  } catch (error) {
    logger.error('Error creating subscription:', error);
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', `Failed to create subscription: ${error.message}`);
  }
});

/**
 * Manual check expired subscriptions
 */
exports.manualCheckExpiredSubscriptions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Трябва да бъдете автентикирани.');
  }

  logger.info('Manual expired subscriptions check triggered by user:', context.auth.uid);
  
  const now = admin.firestore.Timestamp.now();
  let updatedCount = 0;

  try {
    const expiredSubscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '<=', now)
      .get();

    const batch = admin.firestore().batch();
    expiredSubscriptions.forEach((doc) => {
      const subscriptionRef = admin.firestore().collection('subscriptions').doc(doc.id);
      batch.update(subscriptionRef, {
        status: 'expired',
        updatedAt: now
      });
      updatedCount++;
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} expired subscriptions`,
      updatedCount: updatedCount
    };

  } catch (error) {
    logger.error('Error in manual check expired subscriptions:', error);
    throw new functions.https.HttpsError('internal', `Error checking subscriptions: ${error.message}`);
  }
}); 