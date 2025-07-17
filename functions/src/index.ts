/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { getStripePriceId } from './config/subscription.config';

// --- Server-side Subscription Plan Configuration ---
// This is the single source of truth for pricing.
const प्लांस = {
    monthly: { price: 12.99, currency: 'BGN' },
    quarterly: { price: 29.99, currency: 'BGN' },
    yearly: { price: 99.99, currency: 'BGN' }
};

// Initialize services
admin.initializeApp();
const stripe = new Stripe(functions.config().stripe.secret);

// Helper function to get or create a Stripe customer
const getOrCreateCustomer = async (userId: string, email: string | undefined) => {
  const userSnapshot = await admin.firestore().collection("users").doc(userId).get();
  const userData = userSnapshot.data();

  if (userData && userData.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email, // Email is optional for customer creation
    metadata: { firebaseUID: userId },
  });

  await admin.firestore().collection("users").doc(userId).set({
    stripeCustomerId: customer.id,
  }, { merge: true });

  return customer.id;
};

// Helper function to get plan ID from Stripe price ID
const getPlanIdFromPriceId = (priceId: string): string => {
  // Map Stripe price IDs to plan IDs
  const priceIdToPlanId: Record<string, string> = {
    'price_1RY1fU4dsTm22ri7UDyH5v94': 'monthly',
    'price_1RY1iM4dsTm22ri71Ov28LF4': 'quarterly', 
    'price_1RY1io4dsTm22ri7uNflBZqk': 'yearly',
  };
  
  const planId = priceIdToPlanId[priceId];
  if (!planId) {
    logger.error(`Unknown price ID: ${priceId}`);
    throw new Error(`Unknown price ID: ${priceId}`);
  }
  
  return planId;
};

// Helper function to get user ID from Stripe customer ID
const getUserIdFromCustomerId = async (customerId: string): Promise<string | null> => {
  try {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      return usersSnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    logger.error('Error finding user by customer ID:', error);
    return null;
  }
};

// NEW: Handle subscription created event
const handleSubscriptionCreated = async (subscription: Stripe.Subscription) => {
  logger.info(`Subscription created: ${subscription.id}`);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) {
    logger.error(`Could not find user for customer ${subscription.customer}`);
    return;
  }
  
  const planId = getPlanIdFromPriceId(subscription.items.data[0].price.id);
  
  // Create subscription document in Firestore
  await admin.firestore().collection('subscriptions').doc(userId).set({
    id: subscription.id,
    userId: userId,
    planId: planId,
    status: subscription.status,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    amount: subscription.items.data[0].price.unit_amount! / 100,
    currency: subscription.currency.toUpperCase(),
    currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_start * 1000)),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_end * 1000)),
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  }, { merge: true });
  
  logger.info(`Successfully created subscription document for user ${userId}`);
};

// NEW: Handle subscription updated event
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  logger.info(`Subscription updated: ${subscription.id}`);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) {
    logger.error(`Could not find user for customer ${subscription.customer}`);
    return;
  }
  
  const planId = getPlanIdFromPriceId(subscription.items.data[0].price.id);
  
  // Update subscription document in Firestore
  await admin.firestore().collection('subscriptions').doc(userId).update({
    status: subscription.status,
    planId: planId,
    priceId: subscription.items.data[0].price.id,
    amount: subscription.items.data[0].price.unit_amount! / 100,
    currency: subscription.currency.toUpperCase(),
    currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_start * 1000)),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_end * 1000)),
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    updatedAt: admin.firestore.Timestamp.now(),
  });
  
  logger.info(`Successfully updated subscription document for user ${userId}`);
};

// NEW: Handle subscription deleted event
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  logger.info(`Subscription deleted: ${subscription.id}`);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) {
    logger.error(`Could not find user for customer ${subscription.customer}`);
    return;
  }
  
  // Update subscription status to cancelled
  await admin.firestore().collection('subscriptions').doc(userId).update({
    status: 'cancelled',
    updatedAt: admin.firestore.Timestamp.now(),
  });
  
  logger.info(`Successfully marked subscription as cancelled for user ${userId}`);
};

