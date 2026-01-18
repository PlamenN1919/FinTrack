import { 
  GamificationProfile, 
  Achievement, 
  Mission, 
  Reward,
  calculateLevelFromXP
} from '../models/gamification';
import { mockGamificationProfile } from '../data/gamificationData';
import { LEVEL_THRESHOLDS } from '../utils/constants';
import storageService from './StorageService';
import {
  getTodayDateString,
  isValidISODateString,
  getDaysDifference,
  isSameDay,
  isYesterday,
  normalizeDateToStartOfDay,
} from '../utils/dateUtils';

/**
 * Event emitter for gamification updates
 */
class GamificationEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(...args));
    }
  }
}

/**
 * Сервиз за управление на гамификацията в приложението.
 * Управлява постижения, мисии, опит (XP) и награди.
 */
class GamificationService {
  private profile: GamificationProfile;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  public eventEmitter: GamificationEventEmitter = new GamificationEventEmitter();
  
  constructor() {
    // Започваме с mock данните
    this.profile = {...mockGamificationProfile};
    // Стартираме async инициализация
    this.initPromise = this.initializeProfile();
    // Стартираме автоматично обновяване на мисии
    this.startAutoRefresh();
  }

  /**
   * Инициализира профила от съхранението
   */
  private async initializeProfile(): Promise<void> {
    try {
      const savedProfile = await storageService.loadGamification();
      if (savedProfile) {
        // Валидираме запазените данни
        if (this.isValidProfile(savedProfile)) {
          // Merge новите мисии и награди с запазените данни
          this.profile = {
            ...savedProfile,
            // Запазваме XP, level, streak и постижения от запазените данни
            // Но обновяваме мисиите и наградите с новите
            missions: {
              active: mockGamificationProfile.missions.active,
              completed: savedProfile.missions.completed || []
            },
            rewards: mockGamificationProfile.rewards,
            achievements: mockGamificationProfile.achievements
          };
          console.log('✅ Gamification profile loaded and updated with new missions');
          await this.saveProfile(); // Запазваме обновения профил
        } else {
          console.warn('⚠️ Invalid saved profile, using defaults');
          this.profile = {...mockGamificationProfile};
          await this.saveProfile();
        }
      } else {
        // Ако няма запазен профил, запазваме началния
        console.log('📝 No saved profile found, creating new one');
        this.profile = {...mockGamificationProfile};
        await this.saveProfile();
      }
      
      this.isInitialized = true;
      
      // Проверяваме дневния стрийк при инициализация
      this.checkDailyStreak();
      
      // Емитираме event че сме готови
      this.eventEmitter.emit('initialized', this.profile);
      this.eventEmitter.emit('profileUpdated', this.profile);
      
    } catch (error) {
      console.error('❌ Error initializing gamification profile:', error);
      this.isInitialized = true;
      // Дори при грешка, емитираме event с default профила
      this.eventEmitter.emit('initialized', this.profile);
    }
  }

  /**
   * Валидира профил структурата
   */
  private isValidProfile(profile: any): boolean {
    return profile && 
           typeof profile.xp === 'number' && 
           typeof profile.level === 'number' &&
           Array.isArray(profile.achievements) &&
           Array.isArray(profile.rewards) &&
           profile.missions &&
           Array.isArray(profile.missions.active) &&
           Array.isArray(profile.missions.completed);
  }

  /**
   * Запазва профила в съхранението
   */
  private async saveProfile(): Promise<void> {
    try {
      await storageService.saveGamification(this.profile);
      // Емитираме event за обновяване
      this.eventEmitter.emit('profileUpdated', this.profile);
    } catch (error) {
      console.error('❌ Error saving gamification profile:', error);
    }
  }

  /**
   * Subscription методи за компонентите
   */
  onProfileUpdated(callback: (profile: GamificationProfile) => void) {
    this.eventEmitter.on('profileUpdated', callback);
  }

  offProfileUpdated(callback: (profile: GamificationProfile) => void) {
    this.eventEmitter.off('profileUpdated', callback);
  }

  onInitialized(callback: (profile: GamificationProfile) => void) {
    if (this.isInitialized) {
      // Ако вече сме инициализирани, извикваме callback-а веднага
      callback(this.profile);
    } else {
      this.eventEmitter.on('initialized', callback);
    }
  }

  /**
   * Получава текущия профил на гамификация (синхронен)
   */
  getProfile(): GamificationProfile {
    return this.profile;
  }

