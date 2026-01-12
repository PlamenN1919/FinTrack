// Константи за локално съхранение
export const THEME_KEY = 'fintrack_theme';
export const USER_DATA_KEY = 'fintrack_user_data';
export const TRANSACTIONS_KEY = 'fintrack_transactions';
export const BUDGETS_KEY = 'fintrack_budgets';
export const SETTINGS_KEY = 'fintrack_settings';
export const GAMIFICATION_KEY = 'fintrack_gamification';

// Константи за навигация
export const SCREENS = {
  HOME: 'Home',
  TRANSACTIONS: 'Transactions',
  BUDGETS: 'Budgets',
  REPORTS: 'Reports',
  SCANNER: 'Scanner',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  ADD_TRANSACTION: 'AddTransaction',
  ADD_BUDGET: 'AddBudget',
  TRANSACTION_DETAILS: 'TransactionDetails',
  BUDGET_DETAILS: 'BudgetDetails',
  FINANCIAL_HEALTH: 'FinancialHealth',
  ACHIEVEMENTS: 'Achievements',
  VOICE_ASSISTANT: 'VoiceAssistant',
  WHAT_IF_SIMULATION: 'WhatIfSimulation',
  EDIT_PROFILE: 'EditProfile',
  // Referral system screens
  REFERRAL: 'Referral',
  REFERRAL_DASHBOARD: 'ReferralDashboard',
};

// Константи за категории разходи
export const EXPENSE_CATEGORIES = {
  FOOD: { name: 'Храна', icons: ['🍕', '🍔', '🥗', '🍎', '🥖'] },
  TRANSPORT: { name: 'Транспорт', icons: ['🚗', '🚌', '🚇', '🚲', '⛽'] },
  ENTERTAINMENT: { name: 'Забавления', icons: ['🎬', '🎮', '🎵', '🎪', '🎯'] },
  UTILITIES: { name: 'Битови', icons: ['💡', '💧', '🔥', '📱', '📺'] },
  HEALTH: { name: 'Здраве', icons: ['🏥', '💊', '🩺', '🦷', '👓'] },
  EDUCATION: { name: 'Образование', icons: ['📚', '🎓', '✏️', '💻', '🔬'] },
  CLOTHING: { name: 'Облекло', icons: ['👕', '👗', '👟', '👜', '⌚'] },
  HOUSING: { name: 'Жилище', icons: ['🏠', '🔧', '🛋️', '🧹', '🔑'] },
  SHOPPING: { name: 'Пазаруване', icons: ['🛒', '🛍️', '💳', '🏪', '🎁'] },
  OTHER: { name: 'Други', icons: ['📦', '❓', '💼', '🔧', '📋'] },
};

// Константи за категории приходи
export const INCOME_CATEGORIES = {
  SALARY: { name: 'Заплата', icons: ['💰', '💵', '💼', '🏢', '📊'] },
  FREELANCE: { name: 'Фрийланс', icons: ['💻', '🎨', '✍️', '📝', '🖥️'] },
  BUSINESS: { name: 'Бизнес', icons: ['🏪', '📈', '💹', '🤝', '🎯'] },
  INVESTMENT: { name: 'Инвестиции', icons: ['📊', '💎', '🏦', '📈', '💹'] },
  RENTAL: { name: 'Наем', icons: ['🏠', '🔑', '🏢', '🏘️', '📋'] },
  GIFT: { name: 'Подарък', icons: ['🎁', '💝', '🎉', '💖', '🌟'] },
  BONUS: { name: 'Бонус', icons: ['🎊', '⭐', '🏆', '💫', '🎯'] },
  REFUND: { name: 'Възстановяване', icons: ['↩️', '💳', '🔄', '💰', '📋'] },
  OTHER: { name: 'Други', icons: ['💰', '❓', '📦', '💼', '📋'] },
};

// Обратна съвместимост - старите категории
export const CATEGORIES = {
  FOOD: 'Храна',
  TRANSPORT: 'Транспорт',
  ENTERTAINMENT: 'Забавления',
  UTILITIES: 'Битови',
  HEALTH: 'Здраве',
  EDUCATION: 'Образование',
  CLOTHING: 'Облекло',
  SAVINGS: 'Спестявания',
  HOUSING: 'Жилище',
  OTHER: 'Други',
};

// Константи за типове транзакции
export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer',
};

// API ключове и URL-и
export const API_URLS = {
  FINANCIAL_DATA: 'https://api.fintrack.com/financial-data',
  LOYALTY_PROGRAMS: 'https://api.fintrack.com/loyalty-programs',
  CURRENCY_RATES: 'https://api.fintrack.com/currency-rates',
};

// Константи за темите
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Константи за финансовото здраве
export const FINANCIAL_HEALTH = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  AVERAGE: 'average',
  POOR: 'poor',
  CRITICAL: 'critical',
};

// Константи за гамификация
export const ACHIEVEMENT_TYPES = {
  SAVING: 'saving',
  BUDGETING: 'budgeting',
  TRACKING: 'tracking',
  LEARNING: 'learning',
  CONSISTENCY: 'consistency',
  GOALS: 'goals',
};

export const ACHIEVEMENT_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const MISSION_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SPECIAL: 'special',
};

export const LEVEL_THRESHOLDS = [
  0, // Ниво 1
  100, // Ниво 2
  250, // Ниво 3
  500, // Ниво 4
  1000, // Ниво 5
  1750, // Ниво 6
  2750, // Ниво 7
  4000, // Ниво 8
  5500, // Ниво 9
  7500, // Ниво 10
];

export const REWARD_TYPES = {
  THEME: 'theme',
  FEATURE: 'feature',
  BADGE: 'badge',
  INSIGHT: 'insight',
};

// Константи за емоционалното харчене
export const EMOTIONS = {
  HAPPY: 'happy',
  SAD: 'sad',
  STRESSED: 'stressed',
  EXCITED: 'excited',
  BORED: 'bored',
  NEUTRAL: 'neutral',
};

export const PAYMENT_METHODS = {
  card: { key: 'card', name: 'Карта', icon: '💳' },
  cash: { key: 'cash', name: 'В брой', icon: '💵' },
  bank: { key: 'bank', name: 'Банков превод', icon: '🏦' },
}; 