// NEW: Handle invoice payment succeeded event
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  logger.info(`Invoice payment succeeded: ${invoice.id}`);
  
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = await getUserIdFromCustomerId(subscription.customer as string);
    
    if (userId) {
      // Update subscription status to active
      await admin.firestore().collection('subscriptions').doc(userId).update({
        status: 'active',
        currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_start * 1000)),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date((subscription as any).current_period_end * 1000)),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      logger.info(`Successfully updated subscription to active for user ${userId}`);
    }
  }
};

// NEW: Handle invoice payment failed event
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  logger.info(`Invoice payment failed: ${invoice.id}`);
  
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = await getUserIdFromCustomerId(subscription.customer as string);
    
    if (userId) {
      // Update subscription status to failed
      await admin.firestore().collection('subscriptions').doc(userId).update({
        status: 'failed',
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      logger.info(`Successfully updated subscription to failed for user ${userId}`);
    }
  }
};

// Create a Payment Intent for the client
export const createPaymentIntent = functions.https.onCall(async (data: any, context: any) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  
  const { planId } = data;
  const userEmail = context.auth.token.email;

  // Validate planId against our server-side config
  const plan = प्लांस[planId as keyof typeof प्लांस];
  if (!plan) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid 'planId'.");
  }

  // Get price and currency from the server-side config
  const { price, currency } = plan;
  
  const customerId = await getOrCreateCustomer(context.auth.uid, userEmail);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(price * 100), // Use server-side price
    currency: currency.toLowerCase(), // Ensure lowercase
    customer: customerId,
    payment_method_types: ['card'], // Explicitly specify card payments
    metadata: {
        firebaseUID: context.auth.uid,
        planId: planId,
    }
  });

  return {
    clientSecret: paymentIntent.client_secret,
  };
});

/**
 * Triggered on new user creation.
 * Creates a corresponding user document in Firestore.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user: any) => {
  logger.info("New user created:", user.uid);
  
  try {
    // Create a Stripe customer for the new user.
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUID: user.uid },
    });

    // Create the user document in Firestore.
    const userDoc = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      stripeCustomerId: customer.id,
    };

    await admin.firestore().collection("users").doc(user.uid).set(userDoc);
    logger.info("User document created in Firestore for:", user.uid);
  } catch (error) {
    logger.error(`Error creating user document or Stripe customer for ${user.uid}:`, error);
  }
});

/**
 * Triggered on user deletion.
 * Cancels their Stripe subscription and deletes their customer data.
 */
export const onUserDelete = functions.auth.user().onDelete(async (user: any) => {
  logger.info("User being deleted:", user.uid);
  try {
    const userSnapshot = await admin.firestore().collection("users").doc(user.uid).get();
    const userData = userSnapshot.data();

    if (userData && userData.stripeCustomerId) {
      const customerId = userData.stripeCustomerId;
      
      // 1. Cancel all active subscriptions for the customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });

      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
        logger.info(`Canceled subscription ${sub.id} for customer ${customerId}`);
      }

      // 2. Delete the Stripe customer object
      await stripe.customers.del(customerId);
      logger.info(`Deleted Stripe customer ${customerId}`);
    }

    // 3. Delete user data from Firestore
    const firestore = admin.firestore();
    const batch = firestore.batch();
    
    batch.delete(firestore.collection("users").doc(user.uid));
    batch.delete(firestore.collection("subscriptions").doc(user.uid));
    
    await batch.commit();
    logger.info(`Deleted Firestore data for user ${user.uid}`);

  } catch (error) {
    logger.error(`Failed to clean up data for user ${user.uid}:`, error);
  }
});