  /**
   * Получава текущия профил на гамификация (асинхронен - чака инициализация)
   */
  async getProfileAsync(): Promise<GamificationProfile> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    return this.profile;
  }

  /**
   * Проверява дали е инициализиран
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Добавя опит към профила и актуализира нивото
   */
  addXP(amount: number): { xp: number; level: number; leveledUp: boolean; newRewards: Reward[] } {
    try {
      // Валидация на входните данни
      if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        console.warn('⚠️ Invalid XP amount:', amount);
        return {
          xp: this.profile.xp,
          level: this.profile.level,
          leveledUp: false,
          newRewards: []
        };
      }

      const oldLevel = this.profile.level;
      const oldXP = this.profile.xp;
      
      this.profile.xp += amount;
      this.profile.level = calculateLevelFromXP(this.profile.xp, LEVEL_THRESHOLDS);
      
      console.log(`🎯 Added ${amount} XP (${oldXP} → ${this.profile.xp})`);
      
      // Проверяваме дали има нови награди за отключване при level up
      const newRewards: Reward[] = [];
      if (this.profile.level > oldLevel) {
        console.log(`🎊 Level up! ${oldLevel} → ${this.profile.level}`);
        
        try {
          const availableRewards = this.getAvailableRewards();
          availableRewards.forEach(reward => {
            try {
              const unlockedReward = this.unlockReward(reward.id);
              if (unlockedReward) {
                newRewards.push(unlockedReward);
                console.log(`🏆 Unlocked reward: ${reward.name}`);
              }
            } catch (rewardError) {
              console.error('❌ Error unlocking reward:', rewardError);
            }
          });
        } catch (rewardsError) {
          console.error('❌ Error processing level up rewards:', rewardsError);
        }
      }
      
      // Запазваме промените
      this.saveProfile();
      
      // Връща информация за новото състояние и дали има повишение на нивото
      const result = {
        xp: this.profile.xp,
        level: this.profile.level,
        leveledUp: this.profile.level > oldLevel,
        newRewards
      };
      
      // Емитираме специален event за XP промяна
      this.eventEmitter.emit('xpAdded', { amount, result });
      
      return result;
    } catch (error) {
      console.error('❌ Critical error in addXP:', error);
      return {
        xp: this.profile.xp,
        level: this.profile.level,
        leveledUp: false,
        newRewards: []
      };
    }
  }
  
  /**
   * Актуализира прогреса на постижение
   */
  updateAchievementProgress(achievementId: string, progress: number): Achievement | null {
    try {
      // Валидация на входните данни
      if (!achievementId || typeof achievementId !== 'string') {
        console.warn('⚠️ Invalid achievement ID:', achievementId);
        return null;
      }

      if (typeof progress !== 'number' || isNaN(progress) || progress < 0) {
        console.warn('⚠️ Invalid progress value:', progress);
        return null;
      }

      const achievement = this.profile.achievements.find(a => a.id === achievementId);
      
      if (!achievement) {
        console.warn(`⚠️ Achievement ${achievementId} not found`);
        return null;
      }
      
      // Ако постижението вече е изпълнено, не променяме нищо
      if (achievement.isCompleted) {
        return achievement;
      }
      
      const oldProgress = achievement.progress;
      
      // Актуализираме прогреса
      achievement.progress = Math.min(progress, achievement.maxProgress);
      
      console.log(`📈 Achievement "${achievement.name}" progress: ${oldProgress} → ${achievement.progress}/${achievement.maxProgress}`);
      
      // Проверяваме дали постижението е изпълнено
      if (achievement.progress >= achievement.maxProgress && !achievement.isCompleted) {
        try {
          achievement.isCompleted = true;
          achievement.dateCompleted = new Date().toISOString();
          this.profile.completedAchievements += 1;
          
          console.log(`🎯 Achievement completed: ${achievement.name} (+${achievement.xpReward} XP)`);
          
          // Даваме XP за постижението
          this.addXP(achievement.xpReward);
          
          // Емитираме event за завършено постижение
          this.eventEmitter.emit('achievementCompleted', achievement);
        } catch (completionError) {
          console.error('❌ Error completing achievement:', completionError);
        }
      }
      
      // Запазваме промените
      this.saveProfile();
      
      return achievement;
    } catch (error) {
      console.error('❌ Critical error in updateAchievementProgress:', error);
      return null;
    }
  }
  
  /**
   * Стартира нова мисия
   */
  startMission(missionId: string): Mission | null {
    const mission = this.profile.missions.active.find(m => m.id === missionId);
    
    if (!mission) {
      console.warn(`⚠️ Mission ${missionId} not found`);
      return null;
    }
    
    mission.startedAt = new Date().toISOString();
    console.log(`🚀 Mission started: ${mission.name}`);
    
    this.saveProfile();
    return mission;
  }
  
  /**
   * Актуализира прогреса на мисия
   */
  updateMissionProgress(missionId: string, progress: number): Mission | null {
    const mission = this.profile.missions.active.find(m => m.id === missionId);
    
    if (!mission) {
      console.warn(`⚠️ Mission ${missionId} not found`);
      return null;
    }
    
    const oldProgress = mission.progress;
    
    // Актуализираме прогреса
    mission.progress = Math.min(progress, mission.maxProgress);
    
    console.log(`📈 Mission "${mission.name}" progress: ${oldProgress} → ${mission.progress}/${mission.maxProgress}`);
    
    // Проверяваме дали мисията е изпълнена
    if (mission.progress >= mission.maxProgress) {
      mission.isCompleted = true;
      mission.completedAt = new Date().toISOString();
      
      // Преместваме мисията от активни към изпълнени
      this.profile.missions.active = this.profile.missions.active.filter(m => m.id !== missionId);
      this.profile.missions.completed.push(mission);
      
      console.log(`✅ Mission completed: ${mission.name} (+${mission.xpReward} XP)`);
      
      // Даваме XP за мисията
      this.addXP(mission.xpReward);
      
      // Емитираме event за завършена мисия
      this.eventEmitter.emit('missionCompleted', mission);
    }
    
    this.saveProfile();
    return mission;
  }
  
  /**
   * Получава неотключени награди за текущото ниво (синхронна версия)
   */
  private getAvailableRewardsSync(): Reward[] {
    const availableRewards: Reward[] = [];
    const { level } = this.profile;
    
    this.profile.rewards.forEach(reward => {
      if (!reward.isUnlocked) {
        // Всяка награда има различно ниво за отключване
        switch(reward.id) {
          case '2': // Разширена аналитика
            if (level >= 4) availableRewards.push(reward);
            break;
          case '3': // Значка "Финансов експерт"
            if (level >= 5) availableRewards.push(reward);
            break;
          case '4': // FinTrack PRO съвети
            if (level >= 3) availableRewards.push(reward);
            break;
          case '5': // Златна тема
            if (level >= 7) availableRewards.push(reward);
            break;
        }
      }
    });
    
    return availableRewards;
  }

  /**
   * Отключва награда (синхронна версия)
   */
  private unlockRewardSync(rewardId: string): Reward | null {
    const reward = this.profile.rewards.find(r => r.id === rewardId);
    
    if (!reward || reward.isUnlocked) {
      return null;
    }
    
    reward.isUnlocked = true;
    reward.dateUnlocked = new Date().toISOString();
    
    return reward;
  }

  /**
   * Получава неотключени награди за текущото ниво
   */
  getAvailableRewards(): Reward[] {
    return this.getAvailableRewardsSync();
  }
  
  /**
   * Проверява напредъка на постижения въз основа на действието (ДЕКЛАРАТИВЕН ПОДХОД)
   */
  checkAchievementsForAction(action: string, metadata: any = {}): Achievement[] {
    console.log(`🔍 Checking achievements for action: ${action}`, metadata);
    
    const updatedAchievements: Achievement[] = [];

    this.profile.achievements.forEach(a => {
      // Проверяваме дали постижението има тригер и дали той съвпада с действието
      if (!a.trigger || a.trigger.action !== action || a.isCompleted) {
        return;
      }
      
      // Проверяваме опционалното условие
      if (a.trigger.condition && !a.trigger.condition(metadata, a.progress, this.profile)) {
        return;
      }
      
      // Изчисляваме и прилагаме новия прогрес
      const newProgress = a.trigger.progressUpdate(a.progress, metadata);
      if (newProgress > a.progress) {
        this.updateAchievementProgress(a.id, newProgress);
        updatedAchievements.push(a);
      }
    });

    return updatedAchievements;
  }
  
  /**
   * Проверява напредъка на мисии въз основа на действието (ДЕКЛАРАТИВЕН ПОДХОД)
   */
  checkMissionsForAction(action: string, metadata: any = {}): Mission[] {
    console.log(`🎯 Checking missions for action: ${action}`, metadata);
    
    // Първо проверяваме и премахваме изтеклите мисии
    this.cleanupExpiredMissions();
    
    const updatedMissions: Mission[] = [];

    this.profile.missions.active.forEach(m => {
      // Проверяваме дали мисията има тригер и дали той съвпада с действието
      if (!m.trigger || m.trigger.action !== action || m.isCompleted) {
        return;
      }
      
      // Проверяваме опционалното условие
      if (m.trigger.condition && !m.trigger.condition(metadata, m.progress, this.profile)) {
        return;
      }
      
      // Изчисляваме и прилагаме новия прогрес
      const newProgress = m.trigger.progressUpdate(m.progress, metadata);
      if (newProgress > m.progress) {
        this.updateMissionProgress(m.id, newProgress);
        updatedMissions.push(m);
      }
    });

    return updatedMissions;
  }

  /**
   * Почиства изтеклите мисии
   */
  private cleanupExpiredMissions(): void {
    const now = new Date();
    const expiredMissions = this.profile.missions.active.filter(mission => {
      const expiresAt = new Date(mission.expiresAt);
      return now > expiresAt;
    });

    if (expiredMissions.length > 0) {
      console.log(`🗑️ Cleaning up ${expiredMissions.length} expired missions`);
      
      // Премахваме expired мисии от активните
      this.profile.missions.active = this.profile.missions.active.filter(mission => {
        const expiresAt = new Date(mission.expiresAt);
        return now <= expiresAt;
      });
      
      // Можем да ги добавим към completed с flag че са expired
      expiredMissions.forEach(mission => {
        mission.isCompleted = false; // Mark as expired, not completed
        console.log(`⏰ Mission "${mission.name}" expired`);
      });
      
      this.saveProfile();
    }
  }
  
  /**
   * Проверява и актуализира стрийк при отваряне на приложението
   * ВАЖНО: Този метод САМО проверява streak при app startup
   * За streak актуализация при транзакции използвай updateStreakForTransaction()
   */
  checkDailyStreak(): number {
    try {
      const today = getTodayDateString(); // "2026-01-17" (ISO format)
      const lastActiveDate = this.profile.lastActiveDate;
      
      console.log(`🔍 Checking daily streak - Today: ${today}, Last active: ${lastActiveDate || 'Never'}`);
      
      // Ако няма запазена последна активна дата, това е първо отваряне
      if (!lastActiveDate || !isValidISODateString(lastActiveDate)) {
        console.log(`🎯 First time tracking streak - initializing with 0 days (waiting for first transaction)`);
        // НЕ задаваме streak = 1, защото потребителят още не е направил транзакция
        // Streak се увеличава САМО при updateStreakForTransaction()
        this.profile.streakDays = 0;
        this.profile.lastActiveDate = undefined;
        this.saveProfile();
        return this.profile.streakDays;
      }
      
      // Ако последната активна дата е днес, streak-ът е актуален
      if (lastActiveDate === today) {
        console.log(`✅ Streak already counted for today: ${this.profile.streakDays} days`);
        return this.profile.streakDays;
      }
      
      // Проверяваме дали streak-ът трябва да се нулира поради пропуснати дни
      // Streak се губи ако са минали 2+ дни БЕЗ активност
      const daysSinceLastActivity = getDaysDifference(today, lastActiveDate);
      
      if (daysSinceLastActivity > 1) {
        // Пропуснати дни - streak се нулира
        const oldStreak = this.profile.streakDays;
        
        console.log(`💔 Streak broken! ${daysSinceLastActivity} days since last activity. ${oldStreak} → 0 days`);
        
        this.profile.streakDays = 0;
        this.profile.lastActiveDate = undefined;
        
        // Емитираме event за счупен streak
        this.eventEmitter.emit('streakUpdated', { 
          oldStreak, 
          newStreak: 0, 
          hasActivity: false,
          isConsecutive: false,
          daysMissed: daysSinceLastActivity - 1,
          streakBroken: true
        });

        // Проверяваме постижения за streak reset
        this.checkAchievementsForAction('streak_updated', {
          oldStreak,
          newStreak: 0,
          isConsecutive: false,
          wasReset: true,
          streakBroken: true
        });
        
        this.saveProfile();
      }
      
      // Връщаме текущия streak (може да е нулиран или все още активен)
      return this.profile.streakDays;
      
    } catch (error) {
      console.error('❌ Critical error in checkDailyStreak:', error);
      // При критична грешка връщаме текущия streak без промени
      return this.profile.streakDays || 0;
    }
  }

  /**
   * Актуализира streak при добавяне на транзакция
   * ТОВА Е ОСНОВНИЯТ МЕТОД за streak management
   * 
   * @param transactionDate - Дата на транзакцията (ISO string YYYY-MM-DD)
   * @returns Обект с информация за streak промяната
   */
  updateStreakForTransaction(transactionDate: string): {
    streakDays: number;
    isNewStreak: boolean;
    isContinued: boolean;
    isFirstOfDay: boolean;
    wasReset: boolean;
  } {
    try {
      const today = getTodayDateString();
      const lastActiveDate = this.profile.lastActiveDate;
      
      // Валидация на датата на транзакцията
      if (!isValidISODateString(transactionDate)) {
        console.warn(`⚠️ Invalid transaction date: ${transactionDate}`);
        return {
          streakDays: this.profile.streakDays,
          isNewStreak: false,
          isContinued: false,
          isFirstOfDay: false,
          wasReset: false
        };
      }
      
      // Проверка дали транзакцията е от бъдещето
      const daysDiff = getDaysDifference(transactionDate, today);
      if (normalizeDateToStartOfDay(transactionDate) > normalizeDateToStartOfDay(today)) {
        console.warn(`⚠️ Transaction date is in the future: ${transactionDate}`);
        return {
          streakDays: this.profile.streakDays,
          isNewStreak: false,
          isContinued: false,
          isFirstOfDay: false,
          wasReset: false
        };
      }
      
      console.log(`🔍 Updating streak for transaction - Date: ${transactionDate}, Last active: ${lastActiveDate || 'Never'}`);
      
      const oldStreak = this.profile.streakDays;
      let isNewStreak = false;
      let isContinued = false;
      let isFirstOfDay = false;
      let wasReset = false;
      
      // СЛУЧАЙ 1: Първа транзакция изобщо (нов потребител)
      if (!lastActiveDate || !isValidISODateString(lastActiveDate)) {
        this.profile.streakDays = 1;
        this.profile.lastActiveDate = transactionDate;
        isNewStreak = true;
        isFirstOfDay = true;
        
        console.log(`🎯 First transaction ever! Streak started: 1 day`);
        
        // Емитираме event
        this.eventEmitter.emit('streakUpdated', { 
          oldStreak: 0, 
          newStreak: 1, 
          hasActivity: true,
          isConsecutive: false,
          isNewStreak: true
        });

        this.checkAchievementsForAction('streak_updated', {
          oldStreak: 0,
          newStreak: 1,
          isConsecutive: false,
          isNewStreak: true
        });
        
        this.saveProfile();
        return { streakDays: 1, isNewStreak: true, isContinued: false, isFirstOfDay: true, wasReset: false };
      }
      
      // СЛУЧАЙ 2: Транзакцията е от същия ден като последната активност
      if (transactionDate === lastActiveDate) {
        console.log(`✅ Additional transaction for same day (${transactionDate}). Streak unchanged: ${this.profile.streakDays} days`);
        return { 
          streakDays: this.profile.streakDays, 
          isNewStreak: false, 
          isContinued: false, 
          isFirstOfDay: false,
          wasReset: false 
        };
      }
      
      // Изчисляваме разликата в дни
      const daysSinceLastActivity = getDaysDifference(transactionDate, lastActiveDate);
      
      // СЛУЧАЙ 3: Транзакцията е от следващия ден (consecutive)
      if (daysSinceLastActivity === 1 && normalizeDateToStartOfDay(transactionDate) > normalizeDateToStartOfDay(lastActiveDate)) {
        this.profile.streakDays += 1;
        this.profile.lastActiveDate = transactionDate;
        isContinued = true;
        isFirstOfDay = true;
        
        console.log(`🔥 Consecutive day transaction! Streak: ${oldStreak} → ${this.profile.streakDays} days`);
        
        // Награда на всеки 7 дни
        if (this.profile.streakDays % 7 === 0) {
          console.log(`🎯 Weekly streak milestone! +25 XP for ${this.profile.streakDays} days streak`);
          this.addXP(25);
        }
        
        // Емитираме event
        this.eventEmitter.emit('streakUpdated', { 
          oldStreak, 
          newStreak: this.profile.streakDays, 
          hasActivity: true,
          isConsecutive: true,
          isContinued: true
        });

        this.checkAchievementsForAction('streak_updated', {
          oldStreak,
          newStreak: this.profile.streakDays,
          isConsecutive: true,
          isContinued: true
        });
        
        this.saveProfile();
        return { 
          streakDays: this.profile.streakDays, 
          isNewStreak: false, 
          isContinued: true, 
          isFirstOfDay: true,
          wasReset: false 
        };
      }
      
      // СЛУЧАЙ 4: Пропуснати дни - streak се нулира и започва отново
      if (daysSinceLastActivity > 1) {
        this.profile.streakDays = 1;
        this.profile.lastActiveDate = transactionDate;
        wasReset = true;
        isNewStreak = true;
        isFirstOfDay = true;
        
        console.log(`💔 Streak broken after ${daysSinceLastActivity} days gap. ${oldStreak} → 1 day (restarting)`);
        
        // Емитираме event
        this.eventEmitter.emit('streakUpdated', { 
          oldStreak, 
          newStreak: 1, 
          hasActivity: true,
          isConsecutive: false,
          daysMissed: daysSinceLastActivity - 1,
          wasReset: true,
          streakBroken: true
        });

        this.checkAchievementsForAction('streak_updated', {
          oldStreak,
          newStreak: 1,
          isConsecutive: false,
          wasReset: true,
          streakBroken: true
        });
        
        this.saveProfile();
        return { 
          streakDays: 1, 
          isNewStreak: true, 
          isContinued: false, 
          isFirstOfDay: true,
          wasReset: true 
        };
      }
      
      // СЛУЧАЙ 5: Транзакция от ПРЕДИ последната активност (backdated transaction)
      // Не актуализираме streak, защото не е consecutive
      console.log(`⏮️ Transaction is from before last activity (${transactionDate} < ${lastActiveDate}). Streak unchanged.`);
      return { 
        streakDays: this.profile.streakDays, 
        isNewStreak: false, 
        isContinued: false, 
        isFirstOfDay: false,
        wasReset: false 
      };
      
    } catch (error) {
      console.error('❌ Critical error in updateStreakForTransaction:', error);
      return {
        streakDays: this.profile.streakDays,
        isNewStreak: false,
        isContinued: false,
        isFirstOfDay: false,
        wasReset: false
      };
    }
  }

  /**
   * Актуализира броя последователни дни (DEPRECATED - използвайте checkDailyStreak)
   * @deprecated Използвайте checkDailyStreak() за автоматично проследяване на дни
   */
  updateStreak(hasActivity: boolean): number {
    console.log('⚠️ updateStreak is deprecated. Use checkDailyStreak() instead.');
    return this.checkDailyStreak();
  }

  /**
   * Отключва награда (публичен метод)
   */
  unlockReward(rewardId: string): Reward | null {
    const reward = this.unlockRewardSync(rewardId);
    if (reward) {
      console.log(`🎁 Reward unlocked: ${reward.name}`);
      this.saveProfile();
      this.eventEmitter.emit('rewardUnlocked', reward);
    }
    return reward;
  }

  /**
   * Проверява дали потребителят е завършил дневната си активност
   */
  checkDailyActivityCompletion(): boolean {
    const today = new Date().toDateString();
    const todayTransactions = this.getTransactionsForDate(today);
    
    // Ако има поне една транзакция днес, смятаме че дневната активност е завършена
    if (todayTransactions.length > 0) {
      // Задействаме мисиите за дневна активност
      this.checkMissionsForAction('daily_activity_completed', {
        transactionCount: todayTransactions.length,
        date: today
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Проверява дали няма разходи за забавления днес (за мисии)
   */
  checkNoEntertainmentToday(): void {
    const today = new Date().toDateString();
    const todayTransactions = this.getTransactionsForDate(today);
    
    const entertainmentExpenses = todayTransactions.filter(t => 
      t.category === 'Забавления' && t.amount < 0
    );
    
    if (entertainmentExpenses.length === 0) {
      // Няма разходи за забавления днес
      this.checkMissionsForAction('no_entertainment_day', {
        date: today
      });
    }
  }

  /**
   * Помощна функция за получаване на транзакции за определена дата
   */
  private getTransactionsForDate(dateString: string): any[] {
    if (!this.transactionsData || this.transactionsData.length === 0) {
      console.log(`📅 No transactions data available for date: ${dateString}`);
      return [];
    }
    
    const targetDate = new Date(dateString).toDateString();
    const filteredTransactions = this.transactionsData.filter(transaction => {
      const transactionDate = new Date(transaction.date).toDateString();
      return transactionDate === targetDate;
    });
    
    console.log(`📅 Found ${filteredTransactions.length} transactions for date: ${dateString}`);
    return filteredTransactions;
  }

  /**
   * Публичен метод за подаване на информация за транзакции
   */
  setTransactionsData(transactions: any[]): void {
    this.transactionsData = transactions;
  }

  private transactionsData: any[] = [];

  /**
   * Извиква се когато потребителят преглежда отчет
   */
  onReportViewed(reportType: string): void {
    console.log(`📊 Report viewed: ${reportType}`);
    this.checkAchievementsForAction('view_report', { reportType });
    this.checkMissionsForAction('view_report', { reportType });
  }

  /**
   * Извиква се когато се обновява финансовото здраве
   */
  onFinancialHealthUpdated(healthScore: number, factors: any): void {
    console.log(`💚 Financial health updated: ${healthScore}%`);
    this.checkAchievementsForAction('financial_health_updated', { 
      healthScore, 
      factors 
    });
  }

  /**
   * Извиква се при постигане на финансова цел
   */
  onGoalAchieved(goalData: any): void {
    console.log(`🎯 Goal achieved:`, goalData);
    this.checkAchievementsForAction('goal_achieved', goalData);
  }

  /**
   * Извиква се при анализ на седмичните разходи
   */
  onWeeklyAnalysisCompleted(analysisData: any): void {
    console.log(`🔍 Weekly analysis completed:`, analysisData);
    this.checkMissionsForAction('weekly_analysis', analysisData);
  }

  /**
   * Извиква се при проверка на бюджетно спазване
   */
  onBudgetComplianceCheck(budgetData: any): void {
    console.log(`💼 Budget compliance check:`, budgetData);
    this.checkAchievementsForAction('budget_check', budgetData);
    this.checkMissionsForAction('budget_compliance_check', budgetData);
  }

  /**
   * Извиква се при проверка на спестявания
   */
  onSavingsCheck(savingsData: any): void {
    console.log(`🐖 Savings check:`, savingsData);
    this.checkAchievementsForAction('savings_check', savingsData);
  }

  /**
   * Извиква се при оптимизация на разходи
   */
  onExpenseOptimization(optimizationData: any): void {
    console.log(`✂️ Expense optimization:`, optimizationData);
    this.checkAchievementsForAction('expense_optimization', optimizationData);
  }

  /**
   * Reset профила (за тестване или нов потребител)
   */
  resetProfile(): void {
    console.log('🔄 Resetting gamification profile to defaults (fresh start)');
    
    // Създаваме напълно нов профил от нулата
    this.profile = {
      xp: 0,
      level: 1,
      streakDays: 0,
      lastActiveDate: undefined,
      achievements: mockGamificationProfile.achievements.map(a => ({
        ...a,
        progress: 0,
        isCompleted: false,
        dateCompleted: undefined
      })),
      completedAchievements: 0,
      totalAchievements: mockGamificationProfile.achievements.length,
      missions: {
        active: mockGamificationProfile.missions.active,
        completed: []
      },
      rewards: mockGamificationProfile.rewards.map(r => ({
        ...r,
        isUnlocked: false,
        dateUnlocked: undefined
      }))
    };
    
    this.saveProfile();
    this.eventEmitter.emit('profileReset', this.profile);
    console.log('✅ Profile reset complete - starting from zero!');
  }

  /**
   * Export профила (за backup)
   */
  exportProfile(): GamificationProfile {
    return JSON.parse(JSON.stringify(this.profile));
  }

  /**
   * Import профила (от backup)
   */
  async importProfile(profileData: GamificationProfile): Promise<boolean> {
    try {
      if (this.isValidProfile(profileData)) {
        this.profile = profileData;
        await this.saveProfile();
        console.log('✅ Profile imported successfully');
        return true;
      } else {
        console.error('❌ Invalid profile data for import');
        return false;
      }
    } catch (error) {
      console.error('❌ Error importing profile:', error);
      return false;
    }
  }

  /**
   * Test метод за проверка на интегрирането (за развитие)
   */
  testGamificationFlow(): void {
    console.log('🧪 Testing gamification flow...');
    console.log('Current profile:', {
      xp: this.profile.xp,
      level: this.profile.level,
      streakDays: this.profile.streakDays,
      completedAchievements: this.profile.completedAchievements,
      activeMissions: this.profile.missions.active.length,
      unlockedRewards: this.profile.rewards.filter(r => r.isUnlocked).length,
    });

    // Симулирам добавяне на транзакция
    console.log('🔄 Simulating transaction addition...');
    this.checkAchievementsForAction('add_transaction', {
      category: 'Храна',
      amount: -25.50,
      emotionalState: 'happy',
      isScanned: false,
    });

    this.addXP(5);

    console.log('✅ Test completed. New profile state:', {
      xp: this.profile.xp,
      level: this.profile.level,
      streakDays: this.profile.streakDays,
      isInitialized: this.isInitialized,
    });
  }

  /**
   * Принудително обновява мисиите и наградите с най-новите данни
   */
  refreshMissionsAndRewards(): void {
    console.log('🔄 Refreshing missions and rewards with latest data...');
    
    // Запазваме завършените мисии
    const completedMissions = this.profile.missions.completed || [];
    
    // Обновяваме с новите мисии и награди
    this.profile.missions = {
      active: mockGamificationProfile.missions.active,
      completed: completedMissions
    };
    this.profile.rewards = mockGamificationProfile.rewards;
    this.profile.achievements = mockGamificationProfile.achievements;
    
    // Запазваме промените
    this.saveProfile();
    
    console.log(`✅ Updated with ${this.profile.missions.active.length} active missions and ${this.profile.rewards.length} rewards`);
  }

  /**
   * Debug информация за профила
   */
  getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      profile: {
        xp: this.profile.xp,
        level: this.profile.level,
        streakDays: this.profile.streakDays,
        achievements: {
          total: this.profile.achievements.length,
          completed: this.profile.achievements.filter(a => a.isCompleted).length,
          inProgress: this.profile.achievements.filter(a => !a.isCompleted && a.progress > 0).length,
        },
        missions: {
          active: this.profile.missions.active.length,
          completed: this.profile.missions.completed.length,
        },
        rewards: {
          total: this.profile.rewards.length,
          unlocked: this.profile.rewards.filter(r => r.isUnlocked).length,
        }
      }
    };
  }

  /**
   * Автоматично обновяване на мисии (извиква се периодично)
   * Почиства изтеклите мисии и генерира нови дневни/седмични мисии
   */
  autoRefreshMissions(): void {
    try {
      console.log('🔄 Auto-refreshing missions...');
      
      // Почистваме изтеклите мисии
      this.cleanupExpiredMissions();
      
      // Проверяваме дали трябва да генерираме нови дневни мисии
      const today = new Date().toDateString();
      const lastRefresh = this.profile.lastActiveDate;
      
      if (lastRefresh !== today) {
        console.log('📅 Generating new daily missions for today');
        // Тук може да добавим логика за генериране на нови дневни мисии
        // За момента само обновяваме датата
        this.profile.lastActiveDate = today;
        this.saveProfile();
      }
      
      console.log('✅ Missions refreshed successfully');
    } catch (error) {
      console.error('❌ Error auto-refreshing missions:', error);
    }
  }

  /**
   * Стартира автоматично обновяване на мисии (извиква се при инициализация)
   */
  startAutoRefresh(): void {
    // Проверяваме веднъж при стартиране
    this.autoRefreshMissions();
    
    // Настройваме интервал за проверка на всеки 1 час
    setInterval(() => {
      this.autoRefreshMissions();
    }, 60 * 60 * 1000); // 1 час
  }

  /**
   * Изчиства профила (за logout или нов потребител)
   */
  async clearProfile(): Promise<void> {
    try {
      console.log('🗑️ Clearing gamification profile...');
      
      // Изчистваме от storage
      await storageService.saveGamification(null);
      
      // Reset-ваме в паметта
      this.resetProfile();
      
      console.log('✅ Profile cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing profile:', error);
    }
  }

  /**
   * Проверява дали профилът е нов (без прогрес)
   */
  isNewProfile(): boolean {
    return this.profile.xp === 0 && 
           this.profile.level === 1 && 
           this.profile.completedAchievements === 0 &&
           this.profile.missions.completed.length === 0;
  }
}

// Създаваме и експортираме единична инстанция на сервиза (singleton)
export const gamificationService = new GamificationService();
export default gamificationService; 