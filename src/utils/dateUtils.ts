/**
 * Utility функции за работа с дати
 * Осигуряват консистентно и надеждно работене с дати в цялото приложение
 */

/**
 * Нормализира дата до началото на деня (00:00:00.000)
 * Използва се за консистентно сравняване на дати БЕЗ час
 * 
 * @param date - Дата за нормализиране (Date обект или ISO string)
 * @returns Timestamp (milliseconds) от началото на деня в LOCAL timezone
 */
export const normalizeDateToStartOfDay = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Получава началото на днешния ден като timestamp
 * 
 * @returns Timestamp (milliseconds) от началото на днес в LOCAL timezone
 */
export const getTodayStartTimestamp = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

/**
 * Получава началото на днешния ден като ISO string (YYYY-MM-DD)
 * 
 * @returns ISO string във формат YYYY-MM-DD (само дата, без час)
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Преобразува timestamp в ISO date string (YYYY-MM-DD)
 * 
 * @param timestamp - Timestamp в milliseconds
 * @returns ISO string във формат YYYY-MM-DD
 */
export const timestampToDateString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Изчислява разликата в ЦЕЛИ ДНИ между две дати
 * Игнорира часа - сравнява само датите
 * 
 * @param date1 - Първа дата (по-нова)
 * @param date2 - Втора дата (по-стара)
 * @returns Брой дни разлика (винаги положително число)
 * 
 * @example
 * getDaysDifference(new Date('2026-01-17'), new Date('2026-01-15')) // 2
 * getDaysDifference(new Date('2026-01-17T23:59'), new Date('2026-01-17T00:01')) // 0 (същия ден)
 */
export const getDaysDifference = (date1: Date | string | number, date2: Date | string | number): number => {
  const timestamp1 = normalizeDateToStartOfDay(
    typeof date1 === 'number' ? new Date(date1) : date1
  );
  const timestamp2 = normalizeDateToStartOfDay(
    typeof date2 === 'number' ? new Date(date2) : date2
  );
  
  const diffInMs = Math.abs(timestamp1 - timestamp2);
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays;
};

/**
 * Проверява дали две дати са от СЪЩИЯ ден (игнорира час)
 * 
 * @param date1 - Първа дата
 * @param date2 - Втора дата
 * @returns true ако са от същия ден, false иначе
 */
export const isSameDay = (date1: Date | string | number, date2: Date | string | number): boolean => {
  const timestamp1 = normalizeDateToStartOfDay(
    typeof date1 === 'number' ? new Date(date1) : date1
  );
  const timestamp2 = normalizeDateToStartOfDay(
    typeof date2 === 'number' ? new Date(date2) : date2
  );
  
  return timestamp1 === timestamp2;
};

/**
 * Проверява дали дата е днес
 * 
 * @param date - Дата за проверка
 * @returns true ако датата е днес, false иначе
 */
export const isToday = (date: Date | string | number): boolean => {
  const todayTimestamp = getTodayStartTimestamp();
  const dateTimestamp = normalizeDateToStartOfDay(
    typeof date === 'number' ? new Date(date) : date
  );
  
  return todayTimestamp === dateTimestamp;
};

/**
 * Проверява дали дата е вчера
 * 
 * @param date - Дата за проверка
 * @returns true ако датата е вчера, false иначе
 */
export const isYesterday = (date: Date | string | number): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return isSameDay(date, yesterday);
};

/**
 * Форматира ISO date string за показване на потребителя
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Форматиран string (DD.MM.YYYY)
 */
export const formatDateForDisplay = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

/**
 * Валидира дали string е валиден ISO date format (YYYY-MM-DD)
 * 
 * @param dateString - String за валидация
 * @returns true ако е валиден, false иначе
 */
export const isValidISODateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Получава дата преди N дни като ISO string
 * 
 * @param daysAgo - Брой дни назад
 * @returns ISO date string (YYYY-MM-DD)
 */
export const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return timestampToDateString(date.getTime());
};
