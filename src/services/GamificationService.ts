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
  private eventEmitter: GamificationEventEmitter = new GamificationEventEmitter();
  
  constructor() {
    // Започваме с mock данните
    this.profile = {...mockGamificationProfile};
    // Стартираме async инициализация
    this.initPromise = this.initializeProfile();
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
   * Проверява напредъка на постижения въз основа на действието
   */
  checkAchievementsForAction(action: string, metadata: any = {}): Achievement[] {
    console.log(`🔍 Checking achievements for action: ${action}`, metadata);
    
    const achievementsToUpdate: Achievement[] = [];
    
    if (action === 'add_transaction') {
      // Постижение "Първи стъпки" - само ако все още не е завършено
      const firstStepsAchievement = this.profile.achievements.find(a => a.id === '1');
      if (firstStepsAchievement && !firstStepsAchievement.isCompleted && firstStepsAchievement.progress === 0) {
        this.updateAchievementProgress(firstStepsAchievement.id, 1);
        achievementsToUpdate.push(firstStepsAchievement);
      }
      
      // Постижение "Емоционално осъзнат" - ако транзакцията има емоционално състояние
      if (metadata.emotionalState && metadata.emotionalState !== 'neutral') {
        const emotionalAchievement = this.profile.achievements.find(a => a.id === '7');
        if (emotionalAchievement && !emotionalAchievement.isCompleted) {
          this.updateAchievementProgress(emotionalAchievement.id, emotionalAchievement.progress + 1);
          achievementsToUpdate.push(emotionalAchievement);
        }
      }

      // Постижение "QR скенер" - ако транзакцията е от сканиране
      if (metadata.isScanned) {
        const scannerAchievement = this.profile.achievements.find(a => a.id === '9');
        if (scannerAchievement && !scannerAchievement.isCompleted) {
          this.updateAchievementProgress(scannerAchievement.id, scannerAchievement.progress + 1);
          achievementsToUpdate.push(scannerAchievement);
        }
      }
    }
    
    if (action === 'streak_updated') {
      // Постижение "Последователен" - базирано на streak дни
      const consistencyAchievement = this.profile.achievements.find(a => a.id === '5');
      if (consistencyAchievement && !consistencyAchievement.isCompleted) {
        this.updateAchievementProgress(consistencyAchievement.id, this.profile.streakDays);
        achievementsToUpdate.push(consistencyAchievement);
      }
    }
    
    if (action === 'view_report') {
      // Постижение "Финансов анализатор" - прегледайте отчети
      const analyzerAchievement = this.profile.achievements.find(a => a.id === '4');
      if (analyzerAchievement && !analyzerAchievement.isCompleted) {
        this.updateAchievementProgress(analyzerAchievement.id, analyzerAchievement.progress + 1);
        achievementsToUpdate.push(analyzerAchievement);
      }
    }
    
    if (action === 'financial_health_updated') {
      // Постижение "Финансов гуру" - финансов здравен индекс
      if (metadata.healthScore && metadata.healthScore >= 90) {
        const guruAchievement = this.profile.achievements.find(a => a.id === '8');
        if (guruAchievement && !guruAchievement.isCompleted) {
          this.updateAchievementProgress(guruAchievement.id, metadata.healthScore);
          achievementsToUpdate.push(guruAchievement);
        }
      }
    }
    
    if (action === 'budget_check') {
      // Постижение "Бюджетен майстор" - спазвайте бюджети
      if (metadata.budgetCompliance && metadata.daysInBudget) {
        const budgetMasterAchievement = this.profile.achievements.find(a => a.id === '2');
        if (budgetMasterAchievement && !budgetMasterAchievement.isCompleted) {
          this.updateAchievementProgress(budgetMasterAchievement.id, metadata.daysInBudget);
          achievementsToUpdate.push(budgetMasterAchievement);
        }
      }
    }
    
    if (action === 'savings_check') {
      // Постижение "Спестовник" - спестете 10% от доход
      if (metadata.savingsRate && metadata.consecutiveMonths) {
        const saverAchievement = this.profile.achievements.find(a => a.id === '3');
        if (saverAchievement && !saverAchievement.isCompleted && metadata.savingsRate >= 0.10) {
          this.updateAchievementProgress(saverAchievement.id, metadata.consecutiveMonths);
          achievementsToUpdate.push(saverAchievement);
        }
      }
    }
    
    if (action === 'goal_achieved') {
      // Постижение "Целеустремен" - постигнете финансови цели
      const goalAchievement = this.profile.achievements.find(a => a.id === '6');
      if (goalAchievement && !goalAchievement.isCompleted) {
        this.updateAchievementProgress(goalAchievement.id, goalAchievement.progress + 1);
        achievementsToUpdate.push(goalAchievement);
      }
    }
    
    if (action === 'expense_optimization') {
      // Постижение "Оптимизатор на разходи" - намалете разходи с 20%
      if (metadata.reductionPercentage && metadata.reductionPercentage >= 20) {
        const optimizerAchievement = this.profile.achievements.find(a => a.id === '10');
        if (optimizerAchievement && !optimizerAchievement.isCompleted) {
          this.updateAchievementProgress(optimizerAchievement.id, metadata.reductionPercentage);
          achievementsToUpdate.push(optimizerAchievement);
        }
      }
    }
    
    return achievementsToUpdate;
  }
  
  /**
   * Проверява напредъка на мисии въз основа на действието
   */
  checkMissionsForAction(action: string, metadata: any = {}): Mission[] {
    console.log(`🎯 Checking missions for action: ${action}`, metadata);
    
    // Първо проверяваме и премахваме expired мисии
    this.cleanupExpiredMissions();
    
    const missionsToUpdate: Mission[] = [];
    
    if (action === 'daily_activity_completed') {
      // Мисия "Проследяване на дневните разходи" - завършва се веднъж на ден
      const trackingMission = this.profile.missions.active.find(m => m.id === '1' && m.type === 'daily');
      if (trackingMission && !trackingMission.isCompleted) {
        this.updateMissionProgress(trackingMission.id, 1); // Set to completed
        missionsToUpdate.push(trackingMission);
      }
    }
    
    if (action === 'add_transaction') {
      // Мисия "Ограничете ненужните разходи" - проверяваме ако правим разходи за забавления
      if (metadata.category === 'Забавления' && metadata.amount < 0) {
        const limitMission = this.profile.missions.active.find(m => m.id === '4');
        if (limitMission && !limitMission.isCompleted) {
          // При разход за забавления - reset прогреса или penalize
          console.log(`💸 Entertainment expense detected - mission "${limitMission.name}" progress affected`);
          // Можем да reset-нем прогреса или да го оставим както е
          // За сега ще го оставим както е, но ще log-нем
        }
      }
      
      // Мисия "Оптимизирайте храната" - проверяваме бюджет за храна
      if (metadata.category === 'Храна' && metadata.amount < 0) {
        const foodMission = this.profile.missions.active.find(m => m.id === '2');
        if (foodMission && !foodMission.isCompleted && metadata.withinBudget) {
          this.updateMissionProgress(foodMission.id, foodMission.progress + 1);
          missionsToUpdate.push(foodMission);
        }
      }
    }
    
    if (action === 'view_report') {
      // Мисия "Проучване на отчети"
      const reportMission = this.profile.missions.active.find(m => m.id === '3');
      if (reportMission && !reportMission.isCompleted) {
        this.updateMissionProgress(reportMission.id, reportMission.progress + 1);
        missionsToUpdate.push(reportMission);
      }
    }
    
    if (action === 'weekly_analysis') {
      // Мисия "Финансов преглед на седмицата"
      const weeklyMission = this.profile.missions.active.find(m => m.id === '5');
      if (weeklyMission && !weeklyMission.isCompleted) {
        this.updateMissionProgress(weeklyMission.id, weeklyMission.progress + 1);
        missionsToUpdate.push(weeklyMission);
      }
    }
    
    if (action === 'budget_compliance_check') {
      // Проверяваме дали сме в бюджет за различни мисии
      if (metadata.category === 'Храна' && metadata.isWithinBudget) {
        const foodMission = this.profile.missions.active.find(m => m.id === '2');
        if (foodMission && !foodMission.isCompleted) {
          this.updateMissionProgress(foodMission.id, foodMission.progress + 1);
          missionsToUpdate.push(foodMission);
        }
      }
    }
    
    if (action === 'no_entertainment_day') {
      // Мисия "Ограничете ненужните разходи" - ден без разходи за забавления
      const limitMission = this.profile.missions.active.find(m => m.id === '4');
      if (limitMission && !limitMission.isCompleted) {
        this.updateMissionProgress(limitMission.id, limitMission.progress + 1);
        missionsToUpdate.push(limitMission);
      }
    }
    
    return missionsToUpdate;
  }

  /**
   * Почиства expired мисии
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
   */
  checkDailyStreak(): number {
    try {
      const today = new Date().toDateString(); // Получаваме днешната дата в формат "Wed Oct 05 2011"
      const lastActiveDate = this.profile.lastActiveDate;
      
      // Ако няма запазена последна активна дата, това е първо отваряне
      if (!lastActiveDate) {
        this.profile.streakDays = 1;
        this.profile.lastActiveDate = today;
        console.log(`🎯 First time opening app today! Streak: 1 day`);
        this.saveProfile();
        return this.profile.streakDays;
      }
      
      // Ако последната активна дата е днес, не правим нищо
      if (lastActiveDate === today) {
        console.log(`✅ Already opened app today. Streak: ${this.profile.streakDays} days`);
        return this.profile.streakDays;
      }
      
      // Изчисляваме разликата в дни
      try {
        const lastDate = new Date(lastActiveDate);
        const todayDate = new Date(today);
        
        // Проверяваме дали датите са валидни
        if (isNaN(lastDate.getTime()) || isNaN(todayDate.getTime())) {
          console.warn('⚠️ Invalid dates detected, resetting streak');
          this.profile.streakDays = 1;
          this.profile.lastActiveDate = today;
          this.saveProfile();
          return this.profile.streakDays;
        }
        
        const daysDifference = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const oldStreak = this.profile.streakDays;
        
        if (daysDifference === 1) {
          // Това е следващия ден - увеличаваме стрийка
          this.profile.streakDays += 1;
          this.profile.lastActiveDate = today;
          
          console.log(`🔥 Consecutive day! Streak: ${oldStreak} → ${this.profile.streakDays} days`);
          
          // На всеки 7 дни последователно активност даваме допълнителен XP
          if (this.profile.streakDays % 7 === 0) {
            console.log(`🎯 Weekly streak bonus! +25 XP`);
            this.addXP(25);
          }
          
          // Емитираме event за streak промяна
          this.eventEmitter.emit('streakUpdated', { 
            oldStreak, 
            newStreak: this.profile.streakDays, 
            hasActivity: true,
            isConsecutive: true
          });

          // Проверяваме постижения за streak update
          this.checkAchievementsForAction('streak_updated', {
            oldStreak,
            newStreak: this.profile.streakDays,
            isConsecutive: true
          });
          
        } else {
          // Пропуснати дни - нулираме стрийка и започваме отново
          this.profile.streakDays = 1; // Започваме отново от 1 за днес
          this.profile.lastActiveDate = today;
          
          if (oldStreak > 0) {
            console.log(`💔 Streak broken after ${daysDifference} days gap. ${oldStreak} → 1 day`);
          } else {
            console.log(`🎯 Starting new streak: 1 day`);
          }
          
          // Емитираме event за streak промяна
          this.eventEmitter.emit('streakUpdated', { 
            oldStreak, 
            newStreak: this.profile.streakDays, 
            hasActivity: true,
            isConsecutive: false,
            daysMissed: daysDifference - 1
          });

          // Проверяваме постижения за streak update (reset случай)
          this.checkAchievementsForAction('streak_updated', {
            oldStreak,
            newStreak: this.profile.streakDays,
            isConsecutive: false,
            wasReset: true
          });
        }
      } catch (dateError) {
        console.error('❌ Error calculating date difference:', dateError);
        // При грешка reset-ваме streak-а
        this.profile.streakDays = 1;
        this.profile.lastActiveDate = today;
      }
      
      this.saveProfile();
      return this.profile.streakDays;
    } catch (error) {
      console.error('❌ Critical error in checkDailyStreak:', error);
      // При критична грешка връщаме текущия streak
      return this.profile.streakDays || 1;
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
   * Reset профила (за тестване)
   */
  resetProfile(): void {
    console.log('🔄 Resetting gamification profile to defaults');
    this.profile = {...mockGamificationProfile};
    this.saveProfile();
    this.eventEmitter.emit('profileReset', this.profile);
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
}

// Създаваме и експортираме единична инстанция на сервиза (singleton)
export const gamificationService = new GamificationService();
export default gamificationService; 