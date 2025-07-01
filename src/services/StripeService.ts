import { getFunctions, httpsCallable } from 'firebase/functions';
import { SubscriptionPlan } from '../types/auth.types';

/**
 * Represents the server-side response when creating a payment intent.
 */
export interface CreatePaymentIntentResponse {
  clientSecret: string;
}

/**
 * Calls the backend endpoint to create a Stripe Payment Intent.
 *
 * @param planId The ID of the selected subscription plan.
 * @returns A promise that resolves to the server response containing the clientSecret.
 */
export const createPaymentIntent = async (
  planId: SubscriptionPlan
): Promise<CreatePaymentIntentResponse> => {
  const functions = getFunctions();
  const createPaymentIntentCallable = httpsCallable(functions, 'createPaymentIntent');

  console.log(`[StripeService] Calling createPaymentIntent for plan: ${planId}`);

  try {
    const result = await createPaymentIntentCallable({ planId });
    const data = result.data as CreatePaymentIntentResponse;
    
    if (!data || !data.clientSecret) {
      throw new Error('Invalid response from server when creating payment intent.');
    }

    console.log(`[StripeService] Payment Intent created successfully.`);
    return { clientSecret: data.clientSecret };
  } catch (error) {
    console.error('[StripeService] Error calling createPaymentIntent function:', error);
    // Re-throw the error so the UI layer can handle it
    throw new Error('Failed to create payment intent.');
  }
};

export const stripeService = {
  createPaymentIntent,
}; 