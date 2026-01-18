/**
 * Unit тестове за streak логиката в GamificationService
 * Покрива всички edge cases и сценарии
 */

import gamificationService from '../GamificationService';
import {
  getTodayDateString,
  getDateDaysAgo,
  timestampToDateString,
} from '../../utils/dateUtils';

describe('GamificationService - Streak Logic', () => {
  beforeEach(() => {
    // Reset-ваме профила преди всеки тест
    gamificationService.resetProfile();
  });

  describe('updateStreakForTransaction - Базова функционалност', () => {
    test('Първа транзакция създава streak от 1 ден', () => {
      const today = getTodayDateString();
      const result = gamificationService.updateStreakForTransaction(today);

      expect(result.streakDays).toBe(1);
      expect(result.isNewStreak).toBe(true);
      expect(result.isFirstOfDay).toBe(true);
      expect(result.isContinued).toBe(false);
      expect(result.wasReset).toBe(false);

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
      expect(profile.lastActiveDate).toBe(today);
    });

    test('Втора транзакция на същия ден НЕ увеличава streak', () => {
      const today = getTodayDateString();
      
      // Първа транзакция
      gamificationService.updateStreakForTransaction(today);
      
      // Втора транзакция на същия ден
      const result = gamificationService.updateStreakForTransaction(today);

      expect(result.streakDays).toBe(1);
      expect(result.isNewStreak).toBe(false);
      expect(result.isFirstOfDay).toBe(false);
      expect(result.isContinued).toBe(false);

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
    });

    test('Транзакция на следващия ден увеличава streak на 2', () => {
      const yesterday = getDateDaysAgo(1);
      const today = getTodayDateString();
      
      // Транзакция вчера
      gamificationService.updateStreakForTransaction(yesterday);
      expect(gamificationService.getProfile().streakDays).toBe(1);
      
      // Транзакция днес
      const result = gamificationService.updateStreakForTransaction(today);

      expect(result.streakDays).toBe(2);
      expect(result.isNewStreak).toBe(false);
      expect(result.isContinued).toBe(true);
      expect(result.isFirstOfDay).toBe(true);

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(2);
      expect(profile.lastActiveDate).toBe(today);
    });

    test('Пропуснат 1 ден (gap от 2 дни) нулира streak', () => {
      const threeDaysAgo = getDateDaysAgo(3);
      const today = getTodayDateString();
      
      // Транзакция преди 3 дни
      gamificationService.updateStreakForTransaction(threeDaysAgo);
      expect(gamificationService.getProfile().streakDays).toBe(1);
      
      // Транзакция днес (пропуснати 2 дни между тях)
      const result = gamificationService.updateStreakForTransaction(today);

      expect(result.streakDays).toBe(1);
      expect(result.wasReset).toBe(true);
      expect(result.isNewStreak).toBe(true);

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
      expect(profile.lastActiveDate).toBe(today);
    });
  });

  describe('updateStreakForTransaction - Consecutive days (7+ дни)', () => {
    test('7 consecutive дни дават streak bonus', () => {
      const mockAddXP = jest.spyOn(gamificationService, 'addXP');
      
      // Симулираме 7 последователни дни
      for (let i = 6; i >= 0; i--) {
        const date = getDateDaysAgo(i);
        gamificationService.updateStreakForTransaction(date);
      }

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(7);
      
      // Проверяваме дали е даден bonus XP на 7-я ден
      expect(mockAddXP).toHaveBeenCalledWith(25);
      
      mockAddXP.mockRestore();
    });

    test('14 consecutive дни дават 2 streak bonuses', () => {
      const mockAddXP = jest.spyOn(gamificationService, 'addXP');
      
      // Симулираме 14 последователни дни
      for (let i = 13; i >= 0; i--) {
        const date = getDateDaysAgo(i);
        gamificationService.updateStreakForTransaction(date);
      }

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(14);
      
      // Проверяваме дали има 2 bonus XP calls (на 7-я и 14-я ден)
      expect(mockAddXP).toHaveBeenCalledTimes(14 + 2); // 14 транзакции (по 5 XP) + 2 bonuses (по 25 XP)
      
      mockAddXP.mockRestore();
    });

    test('30 consecutive дни постигат achievement "Последователен"', () => {
      // Симулираме 30 последователни дни
      for (let i = 29; i >= 0; i--) {
        const date = getDateDaysAgo(i);
        gamificationService.updateStreakForTransaction(date);
      }

      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(30);
      
      // Проверяваме дали achievement-ът е завършен
      const streakAchievement = profile.achievements.find(a => a.id === '5');
      expect(streakAchievement).toBeDefined();
      expect(streakAchievement?.progress).toBe(30);
      expect(streakAchievement?.isCompleted).toBe(true);
    });
  });

  describe('updateStreakForTransaction - Edge cases', () => {
    test('Невалидна дата връща текущия streak без промяна', () => {
      const today = getTodayDateString();
      
      // Създаваме streak от 1 ден
      gamificationService.updateStreakForTransaction(today);
      
      // Опит с невалидна дата
      const result = gamificationService.updateStreakForTransaction('invalid-date');

      expect(result.streakDays).toBe(1);
      expect(result.isNewStreak).toBe(false);
      expect(result.isContinued).toBe(false);
      expect(result.isFirstOfDay).toBe(false);
    });

    test('Транзакция от бъдещето се игнорира', () => {
      const today = getTodayDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = timestampToDateString(tomorrow.getTime());
      
      // Транзакция днес
      gamificationService.updateStreakForTransaction(today);
      
      // Опит за транзакция утре
      const result = gamificationService.updateStreakForTransaction(tomorrowStr);

      expect(result.streakDays).toBe(1);
      expect(result.isNewStreak).toBe(false);
      expect(result.isContinued).toBe(false);
      
      // Streak остава непроменен
      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
      expect(profile.lastActiveDate).toBe(today);
    });

    test('Backdated транзакция НЕ променя streak', () => {
      const yesterday = getDateDaysAgo(1);
      const today = getTodayDateString();
      const twoDaysAgo = getDateDaysAgo(2);
      
      // Транзакция вчера
      gamificationService.updateStreakForTransaction(yesterday);
      expect(gamificationService.getProfile().streakDays).toBe(1);
      
      // Транзакция днес (streak става 2)
      gamificationService.updateStreakForTransaction(today);
      expect(gamificationService.getProfile().streakDays).toBe(2);
      
      // Backdated транзакция от преди 2 дни (НЕ трябва да промени streak)
      const result = gamificationService.updateStreakForTransaction(twoDaysAgo);

      expect(result.streakDays).toBe(2);
      expect(result.isFirstOfDay).toBe(false);
      
      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(2);
      expect(profile.lastActiveDate).toBe(today); // Остава непроменена
    });
  });

  describe('checkDailyStreak - При app startup', () => {
    test('Първо отваряне на апа инициализира streak на 0', () => {
      const streak = gamificationService.checkDailyStreak();

      expect(streak).toBe(0);
      
      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(0);
      expect(profile.lastActiveDate).toBeUndefined();
    });

    test('Отваряне на апа същия ден НЕ променя streak', () => {
      const today = getTodayDateString();
      
      // Създаваме streak чрез транзакция
      gamificationService.updateStreakForTransaction(today);
      expect(gamificationService.getProfile().streakDays).toBe(1);
      
      // "Рестартираме" апа (checkDailyStreak)
      const streak = gamificationService.checkDailyStreak();

      expect(streak).toBe(1);
      
      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
    });

    test('Отваряне на апа след пропуснати дни нулира streak', () => {
      const threeDaysAgo = getDateDaysAgo(3);
      
      // Създаваме streak преди 3 дни
      gamificationService.updateStreakForTransaction(threeDaysAgo);
      
      // Променяме профила за да симулираме че сме във вчерашния ден
      const profile = gamificationService.getProfile();
      profile.lastActiveDate = threeDaysAgo;
      profile.streakDays = 5; // Имаме streak от 5 дни
      
      // "Отваряме" апа днес (след 3 дни gap)
      const streak = gamificationService.checkDailyStreak();

      expect(streak).toBe(0);
      
      const updatedProfile = gamificationService.getProfile();
      expect(updatedProfile.streakDays).toBe(0);
      expect(updatedProfile.lastActiveDate).toBeUndefined();
    });
  });

  describe('Integration - Реален workflow', () => {
    test('Реалистичен сценарий: 10 дни с транзакции, после gap, после restart', () => {
      // Дни 1-10: Последователни транзакции
      for (let i = 9; i >= 0; i--) {
        const date = getDateDaysAgo(i);
        const result = gamificationService.updateStreakForTransaction(date);
        console.log(`Day ${10 - i}: streak = ${result.streakDays}`);
      }
      
      let profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(10);
      
      // Симулираме че минават 5 дни БЕЗ транзакции
      // Променяме lastActiveDate на преди 5 дни
      profile.lastActiveDate = getDateDaysAgo(5);
      
      // "Отваряме" апа днес - streak трябва да се нулира
      gamificationService.checkDailyStreak();
      
      profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(0);
      
      // Добавяме нова транзакция днес - streak започва отново
      const today = getTodayDateString();
      const result = gamificationService.updateStreakForTransaction(today);
      
      expect(result.streakDays).toBe(1);
      expect(result.isNewStreak).toBe(true);
      expect(result.wasReset).toBe(false); // Не е reset, защото streak вече беше 0
    });

    test('Множество транзакции на един ден броят streak само веднъж', () => {
      const today = getTodayDateString();
      
      // Добавяме 5 транзакции на същия ден
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(gamificationService.updateStreakForTransaction(today));
      }
      
      // Само първата транзакция трябва да увеличи streak
      expect(results[0].streakDays).toBe(1);
      expect(results[0].isFirstOfDay).toBe(true);
      
      // Останалите не променят streak
      for (let i = 1; i < 5; i++) {
        expect(results[i].streakDays).toBe(1);
        expect(results[i].isFirstOfDay).toBe(false);
      }
      
      const profile = gamificationService.getProfile();
      expect(profile.streakDays).toBe(1);
    });
  });

  describe('Event emissions', () => {
    test('streakUpdated event се емитва при нов streak', (done) => {
      const today = getTodayDateString();
      
      gamificationService.eventEmitter.on('streakUpdated', (data) => {
        expect(data.oldStreak).toBe(0);
        expect(data.newStreak).toBe(1);
        expect(data.isConsecutive).toBe(false);
        expect(data.isNewStreak).toBe(true);
        done();
      });
      
      gamificationService.updateStreakForTransaction(today);
    });

    test('streakUpdated event се емитва при consecutive day', (done) => {
      const yesterday = getDateDaysAgo(1);
      const today = getTodayDateString();
      
      gamificationService.updateStreakForTransaction(yesterday);
      
      gamificationService.eventEmitter.on('streakUpdated', (data) => {
        if (data.newStreak === 2) {
          expect(data.oldStreak).toBe(1);
          expect(data.isConsecutive).toBe(true);
          expect(data.isContinued).toBe(true);
          done();
        }
      });
      
      gamificationService.updateStreakForTransaction(today);
    });

    test('streakUpdated event се емитва при broken streak', (done) => {
      const threeDaysAgo = getDateDaysAgo(3);
      const today = getTodayDateString();
      
      gamificationService.updateStreakForTransaction(threeDaysAgo);
      
      gamificationService.eventEmitter.on('streakUpdated', (data) => {
        if (data.streakBroken) {
          expect(data.oldStreak).toBe(1);
          expect(data.newStreak).toBe(1);
          expect(data.wasReset).toBe(true);
          expect(data.daysMissed).toBe(2);
          done();
        }
      });
      
      gamificationService.updateStreakForTransaction(today);
    });
  });
});
