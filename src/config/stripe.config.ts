// Stripe конфигурация за FinTrack
export const STRIPE_CONFIG = {
  // Test mode keys (за development)
  test: {
    publishableKey: 'pk_test_51RHUZh4dsTm22ri7eRMIa1ynvEQEiqilfZRiNgmZHVss0KoXdJ6d3rwheOsiaVr18w5jm6H3EGfifuzuGxnwEySy00vg5ierve',
    merchantIdentifier: 'merchant.com.fintrack.test',
    urlScheme: 'fintrack-test',
  },
  
  // Live mode keys (за production) 
  live: {
    publishableKey: 'pk_live_51RY1Qr4dsTm22ri7...', // Заменете с вашия live publishable key
    merchantIdentifier: 'merchant.com.fintrack',
    urlScheme: 'fintrack',
  },
};

// Текуща конфигурация според режима
export const getCurrentStripeConfig = () => {
  const isDevelopment = __DEV__;
  return isDevelopment ? STRIPE_CONFIG.test : STRIPE_CONFIG.live;
};

// Payment configuration
export const PAYMENT_CONFIG = {
  // Страна и валута
  country: 'BG',
  currency: 'BGN',
  
  // Timeout settings
  timeout: 30000, // 30 секунди
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 2000, // 2 секунди
  
  // UI настройки
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#667eea', // FinTrack primary color
      borderRadius: '16px',
      fontFamily: 'System',
    },
  },
  
  // Card input styling
  cardStyle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 16,
    fontSize: 16,
    textColor: '#333333',
    placeholderColor: '#999999',
    textErrorColor: '#F44336',
    cursorColor: '#667eea',
  },
};

// Error messages на български
export const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  // Card errors
  'card_declined': 'Картата беше отхвърлена. Моля, опитайте с друга карта.',
  'expired_card': 'Картата е изтекла. Моля, обновете данните си.',
  'insufficient_funds': 'Недостатъчно средства по картата.',
  'incorrect_cvc': 'Невалиден CVC код.',
  'incorrect_number': 'Невалиден номер на карта.',
  'invalid_expiry_month': 'Невалиден месец на изтичане.',
  'invalid_expiry_year': 'Невалидна година на изтичане.',
  'invalid_cvc': 'Невалиден CVC код.',
  
  // Processing errors
  'processing_error': 'Грешка при обработката на плащането. Моля, опитайте отново.',
  'rate_limit': 'Твърде много опити. Моля, изчакайте малко.',
  
  // Network errors
  'network_error': 'Грешка в мрежата. Проверете връзката си.',
  'timeout': 'Времето за плащане изтече. Моля, опитайте отново.',
  
  // Generic errors
  'unknown_error': 'Възникна неочаквана грешка. Моля, опитайте отново.',
  'authentication_required': 'Изисква се допълнително потвърждение от банката ви.',
};

// Utility функции
export const getStripeErrorMessage = (errorCode?: string): string => {
  if (!errorCode) return STRIPE_ERROR_MESSAGES.unknown_error;
  return STRIPE_ERROR_MESSAGES[errorCode] || STRIPE_ERROR_MESSAGES.unknown_error;
};

export const formatAmountForStripe = (amount: number): number => {
  // Stripe изисква сумата в стотинки (за BGN = стотинки)
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  // Конвертира от стотинки обратно в лева
  return amount / 100;
}; 