import { ACHIEVEMENT_TYPES, ACHIEVEMENT_RARITY, MISSION_TYPES, REWARD_TYPES } from '../utils/constants';

// 🎯 НОВ МОДЕЛ: Декларативен тригер за проверка на събития
export interface GamificationEventTrigger {
  // Действието, което задейства проверката (напр. 'add_transaction')
  action: string;
  
  // Функция, която изчислява новия напредък.
  // Връща число, което представлява НОВИЯ общ напредък.
  progressUpdate: (currentProgress: number, metadata: any) => number;
  
  // Опционално условие. Ако върне false, проверката се пропуска.
  condition?: (metadata: any, currentProgress: number, profile: GamificationProfile) => boolean;
}

// Интерфейс за постижение
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  rarity: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  dateCompleted?: string;
  // Декларативен тригер за автоматична проверка
  trigger?: GamificationEventTrigger;
  reward?: Reward;
}

// Интерфейс за мисия
export interface Mission {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  expiresAt: string;
  startedAt: string;
  completedAt?: string;
  // Декларативен тригер за автоматична проверка
  trigger?: GamificationEventTrigger;
  reward?: Reward;
}

// Интерфейс за награда
export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  isUnlocked: boolean;
  dateUnlocked?: string;
}

// Интерфейс за профил на потребителя с гамификация
export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string; // Последна дата на транзакция (ISO format: YYYY-MM-DD) - за streak проследяване
  achievements: Achievement[];
  completedAchievements: number;
  totalAchievements: number;
  missions: {
    active: Mission[];
    completed: Mission[];
  };
  rewards: Reward[];
}

// Помощна функция за изчисляване на ниво от XP
export const calculateLevelFromXP = (xp: number, thresholds: number[]): number => {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
};

// Помощна функция за изчисляване на прогрес към следващото ниво
export const calculateLevelProgress = (xp: number, thresholds: number[]): number => {
  const currentLevel = calculateLevelFromXP(xp, thresholds);
  if (currentLevel === thresholds.length) {
    return 100; // Максимално ниво
  }
  
  const currentThreshold = thresholds[currentLevel - 1];
  const nextThreshold = thresholds[currentLevel];
  const xpForNextLevel = nextThreshold - currentThreshold;
  const xpProgress = xp - currentThreshold;
  
  return Math.min(Math.round((xpProgress / xpForNextLevel) * 100), 100);
}; 