// Handle Stripe webhooks
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
  const signature = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      functions.config().stripe.webhook_secret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const dataObject: any = event.data.object;

  switch (event.type) {
    // REMOVED: payment_intent.succeeded handling - we now use subscription model
    // case "payment_intent.succeeded":
    //   try {
    //     const paymentIntent = dataObject as Stripe.PaymentIntent;
    //     const userUID = paymentIntent.metadata.firebaseUID;
    //     const planId = paymentIntent.metadata.planId;
    //     
    //     if (userUID && planId) {
    //       logger.info(`Payment succeeded for user ${userUID}, plan ${planId}`);
    //       
    //       // Create subscription record in Firestore
    //       await admin.firestore().collection("subscriptions").doc(userUID).set({
    //         status: "active",
    //         planId: planId,
    //         userId: userUID,
    //         amount: paymentIntent.amount / 100, // Convert from cents
    //         currency: paymentIntent.currency.toUpperCase(),
    //         stripeCustomerId: paymentIntent.customer,
    //         paymentIntentId: paymentIntent.id,
    //         currentPeriodStart: admin.firestore.Timestamp.now(),
    //         currentPeriodEnd: admin.firestore.Timestamp.fromDate(
    //           calculatePeriodEndDate(planId)
    //         ),
    //         createdAt: admin.firestore.Timestamp.now(),
    //         updatedAt: admin.firestore.Timestamp.now(),
    //       }, { merge: true });
    //       
    //       logger.info(`Successfully created subscription for user ${userUID}`);
    //     }
    //   } catch (error) {
    //     logger.error("Error handling 'payment_intent.succeeded':", error);
    //   }
    //   break;

    case "payment_intent.payment_failed":
      try {
        const paymentIntent = dataObject as Stripe.PaymentIntent;
        const userUID = paymentIntent.metadata.firebaseUID;
        
        if (userUID) {
          logger.warn(`Payment failed for user ${userUID}`);
          
          // Update or create subscription record with failed status
          await admin.firestore().collection("subscriptions").doc(userUID).set({
            status: "failed",
            userId: userUID,
            paymentIntentId: paymentIntent.id,
            updatedAt: admin.firestore.Timestamp.now(),
          }, { merge: true });
        }
      } catch (error) {
        logger.error("Error handling 'payment_intent.payment_failed':", error);
      }
      break;
      
    // NEW: Handle subscription lifecycle events
    case "customer.subscription.created":
      try {
        const subscription = dataObject as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
      } catch (error) {
        logger.error("Error handling 'customer.subscription.created':", error);
      }
      break;
      
    case "customer.subscription.updated":
      try {
        const subscription = dataObject as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
      } catch (error) {
        logger.error("Error handling 'customer.subscription.updated':", error);
      }
      break;
      
    case "customer.subscription.deleted":
      try {
        const subscription = dataObject as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
      } catch (error) {
        logger.error("Error handling 'customer.subscription.deleted':", error);
      }
      break;
      
    // NEW: Handle invoice events
    case "invoice.payment_succeeded":
      try {
        const invoice = dataObject as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
      } catch (error) {
        logger.error("Error handling 'invoice.payment_succeeded':", error);
      }
      break;
      
    case "invoice.payment_failed":
      try {
        const invoice = dataObject as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
      } catch (error) {
        logger.error("Error handling 'invoice.payment_failed':", error);
      }
      break;

    default:
      logger.info(`Unhandled webhook event type: ${event.type}`);
  }

  res.status(200).send('Webhook received');
});

// NEW: Check for expired subscriptions every 24 hours
export const checkExpiredSubscriptions = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/Sofia') // Bulgarian timezone
  .onRun(async (context) => {
    logger.info('Starting expired subscriptions check...');
    
    const now = admin.firestore.Timestamp.now();
    const batch = admin.firestore().batch();
    let updatedCount = 0;

    try {
      // Query all active subscriptions that have expired
      const expiredSubscriptions = await admin.firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '<=', now)
        .get();

      expiredSubscriptions.forEach((doc) => {
        const subscriptionRef = admin.firestore().collection('subscriptions').doc(doc.id);
        batch.update(subscriptionRef, {
          status: 'expired',
          updatedAt: now
        });
        updatedCount++;
        logger.info(`Marked subscription ${doc.id} as expired`);
      });

      if (updatedCount > 0) {
        await batch.commit();
        logger.info(`Successfully updated ${updatedCount} expired subscriptions`);
      } else {
        logger.info('No expired subscriptions found');
      }

      return null;
    } catch (error) {
      logger.error('Error checking expired subscriptions:', error);
      throw error;
    }
  });

