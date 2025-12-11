import { Achievement, Mission, Reward, GamificationProfile } from '../models/gamification';
import { 
  ACHIEVEMENT_TYPES, 
  ACHIEVEMENT_RARITY, 
  MISSION_TYPES, 
  REWARD_TYPES 
} from '../utils/constants';

// Примерни постижения
export const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'Първи стъпки',
    description: 'Добавете първата си транзакция в приложението',
    icon: '🏆',
    type: ACHIEVEMENT_TYPES.TRACKING,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    xpReward: 10,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    trigger: {
      action: 'add_transaction',
      condition: (metadata, currentProgress) => currentProgress < 1,
      progressUpdate: (currentProgress) => currentProgress + 1
    }
  },
  {
    id: '2',
    name: 'Бюджетен майстор',
    description: 'Спазвайте всички бюджетни категории в продължение на цял месец',
    icon: '💰',
    type: ACHIEVEMENT_TYPES.BUDGETING,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    xpReward: 50,
    progress: 0,
    maxProgress: 30,
    isCompleted: false,
    trigger: {
      action: 'budget_compliance_check',
      condition: (metadata) => metadata.isWithinBudget,
      progressUpdate: (currentProgress, metadata) => metadata.daysInBudget
    }
  },
  {
    id: '3',
    name: 'Спестовник',
    description: 'Спестете 10% от месечния си доход за 3 последователни месеца',
    icon: '🐖',
    type: ACHIEVEMENT_TYPES.SAVING,
    rarity: ACHIEVEMENT_RARITY.RARE,
    xpReward: 100,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    trigger: {
      action: 'savings_check',
      condition: (metadata) => metadata.savingsRate >= 0.10,
      progressUpdate: (currentProgress, metadata) => metadata.consecutiveMonths
    }
  },
  {
    id: '4',
    name: 'Финансов анализатор',
    description: 'Прегледайте всички видове отчети в приложението',
    icon: '📊',
    type: ACHIEVEMENT_TYPES.LEARNING,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    xpReward: 25,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    trigger: {
      action: 'view_report',
      progressUpdate: (currentProgress) => currentProgress + 1
    }
  },
  {
    id: '5',
    name: 'Последователен',
    description: 'Въведете транзакции 30 дни подред',
    icon: '📆',
    type: ACHIEVEMENT_TYPES.CONSISTENCY,
    rarity: ACHIEVEMENT_RARITY.RARE,
    xpReward: 75,
    progress: 0,
    maxProgress: 30,
    isCompleted: false,
    trigger: {
      action: 'streak_updated',
      progressUpdate: (currentProgress, metadata) => metadata.newStreak
    }
  },
  {
    id: '6',
    name: 'Целеустремен',
    description: 'Постигнете 5 финансови цели',
    icon: '🎯',
    type: ACHIEVEMENT_TYPES.GOALS,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    xpReward: 150,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    trigger: {
      action: 'goal_achieved',
      progressUpdate: (currentProgress) => currentProgress + 1
    }
  },
  {
    id: '7',
    name: 'Емоционално осъзнат',
    description: 'Отбележете емоционалното си състояние за 50 транзакции',
    icon: '😊',
    type: ACHIEVEMENT_TYPES.TRACKING,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    xpReward: 50,
    progress: 0,
    maxProgress: 50,
    isCompleted: false,
    trigger: {
      action: 'add_transaction',
      condition: (metadata) => metadata.emotionalState && metadata.emotionalState !== 'neutral',
      progressUpdate: (currentProgress) => currentProgress + 1
    }
  },
  {
    id: '8',
    name: 'Финансов гуру',
    description: 'Достигнете финансов здравен индекс над 90 точки',
    icon: '🧘',
    type: ACHIEVEMENT_TYPES.GOALS,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    xpReward: 300,
    progress: 0,
    maxProgress: 90,
    isCompleted: false,
    trigger: {
      action: 'financial_health_updated',
      condition: (metadata) => metadata.healthScore >= 95,
      progressUpdate: (currentProgress, metadata) => metadata.healthScore
    }
  },
  {
    id: '9',
    name: 'QR скенер',
    description: 'Сканирайте 20 касови бележки с QR код',
    icon: '📷',
    type: ACHIEVEMENT_TYPES.TRACKING,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    xpReward: 30,
    progress: 0,
    maxProgress: 20,
    isCompleted: false,
    trigger: {
      action: 'add_transaction',
      condition: (metadata) => metadata.isScanned,
      progressUpdate: (currentProgress) => currentProgress + 1
    }
  },
  {
    id: '10',
    name: 'Оптимизатор на разходи',
    description: 'Намалете разходите си в определена категория с 20%',
    icon: '✂️',
    type: ACHIEVEMENT_TYPES.BUDGETING,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    xpReward: 75,
    progress: 0,
    maxProgress: 20,
    isCompleted: false,
    trigger: {
      action: 'expense_optimization',
      condition: (metadata) => metadata.reductionPercentage >= 20,
      progressUpdate: (currentProgress, metadata) => metadata.reductionPercentage
    }
  },
];

