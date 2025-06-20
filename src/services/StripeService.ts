import { SubscriptionPlan } from '../types/auth.types';
import { SUBSCRIPTION_PLANS } from '../config/subscription.config';
import { formatAmountForStripe } from '../config/stripe.config';

/**
 * Represents the server-side response when creating a payment intent.
 */
export interface CreatePaymentIntentResponse {
  clientSecret: string;
  customerId: string;
  ephemeralKey: string; // Used for allowing the SDK to act on behalf of the customer
}

/**
 * Simulates calling a backend endpoint to create a Stripe Payment Intent.
 * In a real application, this would be a network request to your server.
 * Your server would then use the Stripe Node.js library to create the intent.
 * 
 * @param planId The ID of the selected subscription plan.
 * @param userId The ID of the user creating the subscription.
 * @returns A promise that resolves to the simulated server response.
 */
export const createPaymentIntent = async (
  planId: SubscriptionPlan,
  userId: string
): Promise<CreatePaymentIntentResponse> => {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid subscription plan selected.');
  }

  const amount = plan.monthlyPrice; // Simplified logic, use appropriate pricing
  const currency = plan.currency.toLowerCase();

  console.log(`[StripeService] Simulating creation of Payment Intent for user ${userId}`);
  console.log(`[StripeService] Plan: ${planId}, Amount: ${amount} ${currency}`);

  // This is a simulation. In a real backend, you would:
  // 1. Create or retrieve a Stripe Customer for the userId.
  // 2. Create an Ephemeral Key for that customer.
  // 3. Create a PaymentIntent with the amount, currency, and customer ID.
  // 4. Return the client_secret, customerId, and ephemeralKey secret to the client.

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock data that mimics a real response from your server.
  // The client_secret would look something like 'pi_123abc_secret_456def'
  const mockClientSecret = `pi_${userId}_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`;
  const mockCustomerId = `cus_mock_${userId}`;
  const mockEphemeralKey = `ek_test_mock_${Date.now()}`;

  console.log(`[StripeService] Mock Payment Intent created with clientSecret: ${mockClientSecret}`);

  return {
    clientSecret: mockClientSecret,
    customerId: mockCustomerId,
    ephemeralKey: mockEphemeralKey,
  };
};

export const stripeService = {
  createPaymentIntent,
}; 