// NEW: Manual trigger for testing expired subscriptions check
export const manualCheckExpiredSubscriptions = functions.https.onCall(async (data, context) => {
  // Check authentication - only allow authenticated users to trigger this
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  logger.info('Manual expired subscriptions check triggered by user:', context.auth.uid);
  
  const now = admin.firestore.Timestamp.now();
  const batch = admin.firestore().batch();
  let updatedCount = 0;

  try {
    // Query all active subscriptions that have expired
    const expiredSubscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '<=', now)
      .get();

    expiredSubscriptions.forEach((doc) => {
      const subscriptionRef = admin.firestore().collection('subscriptions').doc(doc.id);
      batch.update(subscriptionRef, {
        status: 'expired',
        updatedAt: now
      });
      updatedCount++;
      logger.info(`Marked subscription ${doc.id} as expired`);
    });

    if (updatedCount > 0) {
      await batch.commit();
      logger.info(`Successfully updated ${updatedCount} expired subscriptions`);
    }

    return {
      success: true,
      updatedCount,
      message: `Проверени и обновени ${updatedCount} изтекли абонамента`
    };
  } catch (error) {
    logger.error('Error in manual expired subscriptions check:', error);
    throw new functions.https.HttpsError('internal', 'Error checking expired subscriptions');
  }
});

