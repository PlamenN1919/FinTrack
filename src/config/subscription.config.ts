import { PlanConfig, SubscriptionPlan, FeatureFlags } from '../types/auth.types';

// Всички features са достъпни във всички планове (според изискванията)
const ALL_FEATURES: FeatureFlags = {
  UNLIMITED_TRANSACTIONS: true,
  ADVANCED_REPORTS: true,
  RECEIPT_SCANNING: true,
  BUDGET_GOALS: true,
  EXPORT_DATA: true,
  PRIORITY_SUPPORT: true,
  FAMILY_SHARING: true,
  CUSTOM_CATEGORIES: true,
  VOICE_ASSISTANT: true,
  WHAT_IF_SIMULATIONS: true,
};

// Конфигурация на абонаментните планове за България
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.MONTHLY]: {
    id: SubscriptionPlan.MONTHLY,
    name: 'Месечен план',
    description: 'Пълен достъп до всички функции на FinTrack',
    monthlyPrice: 12.99,
    currency: 'BGN',
    features: ALL_FEATURES,
    stripePriceIds: {
      monthly: 'price_1RY1fU4dsTm22ri7UDyH5v94',
    },
  },
  
  [SubscriptionPlan.QUARTERLY]: {
    id: SubscriptionPlan.QUARTERLY,
    name: 'Тримесечен план',
    description: 'Най-добрата стойност за парите - спестете 23%',
    monthlyPrice: 12.99,
    quarterlyPrice: 29.99, // 9.99 лв/месец
    currency: 'BGN',
    features: ALL_FEATURES,
    popular: true, // Най-популярен план
    stripePriceIds: {
      quarterly: 'price_1RY1iM4dsTm22ri71Ov28LF4',
    },
  },
  
  [SubscriptionPlan.YEARLY]: {
    id: SubscriptionPlan.YEARLY,
    name: 'Годишен план',
    description: 'Максимални спестявания - спестете 36%',
    monthlyPrice: 12.99,
    yearlyPrice: 99.99, // 8.33 лв/месец
    currency: 'BGN',
    features: ALL_FEATURES,
    bestValue: true, // Най-изгоден план
    stripePriceIds: {
      yearly: 'price_1RY1io4dsTm22ri7uNflBZqk',
    },
  },
};

// Помощни функции за изчисления
export const getPlanPrice = (plan: SubscriptionPlan, period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): number => {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  
  // Fallback if plan config is not found
  if (!planConfig) {
    console.warn(`[getPlanPrice] Plan config not found for plan: ${plan}, using default monthly price`);
    return 12.99; // Default monthly price
  }
  
  switch (period) {
    case 'monthly':
      return planConfig.monthlyPrice || 12.99;
    case 'quarterly':
      return planConfig.quarterlyPrice || planConfig.monthlyPrice * 3 || 29.99;
    case 'yearly':
      return planConfig.yearlyPrice || planConfig.monthlyPrice * 12 || 99.99;
    default:
      return planConfig.monthlyPrice || 12.99;
  }
};

export const getMonthlyEquivalent = (plan: SubscriptionPlan, period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): number => {
  const totalPrice = getPlanPrice(plan, period);
  
  switch (period) {
    case 'monthly':
      return totalPrice;
    case 'quarterly':
      return totalPrice / 3;
    case 'yearly':
      return totalPrice / 12;
    default:
      return totalPrice;
  }
};

