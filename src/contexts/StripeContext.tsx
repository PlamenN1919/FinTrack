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

// Stripe LIVE publishable key - Production mode
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RHUZWG1pdDRlAv6QmXDa9GYBXlCxLZo1XFbXQYRJhs98fzMbkxGgIBkHX7FyXp1jOEZuGmTGmqmREA2siiVajcj00KVZbWE63';

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