// Примерни мисии
export const mockMissions: Mission[] = [
  {
    id: '1',
    name: 'Проследяване на дневните разходи',
    description: 'Добавете поне една транзакция днес',
    icon: '📝',
    type: MISSION_TYPES.DAILY,
    xpReward: 10,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    startedAt: new Date().toISOString(),
    trigger: {
      action: 'daily_activity_completed',
      progressUpdate: (p) => p + 1
    }
  },
  {
    id: '2',
    name: 'Оптимизирайте храната',
    description: 'Не надвишавайте дневния бюджет за храна през следващите 3 дни',
    icon: '🍲',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 15,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: '2024-05-25T23:59:59',
    startedAt: '2024-05-20T00:00:00',
  },
  {
    id: '3',
    name: 'Проучване на отчети',
    description: 'Прегледайте всички раздели на месечния отчет',
    icon: '📊',
    type: MISSION_TYPES.MONTHLY,
    xpReward: 20,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    expiresAt: '2024-05-31T23:59:59',
    startedAt: '2024-05-01T00:00:00',
  },
  {
    id: '4',
    name: 'Ограничете ненужните разходи',
    description: 'Имайте поне 5 дни без разходи за забавления тази седмица',
    icon: '🚫',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 30,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
    trigger: {
      action: 'no_entertainment_day',
      progressUpdate: (p) => p + 1
    }
  },
  {
    id: '5',
    name: 'Финансов преглед на седмицата',
    description: 'Анализирайте седмичните си разходи и определете 3 начина за оптимизация',
    icon: '🔍',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 25,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: '2024-05-26T23:59:59',
    startedAt: '2024-05-20T00:00:00',
  },
  
  // 🌟 СПЕЦИАЛНИ МИСИИ
  {
    id: '6',
    name: 'Финансов детектив',
    description: 'Открийте и категоризирайте 5 "забравени" разхода от миналия месец',
    icon: '🕵️',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 30,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дни
    startedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Емоционален майстор',
    description: 'Отбележете емоцията си при 10 поредни транзакции',
    icon: '🎭',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 25,
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 дни
    startedAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Финансов шампион',
    description: 'Постигнете всички 3 цели: спестете 100лв, не надвишете бюджета, добавете 15 транзакции',
    icon: '🏆',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 50,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дни
    startedAt: new Date().toISOString(),
  },

  // ☕ ДНЕВНИ МИСИИ
  {
    id: '9',
    name: 'Кафе предизвикателство',
    description: 'Не харчете за кафе/напитки извън дома днес',
    icon: '☕',
    type: MISSION_TYPES.DAILY,
    xpReward: 8,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), // До края на деня
    startedAt: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Еко ден',
    description: 'Използвайте само обществен транспорт или ходете пеша днес',
    icon: '🌱',
    type: MISSION_TYPES.DAILY,
    xpReward: 10,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '11',
    name: 'Спестовен ден',
    description: 'Харчете под 20 лв за целия ден',
    icon: '💰',
    type: MISSION_TYPES.DAILY,
    xpReward: 12,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '12',
    name: 'Цифров минимализъм',
    description: 'Не правете онлайн покупки днес',
    icon: '📱',
    type: MISSION_TYPES.DAILY,
    xpReward: 15,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    startedAt: new Date().toISOString(),
  },

  // 📊 СЕДМИЧНИ МИСИИ
  {
    id: '13',
    name: 'Категория фокус',
    description: 'Изберете една категория и я намалете с 30% спрямо миналата седмица',
    icon: '🎯',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 35,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '14',
    name: 'Финансов одит',
    description: 'Прегледайте и коригирайте 10 стари транзакции',
    icon: '🔍',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 25,
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '15',
    name: 'Умно пазаруване',
    description: 'Сравнете цени за 5 продукта преди покупка и запишете спестяванията',
    icon: '💡',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 30,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '16',
    name: 'Креативно спестяване',
    description: 'Намерете 3 безплатни алтернативи на платени дейности',
    icon: '🎨',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 20,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },

  // 🗓️ МЕСЕЧНИ МИСИИ
  {
    id: '17',
    name: 'Финансов растеж',
    description: 'Увеличете спестяванията си с 15% спрямо миналия месец',
    icon: '📈',
    type: MISSION_TYPES.MONTHLY,
    xpReward: 75,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '18',
    name: 'Баланс майстор',
    description: 'Поддържайте баланс между всички категории разходи (не повече от 40% в една)',
    icon: '⚖️',
    type: MISSION_TYPES.MONTHLY,
    xpReward: 60,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '19',
    name: 'Постоянство',
    description: 'Добавете поне 1 транзакция всеки ден от месеца',
    icon: '🏅',
    type: MISSION_TYPES.MONTHLY,
    xpReward: 80,
    progress: 0,
    maxProgress: 30,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '20',
    name: 'Цел ориентиран',
    description: 'Създайте и постигнете 3 финансови цели за месеца',
    icon: '🎯',
    type: MISSION_TYPES.MONTHLY,
    xpReward: 100,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },

  // 🌟 СЕЗОННИ/ПРАЗНИЧНИ МИСИИ
  {
    id: '21',
    name: 'Коледен спестовник',
    description: 'Спестете за коледни подаръци без да надвишите бюджета',
    icon: '🎄',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 40,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: '2024-12-31T23:59:59',
    startedAt: new Date().toISOString(),
  },
  {
    id: '22',
    name: 'Пролетно почистване',
    description: 'Продайте 5 неизползвани вещи и добавете приходите',
    icon: '🌸',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 35,
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    expiresAt: '2024-05-31T23:59:59',
    startedAt: new Date().toISOString(),
  },
  {
    id: '23',
    name: 'Лятна ваканция',
    description: 'Спестете за лятна почивка за 3 месеца',
    icon: '🏖️',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 90,
    progress: 0,
    maxProgress: 3,
    isCompleted: false,
    expiresAt: '2024-08-31T23:59:59',
    startedAt: new Date().toISOString(),
  },

  // 🎮 ИНТЕРАКТИВНИ МИСИИ
  {
    id: '24',
    name: 'Финансова рулетка',
    description: 'Всеки ден получавате случайна категория - опитайте се да не харчите в нея',
    icon: '🎲',
    type: MISSION_TYPES.DAILY,
    xpReward: 15,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    startedAt: new Date().toISOString(),
  },
  {
    id: '25',
    name: 'Спринт спестяване',
    description: 'Спестете определена сума за 48 часа',
    icon: '🏃',
    type: MISSION_TYPES.SPECIAL,
    xpReward: 25,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 48 часа
    startedAt: new Date().toISOString(),
  },
  {
    id: '26',
    name: 'Финансов пъзел',
    description: 'Разгадайте защо разходите ви са се увеличили и намерете решение',
    icon: '🧩',
    type: MISSION_TYPES.WEEKLY,
    xpReward: 30,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  },
];

