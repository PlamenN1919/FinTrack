import React, { createContext, useContext, useEffect, useState } from 'react';
import { initStripe, StripeProvider } from '@stripe/stripe-react-native';

interface StripeContextType {
  isInitialized: boolean;
  error: string | null;
}

const StripeContext = createContext<StripeContextType>({
  isInitialized: false,
  error: null,
});

interface StripeContextProviderProps {
  children: React.ReactNode;
}

// HARDCODED Stripe TEST publishable key
// TODO: Move to environment variable before production
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RHUZWG1pdDRlAv6QC7FQEqooq2KOzfWQE7w8C0YU9y82dIy9CemK0afCxTIgLcLK4eSWrkqnl4mNscYRM7xb70K00iRSlDuTF';

export const StripeContextProvider: React.FC<StripeContextProviderProps> = ({ children }) => {
  console.log('[StripeContext] StripeContextProvider component rendering...');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[StripeContext] useEffect triggered - starting initialization...');
    const initializeStripe = async () => {
      try {
        console.log('[Stripe] Initializing with key:', STRIPE_PUBLISHABLE_KEY.substring(0, 30) + '...');
        await initStripe({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          merchantIdentifier: 'merchant.com.fintrack.app',
          urlScheme: 'fintrack-payments',
        });
        
        setIsInitialized(true);
        console.log('[Stripe] Successfully initialized!');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown Stripe initialization error';
        setError(errorMessage);
        console.error('[Stripe] Initialization failed:', errorMessage);
      }
    };

    initializeStripe();
  }, []);

  return (
    <StripeContext.Provider value={{ isInitialized, error }}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.fintrack.app"
        urlScheme="fintrack-payments"
      >
        {children as React.ReactElement}
      </StripeProvider>
    </StripeContext.Provider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeContext must be used within StripeContextProvider');
  }
  return context;
}; 