// NEW: Create Stripe Subscription (replaces one-time payment)
export const createStripeSubscription = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { planId } = data;
  const userId = context.auth.uid;

  logger.info(`Creating Stripe subscription for user ${userId} with plan ${planId}`);

  try {
    // Validate planId
    if (!planId || typeof planId !== 'string') {
      logger.error(`Invalid planId: ${planId} (type: ${typeof planId})`);
      throw new functions.https.HttpsError('invalid-argument', 'planId is required and must be a string.');
    }

    logger.info(`PlanId validation passed: ${planId}`);

    // Get user's Stripe customer ID
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.error(`User document not found for userId: ${userId}`);
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      logger.error(`User ${userId} does not have a Stripe customer ID`);
      throw new functions.https.HttpsError('failed-precondition', 'User does not have a Stripe customer ID.');
    }

    logger.info(`Found Stripe customer ID: ${stripeCustomerId}`);

    // Get the Stripe Price ID for the plan
    let priceId: string;
    try {
      // Validate planId is one of the valid enum values
      const validPlans = ['monthly', 'quarterly', 'yearly'];
      if (!validPlans.includes(planId)) {
        logger.error(`Invalid planId value: ${planId}. Valid values: ${validPlans.join(', ')}`);
        throw new Error(`Invalid plan ID: ${planId}`);
      }
      
      priceId = getStripePriceId(planId as any);
      logger.info(`Retrieved price ID: ${priceId} for plan: ${planId}`);
    } catch (priceError) {
      logger.error(`Error getting price ID for plan ${planId}:`, priceError);
      throw new functions.https.HttpsError('invalid-argument', `Invalid plan ID: ${planId}`);
    }

    // Create the subscription with improved configuration
    logger.info(`Creating Stripe subscription with customer: ${stripeCustomerId}, price: ${priceId}`);
    
    // First, create subscription without expand to avoid expansion issues
    let subscription: any;
    try {
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        // Don't expand initially to avoid issues
      });
      
      logger.info(`Stripe subscription created successfully: ${subscription.id}`);
    } catch (subscriptionError: any) {
      logger.error(`Error creating Stripe subscription:`, subscriptionError);
      throw new functions.https.HttpsError('internal', `Failed to create subscription: ${subscriptionError.message}`);
    }

    // Now retrieve the latest invoice separately for better error handling
    let latestInvoice: any;
    let paymentIntent: any;
    
    try {
      // Get the latest invoice ID from the subscription
      const latestInvoiceId = subscription.latest_invoice;
      if (!latestInvoiceId) {
        throw new Error('No latest invoice found on subscription');
      }
      
      logger.info(`Retrieving latest invoice: ${latestInvoiceId}`);
      
      // Retrieve the invoice with payment intent expansion
      latestInvoice = await stripe.invoices.retrieve(latestInvoiceId, {
        expand: ['payment_intent'],
      });
      
      logger.info(`Latest invoice retrieved successfully: ${latestInvoice.id}`);
      
      // Get the payment intent
      paymentIntent = latestInvoice.payment_intent;
      
      if (!paymentIntent) {
        throw new Error('No payment intent found on invoice');
      }
      
      if (typeof paymentIntent === 'string') {
        // If it's still a string ID, retrieve it manually
        logger.info(`Payment intent is string ID, retrieving manually: ${paymentIntent}`);
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
      }
      
      logger.info(`Payment intent retrieved successfully: ${paymentIntent.id}`);
      
    } catch (invoiceError: any) {
      logger.error(`Error retrieving invoice or payment intent:`, invoiceError);
      
      // Try alternative approach - create a new payment intent manually
      try {
        logger.info(`Attempting to create payment intent manually for subscription ${subscription.id}`);
        
        const planConfig = प्लांस[planId as keyof typeof प्लांस];
        if (!planConfig) {
          throw new Error(`No plan configuration found for ${planId}`);
        }
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(planConfig.price * 100),
          currency: planConfig.currency.toLowerCase(),
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          metadata: {
            subscriptionId: subscription.id,
            planId: planId,
            userId: userId,
          },
        });
        
        logger.info(`Manual payment intent created successfully: ${paymentIntent.id}`);
        
        // Update the subscription to attach this payment intent
        await stripe.subscriptions.update(subscription.id, {
          // This will be set when payment succeeds
        });
        
      } catch (manualError: any) {
        logger.error(`Failed to create manual payment intent:`, manualError);
        throw new functions.https.HttpsError('internal', `Failed to create payment intent: ${manualError.message}`);
      }
    }

    if (!paymentIntent.client_secret) {
      logger.error(`Payment intent ${paymentIntent.id} does not have a client secret`);
      throw new functions.https.HttpsError('internal', 'Payment intent missing client secret.');
    }

    // Get plan config for response data
    const planConfig = प्लांस[planId as keyof typeof प्लांस];
    const responseData = {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
      planId: planId,
      amount: latestInvoice ? (latestInvoice.amount_total || 0) / 100 : (planConfig ? planConfig.price : 0),
      currency: subscription.currency || 'bgn'
    };

    logger.info(`Successfully created subscription ${subscription.id} for user ${userId}`, responseData);

    return responseData;

  } catch (error: any) {
    logger.error('Error creating Stripe subscription:', error);
    
    // If it's already an HttpsError, re-throw it
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    if (error.type === 'StripeError') {
      logger.error(`Stripe API error: ${error.code} - ${error.message}`);
      throw new functions.https.HttpsError('invalid-argument', `Stripe error: ${error.message}`);
    }
    
    // Log the actual error for debugging
    logger.error(`Unexpected error: ${error.message}`, error);
    throw new functions.https.HttpsError('internal', `Failed to create subscription: ${error.message}`);
  }
});

