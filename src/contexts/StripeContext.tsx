import React, { createContext, useContext, useEffect, useState } from 'react';
import { initStripe, StripeProvider } from '@stripe/stripe-react-native';
import { stripeConfig } from '../config/stripe.config';

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

export const StripeContextProvider: React.FC<StripeContextProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        await initStripe({
          publishableKey: stripeConfig.publishableKey,
          merchantIdentifier: stripeConfig.merchantIdentifier,
          urlScheme: stripeConfig.urlScheme,
        });
        
        setIsInitialized(true);
        console.log('[Stripe] Successfully initialized');
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
        publishableKey={stripeConfig.publishableKey}
        merchantIdentifier={stripeConfig.merchantIdentifier}
        urlScheme={stripeConfig.urlScheme}
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