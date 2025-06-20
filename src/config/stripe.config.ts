// Stripe Configuration для FinTrack
import { Environment } from './environment.config';

export interface StripeConfig {
  publishableKey: string;
  merchantIdentifier?: string; // For Apple Pay
  urlScheme?: string; // For redirects
}

// Test keys от Stripe Dashboard (безопасни за споделяне)
const STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_51H5BdL7F8M2mIQLUOCMfr1K3bHXcPL3Fv8RbNXhPr4TnP4dP2k4j1hYbGnV3dMq8RgY1rP5xW6sK9tA7cE2fZ0k4L8nU'; // Заместете с вашия тестови ключ

const getStripeConfig = (): StripeConfig => {
  const config: StripeConfig = {
    publishableKey: STRIPE_TEST_PUBLISHABLE_KEY,
    merchantIdentifier: 'merchant.com.fintrack.app',
    urlScheme: 'fintrack-payments',
};

  // В production ще използваме live ключове
  if (Environment.isDevelopment) {
    return {
      ...config,
      publishableKey: STRIPE_TEST_PUBLISHABLE_KEY,
    };
  }

  return config;
};

// Тестови карти за различни сценарии
export const TEST_CARDS = {
  SUCCESS: '4242424242424242', // Винаги успешна
  DECLINED: '4000000000000002', // Винаги отхвърлена  
  INSUFFICIENT_FUNDS: '4000000000009995', // Недостатъчни средства
  EXPIRED: '4000000000000069', // Изтекла карта
  CVC_FAIL: '4000000000000127', // Грешен CVC
  PROCESSING_ERROR: '4000000000000119', // Грешка при обработка
};

// Валиден CVC за тестване
export const TEST_CVC = '123';

// Валидна дата за тестване (винаги в бъдещето)
export const TEST_EXPIRY = {
  month: 12,
  year: new Date().getFullYear() + 2,
};

export const stripeConfig = getStripeConfig();

// Helper функции
export const formatExpiryDate = (text: string): string => {
  // Форматира MM/YY
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + (cleaned.length > 2 ? '/' + cleaned.substring(2, 4) : '');
  }
  return cleaned;
};

export const validateCardNumber = (cardNumber: string): boolean => {
  // Основна Luhn алгоритъм валидация
  const num = cardNumber.replace(/\D/g, '');
  if (num.length < 13 || num.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const getCardType = (cardNumber: string): string => {
  const num = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(num)) return 'Visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'American Express';
  if (/^6/.test(num)) return 'Discover';
  
  return 'Unknown';
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

export default stripeConfig; 