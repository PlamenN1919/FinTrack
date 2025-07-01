/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

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
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
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
    case "invoice.payment_succeeded":
      try {
        if (dataObject.subscription) {
          const sub = await stripe.subscriptions.retrieve(dataObject.subscription);
          const userUID = sub.metadata.firebaseUID;
          if (userUID) {
            await admin.firestore().collection("subscriptions").doc(userUID).set({
              status: "active",
              planId: sub.items.data[0].price.id,
              current_period_end: sub['current_period_end'] * 1000,
            }, { merge: true });
            logger.info(`Successfully updated subscription for user ${userUID}`);
          }
        }
      } catch (error) {
          logger.error("Error handling 'invoice.payment_succeeded':", error);
      }
      break;
    case "invoice.payment_failed":
       try {
        if (dataObject.subscription) {
          const sub = await stripe.subscriptions.retrieve(dataObject.subscription) as Stripe.Subscription;
          const userUID = sub.metadata.firebaseUID;
          if (userUID) {
            await admin.firestore().collection("subscriptions").doc(userUID).update({
              status: "payment_failed",
            });
            logger.warn(`Failed payment noted for user ${userUID}`);
          }
        }
       } catch (error) {
           logger.error("Error handling 'invoice.payment_failed':", error);
       }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send();
});