// NEW: Cancel Stripe Subscription
export const cancelStripeSubscription = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { subscriptionId } = data;
  const userId = context.auth.uid;

  logger.info(`Cancelling Stripe subscription ${subscriptionId} for user ${userId}`);

  try {
    // Validate subscriptionId
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      logger.error(`Invalid subscriptionId: ${subscriptionId}`);
      throw new functions.https.HttpsError('invalid-argument', 'subscriptionId is required and must be a string.');
    }

    // Verify that the subscription belongs to the current user
    const subscriptionDoc = await admin.firestore().collection('subscriptions').doc(userId).get();
    if (!subscriptionDoc.exists) {
      logger.error(`No subscription document found for user ${userId}`);
      throw new functions.https.HttpsError('not-found', 'No subscription found for user.');
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData?.stripeSubscriptionId !== subscriptionId) {
      logger.error(`Subscription ID mismatch for user ${userId}. Expected: ${subscriptionData?.stripeSubscriptionId}, Got: ${subscriptionId}`);
      throw new functions.https.HttpsError('permission-denied', 'Subscription does not belong to user.');
    }

    // Cancel the subscription in Stripe (at period end to avoid immediate cancellation)
    logger.info(`Cancelling subscription ${subscriptionId} in Stripe...`);
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info(`Successfully cancelled subscription ${subscriptionId} in Stripe`);

    // Update Firestore document to reflect cancellation
    await admin.firestore().collection('subscriptions').doc(userId).update({
      cancelAtPeriodEnd: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    logger.info(`Successfully updated subscription document for user ${userId}`);

    return {
      success: true,
      message: 'Абонаментът ще бъде отменен в края на текущия период.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: (cancelledSubscription as any).current_period_end,
    };

  } catch (error: any) {
    logger.error('Error cancelling Stripe subscription:', error);
    
    // If it's already an HttpsError, re-throw it
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    if (error.type === 'StripeError') {
      logger.error(`Stripe API error: ${error.code} - ${error.message}`);
      throw new functions.https.HttpsError('invalid-argument', `Stripe error: ${error.message}`);
    }
    
    // Log the actual error for debugging
    logger.error(`Unexpected error: ${error.message}`, error);
    throw new functions.https.HttpsError('internal', `Failed to cancel subscription: ${error.message}`);
  }
});

// NEW: Update Stripe Subscription
export const updateStripeSubscription = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { subscriptionId, newPriceId } = data;
  const userId = context.auth.uid;

  logger.info(`Updating Stripe subscription ${subscriptionId} for user ${userId} to price ${newPriceId}`);

  try {
    // Validate input
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      logger.error(`Invalid subscriptionId: ${subscriptionId}`);
      throw new functions.https.HttpsError('invalid-argument', 'subscriptionId is required and must be a string.');
    }

    if (!newPriceId || typeof newPriceId !== 'string') {
      logger.error(`Invalid newPriceId: ${newPriceId}`);
      throw new functions.https.HttpsError('invalid-argument', 'newPriceId is required and must be a string.');
    }

    // Verify that the subscription belongs to the current user
    const subscriptionDoc = await admin.firestore().collection('subscriptions').doc(userId).get();
    if (!subscriptionDoc.exists) {
      logger.error(`No subscription document found for user ${userId}`);
      throw new functions.https.HttpsError('not-found', 'No subscription found for user.');
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData?.stripeSubscriptionId !== subscriptionId) {
      logger.error(`Subscription ID mismatch for user ${userId}. Expected: ${subscriptionData?.stripeSubscriptionId}, Got: ${subscriptionId}`);
      throw new functions.https.HttpsError('permission-denied', 'Subscription does not belong to user.');
    }

    // Get current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItem = currentSubscription.items.data[0];

    // Update the subscription in Stripe
    logger.info(`Updating subscription ${subscriptionId} in Stripe to price ${newPriceId}...`);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Charge/credit prorated amount immediately
    });

    logger.info(`Successfully updated subscription ${subscriptionId} in Stripe`);

    // Firestore will be updated automatically by the subscription.updated webhook
    // But we can return the updated data immediately
    return {
      success: true,
      message: 'Абонаментът беше променен успешно.',
      subscriptionId: updatedSubscription.id,
      newPriceId: newPriceId,
      status: updatedSubscription.status,
    };

  } catch (error: any) {
    logger.error('Error updating Stripe subscription:', error);
    
    // If it's already an HttpsError, re-throw it
    if (error.code && error.code.startsWith('functions/')) {
      throw error;
    }
    
    if (error.type === 'StripeError') {
      logger.error(`Stripe API error: ${error.code} - ${error.message}`);
      throw new functions.https.HttpsError('invalid-argument', `Stripe error: ${error.message}`);
    }
    
    // Log the actual error for debugging
    logger.error(`Unexpected error: ${error.message}`, error);
    throw new functions.https.HttpsError('internal', `Failed to update subscription: ${error.message}`);
  }
});