// Примерни награди
export const mockRewards: Reward[] = [
  {
    id: '1',
    name: 'Тъмна тема',
    description: 'Отключва тъмна тема за приложението',
    icon: '🌙',
    type: REWARD_TYPES.THEME,
    isUnlocked: false,
  },
  {
    id: '2',
    name: 'Разширена аналитика',
    description: 'Отключва допълнителни видове анализ и графики',
    icon: '📈',
    type: REWARD_TYPES.FEATURE,
    isUnlocked: false,
  },
  {
    id: '3',
    name: 'Значка "Финансов експерт"',
    description: 'Специална значка, която показва вашия напредък',
    icon: '🏅',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '4',
    name: 'FinTrack PRO съвети',
    description: 'Персонализирани седмични съвети за спестяване',
    icon: '💡',
    type: REWARD_TYPES.INSIGHT,
    isUnlocked: false,
  },
  {
    id: '5',
    name: 'Златна тема',
    description: 'Ексклузивна златна цветова схема за приложението',
    icon: '✨',
    type: REWARD_TYPES.THEME,
    isUnlocked: false,
  },
  
  // 🎯 НОВИ НАГРАДИ ЗА НОВИТЕ МИСИИ
  {
    id: '6',
    name: 'Детективска значка',
    description: 'Специална значка за откриване на скрити разходи',
    icon: '🕵️',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '7',
    name: 'Емоционална аналитика',
    description: 'Отключва разширени емоционални отчети и анализи',
    icon: '🎭',
    type: REWARD_TYPES.FEATURE,
    isUnlocked: false,
  },
  {
    id: '8',
    name: 'Еко тема',
    description: 'Зелена еко тема за приложението',
    icon: '🌱',
    type: REWARD_TYPES.THEME,
    isUnlocked: false,
  },
  {
    id: '9',
    name: 'Спестовна значка',
    description: 'Златна значка за постигнати спестявания',
    icon: '💰',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '10',
    name: 'Умни съвети',
    description: 'AI-генерирани персонализирани съвети за спестяване',
    icon: '🧠',
    type: REWARD_TYPES.INSIGHT,
    isUnlocked: false,
  },
  {
    id: '11',
    name: 'Шампионска корона',
    description: 'Ексклузивна корона за финансови шампиони',
    icon: '👑',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '12',
    name: 'Празнична тема',
    description: 'Специална тема за празници и сезони',
    icon: '🎄',
    type: REWARD_TYPES.THEME,
    isUnlocked: false,
  },
  {
    id: '13',
    name: 'Аналитична значка',
    description: 'Значка за напреднали финансови анализи',
    icon: '📊',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '14',
    name: 'Креативна значка',
    description: 'Значка за креативни спестовни решения',
    icon: '🎨',
    type: REWARD_TYPES.BADGE,
    isUnlocked: false,
  },
  {
    id: '15',
    name: 'Лятна тема',
    description: 'Свежа лятна цветова схема',
    icon: '🏖️',
    type: REWARD_TYPES.THEME,
    isUnlocked: false,
  },
];

// Примерен профил с гамификация - НУЛЕВ СТАРТ за нови потребители
export const mockGamificationProfile: GamificationProfile = {
  xp: 0, // Започваме от 0 XP
  level: 1, // Започваме от ниво 1
  streakDays: 0, // Няма streak в началото
  lastActiveDate: undefined, // Няма предишна активност
  achievements: mockAchievements.map(a => ({
    ...a,
    progress: 0, // Всички постижения започват от 0
    isCompleted: false, // Нищо не е завършено
    dateCompleted: undefined
  })),
  completedAchievements: 0, // Няма завършени постижения
  totalAchievements: mockAchievements.length,
  missions: {
    active: mockMissions.filter(m => !m.isCompleted), // Всички мисии са активни
    completed: [], // Няма завършени мисии
  },
  rewards: mockRewards.map(r => ({
    ...r,
    isUnlocked: false, // Всички награди са заключени
    dateUnlocked: undefined
  })),
}; 