export const getSavingsPercentage = (plan: SubscriptionPlan, period: 'quarterly' | 'yearly'): number => {
  const monthlyPrice = getPlanPrice(plan, 'monthly');
  const monthlyEquivalent = getMonthlyEquivalent(plan, period);
  
  return Math.round(((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100);
};

export const getSavingsAmount = (plan: SubscriptionPlan, period: 'quarterly' | 'yearly'): number => {
  const monthlyPrice = getPlanPrice(plan, 'monthly');
  const totalPrice = getPlanPrice(plan, period);
  const periodsCount = period === 'quarterly' ? 3 : 12;
  
  return (monthlyPrice * periodsCount) - totalPrice;
};

// Stripe Price IDs за различните планове (обновени с реални)
export const STRIPE_PRICE_IDS = {
  MONTHLY_BG: 'price_1RY1fU4dsTm22ri7UDyH5v94',
  QUARTERLY_BG: 'price_1RY1iM4dsTm22ri71Ov28LF4', 
  YEARLY_BG: 'price_1RY1io4dsTm22ri7uNflBZqk',
} as const;

// Валидация на планове
export const isValidPlan = (planId: string): planId is SubscriptionPlan => {
  return Object.values(SubscriptionPlan).includes(planId as SubscriptionPlan);
};

export const getPlanConfig = (planId: SubscriptionPlan): PlanConfig => {
  const config = SUBSCRIPTION_PLANS[planId];
  if (!config) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return config;
};

// Feature checking
export const hasFeature = (plan: SubscriptionPlan, feature: keyof FeatureFlags): boolean => {
  const planConfig = getPlanConfig(plan);
  return planConfig.features[feature];
};

// Plan comparison data за UI
export const getPlanComparison = () => {
  return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
    ...plan,
    monthlyEquivalent: {
      quarterly: plan.quarterlyPrice ? getMonthlyEquivalent(plan.id, 'quarterly') : null,
      yearly: plan.yearlyPrice ? getMonthlyEquivalent(plan.id, 'yearly') : null,
    },
    savings: {
      quarterly: plan.quarterlyPrice ? getSavingsPercentage(plan.id, 'quarterly') : null,
      yearly: plan.yearlyPrice ? getSavingsPercentage(plan.id, 'yearly') : null,
    },
    savingsAmount: {
      quarterly: plan.quarterlyPrice ? getSavingsAmount(plan.id, 'quarterly') : null,
      yearly: plan.yearlyPrice ? getSavingsAmount(plan.id, 'yearly') : null,
    },
  }));
};

// Default plan за нови потребители
export const DEFAULT_PLAN = SubscriptionPlan.QUARTERLY;

// Trial configuration (ако решим да добавим в бъдеще)
export const TRIAL_CONFIG = {
  enabled: false, // Засега изключено
  duration: 7, // дни
  planId: SubscriptionPlan.MONTHLY,
};

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'BGN',
  locale: 'bg-BG',
  supportedPaymentMethods: ['card'], // Само банкови карти
  retryAttempts: 3,
  timeoutMs: 30000, // 30 секунди timeout
};

// Subscription limits (за бъдещи ограничения ако се нуждаем)
export const SUBSCRIPTION_LIMITS = {
  [SubscriptionPlan.MONTHLY]: {
    maxDevices: 3,
    maxTransactionsPerMonth: -1, // unlimited
    maxBudgets: -1, // unlimited
    maxCategories: -1, // unlimited
  },
  [SubscriptionPlan.QUARTERLY]: {
    maxDevices: 5,
    maxTransactionsPerMonth: -1, // unlimited
    maxBudgets: -1, // unlimited
    maxCategories: -1, // unlimited
  },
  [SubscriptionPlan.YEARLY]: {
    maxDevices: 10,
    maxTransactionsPerMonth: -1, // unlimited
    maxBudgets: -1, // unlimited
    maxCategories: -1, // unlimited
  },
};

// Formatting functions
export const formatPrice = (amount: number, currency: string = 'BGN'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0.00 ${currency}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
};

export const calculateSavings = (planId: SubscriptionPlan): number => {
  const planConfig = SUBSCRIPTION_PLANS[planId];
  
  if (planConfig.quarterlyPrice) {
    return getSavingsPercentage(planId, 'quarterly');
  }
  
  if (planConfig.yearlyPrice) {
    return getSavingsPercentage(planId, 'yearly');
  }
  
  return 0;
};

// Error messages на български
export const SUBSCRIPTION_ERROR_MESSAGES = {
  PLAN_NOT_FOUND: 'Планът не е намерен',
  INVALID_PAYMENT_METHOD: 'Невалиден метод за плащане',
  PAYMENT_FAILED: 'Плащането беше неуспешно',
  SUBSCRIPTION_EXPIRED: 'Абонаментът ви е изтекъл',
  NETWORK_ERROR: 'Грешка в мрежата. Моля, опитайте отново.',
  UNKNOWN_ERROR: 'Възникна неочаквана грешка',
} as const; 